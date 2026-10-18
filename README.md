# CASEFILE

CASEFILE is an evidence-first bug investigation and verification platform for Python projects. It helps teams turn a bug report into a reproducible test, verify the original failure, validate a fix, and keep a record of the evidence.

## Stack

- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: FastAPI + SQLAlchemy + SQLite + Pytest
- Local-only workflow: no external AI APIs or model dependencies

## Quick start

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

The API is a local development service, not a multi-user deployment. It binds to
localhost by default. Running user-provided tests is disabled until a verified
isolated execution runner is configured; CASEFILE does not execute test code on
the host.

## Production checks

```bash
cd backend
pip install -r requirements-dev.txt
python -m ruff check .
python -m pytest
cd ../frontend
npm ci
npm run lint
npm run test -- --run
npm run build
```

## Features

- Dashboard with metrics, recent investigations, and recent executions
- Investigation list with search and status filters
- Structured bug investigation form
- Investigation detail view with evidence and execution history
- Narrative test preview; execution is disabled until a verified sandbox exists
- Verification and regression attempts are recorded as blocked, not reported as passes
- Downloadable TXT, JSON, and HTML evidence reports
- Local SQLite persistence for investigations and executions

## Notes

The MVP intentionally focuses on reproducible evidence and local verification rather than broader collaboration features or external AI integrations.
