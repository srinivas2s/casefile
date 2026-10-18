from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


class InvestigationStatus(str, Enum):
    DRAFT = "Draft"
    READY = "Ready"
    REPRODUCED = "Reproduced"
    FIX_VERIFIED = "Fix Verified"
    VERIFICATION_FAILED = "Verification Failed"


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    bug_description = Column(Text, nullable=False)
    language = Column(String(50), default="Python")
    source_code = Column(Text, nullable=False)
    expected_behavior = Column(Text, nullable=False)
    actual_behavior = Column(Text, nullable=False)
    steps_to_reproduce = Column(Text, nullable=False)
    reproduction_input = Column(Text, nullable=True)
    existing_pytest_test_file = Column(Text, nullable=True)
    status = Column(String(50), default=InvestigationStatus.DRAFT.value)
    fix_summary = Column(Text, nullable=True)
    generated_test = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    executions = relationship("Execution", back_populates="investigation")


class Execution(Base):
    __tablename__ = "executions"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), nullable=False)
    test_type = Column(String(50), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    duration_ms = Column(Integer, default=0)
    result = Column(String(50), nullable=False)
    passed_tests = Column(Integer, default=0)
    failed_tests = Column(Integer, default=0)
    output = Column(Text, nullable=True)

    investigation = relationship("Investigation", back_populates="executions")
