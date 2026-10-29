/**
 * RADIX Talent Match - Profile Backend Service
 * Microservice Port: 8040 | Proxy prefix: /api/profiles
 */

import { apiFetch } from './apiClient';
import type { CandidateProfile } from '../types';

export interface ProfileBackendRecord {
  candidate_id: string;
  candidate_name: string;
  email?: string | null;
  profile_data: CandidateProfile;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileSaveResponse {
  message: string;
  candidate_id: string;
}

export interface ProfileBackendHealth {
  status: string;
  database?: string;
  timestamp?: string;
}

const PROFILES_BASE = import.meta.env.VITE_PROFILE_API_URL || '/api/profiles';

/**
 * Persists a candidate profile to the Profile Backend PostgreSQL database.
 */
export async function saveProfileToBackend(
  profile: CandidateProfile | Record<string, unknown>
): Promise<ProfileSaveResponse> {
  const profileRecord = profile as Record<string, unknown>;
  const personalInfo = profileRecord.personal_info as Record<string, unknown> | undefined;

  const candidateId = String(profileRecord.profile_id ?? '').trim();
  const candidateName = String(personalInfo?.full_name ?? '').trim();
  const email = String(personalInfo?.email ?? '').trim();

  if (!candidateId || !candidateName) {
    throw new Error('A profile ID and candidate name are required before saving to the backend.');
  }

  return apiFetch<ProfileSaveResponse>(PROFILES_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      candidate_id: candidateId,
      candidate_name: candidateName,
      email: email || null,
      profile_data: profile,
    }),
    timeoutMs: 15000,
  });
}

/**
 * Retrieves a candidate profile by ID from the Profile Backend.
 */
export async function getProfileFromBackend(candidateId: string): Promise<ProfileBackendRecord> {
  if (!candidateId.trim()) {
    throw new Error('Candidate ID is required.');
  }

  const endpoint = `${PROFILES_BASE}/${encodeURIComponent(candidateId.trim())}`;
  return apiFetch<ProfileBackendRecord>(endpoint, {
    method: 'GET',
    timeoutMs: 10000,
  });
}

/**
 * Health check for Profile Backend.
 */
export async function checkProfileBackendHealth(): Promise<ProfileBackendHealth> {
  return apiFetch<ProfileBackendHealth>('/api/backend-health', {
    method: 'GET',
    timeoutMs: 5000,
  });
}
