
const API_BASE_URL =
  import.meta.env.VITE_PROFILE_API_URL || 'http://127.0.0.1:8040';

export interface ProfileSaveResponse {
  message: string;
  candidate_id: string;
}

export async function saveProfileToBackend(
  profile: Record<string, unknown>
): Promise<ProfileSaveResponse> {
  const personalInfo = profile.personal_info as
    | Record<string, unknown>
    | undefined;

  const candidateId = String(profile.profile_id ?? '').trim();
  const candidateName = String(personalInfo?.full_name ?? '').trim();
  const email = String(personalInfo?.email ?? '').trim();

  if (!candidateId || !candidateName) {
    throw new Error(
      'A profile ID and candidate name are required before saving.'
    );
  }

  const response = await fetch(`${API_BASE_URL}/api/profiles`, {
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
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Backend save failed (${response.status}): ${errorBody}`
    );
  }

  return response.json() as Promise<ProfileSaveResponse>;
}
