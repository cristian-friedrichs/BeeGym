# Basic Synthetic Monitoring

This is the first real smoke test for BeeGym synthetic monitoring.

It starts the built Next.js app locally and validates that public routes respond without critical errors.
It also writes a local health report with the latest run result.

## Scope

The smoke test checks:

- the app starts locally with `npm run start`;
- `/` responds successfully;
- `/login` responds successfully;
- responses do not contain critical Next.js error markers.
- a local JSON health report is generated after the run.

## Safety limits

The smoke test does not:

- log in;
- use real users;
- include headers, cookies, tokens, or HTML response bodies in the report;
- read or print secrets;
- touch Supabase directly;
- create data;
- test payments;
- call paid services;
- run as a recurring monitor.

## Run locally

Build the app first:

```bash
npm run build
```

Then run the smoke test:

```bash
node testsprite_tests/basic-synthetic-monitoring/smoke.mjs
```

By default it starts the app on `http://127.0.0.1:9002`.

Optional environment variables:

```bash
BEEGYM_SMOKE_PORT=9002
BEEGYM_SMOKE_STARTUP_TIMEOUT_MS=60000
BEEGYM_SMOKE_REQUEST_TIMEOUT_MS=10000
```

## Local health report

Each run writes the latest local health report to:

```text
testsprite_tests/basic-synthetic-monitoring/reports/latest-smoke-report.json
```

The `reports/` directory is generated output and is ignored by Git.

The report contains:

```json
{
  "timestamp": "2026-05-25T12:34:56.789Z",
  "environment": {
    "baseUrl": "http://127.0.0.1:9002",
    "type": "local"
  },
  "status": "passed",
  "routes": [
    {
      "path": "/",
      "url": "http://127.0.0.1:9002/",
      "statusCode": 200,
      "durationMs": 123,
      "passed": true
    },
    {
      "path": "/login",
      "url": "http://127.0.0.1:9002/login",
      "statusCode": 200,
      "durationMs": 98,
      "passed": true
    }
  ],
  "durationMs": 221,
  "error": null,
  "warnings": [
    {
      "code": "DEP0190",
      "message": "Node.js may print DEP0190 on Windows because this smoke test starts the fixed npm command with shell: true. This is documented as a temporary non-blocking warning for this local smoke test."
    }
  ]
}
```

On failure, `status` is `failed`, `error` contains the safe failure message, and any route that failed has `passed: false`. The report intentionally excludes request headers, response headers, cookies, tokens, secrets, user data, and HTML bodies.

## Known Windows warning

On Windows, Node.js may print this warning:

```text
[DEP0190] Passing args to a child process with shell option true can lead to security vulnerabilities
```

This warning is temporarily accepted for this internal smoke test because the command is fixed, does not receive user input, does not print secrets, and does not execute dynamic commands.

Future improvement: replace the server startup with a Windows-compatible approach that does not require `shell: true`.

## Acceptance criteria

- The production build exists.
- The local server starts.
- `/` returns a non-empty response with status lower than 400.
- `/login` returns a non-empty response with status lower than 400.
- No critical error marker is found in the HTML.
- The server process is stopped after the check.
