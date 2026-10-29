/**
 * RADIX Talent Match - Module 2: Resume Parser Service
 * Microservice Port: 8000 | Proxy prefix: /api/module2
 */

import { apiFetch } from './apiClient';
import type { Module2ParserOutput } from '../types/module2';

export interface ResumeParserHealth {
  status: string;
  version?: string;
  llm_mode?: string;
}

const MODULE2_BASE = import.meta.env.VITE_RESUME_PARSER_API_URL || '/api/module2';

/**
 * Sends a PDF or DOCX resume to Module 2 parser backend.
 */
export async function parseResumeFile(file: File): Promise<Module2ParserOutput> {
  const formData = new FormData();
  formData.append('file', file);

  return apiFetch<Module2ParserOutput>(MODULE2_BASE, {
    method: 'POST',
    body: formData,
    timeoutMs: 120000,
  });
}

/**
 * Health check for Module 2 Resume Parser.
 */
export async function checkResumeParserHealth(): Promise<ResumeParserHealth> {
  const endpoint = `${MODULE2_BASE}/health`;
  return apiFetch<ResumeParserHealth>(endpoint, {
    method: 'GET',
    timeoutMs: 5000,
  });
}
