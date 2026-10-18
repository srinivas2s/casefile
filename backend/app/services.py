from __future__ import annotations

import textwrap

from sqlalchemy.orm import Session

from .models import Execution, Investigation, InvestigationStatus


def format_timestamp(value):
    if value is None:
        return "Unknown"
    return value.strftime("%Y-%m-%d %H:%M")


def create_reproduction_test(investigation: Investigation) -> str:
    return textwrap.dedent(
        f'''
        def test_reproduction_for_{investigation.id}():
            title = {investigation.title!r}
            expected = {investigation.expected_behavior.strip()!r}
            observed = {investigation.actual_behavior.strip()!r}
            issue = {investigation.bug_description.strip()!r}
            reproduction_steps = {investigation.steps_to_reproduce.strip()!r}
            assert observed != expected, (
                "Narrative preview only; this does not execute the submitted source. "
                "Investigation: %s | Issue: %s | Steps: %s" % (title, issue, reproduction_steps)
            )
        '''
    ).strip() + "\n"


def run_investigation_test() -> dict:
    return {
        "result": "error",
        "passed_tests": 0,
        "failed_tests": 0,
        "output": (
            "Execution blocked: CASEFILE has no verified isolated test runner configured. "
            "No submitted source or test file was executed."
        ),
    }


def build_dashboard_payload(db: Session):
    investigations = db.query(Investigation).order_by(Investigation.created_at.desc()).all()
    executions = db.query(Execution).order_by(Execution.start_time.desc()).limit(5).all()

    total_investigations = len(investigations)
    reproduced_bugs = sum(1 for investigation in investigations if investigation.status == InvestigationStatus.REPRODUCED.value)
    verified_fixes = sum(1 for investigation in investigations if investigation.status == InvestigationStatus.FIX_VERIFIED.value)
    failed_verification_attempts = sum(
        1 for investigation in investigations if investigation.status == InvestigationStatus.VERIFICATION_FAILED.value
    )

    recent_investigations = [
        {
            "id": investigation.id,
            "title": investigation.title,
            "status": investigation.status,
            "language": investigation.language,
            "created_at": format_timestamp(investigation.created_at),
            "latest_result": investigation.generated_test or "Awaiting test",
        }
        for investigation in investigations[:5]
    ]

    recent_executions = [
        {
            "id": execution.id,
            "investigation_id": execution.investigation_id,
            "test_type": execution.test_type,
            "result": execution.result,
            "start_time": format_timestamp(execution.start_time),
            "duration_ms": execution.duration_ms,
            "passed_tests": execution.passed_tests,
            "failed_tests": execution.failed_tests,
        }
        for execution in executions
    ]

    return {
        "total_investigations": total_investigations,
        "reproduced_bugs": reproduced_bugs,
        "verified_fixes": verified_fixes,
        "failed_verification_attempts": failed_verification_attempts,
        "recent_investigations": recent_investigations,
        "recent_executions": recent_executions,
    }
