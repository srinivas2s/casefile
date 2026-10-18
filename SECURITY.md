# Security

CASEFILE is a local development MVP, not a multi-user or production deployment.
Do not expose the API to a network or store sensitive data in this prototype.

## Untrusted code execution

The application currently has no verified isolated runner. Test execution
endpoints record an `error` and do not execute submitted source or test files.
Do not re-enable host-side `pytest` execution. A future runner must provide
verifiable isolation, resource limits, timeouts, cleanup, and explicit failure
states before these endpoints can execute code.

## Local API

The development server should bind to `127.0.0.1`. CORS is limited to the local
Vite development origins. The API has no authentication or user isolation and
must not be deployed as a shared service.

Report security issues privately to the project maintainer rather than
publishing exploit details.
