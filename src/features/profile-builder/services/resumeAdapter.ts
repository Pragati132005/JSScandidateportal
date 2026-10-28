import type {
  CandidateProfile,
  CandidateSkill,
} from '../types';

/**
 * Contract representing raw data extracted by Module 2 (Resume Parsing)
 */
export interface ParsedResumeSkillInput {
  name: string;
  categoryHint?: string;
  evidenceHint?: string;
  confidence?: 'high' | 'medium' | 'low';
}

export interface ParsedResumeInput {
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
  links?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  target_roles?: string[];
  education?: Array<{
    institution: string;
    degree: string;
    field_of_study: string;
    start_year: string;
    end_year: string;
    gpa?: string;
  }>;
  skills?: ParsedResumeSkillInput[];
  projects?: Array<{
    title: string;
    role: string;
    description: string;
    technologies: string[];
    live_url?: string;
    repo_url?: string;
    start_date?: string;
    end_date?: string;
    highlights?: string[];
  }>;
  experience?: Array<{
    company: string;
    title: string;
    location: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    description: string;
    technologies?: string[];
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    issue_date: string;
    expiration_date?: string;
    credential_id?: string;
  }>;
}

import {
  normalizeRadixCategory,
  normalizeSkillConfidence,
} from './categoryNormalizer';

export {
  normalizeRadixCategory,
  normalizeSkillConfidence,
};

/**
 * Authoritative synthetic parsed resume fixture representing output of Module 2 (Resume Parsing)
 */
export const SYNTHETIC_PARSED_RESUME: ParsedResumeInput = {
  full_name: 'Jordan Taylor',
  email: 'jordan.taylor@example.org',
  phone: '+1 (555) 345-6789',
  location: 'Austin, TX (Open to Remote)',
  headline: 'Senior Cloud Infrastructure & Site Reliability Engineer',
  summary:
    'Cloud infrastructure and DevOps engineer with 5+ years of experience automating distributed Kubernetes deployments, Terraform IaC, and zero-downtime CI/CD pipelines across AWS and GCP.',
  links: {
    linkedin: 'https://linkedin.com/in/jordantaylor-cloud',
    github: 'https://github.com/jordantaylor-cloud',
    portfolio: 'https://jordantaylor.dev',
  },
  target_roles: ['Senior DevOps Engineer', 'Site Reliability Engineer', 'Cloud Infrastructure Architect'],
  education: [
    {
      institution: 'University of Texas at Austin',
      degree: 'Bachelor of Science',
      field_of_study: 'Computer Engineering',
      start_year: '2017',
      end_year: '2021',
      gpa: '3.82 / 4.0',
    },
  ],
  skills: [
    {
      name: 'Kubernetes & Container Orchestration',
      categoryHint: 'CLOUD',
      confidence: 'high',
      evidenceHint: 'Managed 80+ node production EKS clusters with GitOps ArgoCD',
    },
    {
      name: 'Terraform Infrastructure as Code',
      categoryHint: 'CLOUD',
      confidence: 'high',
      evidenceHint: 'Automated multi-region AWS infrastructure modules in production',
    },
    {
      name: 'Python Systems Automation',
      categoryHint: 'COD',
      confidence: 'medium',
      evidenceHint: 'Developed internal CLI tooling for cluster telemetry and log aggregation',
    },
    {
      name: 'Linux Systems & Performance Tuning',
      categoryHint: 'OS',
      confidence: 'high',
      evidenceHint: 'Tuned kernel network buffers and eBPF tracing for sub-millisecond packet routing',
    },
  ],
  projects: [
    {
      title: 'KubeMesh Telemetry Gateway',
      role: 'Lead Systems Engineer',
      description: 'Automated service mesh monitoring pipeline reducing telemetry lag by 40%.',
      technologies: ['Kubernetes', 'Golang', 'Prometheus', 'Envoy'],
      repo_url: 'https://github.com/jordantaylor-cloud/kubemesh',
      highlights: ['Implemented eBPF packet tracing', 'Deployed across 3 cloud regions'],
    },
  ],
  experience: [
    {
      company: 'Aether Cloud Solutions',
      title: 'Senior DevOps Engineer',
      location: 'Austin, TX',
      start_date: '2021-06',
      end_date: '',
      is_current: true,
      description: 'Owned Kubernetes infrastructure, observability stack, and automated CI/CD deployment gates.',
      technologies: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'GitHub Actions'],
    },
  ],
  certifications: [
    {
      name: 'Certified Kubernetes Administrator (CKA)',
      issuer: 'Cloud Native Computing Foundation',
      issue_date: '2022-04',
    },
  ],
};

/**
 * Authoritative parsed resume fixture for Ananya Rao
 * Contains only information extracted from her resume; missing fields
 * (email, phone, location, institution, dates, links, certifications) are intentionally absent.
 */
export const ANANYA_RAO_PARSED_RESUME: ParsedResumeInput = {
  full_name: 'Ananya Rao',
  headline: 'Systems-leaning generalist — strong fit for SWE-heavy roles, weaker fit for data roles',
  summary:
    'Systems-oriented Computer Science and Engineering candidate with skills in programming, operating systems, computer networks, and object-oriented design. Built a distributed URL-shortening service, a multithreaded C++ job scheduler, and a Java parking-lot management system. Solved 350+ competitive programming problems and mentors juniors in DSA through the college coding club.',
  target_roles: ['Software Engineer', 'Backend Engineer'],
  education: [
    {
      institution: '',
      degree: 'B.Tech',
      field_of_study: 'Computer Science and Engineering',
      start_year: '',
      end_year: '2026',
      gpa: '8.6 / 10',
    },
  ],
  skills: [
    {
      name: 'C++',
      categoryHint: 'COD',
      evidenceHint:
        'Listed in technical skills; used to implement a multithreaded job scheduler simulating OS-level process scheduling algorithms.',
      confidence: 'high',
    },
    {
      name: 'Python',
      categoryHint: 'COD',
      evidenceHint: "Listed in the resume's Technical Skills section.",
      confidence: 'high',
    },
    {
      name: 'Java',
      categoryHint: 'COD',
      evidenceHint:
        'Listed in technical skills; used to design a parking-lot management system with Factory and Strategy patterns.',
      confidence: 'high',
    },
    {
      name: 'Data Structures & Algorithms',
      categoryHint: 'DSA',
      evidenceHint:
        'Listed as a technical skill; solved 350+ competitive programming problems and mentors juniors in DSA through the college coding club.',
      confidence: 'high',
    },
    {
      name: 'Operating Systems',
      categoryHint: 'OS',
      evidenceHint:
        'Listed as a technical skill; implemented a job scheduler simulating Round Robin, Priority, and SJF scheduling.',
      confidence: 'high',
    },
    {
      name: 'Computer Networks',
      categoryHint: 'NETW',
      evidenceHint: "Listed in the resume's Technical Skills section.",
      confidence: 'high',
    },
    {
      name: 'Object-Oriented Design',
      categoryHint: 'OOD',
      evidenceHint:
        'Listed as a technical skill; applied Factory and Strategy design patterns in a Java parking-lot management system.',
      confidence: 'high',
    },
    {
      name: 'Git',
      categoryHint: 'OTHER',
      evidenceHint: "Listed in the resume's Technical Skills section.",
      confidence: 'high',
    },
    {
      name: 'Linux',
      categoryHint: 'OS',
      evidenceHint: "Listed in the resume's Technical Skills section.",
      confidence: 'high',
    },
  ],
  projects: [
    {
      title: 'Distributed URL-Shortening Service',
      role: 'Capstone systems project',
      description:
        'Built a distributed URL-shortening service with a Redis-backed cache and a horizontally scalable API layer.',
      technologies: ['Redis'],
      highlights: ['Implemented a Redis-backed cache', 'Designed a horizontally scalable API layer'],
    },
    {
      title: 'Multithreaded Job Scheduler',
      role: 'Developer',
      description:
        'Implemented a multithreaded job scheduler in C++ simulating OS-level process scheduling algorithms.',
      technologies: ['C++'],
      highlights: [
        'Round Robin scheduling',
        'Priority scheduling',
        'Shortest Job First (SJF) scheduling',
      ],
    },
    {
      title: 'Parking-Lot Management System',
      role: 'Developer',
      description:
        'Designed a parking-lot management system in Java using object-oriented design patterns as a design-practice exercise.',
      technologies: ['Java'],
      highlights: ['Factory design pattern', 'Strategy design pattern'],
    },
  ],
  experience: [
    {
      company: '',
      title: 'Backend Intern',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description:
        'Summer intern on the backend team at a mid-size product startup; shipped a rate-limiter used in production.',
      technologies: [],
    },
    {
      company: '',
      title: 'National-Level Hackathon Finalist',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: 'Finalist in a national-level 24-hour hackathon; built a real-time chat backend.',
      technologies: [],
    },
  ],
  certifications: [],
};

/**
 * Maps raw extracted resume data into our canonical CandidateProfile entity.
 *
 * ZERO FABRICATION POLICY:
 * - Any field missing from the resume remains empty ('', [], or undefined).
 * - Never populates missing fields from another candidate profile or synthetic fixture.
 * - Never invents email, phone, location, institutions, dates, links, evidence, or certifications.
 * - Preserves the candidate's existing profile_id if provided.
 */
export const mapParsedResumeToCandidateProfile = (
  parsed: ParsedResumeInput,
  existingProfile?: CandidateProfile
): CandidateProfile => {
  const profileId =
    existingProfile?.profile_id ||
    `radix-cand-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  const mappedSkills: CandidateSkill[] = (parsed.skills || []).map((sk, idx) => ({
    id: `sk-resume-${idx + 1}-${Date.now().toString(36)}`,
    skill_name: sk.name?.trim() || '',
    category_code: normalizeRadixCategory(sk.categoryHint),
    evidence: sk.evidenceHint?.trim() || '',
    confidence: normalizeSkillConfidence(sk.confidence),
  }));

  return {
    schema_version: '1.0.0',
    profile_id: profileId,
    last_updated: new Date().toISOString(),
    personal_info: {
      full_name: parsed.full_name?.trim() || '',
      email: parsed.email?.trim() || '',
      phone: parsed.phone?.trim() || '',
      location: parsed.location?.trim() || '',
      headline: parsed.headline?.trim() || '',
      summary: parsed.summary?.trim() || '',
      links: {
        linkedin: parsed.links?.linkedin?.trim() || '',
        github: parsed.links?.github?.trim() || '',
        portfolio: parsed.links?.portfolio?.trim() || '',
        other: '',
      },
    },
    preferred_roles: {
      target_roles: Array.isArray(parsed.target_roles) ? [...parsed.target_roles] : [],
      job_types: [], // Empty: not candidate-confirmed yet
      preferred_locations: [],
      expected_salary_currency: '', // Empty: not candidate-confirmed yet
      expected_salary_range: '',
      notice_period_days: undefined,
    },
    education: (parsed.education || []).map((edu, idx) => ({
      id: `edu-resume-${idx + 1}`,
      institution: edu.institution?.trim() || '',
      degree: edu.degree?.trim() || '',
      field_of_study: edu.field_of_study?.trim() || '',
      start_year: edu.start_year?.trim() || '',
      end_year: edu.end_year?.trim() || '',
      gpa_or_grade: edu.gpa?.trim() || '',
      highlights: '',
    })),
    skills: mappedSkills,
    projects: (parsed.projects || []).map((proj, idx) => ({
      id: `proj-resume-${idx + 1}`,
      title: proj.title?.trim() || '',
      role: proj.role?.trim() || '',
      description: proj.description?.trim() || '',
      technologies: Array.isArray(proj.technologies) ? [...proj.technologies] : [],
      live_url: proj.live_url?.trim() || '',
      repo_url: proj.repo_url?.trim() || '',
      start_date: proj.start_date?.trim() || '',
      end_date: proj.end_date?.trim() || '',
      highlights: Array.isArray(proj.highlights) ? [...proj.highlights] : [],
    })),
    internships_and_experience: (parsed.experience || []).map((exp, idx) => ({
      id: `exp-resume-${idx + 1}`,
      company: exp.company?.trim() || '',
      title: exp.title?.trim() || '',
      location: exp.location?.trim() || '',
      start_date: exp.start_date?.trim() || '',
      end_date: exp.end_date?.trim() || '',
      is_current: Boolean(exp.is_current),
      description: exp.description?.trim() || '',
      technologies: Array.isArray(exp.technologies) ? [...exp.technologies] : [],
    })),
    certifications: (parsed.certifications || []).map((cert, idx) => ({
      id: `cert-resume-${idx + 1}`,
      name: cert.name?.trim() || '',
      issuer: cert.issuer?.trim() || '',
      issue_date: cert.issue_date?.trim() || '',
      expiration_date: cert.expiration_date?.trim() || '',
      credential_id: cert.credential_id?.trim() || '',
      credential_url: '',
    })),
  };
};

/**
 * Merges freshly parsed resume data into an existing candidate draft,
 * preserving candidate's explicitly entered manual fields (e.g. email, phone, location)
 * while updating extracted fields without cross-profile leakage.
 */
export const mergeResumeIntoCandidateProfile = (
  existingProfile: CandidateProfile,
  parsedResume: ParsedResumeInput
): CandidateProfile => {
  const pureResumeProfile = mapParsedResumeToCandidateProfile(parsedResume, existingProfile);

  return {
    ...pureResumeProfile,
    profile_id: existingProfile.profile_id,
    last_updated: new Date().toISOString(),
    personal_info: {
      full_name: pureResumeProfile.personal_info.full_name || existingProfile.personal_info.full_name,
      headline: pureResumeProfile.personal_info.headline || existingProfile.personal_info.headline,
      summary: pureResumeProfile.personal_info.summary || existingProfile.personal_info.summary,
      // If resume is missing email/phone/location, keep what the candidate explicitly supplied
      email: pureResumeProfile.personal_info.email || existingProfile.personal_info.email,
      phone: pureResumeProfile.personal_info.phone || existingProfile.personal_info.phone,
      location: pureResumeProfile.personal_info.location || existingProfile.personal_info.location,
      links: {
        linkedin: pureResumeProfile.personal_info.links.linkedin || existingProfile.personal_info.links.linkedin,
        github: pureResumeProfile.personal_info.links.github || existingProfile.personal_info.links.github,
        portfolio: pureResumeProfile.personal_info.links.portfolio || existingProfile.personal_info.links.portfolio,
        other: existingProfile.personal_info.links.other || '',
      },
    },
    preferred_roles: {
      target_roles:
        pureResumeProfile.preferred_roles.target_roles.length > 0
          ? pureResumeProfile.preferred_roles.target_roles
          : existingProfile.preferred_roles.target_roles,
      job_types:
        pureResumeProfile.preferred_roles.job_types.length > 0
          ? pureResumeProfile.preferred_roles.job_types
          : existingProfile.preferred_roles.job_types,
      preferred_locations:
        pureResumeProfile.preferred_roles.preferred_locations.length > 0
          ? pureResumeProfile.preferred_roles.preferred_locations
          : existingProfile.preferred_roles.preferred_locations,
      expected_salary_currency:
        pureResumeProfile.preferred_roles.expected_salary_currency ||
        existingProfile.preferred_roles.expected_salary_currency,
      expected_salary_range:
        pureResumeProfile.preferred_roles.expected_salary_range ||
        existingProfile.preferred_roles.expected_salary_range,
      notice_period_days:
        pureResumeProfile.preferred_roles.notice_period_days ??
        existingProfile.preferred_roles.notice_period_days,
    },
    education:
      pureResumeProfile.education.length > 0 ? pureResumeProfile.education : existingProfile.education,
    skills:
      pureResumeProfile.skills.length > 0 ? pureResumeProfile.skills : existingProfile.skills,
    projects:
      pureResumeProfile.projects.length > 0 ? pureResumeProfile.projects : existingProfile.projects,
    internships_and_experience:
      pureResumeProfile.internships_and_experience.length > 0
        ? pureResumeProfile.internships_and_experience
        : existingProfile.internships_and_experience,
    certifications:
      pureResumeProfile.certifications.length > 0
        ? pureResumeProfile.certifications
        : existingProfile.certifications,
  };
};

export * from './module2Adapter';
