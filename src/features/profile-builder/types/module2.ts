/**
 * RADIX Talent Match - Module 2 (Resume Parsing) Output Contract
 * Module: Profile Builder
 *
 * Defines the external contract representing raw data extracted by Module 2 Resume Parser,
 * as exemplified by priya_menon.parse.json.
 *
 * All fields are treated as potentially optional, nullable, or absent.
 */

export interface Module2Skill {
  skill_name?: string | null;
  category_code?: string | null;
  evidence?: string | null;
  confidence?: 'high' | 'medium' | 'low' | string | null;
  evidence_verified?: boolean | null;
  source_section?: string | null;
}

export interface Module2Hackathon {
  title?: string | null;
  result?: string | null;
  kind?: string | null;
  description?: string | null;
}

export interface Module2Internship {
  role?: string | null;
  organization?: string | null;
  description?: string | null;
}

export interface Module2CertificationObject {
  name?: string | null;
  issuer?: string | null;
  issue_date?: string | null;
  expiration_date?: string | null;
  credential_id?: string | null;
  credential_url?: string | null;
}

export type Module2Certification = string | Module2CertificationObject;

export interface Module2ProfilePrefill {
  name?: string | null;
  email?: string | null;
  education?: string | null;
  skills?: (Module2Skill | null)[] | null;
  hackathons?: (Module2Hackathon | null)[] | null;
  internships?: (Module2Internship | null)[] | null;
  certifications?: (Module2Certification | null)[] | null;
  preferred_roles?: (string | null)[] | null;
  cv_file?: string | null;
}

export interface Module2EducationDetail {
  degree?: string | null;
  field?: string | null;
  field_of_study?: string | null;
  institution?: string | null;
  graduation_year?: number | string | null;
  grade?: string | null;
  grade_scale?: string | null;
  start_year?: number | string | null;
  end_year?: number | string | null;
}

export interface Module2Project {
  title?: string | null;
  role?: string | null;
  description?: string | null;
  technologies?: (string | null)[] | null;
  live_url?: string | null;
  repo_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  highlights?: (string | null)[] | null;
}

export interface Module2Experience {
  role?: string | null;
  title?: string | null;
  organization?: string | null;
  company?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_current?: boolean | null;
  description?: string | null;
  technologies?: (string | null)[] | null;
}

export interface Module2Details {
  phone?: string | null;
  links?: (string | { label?: string; url?: string } | null)[] | null;
  education_details?: (Module2EducationDetail | null)[] | null;
  projects?: (Module2Project | null)[] | null;
  experience?: (Module2Experience | null)[] | null;
  achievements?: (string | null)[] | null;
}

export interface Module2Meta {
  parser_version?: string | null;
  prompt_version?: string | null;
  taxonomy_version?: string | null;
  model_used?: string | null;
  from_cache?: boolean | null;
  input_format?: string | null;
  parse_warnings?: (string | null)[] | null;
  categories_without_evidence?: (string | null)[] | null;
  field_confidence?: Record<string, string | null> | null;
  processing_ms?: number | null;
}

export interface Module2ParserOutput {
  schema_version?: string | null;
  source_type?: string | null;
  source_file?: string | null;
  company?: string | null;
  role?: string | null;
  skills?: (Module2Skill | null)[] | null;
  profile_prefill?: Module2ProfilePrefill | null;
  details?: Module2Details | null;
  category_summary?: unknown;
  meta?: Module2Meta | null;
}

/**
 * Separate metadata structure for provenance tracking and diagnostics.
 * Preserves extraction metadata (parse_warnings, field_confidence, source_section,
 * evidence_verified) honestly without contaminating canonical CandidateProfile v1.0.0.
 */
export interface Module2Metadata {
  schema_version?: string;
  source_type?: string;
  source_file?: string;
  parser_version?: string;
  prompt_version?: string;
  taxonomy_version?: string;
  model_used?: string;
  from_cache?: boolean;
  input_format?: string;
  parse_warnings?: string[];
  categories_without_evidence?: string[];
  field_confidence?: Record<string, string>;
  processing_ms?: number;
  skill_metadata?: Array<{
    skill_name: string;
    source_section?: string;
    evidence_verified?: boolean;
    confidence?: string;
  }>;
  hackathons?: Module2Hackathon[];
  achievements?: string[];
}
