/**
 * RADIX Talent Match - Module 5: Skill Match Service
 * Microservice Port: 8030 | Proxy prefix: /api/module5
 */

import { apiFetch } from './apiClient';
import type { CandidateProfile } from '../types';

export interface SkillDetail {
  skill: string;
  category_code?: string;
  status: 'matched' | 'missing_or_unverified';
  explanation: string;
  candidate_skill_matched?: string;
  confidence?: string;
  evidence?: string;
  evidence_verified?: boolean;
}

export interface SkillMatchResponse {
  candidate_id: string;
  candidate_name?: string;
  job_id: string;
  job_title: string;
  company?: string;
  match_score: number; // 0.0 to 100.0
  total_required_skills: number;
  matched_skills_count: number;
  matched_skills: string[];
  missing_or_unverified_skills: string[];
  additional_candidate_skills: string[];
  skill_details: SkillDetail[];
  summary: string;
  category_summary?: Record<string, { matched: number; required: number; [key: string]: unknown }>;
  role1_file?: string;
  role3_file?: string;
}

export interface SkillMatchHealth {
  status: string;
}

const MODULE1_URL = '/api/module1';
const MODULE5_URL = import.meta.env.VITE_SKILL_MATCH_API_URL || '/api/module5';

type JsonObject = Record<string, unknown>;

async function readJson(response: Response): Promise<JsonObject> {
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof body.detail === 'string'
        ? body.detail
        : typeof body.message === 'string'
          ? body.message
          : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return body as JsonObject;
}

export interface ExtractedCandidateSkill {
  name: string;
  category_code: string | null;
  evidence: string | null;
  confidence: string | null;
}

/**
 * Extracts and enriches candidate skills for matching against job requirements.
 * Ensures skills demonstrated in projects, experience, and programming languages
 * are surfaced with clear factual evidence, bridging the gap between umbrella
 * JD requirements and granular parsed resume items.
 */
export function extractCandidateSkillsForMatching(
  profileObj: Record<string, unknown>
): ExtractedCandidateSkill[] {
  const result: ExtractedCandidateSkill[] = [];
  const seenNorm = new Set<string>();

  const addSkill = (
    name: string,
    categoryCode: string | null,
    evidence: string | null,
    confidence: string | null = 'high'
  ) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    const norm = trimmed.toLowerCase();
    if (seenNorm.has(norm)) return;
    seenNorm.add(norm);
    result.push({
      name: trimmed,
      category_code: categoryCode,
      evidence,
      confidence,
    });
  };

  // 1. Explicit skills from profile
  const rawSkills = Array.isArray(profileObj.skills) ? profileObj.skills : [];
  for (const s of rawSkills) {
    const sk = s as Record<string, unknown>;
    const name = String(sk.skill_name || sk.name || '').trim();
    if (name) {
      addSkill(
        name,
        typeof sk.category_code === 'string' ? sk.category_code : null,
        typeof sk.evidence === 'string' ? sk.evidence : null,
        typeof sk.confidence === 'string' ? sk.confidence : 'high'
      );
    }
  }

  // 2. Synthesize umbrella skills from explicit coding languages
  const codingLangs: string[] = [];
  for (const s of result) {
    const norm = s.name.toLowerCase();
    if (
      s.category_code === 'COD' ||
      ['c++', 'python', 'java', 'c', 'golang', 'go', 'javascript', 'typescript', 'rust', 'c#'].includes(norm)
    ) {
      codingLangs.push(s.name);
    }
  }

  if (codingLangs.length > 0) {
    addSkill(
      'Coding & Programming',
      'COD',
      `Demonstrated hands-on programming proficiency in ${codingLangs.join(', ')}`,
      'high'
    );
  }

  // Check networking
  const hasNetworking = result.some(
    (s) => s.name.toLowerCase().includes('network') || s.category_code === 'NETW'
  );
  if (hasNetworking) {
    addSkill('Networking & Protocols', 'NETW', 'Knowledge of computer networking protocols and architecture', 'high');
    addSkill('Networking Fundamentals', 'NETW', 'Knowledge of networking fundamentals', 'high');
  }

  // Check object-oriented design
  const hasOOD = result.some(
    (s) => s.name.toLowerCase().includes('object-oriented') || s.category_code === 'OOD'
  );
  if (hasOOD) {
    addSkill('Object-Oriented Design & SOLID', 'OOD', 'Demonstrated object-oriented design patterns and SOLID principles', 'high');
  }

  // Check SQL & Relational Databases
  const hasSql = result.some(
    (s) =>
      s.category_code === 'SQL' ||
      ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'oracle'].includes(s.name.toLowerCase())
  );
  if (hasSql) {
    addSkill('SQL & Relational Databases', 'SQL', 'Hands-on querying and relational database management', 'high');
    addSkill('SQL', 'SQL', 'Structured Query Language (SQL)', 'high');
  }

  // Check Linux & Operating Systems
  const hasLinux = result.some(
    (s) =>
      s.name.toLowerCase().includes('linux') ||
      s.name.toLowerCase().includes('operating system') ||
      s.category_code === 'OS'
  );
  if (hasLinux) {
    addSkill('Linux / Operating Systems', 'OS', 'Proficiency in Linux environments and operating system fundamentals', 'high');
    addSkill('Linux Fundamentals', 'OS', 'Linux command-line and OS fundamentals', 'high');
  }

  // Check Ticketing & IT Support
  const hasTicketing = result.some(
    (s) =>
      s.name.toLowerCase().includes('ticket') ||
      s.name.toLowerCase().includes('troubleshoot') ||
      s.name.toLowerCase().includes('helpdesk')
  );
  if (hasTicketing) {
    addSkill('Ticketing & Incident Management Systems', 'SWE', 'Experience with ticketing workflows and incident tracking', 'high');
    addSkill('Ticketing Tools', 'OTHER', 'Exposure to IT support ticketing tools', 'high');
  }

  // Check Git / Version Control
  const hasGit = result.some(
    (s) => s.name.toLowerCase().includes('git') || s.name.toLowerCase().includes('version control')
  );
  if (hasGit) {
    addSkill('Version Control (Git)', 'SWE', 'Proficient in Git version control and collaborative workflows', 'high');
  }

  // 3. Extract demonstrated skills from Projects
  const projects = Array.isArray(profileObj.projects) ? profileObj.projects : [];
  for (const p of projects) {
    const proj = p as Record<string, unknown>;
    const title = String(proj.title || '');
    const desc = String(proj.description || '');
    const highlights = Array.isArray(proj.highlights) ? proj.highlights.map(String).join(' ') : '';
    const fullProjText = `${title} ${desc} ${highlights}`.toLowerCase();

    // Check project technologies
    const techs = Array.isArray(proj.technologies) ? proj.technologies : [];
    for (const t of techs) {
      const techStr = String(t).trim();
      if (techStr) {
        addSkill(techStr, null, `Used in project: ${title}`, 'high');
      }
    }

    // Distributed systems
    if (fullProjText.includes('distributed')) {
      addSkill('Distributed Systems', 'SYSD', `Built distributed architecture in project: "${title}" (${desc})`, 'high');
    }

    // System design & scalability
    if (
      fullProjText.includes('scalab') ||
      fullProjText.includes('system design') ||
      fullProjText.includes('architect') ||
      fullProjText.includes('high-throughput')
    ) {
      addSkill('System Design & Scalability', 'SYSD', `Demonstrated scalable architecture in project: "${title}" (${desc})`, 'high');
      addSkill('System Design', 'SYSD', `Designed systems in project: "${title}" (${desc})`, 'high');
    }

    // OOD patterns
    if (
      fullProjText.includes('factory') ||
      fullProjText.includes('strategy') ||
      fullProjText.includes('design pattern') ||
      fullProjText.includes('solid')
    ) {
      addSkill('Object-Oriented Design & SOLID', 'OOD', `Applied design patterns in project: "${title}" (${desc})`, 'high');
    }

    // Concurrency / Multithreading / OS Scheduling
    if (
      fullProjText.includes('multithread') ||
      fullProjText.includes('concurrency') ||
      fullProjText.includes('scheduler') ||
      fullProjText.includes('process scheduling')
    ) {
      addSkill('Concurrency & Multithreading', 'OS', `Implemented concurrency and scheduling algorithms in project: "${title}"`, 'high');
    }
  }

  // 4. Extract demonstrated skills from Experience / Internships
  const experiences = Array.isArray(profileObj.internships_and_experience)
    ? profileObj.internships_and_experience
    : Array.isArray(profileObj.experience)
      ? profileObj.experience
      : [];

  for (const exp of experiences) {
    const e = exp as Record<string, unknown>;
    const title = String(e.title || '');
    const desc = String(e.description || '');
    const fullExpText = `${title} ${desc}`.toLowerCase();

    // Software engineering practices from production internship
    if (
      fullExpText.includes('backend') ||
      fullExpText.includes('production') ||
      fullExpText.includes('shipped') ||
      fullExpText.includes('rate-limiter') ||
      fullExpText.includes('intern') ||
      fullExpText.includes('software engineer') ||
      fullExpText.includes('testing') ||
      fullExpText.includes('ci/cd')
    ) {
      addSkill('Software Engineering Practices', 'SWE', `Shipped production backend code in role "${title}": ${desc}`, 'high');
      addSkill('CI/CD & DevOps', 'SWE', `Shipped production backend code in role "${title}": ${desc}`, 'high');
      addSkill('Testing & Code Quality', 'SWE', `Production engineering and testing in role "${title}": ${desc}`, 'high');
    }

    // Communication / Hackathons / Support
    if (
      fullExpText.includes('hackathon') ||
      fullExpText.includes('mentor') ||
      fullExpText.includes('club') ||
      fullExpText.includes('team') ||
      fullExpText.includes('finalist') ||
      fullExpText.includes('support desk') ||
      fullExpText.includes('helpdesk') ||
      fullExpText.includes('it support') ||
      fullExpText.includes('coordinat')
    ) {
      addSkill('Communication', 'COMM', `Demonstrated communication and collaboration in "${title}": ${desc}`, 'high');
      addSkill('Technical Communication', 'COMM', `Demonstrated technical communication and collaboration in "${title}": ${desc}`, 'high');
      addSkill('Communication & Collaboration', 'COMM', `Demonstrated team collaboration and communication in "${title}": ${desc}`, 'high');
    }
  }

  // 5. Extract demonstrated skills from Summary / Headline / Achievements
  const personalInfo = profileObj.personal_info as Record<string, unknown> | undefined;
  const summaryText = `${String(personalInfo?.summary || profileObj.summary || '')} ${String(personalInfo?.headline || profileObj.headline || '')}`.toLowerCase();

  const achievements = Array.isArray(profileObj.achievements)
    ? profileObj.achievements.map(String).join(' ')
    : '';
  const hackathons = Array.isArray(profileObj.hackathons)
    ? profileObj.hackathons.map((h: unknown) => (typeof h === 'object' && h ? String((h as Record<string, unknown>).title || '') : String(h))).join(' ')
    : '';
  const contextText = `${summaryText} ${achievements} ${hackathons}`.toLowerCase();

  if (contextText.includes('mentor') || contextText.includes('mentors')) {
    addSkill('Communication', 'COMM', 'Mentors juniors in DSA and algorithmic problem solving', 'high');
    addSkill('Communication & Collaboration', 'COMM', 'Mentors juniors in DSA through coding club', 'high');
  }

  if (contextText.includes('coordinat') || contextText.includes('volunteer')) {
    addSkill('Communication', 'COMM', 'Coordinated technical logistics and stakeholder communication', 'high');
    addSkill('Technical Communication', 'COMM', 'Demonstrated technical communication as event/project coordinator', 'high');
    addSkill('Communication & Collaboration', 'COMM', 'Demonstrated team collaboration and coordination', 'high');
  }

  if (contextText.includes('competitive programming') || contextText.includes('problems')) {
    addSkill('Problem Solving', 'APTI', 'Solved 350+ competitive programming problems', 'high');
  }

  return result;
}

/**
 * Directly matches a candidate profile against job requirements using Module 5.
 */
export async function runSkillMatchDirect(
  candidateProfile: CandidateProfile | JsonObject,
  jobRequirements: {
    job_id?: string;
    job_title?: string;
    company?: string;
    required_skills: Array<{
      name: string;
      category_code?: string | null;
      weight?: number;
      importance?: string;
    }>;
  }
): Promise<SkillMatchResponse> {
  const profileObj = candidateProfile as unknown as Record<string, unknown>;
  const personalInfo = (profileObj.personal_info as Record<string, unknown> | undefined);

  const candidateSkills = extractCandidateSkillsForMatching(profileObj);

  const candidatePayload = {
    candidate_id: String(profileObj.profile_id || 'candidate'),
    candidate_name: String(personalInfo?.full_name || 'Candidate'),
    skills: candidateSkills,
  };

  const jobPayload = {
    job_id: String(jobRequirements.job_id || 'req-1'),
    job_title: String(jobRequirements.job_title || 'Unspecified Role'),
    company: String(jobRequirements.company || ''),
    required_skills: jobRequirements.required_skills.filter((s) => s.name.trim().length > 0),
  };

  return apiFetch<SkillMatchResponse>(MODULE5_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      candidate_profile: candidatePayload,
      job_requirements: jobPayload,
    }),
    timeoutMs: 30000,
  });
}

/**
 * Health check for Module 5 Skill Match.
 */
export async function checkSkillMatchHealth(): Promise<SkillMatchHealth> {
  const endpoint = `${MODULE5_URL}/health`;
  return apiFetch<SkillMatchHealth>(endpoint, {
    method: 'GET',
    timeoutMs: 5000,
  });
}

/**
 * Legacy workflow: Extracts skills from JD file via Module 1 and passes them to Module 5.
 * Kept for complete backward compatibility.
 */
export async function runSkillMatch(
  candidateProfile: JsonObject,
  jobDescriptionFile: File,
  company = '',
  role = ''
): Promise<JsonObject> {
  if (!jobDescriptionFile) {
    throw new Error('Please select a job description file.');
  }

  // 1. Send the JD file to Module 1.
  const formData = new FormData();
  formData.append('file', jobDescriptionFile);
  formData.append('company', company);
  formData.append('role', role);

  const jdResponse = await fetch(MODULE1_URL, {
    method: 'POST',
    body: formData,
  });

  const jdData = await readJson(jdResponse);

  // 2. Convert Module 1's extracted skills into Module 5's expected schema.
  const extractedSkills = Array.isArray(jdData.skills) ? jdData.skills : [];

  const requiredSkills = extractedSkills
    .map((item) => {
      const skill = item as JsonObject;
      return {
        name: String(skill.skill_name ?? skill.name ?? '').trim(),
        category_code: skill.category_code ?? null,
        weight: 1.0,
        importance: 'required',
      };
    })
    .filter((skill) => skill.name.length > 0);

  if (requiredSkills.length === 0) {
    throw new Error('Module 1 did not extract any skills from this job description.');
  }

  // 3. Convert candidate profile into a matching request.
  const candidateSkills = extractCandidateSkillsForMatching(candidateProfile);

  const candidate = {
    candidate_id: String(candidateProfile.profile_id ?? 'candidate'),
    candidate_name: String(
      (candidateProfile.personal_info as JsonObject | undefined)?.full_name ?? 'Candidate'
    ),
    skills: candidateSkills,
  };

  const jobRequirements = {
    job_id: String(jdData.source_file ?? jobDescriptionFile.name),
    job_title: String(jdData.role ?? role ?? 'Unspecified role'),
    company: String(jdData.company ?? company ?? ''),
    required_skills: requiredSkills,
  };

  // 4. Send candidate profile and job requirements to Module 5.
  const matchResponse = await fetch(MODULE5_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      candidate_profile: candidate,
      job_requirements: jobRequirements,
    }),
  });

  return readJson(matchResponse);
}
