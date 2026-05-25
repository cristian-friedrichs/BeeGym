import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const host = '127.0.0.1';
const port = Number.parseInt(process.env.BEEGYM_SMOKE_PORT ?? '9002', 10);
const baseUrl = `http://${host}:${port}`;
const startupTimeoutMs = Number.parseInt(process.env.BEEGYM_SMOKE_STARTUP_TIMEOUT_MS ?? '60000', 10);
const requestTimeoutMs = Number.parseInt(process.env.BEEGYM_SMOKE_REQUEST_TIMEOUT_MS ?? '10000', 10);
const pollIntervalMs = 1000;
const routes = ['/', '/login'];
const isWindows = process.platform === 'win32';
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const reportPath = new URL('./reports/latest-smoke-report.json', import.meta.url);
const reportFilePath = fileURLToPath(reportPath);
const dep0190Warning = {
  code: 'DEP0190',
  message:
    'Node.js may print DEP0190 on Windows because this smoke test starts the fixed npm command with shell: true. This is documented as a temporary non-blocking warning for this local smoke test.',
};

let serverProcess;
const observedWarnings = [];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

process.on('warning', (warning) => {
  if (warning.code === 'DEP0190') {
    observedWarnings.push(dep0190Warning);
  }
});

function startServer() {
  serverProcess = spawn(npmCommand, ['run', 'start', '--', '-p', String(port), '-H', host], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(port),
      HOSTNAME: host,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: isWindows,
    windowsHide: true,
  });

  serverProcess.stdout.on('data', (data) => {
    const text = data.toString();
    if (/ready|started|local/i.test(text)) {
      process.stdout.write(text);
    }
  });

  serverProcess.stderr.on('data', (data) => {
    const text = data.toString();
    if (/error|failed|EADDRINUSE/i.test(text)) {
      process.stderr.write(text);
    }
  });

  serverProcess.on('exit', (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`Synthetic smoke server exited early with code ${code}.`);
    }
    if (signal) {
      console.error(`Synthetic smoke server exited with signal ${signal}.`);
    }
  });
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    return await fetch(url, {
      cache: 'no-store',
      redirect: 'manual',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForServer() {
  const deadline = Date.now() + startupTimeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    if (serverProcess?.exitCode !== null) {
      throw new Error('Server process exited before becoming ready.');
    }

    try {
      const response = await fetchWithTimeout(baseUrl);
      if (response.status < 500) {
        return;
      }
      lastError = new Error(`Received HTTP ${response.status} while waiting for ${baseUrl}.`);
    } catch (error) {
      lastError = error;
    }

    await wait(pollIntervalMs);
  }

  throw new Error(`Server did not become ready within ${startupTimeoutMs}ms. Last error: ${lastError?.message ?? 'unknown'}`);
}

function assertNoCriticalHtml(route, html) {
  const criticalPatterns = [
    /Application error/i,
    /Internal Server Error/i,
    /Unhandled Runtime Error/i,
    /NEXT_STATIC_GEN_BAILOUT/i,
  ];

  for (const pattern of criticalPatterns) {
    if (pattern.test(html)) {
      throw new Error(`Route ${route} rendered a critical error marker: ${pattern.source}`);
    }
  }
}

async function checkRoute(route) {
  const url = new URL(route, baseUrl).toString();
  const startedAt = performance.now();
  let statusCode = null;
  let failureMessage = null;

  try {
    const response = await fetchWithTimeout(url);
    statusCode = response.status;

    if (response.status >= 500) {
      throw new Error(`Route ${route} returned HTTP ${response.status}.`);
    }

    if (response.status >= 400) {
      throw new Error(`Route ${route} returned HTTP ${response.status}.`);
    }

    const html = await response.text();
    if (!html.trim()) {
      throw new Error(`Route ${route} returned an empty response.`);
    }

    assertNoCriticalHtml(route, html);
    console.log(`OK ${route} -> HTTP ${response.status}`);
  } catch (error) {
    failureMessage = error.message;
  }

  return {
    result: {
      path: route,
      url,
      statusCode,
      durationMs: Math.round(performance.now() - startedAt),
      passed: failureMessage === null,
    },
    error: failureMessage,
  };
}

async function stopServer() {
  if (!serverProcess || serverProcess.exitCode !== null) {
    return;
  }

  if (isWindows) {
    await new Promise((resolve) => {
      const killer = spawn('taskkill', ['/pid', String(serverProcess.pid), '/t', '/f'], {
        stdio: 'ignore',
        windowsHide: true,
      });

      killer.on('error', resolve);
      killer.on('exit', resolve);
    });
  } else {
    serverProcess.kill('SIGTERM');
  }

  const deadline = Date.now() + 5000;
  while (serverProcess.exitCode === null && Date.now() < deadline) {
    await wait(100);
  }

  if (serverProcess.exitCode === null) {
    serverProcess.kill('SIGKILL');
  }
}

async function writeHealthReport(report) {
  await mkdir(new URL('./reports/', import.meta.url), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

async function main() {
  const startedAt = performance.now();
  const report = {
    timestamp: new Date().toISOString(),
    environment: {
      baseUrl,
      type: 'local',
    },
    status: 'failed',
    routes: [],
    durationMs: 0,
    error: null,
    warnings: isWindows ? [dep0190Warning] : [],
  };

  console.log(`Starting BeeGym synthetic smoke server at ${baseUrl}`);
  try {
    startServer();
    await waitForServer();

    for (const route of routes) {
      const { result, error } = await checkRoute(route);
      report.routes.push(result);

      if (error) {
        throw new Error(error);
      }
    }

    report.status = 'passed';
    console.log('BeeGym synthetic smoke passed.');
  } catch (error) {
    report.error = error.message;
    throw error;
  } finally {
    for (const warning of observedWarnings) {
      if (!report.warnings.some((item) => item.code === warning.code)) {
        report.warnings.push(warning);
      }
    }

    report.durationMs = Math.round(performance.now() - startedAt);
    await writeHealthReport(report);
    console.log(`BeeGym synthetic smoke report written to ${reportFilePath}`);
  }
}

let exitCode = 0;

try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`BeeGym synthetic smoke failed: ${error.message}`);
} finally {
  await stopServer();
  process.exit(exitCode);
}
