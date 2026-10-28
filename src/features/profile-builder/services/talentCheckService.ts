
import type { CandidateProfile } from '../types';

const TALENT_CHECK_API_URL =
  'http://127.0.0.1:8010/talent-check';

export interface TalentCheckResult {
  company: string;
  skillset_gap: {
    category_code: string;
    required_level: number;
    candidate_level: number;
    gap: boolean;
  }[];
  readiness_score: number;
}

export async function runTalentCheck(
  profile: CandidateProfile,
  company: string
): Promise<TalentCheckResult> {
  const response = await fetch(TALENT_CHECK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      company,
      profile,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Talent Check failed (${response.status}): ${errorBody}`
    );
  }

  return (await response.json()) as TalentCheckResult;
}
