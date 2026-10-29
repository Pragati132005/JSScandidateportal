
const MODULE1_URL = '/api/module1';
const MODULE5_URL = '/api/module5';

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

export async function runSkillMatch(
  candidateProfile: JsonObject,
  jobDescriptionFile: File,
  company = '',
  role = '',
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
  const extractedSkills = Array.isArray(jdData.skills)
    ? jdData.skills
    : [];

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
    throw new Error(
      'Module 1 did not extract any skills from this job description.',
    );
  }

  // 3. Convert Module 3's candidate profile into a matching request.
  const profileSkills = Array.isArray(candidateProfile.skills)
  ? candidateProfile.skills
  : [];

const candidateSkills = profileSkills
  .map((item) => {
    const skill = item as JsonObject;

    return {
      name: String(skill.skill_name ?? skill.name ?? '').trim(),
      category_code: skill.category_code ?? null,
      evidence: skill.evidence ?? null,
      confidence: skill.confidence ?? null,
    };
  })
  .filter((skill) => skill.name.length > 0);

  const candidate = {
  candidate_id: String(candidateProfile.profile_id ?? 'candidate'),
  candidate_name: String(
    (candidateProfile.personal_info as JsonObject | undefined)?.full_name ??
    'Candidate',
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
