# Contributing

CASEFILE is an early local-development MVP. Keep changes small, document known
limitations, and do not mark behavior complete without a test or reproducible
verification.

## Development checks

Backend (from `backend`):

```powershell
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\ruff.exe check .
```

Frontend (from `frontend`):

```powershell
npm run lint
npm run test -- --run
npm run build
```

Never run submitted source or test code directly on the host. Until a verified
isolated runner exists, execution endpoints must remain fail-closed.
