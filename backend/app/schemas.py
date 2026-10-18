from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class InvestigationBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    bug_description: str = Field(..., min_length=10)
    language: str = "Python"
    source_code: str = Field(..., min_length=1)
    expected_behavior: str = Field(..., min_length=1)
    actual_behavior: str = Field(..., min_length=1)
    steps_to_reproduce: str = Field(..., min_length=1)
    reproduction_input: Optional[str] = None


class InvestigationCreate(InvestigationBase):
    pass


class InvestigationUpdate(BaseModel):
    status: Optional[str] = None
    fix_summary: Optional[str] = None
    generated_test: Optional[str] = None


class InvestigationRead(InvestigationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    fix_summary: Optional[str] = None
    generated_test: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ExecutionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    investigation_id: int
    test_type: str
    start_time: datetime
    duration_ms: int
    result: str
    passed_tests: int
    failed_tests: int
    output: Optional[str] = None


class DashboardResponse(BaseModel):
    total_investigations: int
    reproduced_bugs: int
    verified_fixes: int
    failed_verification_attempts: int
    recent_investigations: list[dict]
    recent_executions: list[dict]


class SettingsResponse(BaseModel):
    app_version: str
    database_status: str
    testing_environment_status: str
    github_integration: dict


class ActionResponse(BaseModel):
    success: bool
    message: str
    investigation_id: Optional[int] = None
    result: Optional[str] = None
    output: Optional[str] = None
