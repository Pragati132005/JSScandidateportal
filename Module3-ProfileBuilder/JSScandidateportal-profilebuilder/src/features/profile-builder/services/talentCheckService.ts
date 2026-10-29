/**
 * RADIX Talent Match - Module 4: Talent Check Service
 * Microservice Port: 8010 | Proxy prefix: /api/module4
 */

import { apiFetch } from './apiClient';
import type { CandidateProfile } from '../types';

export interface TalentCheckGapItem {
  category_code: string;
  required_level: number;
  candidate_level: number;
  gap: boolean;
}

export interface TalentCheckResult {
  company: string;
  skillset_gap: TalentCheckGapItem[];
  readiness_score: number;
  source_mode?: 'csv' | 'supabase';
}

export interface TalentCheckHealth {
  status: string;
  module: string;
  version: string;
}

const MODULE4_BASE = import.meta.env.VITE_TALENT_CHECK_API_URL || '/api/module4';

export const FALLBACK_BENCHMARK_COMPANIES: string[] = [
  'Accenture plc',
  'Amazon.com Inc.',
  'Apple Inc.',
  'Cognizant Technology Solutions',
  'Deloitte',
  'Google LLC',
  'Infosys Limited',
  'Meta Platforms Inc.',
  'Microsoft Corporation',
  'Oracle Corporation',
  'Tata Consultancy Services',
  'Wipro Limited',
];

/**
 * Runs Module 4 Talent Check readiness evaluation against company benchmark.
 */
export async function runTalentCheck(
  profile: CandidateProfile,
  company: string
): Promise<TalentCheckResult> {
  const trimmedCompany = company.trim();
  if (!trimmedCompany) {
    throw new Error('A company name is required for Talent Check benchmarking.');
  }

  return apiFetch<TalentCheckResult>(MODULE4_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      company: trimmedCompany,
      profile,
    }),
    timeoutMs: 30000,
  });
}

/**
 * Retrieves the list of available benchmark companies from Module 4.
 */
export async function getBenchmarkCompanies(): Promise<string[]> {
  try {
    const endpoint = `${MODULE4_BASE}/companies`;
    const res = await apiFetch<{ companies: string[] }>(endpoint, {
      method: 'GET',
      timeoutMs: 5000,
    });
    if (Array.isArray(res?.companies) && res.companies.length > 0) {
      return res.companies;
    }
  } catch {
    // Graceful fallback to static benchmark catalog if offline
  }
  return FALLBACK_BENCHMARK_COMPANIES;
}

/**
 * Health check for Module 4 Talent Check.
 */
export async function checkTalentCheckHealth(): Promise<TalentCheckHealth> {
  const endpoint = `${MODULE4_BASE}/health`;
  return apiFetch<TalentCheckHealth>(endpoint, {
    method: 'GET',
    timeoutMs: 5000,
  });
}
