# CASEFILE implementation audit tracker

## Current phase

**IN PROGRESS — audit completed; core execution is safely blocked pending an isolated runner.**

The original CASEFILE MVP master prompt was not found in the repository. The
audit uses the user-provided audit checklist and the current source. No
`TRACKER.md` existed before this audit, so there was no earlier completion
claim to rely on.

## Audit summary

| Category | Requirements | PASS | PARTIAL | FAIL | BLOCKED |
|---|---:|---:|---:|---:|---:|
| A. Frontend and UI/UX | 17 | 9 | 8 | 0 | 0 |
| B. Backend and API | 12 | 7 | 3 | 0 | 2 |
| C. Database | 8 | 5 | 3 | 0 | 0 |
| D. Test-generation engine | 8 | 5 | 1 | 2 | 0 |
| E. Test execution and security | 14 | 7 | 1 | 0 | 6 |
| F. Fix verification and regression | 9 | 1 | 1 | 5 | 2 |
| G. Evidence reporting | 9 | 5 | 3 | 1 | 0 |
| H. GitHub and development workflow | 13 | 11 | 1 | 1 | 0 |
| I. End-to-end demonstration | 10 | 4 | 1 | 2 | 3 |
| **Total** | **100** | **54** | **22** | **11** | **13** |

## Detailed requirements audit

`PASS` means inspected or exercised successfully. `PARTIAL` means only part of
the requirement is met. `FAIL` means it is missing or incorrectly implemented.
`BLOCKED` means execution could not be verified because the secure runtime is
unavailable; the API deliberately fails closed instead of running code on the
host.

### A. Frontend and UI/UX

| Requirement | Status | Evidence / gap |
|---|---|---|
| React, Vite, TypeScript configuration | PASS | Frontend build and type check pass; Vite/Tailwind were upgraded. |
| Minimal, professional visual design | PARTIAL | Existing dark dashboard is consistent, but no design/usability review was performed. |
| Responsive dashboard and sidebar | PARTIAL | Dashboard grids adapt; sidebar remains fixed-width with no mobile collapse. |
| Dashboard statistics use API data | PASS | Dashboard loads `/api/dashboard`; backend aggregates persisted records. |
| Investigation listing, search, filtering | PASS | Listing requests search/status filters from the API. |
| Investigation form and validation | PASS | Required fields are checked in UI and Pydantic schemas. |
| Investigation detail page | PASS | Details and execution records load from API endpoints. |
| Test-generation interface | PARTIAL | It produces an inspectable narrative preview, explicitly not a source-executing test. |
| Execution history | PARTIAL | Persisted execution records are listed; new code runs are blocked. |
| Fix-verification interface | PARTIAL | Controls exist, but actual verification cannot run without isolation. |
| Evidence-report interface | PASS | UI exposes TXT, JSON, and HTML downloads. |
| Settings page | PARTIAL | API reports execution disabled, but several settings are static MVP values. |
| Loading, empty, success, and error states | PARTIAL | Common states exist; coverage and error handling are inconsistent across pages. |
| Navigation and controls | PASS | Navigation and actions have handlers; execution actions report explicit errors. |
| Accessibility and keyboard navigation | PARTIAL | Native controls are used, but keyboard/screen-reader behavior has not been audited. |
| No decorative controls that do nothing | PASS | Displayed controls navigate, export, edit, or return an explicit blocked result. |
| No fabricated investigations, statistics, or test results | PASS | Dashboard reads stored data; execution now records `error` instead of synthetic pass/fail. |

### B. Backend and API

| Requirement | Status | Evidence / gap |
|---|---|---|
| FastAPI application starts | PASS | Started locally; API smoke requests succeeded. |
| Health endpoint | PASS | `/api/health` returned `{"status":"ok","service":"CASEFILE"}`. |
| Dashboard returns real data | PASS | API aggregates the SQLite investigations and executions. |
| Investigation CRUD | PARTIAL | Create, list, and read exist; update/delete endpoints are absent. |
| Validation, status codes, and errors | PARTIAL | Pydantic validation, 201 create, and 404 reads exist; validation/status coverage is incomplete. |
| Test-generation endpoint | PARTIAL | Returns a narrative preview, not a genuine executable test. |
| Test execution endpoint | BLOCKED | No Docker engine or verified sandbox is available; endpoint stores explicit `error` and executes nothing. |
| Execution history persists | PASS | API smoke test confirmed an error record survived server restart on a disposable database. |
| Fix verification and regression execution | BLOCKED | Endpoints safely record blocked attempts; actual source comparison cannot occur. |
| JSON and HTML evidence export | PASS | Both download endpoints return reports with investigation and execution details. |
| API documentation | PASS | `/docs` returned HTTP 200. |
| No core endpoint reports fake success | PASS | Runtime test actions return `success: false`/`result: error` when no runner exists; preview is labeled. |

### C. Database

| Requirement | Status | Evidence / gap |
|---|---|---|
| SQLAlchemy models | PASS | Investigation and execution models are defined. |
| SQLite initialization | PASS | `Base.metadata.create_all` initializes tables at startup. |
| Investigations persist after restart | PASS | Live smoke-created investigation was readable after server restart. |
| Test cases associated with investigations | PARTIAL | A preview string is stored on the investigation; no test-case model exists. |
| Execution records persist | PASS | Execution table and live restart check verified. |
| Verification records persist | PARTIAL | Blocked verification attempts use execution records; successful verification records cannot be produced. |
| Foreign keys and indexes | PARTIAL | SQLite foreign-key enforcement enabled and tested; secondary query indexes/migrations are incomplete. |
| Invalid references handled | PASS | SQLite rejects an execution referencing a missing investigation. |

### D. Test-generation engine

| Requirement | Status | Evidence / gap |
|---|---|---|
| No Qwen, Ollama, or external AI required | PASS | No AI/model dependency is present. |
| Deterministic generation | PASS | Preview is a pure formatting function of investigation fields. |
| Supported bug patterns defined | FAIL | There is no pattern registry or generation contract. |
| Generated tests inspectable | PASS | Preview is stored and shown in the Tests tab. |
| Unsupported scenarios handled honestly | PARTIAL | UI warns that the output is a narrative preview, but no per-pattern support detection exists. |
| Empty CSV rows and other supported cases | FAIL | No CSV-specific generator/test exists. |
| Malformed generation handled safely | PASS | User strings are emitted using Python `repr`; no submitted output is executed. |
| Generated tests are not treated as proof | PASS | Preview is labeled non-executable; run actions do not claim a test result. |

### E. Test execution and security

| Requirement | Status | Evidence / gap |
|---|---|---|
| Untrusted code not executed inside FastAPI process | PASS | Host-side pytest subprocess was removed; test asserts an untrusted file is not run. |
| Execution isolation implemented and tested | BLOCKED | No isolated runner is implemented; this remains the principal blocker. |
| Restricted Docker execution | BLOCKED | Docker CLI exists but Docker Desktop engine is unavailable. |
| Network disabled for test containers | BLOCKED | No container runner exists to verify. |
| Non-root execution | BLOCKED | No container runner exists to verify. |
| Timeouts enforced | BLOCKED | No container runner exists to verify. |
| CPU, memory, and process limits | BLOCKED | No container runner exists to verify. |
| Temporary files cleaned | PASS | Current execution path creates no temporary code/test files. |
| Host filesystem access restricted | PASS | Submitted source and test files are not opened or executed. |
| Application secrets not exposed to test processes | PASS | No test process is spawned; do not expose the local API to untrusted networks. |
| Path traversal prevented | PASS | Host test-file path input was removed from the API schema and form; legacy DB column is unused. |
| Arbitrary user shell commands not executed | PASS | No user-controlled shell/process invocation remains. |
| Docker unavailability does not trigger unsafe fallback | PASS | Execution returns an explicit error and persists it. |
| Demo mode distinguished from secure mode | PARTIAL | Settings and documentation state execution is disabled; there is no separate mode/configuration model. |

### F. Fix verification and regression testing

| Requirement | Status | Evidence / gap |
|---|---|---|
| Original source can be tested | BLOCKED | No verified sandbox is available; endpoint does not execute source. |
| Corrected source can be supplied | FAIL | No corrected-source field or update workflow exists. |
| Same reproduction test runs against both versions | FAIL | Neither source comparison nor a genuine reproduction test exists. |
| Original and corrected versions distinguished | FAIL | Only one source field exists. |
| Source hashes recorded | FAIL | No source hashing or version records exist. |
| Results compared accurately | FAIL | No original/fixed comparison logic exists. |
| Regression tests can execute | BLOCKED | Regression endpoint records a blocked `error` until an isolated runner exists. |
| Failed, passed, inconclusive, and error states distinct | PARTIAL | `error` is now distinct; real pass/fail/inconclusive execution states are not implemented. |
| Passing test not presented as complete proof | PASS | No passing test is claimed by the current blocked runner. |

### G. Evidence reporting

| Requirement | Status | Evidence / gap |
|---|---|---|
| JSON report downloadable | PASS | JSON endpoint includes investigation, preview, run history, and execution notice. |
| HTML report downloadable | PASS | HTML endpoint includes report sections and HTML-escapes user text; XSS escaping is tested. |
| Investigation details accurate | PASS | Reports are built from persisted fields and execution records. |
| Test code and results included | PASS | The generated preview and stored execution output/result are included. |
| Timestamps and exit codes recorded | PARTIAL | Creation/update/run timestamps and duration are included; process exit codes are unavailable and shown as not recorded. |
| Before-fix and after-fix results distinguishable | FAIL | No corrected source or result pairing exists. |
| Regression results included | PARTIAL | Stored regression-type records can appear, but no genuine regression can run. |
| Verification status evidence-based | PARTIAL | Blocked attempts do not alter investigation status; meaningful status transitions need real execution. |
| No fabricated claims | PASS | Reports explicitly note that source/test code was not executed. |

### H. GitHub and development workflow

| Requirement | Status | Evidence / gap |
|---|---|---|
| GitHub integration optional | PASS | Integration remains unconfigured and is not required. |
| Tokens not hardcoded | PASS | No token is configured in the source. |
| Missing GitHub configuration handled gracefully | PASS | Settings report GitHub as not configured. |
| GitHub Actions CI exists and is valid | PARTIAL | Workflow now defines backend/frontend jobs; no hosted Actions run was available. |
| Backend tests included | PASS | Pytest suite runs in CI and passed locally. |
| Frontend tests included | PASS | Vitest suite runs in CI and passed locally. |
| Linting and type checks configured | PASS | Ruff, ESLint, and TypeScript build checks pass. |
| README matches implementation | PASS | README now documents disabled execution and available export formats. |
| `.env.example` is accurate | FAIL | No `.env.example` or `.env` loader exists; no secret-based configuration is currently used. |
| `.gitignore` excludes secrets/generated files | PASS | Ignores `.env*`, databases, virtual environments, caches, and frontend build output. |
| CONTRIBUTING.md exists | PASS | Added development commands and execution safety requirement. |
| SECURITY.md exists | PASS | Documents local-only exposure and fail-closed execution. |
| TRACKER.md reflects implementation status | PASS | This audit records verified and incomplete requirements. |

### I. End-to-end demonstration

| Step | Status | Evidence / gap |
|---|---|---|
| Create investigation for known buggy CSV processor | PASS | API creation works; no fixed CSV demonstration scenario was provided. |
| Generate reproduction test | PARTIAL | Only a narrative preview is generated. |
| Inspect generated test | PASS | Preview is returned and visible in the detail page. |
| Execute against original source | BLOCKED | No verified isolated runner. |
| Capture/persist original execution result | BLOCKED | An `error` is persisted, not an original-source test result. |
| Supply corrected source | FAIL | No corrected source form/API field exists. |
| Rerun same test against corrected source | FAIL | No two-version workflow exists. |
| Run regression tests | BLOCKED | Secure execution unavailable. |
| Download evidence reports | PASS | TXT, JSON, and HTML report downloads exist. |
| Reopen investigation and confirm history | PASS | Investigation and blocked execution persisted after restart in the smoke test. |

## Security findings and fixes

- **Fixed, high severity:** test execution previously ran `pytest` in a host subprocess, with no timeout/isolation, and accepted a host test-file path. A crafted test could execute arbitrary host code. The process invocation and path field were removed; the API now records an explicit blocked `error`. Regression test confirms the supplied test file does not create its marker file.
- **Fixed, medium severity:** wildcard CORS with credentials was replaced by explicit localhost frontend origins without credentials. README and Vite default binding now use `127.0.0.1`.
- **Fixed:** SQLite foreign-key enforcement is enabled and tested.
- **Fixed:** frontend development dependencies had 13 npm audit advisories (including two critical) at baseline. Vite, Vitest, Tailwind, and React Router were upgraded; final `npm audit` reports zero vulnerabilities.
- **Remaining blocker:** secure code execution is unavailable. Docker Desktop engine check failed with a missing `dockerDesktopLinuxEngine` named pipe. Execution remains disabled rather than falling back to host execution.
- **Local-only limitation:** API has no authentication or per-user isolation. Do not expose it beyond localhost.
- **Listener caveat:** after the old broadly bound development process was stopped, Windows still reported a listener on `0.0.0.0:8000` under PID 7164, but the PID could no longer be resolved to a process. The verified replacement server is bound to `127.0.0.1`; inspect the unresolved listener before concluding that port 8000 is loopback-only.

## Verification performed

- Backend from `backend`: `python -m pytest` — **6 passed** on disposable SQLite database; warnings from dependency deprecations remain.
- Backend: `ruff check .` — **passed**.
- Frontend: `npm run lint` — **passed**.
- Frontend: `npm run test -- --run` — **1 test passed**.
- Frontend: `npm run build` — **passed**, including `tsc --noEmit`.
- Frontend: `npm audit` — **0 vulnerabilities**.
- Frontend: `npm ci --dry-run` — **passed**.
- Live API smoke: health, settings, dashboard, docs, create, preview, blocked run, and execution history succeeded on a disposable server/database.
- Frontend integration smoke: a fresh Vite page at `http://127.0.0.1:5173` rendered the dashboard and persisted execution rows; its dashboard request returned HTTP 200.
- Current local API: restarted from the backend virtual environment on `127.0.0.1:8000`; `/api/health` returned `{"status":"ok","service":"CASEFILE"}`.
- Persistence: investigation and blocked execution remained after stopping and restarting the server against the same temporary database.
- HTML report escaping and JSON/HTML download endpoints verified by backend tests.
- Docker runtime check: **blocked**, Docker engine unavailable.
- `pytest` from repository root initially failed with `ModuleNotFoundError: No module named 'app'`; documented usage runs tests from `backend` and passes.
- No hosted GitHub Actions execution was performed.

## Files changed in this audit

- Updated: `.gitignore`, `README.md`, `backend/app/database.py`,
  `backend/app/main.py`, `backend/app/schemas.py`, `backend/app/services.py`,
  `backend/tests/test_api.py`, `frontend/package.json`,
  `frontend/package-lock.json`, `frontend/postcss.config.js`,
  `frontend/src/index.css`, `frontend/src/lib/api.ts`,
  `frontend/src/pages/InvestigationDetailPage.tsx`,
  `frontend/src/pages/NewInvestigationPage.tsx`, `frontend/src/types.ts`,
  `frontend/vite.config.ts`, `.github/workflows/ci.yml`.
- Added: `CONTRIBUTING.md`, `SECURITY.md`, `TRACKER.md`,
  `backend/requirements-dev.txt`, `frontend/.eslintrc.cjs`.

## Remaining work and next steps

1. Implement and independently verify an isolated code runner (container or stronger sandbox) with network off, non-root user, time, CPU, memory, process, output, and filesystem limits; keep execution disabled until then.
2. Define supported deterministic test patterns (including blank CSV rows), add corrected-source versioning/hashes, and compare original/fixed/regression results honestly.
3. Complete CRUD/migrations, report exit codes and before/after runs, and expand frontend mobile/accessibility/error-state tests.

## Repository state note

At audit start, the `main` branch had no commits and `git ls-files` returned no
tracked files; the project source was already untracked. Therefore Git cannot
show a trustworthy baseline diff or distinguish pre-existing untracked content
from this audit's edits. No files were staged or committed. Review/commit only
after establishing the intended repository baseline and explicitly selecting
the files to include.
