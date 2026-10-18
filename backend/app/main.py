from __future__ import annotations

import html
from datetime import datetime
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine
from .models import Execution, Investigation, InvestigationStatus
from .schemas import ActionResponse, DashboardResponse, ExecutionRead, InvestigationCreate, InvestigationRead, SettingsResponse
from .services import build_dashboard_payload, create_reproduction_test, run_investigation_test

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CASEFILE", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "CASEFILE"}


@app.get("/api/dashboard", response_model=DashboardResponse)
def read_dashboard(db: Session = Depends(get_db)):
    payload = build_dashboard_payload(db)
    return payload


@app.get("/api/investigations", response_model=list[InvestigationRead])
def read_investigations(
    search: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Investigation)
    if search:
        normalized = search.strip()
        query_text = f"%{normalized.lower()}%"
        id_filter = None
        try:
            id_filter = int(normalized)
        except ValueError:
            id_filter = None

        filters = (Investigation.title.ilike(query_text)) | (Investigation.bug_description.ilike(query_text))
        if id_filter is not None:
            filters = filters | (Investigation.id == id_filter)
        query = query.filter(filters)
    if status:
        query = query.filter(Investigation.status == status)
    return query.order_by(Investigation.created_at.desc()).all()


@app.post("/api/investigations", response_model=InvestigationRead, status_code=status.HTTP_201_CREATED)
def create_investigation(payload: InvestigationCreate, db: Session = Depends(get_db)):
    investigation = Investigation(**payload.model_dump())
    investigation.status = InvestigationStatus.DRAFT.value
    db.add(investigation)
    db.commit()
    db.refresh(investigation)
    return investigation


@app.get("/api/investigations/{investigation_id}", response_model=InvestigationRead)
def read_investigation(investigation_id: int, db: Session = Depends(get_db)):
    investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return investigation


def build_evidence_report(investigation: Investigation, db: Session) -> dict:
    executions = (
        db.query(Execution)
        .filter(Execution.investigation_id == investigation.id)
        .order_by(Execution.start_time.desc())
        .all()
    )
    return {
        "report_generated_at": datetime.utcnow().isoformat(),
        "execution_notice": (
            "Submitted source and test files are not executed because no verified isolated runner is configured."
        ),
        "investigation": {
            "id": investigation.id,
            "title": investigation.title,
            "status": investigation.status,
            "language": investigation.language,
            "bug_description": investigation.bug_description,
            "expected_behavior": investigation.expected_behavior,
            "actual_behavior": investigation.actual_behavior,
            "steps_to_reproduce": investigation.steps_to_reproduce,
            "source_code": investigation.source_code,
            "reproduction_input": investigation.reproduction_input,
            "fix_summary": investigation.fix_summary,
            "test_preview": investigation.generated_test,
            "created_at": investigation.created_at.isoformat(),
            "updated_at": investigation.updated_at.isoformat(),
        },
        "executions": [
            {
                "id": execution.id,
                "test_type": execution.test_type,
                "start_time": execution.start_time.isoformat(),
                "duration_ms": execution.duration_ms,
                "result": execution.result,
                "passed_tests": execution.passed_tests,
                "failed_tests": execution.failed_tests,
                "output": execution.output,
                "exit_code": None,
            }
            for execution in executions
        ],
    }


def get_report_investigation(investigation_id: int, db: Session) -> Investigation:
    investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return investigation


@app.get("/api/investigations/{investigation_id}/evidence.json")
def export_json_evidence(investigation_id: int, db: Session = Depends(get_db)):
    investigation = get_report_investigation(investigation_id, db)
    return JSONResponse(
        content=build_evidence_report(investigation, db),
        headers={"Content-Disposition": f'attachment; filename="casefile-investigation-{investigation_id}.json"'},
    )


@app.get("/api/investigations/{investigation_id}/evidence.html", response_class=HTMLResponse)
def export_html_evidence(investigation_id: int, db: Session = Depends(get_db)):
    report = build_evidence_report(get_report_investigation(investigation_id, db), db)
    investigation = report["investigation"]

    def section(title: str, content: Optional[str]) -> str:
        return (
            f"<section><h2>{html.escape(title)}</h2>"
            f"<pre>{html.escape(content or 'Not recorded.')}</pre></section>"
        )

    executions = "".join(
        (
            f"<section><h2>Execution #{execution['id']} — {html.escape(execution['test_type'])}</h2>"
            f"<p>Result: {html.escape(execution['result'])} · "
            f"Started: {html.escape(execution['start_time'])} · "
            f"Duration: {execution['duration_ms']} ms · Exit code: not recorded</p>"
            f"<pre>{html.escape(execution['output'] or 'No output captured.')}</pre></section>"
        )
        for execution in report["executions"]
    )
    body = "".join(
        [
            "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\">",
            f"<title>CASEFILE evidence — {html.escape(investigation['title'])}</title>",
            "<style>body{font:16px system-ui;max-width:900px;margin:2rem auto;padding:0 1rem}"
            "pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f3f4f6;padding:1rem}"
            "section{margin:1.5rem 0}</style><body>",
            f"<h1>{html.escape(investigation['title'])}</h1>",
            f"<p>Investigation #{investigation['id']} · Status: {html.escape(investigation['status'])}</p>",
            f"<p><strong>Generated:</strong> {html.escape(report['report_generated_at'])}</p>",
            f"<p><strong>Execution notice:</strong> {html.escape(report['execution_notice'])}</p>",
            section("Bug description", investigation["bug_description"]),
            section("Expected behavior", investigation["expected_behavior"]),
            section("Actual behavior", investigation["actual_behavior"]),
            section("Reproduction steps", investigation["steps_to_reproduce"]),
            section("Source code", investigation["source_code"]),
            section("Fix summary", investigation["fix_summary"]),
            section("Generated test preview (not executed)", investigation["test_preview"]),
            "<h2>Execution history</h2>",
            executions or "<p>No execution records.</p>",
            "</body></html>",
        ]
    )
    return HTMLResponse(
        content=body,
        headers={"Content-Disposition": f'attachment; filename="casefile-investigation-{investigation_id}.html"'},
    )


@app.post("/api/investigations/{investigation_id}/generate-test", response_model=ActionResponse)
def generate_test_for_investigation(investigation_id: int, db: Session = Depends(get_db)):
    investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    investigation.generated_test = create_reproduction_test(investigation)
    db.commit()
    return ActionResponse(
        success=True,
        message="Generated a narrative preview only; it does not exercise the submitted source.",
        investigation_id=investigation.id,
        result=investigation.status,
        output=investigation.generated_test,
    )


@app.post("/api/investigations/{investigation_id}/run-test", response_model=ActionResponse)
def run_test_for_investigation(investigation_id: int, db: Session = Depends(get_db)):
    investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    if not investigation.generated_test:
        investigation.generated_test = create_reproduction_test(investigation)
    result_payload = run_investigation_test()
    execution = Execution(
        investigation_id=investigation.id,
        test_type="reproduction",
        start_time=datetime.utcnow(),
        duration_ms=900,
        result=result_payload["result"],
        passed_tests=result_payload["passed_tests"],
        failed_tests=result_payload["failed_tests"],
        output=result_payload["output"],
    )
    db.add(execution)
    db.commit()
    return ActionResponse(
        success=False,
        message=result_payload["output"],
        investigation_id=investigation.id,
        result=result_payload["result"],
        output=result_payload["output"],
    )


@app.post("/api/investigations/{investigation_id}/record-fix", response_model=ActionResponse)
def record_fix(investigation_id: int, fix_summary: str = "Implemented a fix for the investigation.", db: Session = Depends(get_db)):
    investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    investigation.fix_summary = fix_summary
    investigation.status = InvestigationStatus.READY.value
    db.commit()
    return ActionResponse(success=True, message="Fix recorded.", investigation_id=investigation.id, result=investigation.status)


@app.post("/api/investigations/{investigation_id}/verify-fix", response_model=ActionResponse)
def verify_fix_for_investigation(investigation_id: int, db: Session = Depends(get_db)):
    investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    result_payload = run_investigation_test()
    execution = Execution(
        investigation_id=investigation.id,
        test_type="verification",
        start_time=datetime.utcnow(),
        duration_ms=1100,
        result=result_payload["result"],
        passed_tests=result_payload["passed_tests"],
        failed_tests=result_payload["failed_tests"],
        output=result_payload["output"],
    )
    db.add(execution)
    db.commit()
    return ActionResponse(
        success=False,
        message=result_payload["output"],
        investigation_id=investigation.id,
        result=result_payload["result"],
        output=result_payload["output"],
    )


@app.post("/api/investigations/{investigation_id}/run-regression", response_model=ActionResponse)
def run_regression_for_investigation(investigation_id: int, db: Session = Depends(get_db)):
    investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    result_payload = run_investigation_test()
    execution = Execution(
        investigation_id=investigation.id,
        test_type="regression",
        start_time=datetime.utcnow(),
        duration_ms=1200,
        result=result_payload["result"],
        passed_tests=result_payload["passed_tests"],
        failed_tests=result_payload["failed_tests"],
        output=result_payload["output"],
    )
    db.add(execution)
    db.commit()
    return ActionResponse(
        success=False,
        message=result_payload["output"],
        investigation_id=investigation.id,
        result=result_payload["result"],
        output=result_payload["output"],
    )


@app.get("/api/executions", response_model=list[ExecutionRead])
def read_executions(db: Session = Depends(get_db)):
    return db.query(Execution).order_by(Execution.start_time.desc()).all()


@app.get("/api/settings", response_model=SettingsResponse)
def read_settings():
    return SettingsResponse(
        app_version="0.1.0",
        database_status="SQLite ready",
        testing_environment_status="Execution disabled: secure sandbox unavailable",
        github_integration={"configured": False, "provider": "GitHub REST API", "mode": "local-only"},
    )
