from contextlib import asynccontextmanager
from typing import Any

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine
from .models import CandidateProfile


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create the initial table and verify database connectivity.
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="RADIX Profile Persistence API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ProfileInput(BaseModel):
    candidate_id: str
    candidate_name: str
    email: str | None = None
    profile_data: dict[str, Any] = Field(default_factory=dict)


@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Database connection failed.",
        )


@app.post("/api/profiles")
def save_profile(
    profile: ProfileInput,
    db: Session = Depends(get_db),
):
    candidate_id = profile.candidate_id.strip()
    candidate_name = profile.candidate_name.strip()

    if not candidate_id or not candidate_name:
        raise HTTPException(
            status_code=400,
            detail="Candidate ID and name are required.",
        )

    record = db.get(CandidateProfile, candidate_id)

    if record is None:
        record = CandidateProfile(
            candidate_id=candidate_id,
            candidate_name=candidate_name,
            email=profile.email,
            profile_data=profile.profile_data,
        )
        db.add(record)
    else:
        record.candidate_name = candidate_name
        record.email = profile.email
        record.profile_data = profile.profile_data

    try:
        db.commit()
        db.refresh(record)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not save the candidate profile.",
        )

    return {
        "message": "Profile saved successfully",
        "candidate_id": record.candidate_id,
    }


@app.get("/api/profiles/{candidate_id}")
def get_profile(
    candidate_id: str,
    db: Session = Depends(get_db),
):
    record = db.get(CandidateProfile, candidate_id)

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found.",
        )

    return {
        "candidate_id": record.candidate_id,
        "candidate_name": record.candidate_name,
        "email": record.email,
        "profile_data": record.profile_data,
        "created_at": record.created_at,
        "updated_at": record.updated_at,
    }