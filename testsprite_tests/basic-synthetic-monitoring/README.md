# Basic Synthetic Monitoring

This is the first real smoke test for BeeGym synthetic monitoring.

It starts the built Next.js app locally and validates that public routes respond without critical errors.

## Scope

The smoke test checks:

- the app starts locally with `npm run start`;
- `/` responds successfully;
- `/login` responds successfully;
- responses do not contain critical Next.js error markers.

## Safety limits

The smoke test does not:

- log in;
- use real users;
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
