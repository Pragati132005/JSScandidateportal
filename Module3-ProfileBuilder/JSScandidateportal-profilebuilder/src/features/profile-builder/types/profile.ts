/**
 * RADIX Talent Match - Candidate Profile JSON Contract
 * Module: Profile Builder
 *
 * Defines the canonical contract for candidate profiles, adhering to the 13 RADIX
 * category codes and 3-level confidence scores.
 */

export const RADIX_CATEGORY_CODES = [
  'COD',
  'DSA',
  'OOD',
  'APTI',
  'COMM',
  'AI',
  'CLOUD',
  'SQL',
  'SWE',
  'SYSD',
  'NETW',
  'OS',
  'OTHER',
] as const;

export type RadixCategoryCode = (typeof RADIX_CATEGORY_CODES)[number];

export const SKILL_CONFIDENCE_LEVELS = ['high', 'medium', 'low'] as const;

export type SkillConfidence = (typeof SKILL_CONFIDENCE_LEVELS)[number];

export interface CandidateSkill {
  id: string;
  skill_name: string;
  category_code: RadixCategoryCode;
  evidence: string;
  confidence: SkillConfidence;
}

export interface CandidatePersonalLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  other?: string;
}

export interface CandidatePersonalInfo {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  summary: string;
  links: CandidatePersonalLinks;
}

export interface CandidateEducation {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_year: string;
  end_year: string;
  gpa_or_grade?: string;
  highlights?: string;
}

export type JobTypePreference = 'full-time' | 'internship' | 'contract' | 'remote' | string;

export interface CandidatePreferredRoles {
  target_roles: string[];
  job_types: JobTypePreference[];
  preferred_locations: string[];
  expected_salary_currency?: string;
  expected_salary_range?: string;
  notice_period_days?: number;
}

export interface CandidateProject {
  id: string;
  title: string;
  role: string;
  description: string;
  technologies: string[];
  live_url?: string;
  repo_url?: string;
  start_date?: string;
  end_date?: string;
  highlights: string[];
}

export interface CandidateExperience {
  id: string;
  company: string;
  title: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
  technologies: string[];
}

export interface CandidateCertification {
  id: string;
  name: string;
  issuer: string;
  issue_date: string;
  expiration_date?: string;
  credential_id?: string;
  credential_url?: string;
}

export interface CandidateHackathon {
  title?: string;
  result?: string;
  kind?: string;
  description?: string;
}

export interface CandidateProfile {
  schema_version: '1.0.0';
  profile_id: string;
  last_updated: string;
  personal_info: CandidatePersonalInfo;
  preferred_roles: CandidatePreferredRoles;
  education: CandidateEducation[];
  skills: CandidateSkill[];
  projects: CandidateProject[];
  internships_and_experience: CandidateExperience[];
  certifications: CandidateCertification[];
  hackathons?: CandidateHackathon[];
  cv_file?: string;
}

