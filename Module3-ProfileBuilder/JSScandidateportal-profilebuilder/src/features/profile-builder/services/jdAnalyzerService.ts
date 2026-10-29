/**
 * RADIX Talent Match - Module 1: JD Analytics Service
 * Microservice Port: 8020 | Proxy prefix: /api/module1
 */

import { apiFetch } from './apiClient';

export interface JDSkill {
  skill_name: string;
  category_code: string;
  confidence: 'high' | 'medium' | 'low' | string;
  evidence_quote?: string;
  evidence?: string;
  source_section?: string;
}

export interface JDExtractionResponse {
  schema_version?: string;
  source_type?: string;
  source_file?: string;
  company?: string;
  role?: string;
  skills: JDSkill[];
  extraction_metadata?: Record<string, unknown>;
}

export interface JDHealthStatus {
  status: string;
  service?: string;
  provider?: string;
}

const MODULE1_BASE = import.meta.env.VITE_MODULE1_API_URL || '/api/module1';

/**
 * Extracts skills from an uploaded Job Description document (PDF, DOCX, TXT).
 */
export async function extractJdFromFile(
  file: File,
  company?: string,
  role?: string
): Promise<JDExtractionResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (company && company.trim()) formData.append('company', company.trim());
  if (role && role.trim()) formData.append('role', role.trim());

  const endpoint = `${MODULE1_BASE}/api/extract-jd`;

  return apiFetch<JDExtractionResponse>(endpoint, {
    method: 'POST',
    body: formData,
    timeoutMs: 60000,
  });
}

/**
 * Extracts skills from raw Job Description text.
 */
export async function extractJdFromText(
  jdText: string,
  company?: string,
  role?: string
): Promise<JDExtractionResponse> {
  const endpoint = `${MODULE1_BASE}/api/extract-jd-text`;

  return apiFetch<JDExtractionResponse>(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jd_text: jdText,
      company: company && company.trim() ? company.trim() : undefined,
      role: role && role.trim() ? role.trim() : undefined,
      source_file: 'direct_input.txt',
    }),
    timeoutMs: 60000,
  });
}

/**
 * Health check for Module 1 JD Analyzer.
 */
export async function checkJdAnalyzerHealth(): Promise<JDHealthStatus> {
  const endpoint = `${MODULE1_BASE}/health`;
  return apiFetch<JDHealthStatus>(endpoint, {
    method: 'GET',
    timeoutMs: 5000,
  });
}
