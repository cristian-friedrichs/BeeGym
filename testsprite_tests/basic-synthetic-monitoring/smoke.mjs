import { spawn } from 'node:child_process';
import process from 'node:process';

const host = '127.0.0.1';
const port = Number.parseInt(process.env.BEEGYM_SMOKE_PORT ?? '9002', 10);
const baseUrl = `http://${host}:${port}`;
const startupTimeoutMs = Number.parseInt(process.env.BEEGYM_SMOKE_STARTUP_TIMEOUT_MS ?? '60000', 10);
const requestTimeoutMs = Number.parseInt(process.env.BEEGYM_SMOKE_REQUEST_TIMEOUT_MS ?? '10000', 10);
const pollIntervalMs = 1000;
const routes = ['/', '/login'];
const isWindows = process.platform === 'win32';
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

let serverProcess;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  const url = `${baseUrl}${route}`;
  const response = await fetchWithTimeout(url);

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

async function main() {
  console.log(`Starting BeeGym synthetic smoke server at ${baseUrl}`);
  startServer();
  await waitForServer();

  for (const route of routes) {
    await checkRoute(route);
  }

  console.log('BeeGym synthetic smoke passed.');
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
