from datetime import datetime

from sqlalchemy import Column, DateTime, JSON, String
from .database import Base


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    candidate_id = Column(String, primary_key=True, index=True)
    candidate_name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    profile_data = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )