import React, { useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  ArrowRight,
  Building2,
  Users,
  Briefcase,
  FileText,
} from 'lucide-react';
import type { CandidateProfile, Module2Metadata, Module2ParserOutput } from '../features/profile-builder/types';
import type { JDExtractionResponse } from '../features/profile-builder/services/jdAnalyzerService';
import type { TalentCheckResult } from '../features/profile-builder/services/talentCheckService';
import type { SkillMatchResponse } from '../features/profile-builder/services/skillMatchService';
import { extractJdFromText, extractJdFromFile } from '../features/profile-builder/services/jdAnalyzerService';
import { parseResumeFile } from '../features/profile-builder/services/resumeParserService';
import {
  mapModule2OutputToParsedResumeInput,
  extractModule2Metadata,
  mapParsedResumeToCandidateProfile,
  validateModule2Output,
} from '../features/profile-builder/services/resumeAdapter';
import { runTalentCheck } from '../features/profile-builder/services/talentCheckService';
import { runSkillMatchDirect } from '../features/profile-builder/services/skillMatchService';

import type { AppViewId } from '../components/navigation/Sidebar';

export type WorkflowStepId = 'input' | 'extraction' | 'review' | 'downstream' | 'completed';

export type ModuleStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface FullAssessmentState {
  // Module 1 JD
  m1Status: ModuleStatus;
  m1Result: JDExtractionResponse | null;
  m1Error?: string;

  // Module 2 Resume
  m2Status: ModuleStatus;
  m2Result: Module2ParserOutput | null;
  m2Metadata?: Module2Metadata | null;
  m2Error?: string;

  // Module 3 Profile Draft
  m3Status: ModuleStatus;
  reviewedProfile: CandidateProfile | null;

  // Module 4 Talent Check
  m4Status: ModuleStatus;
  m4Result: TalentCheckResult | null;
  m4Error?: string;

  // Module 5 Skill Match
  m5Status: ModuleStatus;
  m5Result: SkillMatchResponse | null;
  m5Error?: string;
}

interface AssessmentWorkflowViewProps {
  savedProfiles: CandidateProfile[];
  activeProfile: CandidateProfile;
  onSelectActiveProfile: (profile: CandidateProfile) => void;
  activeJd: JDExtractionResponse | null;
  onSetActiveJd: (jd: JDExtractionResponse) => void;
  selectedCompany: string;
  onSelectCompany: (company: string) => void;
  companiesList: string[];
  onNavigate: (view: AppViewId) => void;
  onSaveAssessmentResult: (result: {
    candidateName: string;
    jobTitle: string;
    company: string;
    talentCheckScore?: number;
    skillMatchScore?: number;
    talentResult: TalentCheckResult | null;
    skillMatchResult: SkillMatchResponse | null;
    jdResult: JDExtractionResponse | null;
  }) => void;
}

export const AssessmentWorkflowView: React.FC<AssessmentWorkflowViewProps> = ({
  savedProfiles,
  activeProfile,
  onSelectActiveProfile,
  activeJd,
  onSetActiveJd,
  selectedCompany,
  onSelectCompany,
  companiesList,
  onNavigate,
  onSaveAssessmentResult,
}) => {
  const [currentStep, setCurrentStep] = useState<WorkflowStepId>('input');

  // Input states
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdMode, setJdMode] = useState<'existing' | 'text' | 'file'>(
    activeJd ? 'existing' : 'text'
  );
  const [jdTextInput, setJdTextInput] = useState('');
  const [jdFileInput, setJdFileInput] = useState<File | null>(null);

  // Workflow module states
  const [workflowState, setWorkflowState] = useState<FullAssessmentState>({
    m1Status: activeJd ? 'completed' : 'idle',
    m1Result: activeJd,
    m2Status: 'idle',
    m2Result: null,
    m3Status: 'completed',
    reviewedProfile: activeProfile,
    m4Status: 'idle',
    m4Result: null,
    m5Status: 'idle',
    m5Result: null,
  });

  const [reviewDraft, setReviewDraft] = useState<CandidateProfile>(activeProfile);

  // Step 2: Trigger Independent Extraction
  const handleStartExtraction = async () => {
    setCurrentStep('extraction');

    const promises: Promise<void>[] = [];

    // Run Module 1 if needed
    if (!workflowState.m1Result || jdMode !== 'existing') {
      setWorkflowState((prev) => ({ ...prev, m1Status: 'running', m1Error: undefined }));
      promises.push(
        (async () => {
          try {
            let jdRes: JDExtractionResponse;
            if (jdMode === 'file' && jdFileInput) {
              jdRes = await extractJdFromFile(jdFileInput, selectedCompany);
            } else {
              const text = jdTextInput.trim() || 'Software Engineer with Python, SQL, and Cloud systems';
              jdRes = await extractJdFromText(text, selectedCompany);
            }
            onSetActiveJd(jdRes);
            setWorkflowState((prev) => ({ ...prev, m1Status: 'completed', m1Result: jdRes }));
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'JD extraction error';
            setWorkflowState((prev) => ({
              ...prev,
              m1Status: 'failed',
              m1Error: `${msg}. Check Module 1 on port 8020.`,
            }));
          }
        })()
      );
    }

    // Run Module 2 if a resume was uploaded
    if (resumeFile) {
      setWorkflowState((prev) => ({ ...prev, m2Status: 'running', m2Error: undefined }));
      promises.push(
        (async () => {
          try {
            const m2Out = await parseResumeFile(resumeFile);
            const validation = validateModule2Output(m2Out);
            if (!validation.isValid) {
              throw new Error(`Parser output invalid: ${validation.errors.join('; ')}`);
            }
            const parsedInput = mapModule2OutputToParsedResumeInput(m2Out);
            const meta = extractModule2Metadata(m2Out);

            // Construct draft for candidate review
            const draft = mapParsedResumeToCandidateProfile(parsedInput, activeProfile);
            if (resumeFile.name) draft.cv_file = resumeFile.name;
            if (meta?.hackathons && meta.hackathons.length > 0) {
              draft.hackathons = meta.hackathons.map((h) => ({
                title: h.title || undefined,
                result: h.result || undefined,
                kind: h.kind || undefined,
                description: h.description || undefined,
              }));
            }

            setReviewDraft(draft);
            setWorkflowState((prev) => ({
              ...prev,
              m2Status: 'completed',
              m2Result: m2Out,
              m2Metadata: meta,
              reviewedProfile: draft,
            }));
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Resume parsing error';
            setWorkflowState((prev) => ({
              ...prev,
              m2Status: 'failed',
              m2Error: `${msg}. Check Module 2 on port 8000.`,
            }));
          }
        })()
      );
    } else {
      // Use currently active profile
      setReviewDraft(activeProfile);
      setWorkflowState((prev) => ({
        ...prev,
        m2Status: 'completed',
        reviewedProfile: activeProfile,
      }));
    }

    await Promise.allSettled(promises);
    setCurrentStep('review');
  };

  // Step 3: Confirm Candidate Profile and Launch Downstream Analysis
  const handleConfirmProfileAndRunDownstream = async () => {
    setCurrentStep('downstream');

    const candidateToTest = reviewDraft;
    const currentJd = workflowState.m1Result || activeJd;

    // Run Module 4 (Talent Check)
    setWorkflowState((prev) => ({ ...prev, m4Status: 'running', m4Error: undefined }));
    const pTalent = runTalentCheck(candidateToTest, selectedCompany)
      .then((res) => {
        setWorkflowState((prev) => ({ ...prev, m4Status: 'completed', m4Result: res }));
        return res;
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Talent Check error';
        setWorkflowState((prev) => ({
          ...prev,
          m4Status: 'failed',
          m4Error: `${msg}. Check Module 4 on port 8010.`,
        }));
        return null;
      });

    // Run Module 5 (Skill Match) if JD is available
    let pMatch: Promise<SkillMatchResponse | null> = Promise.resolve(null);
    if (currentJd && currentJd.skills && currentJd.skills.length > 0) {
      setWorkflowState((prev) => ({ ...prev, m5Status: 'running', m5Error: undefined }));
      pMatch = runSkillMatchDirect(candidateToTest, {
        job_id: currentJd.source_file || 'target-jd',
        job_title: currentJd.role || 'Target Role',
        company: currentJd.company || selectedCompany,
        required_skills: currentJd.skills.map((s) => ({
          name: s.skill_name,
          category_code: s.category_code || null,
          weight: 1.0,
          importance: 'required',
        })),
      })
        .then((res) => {
          setWorkflowState((prev) => ({ ...prev, m5Status: 'completed', m5Result: res }));
          return res;
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Skill Match error';
          setWorkflowState((prev) => ({
            ...prev,
            m5Status: 'failed',
            m5Error: `${msg}. Check Module 5 on port 8030.`,
          }));
          return null;
        });
    }

    const [tRes, mRes] = await Promise.all([pTalent, pMatch]);

    // Save result to history
    onSaveAssessmentResult({
      candidateName: candidateToTest.personal_info.full_name || candidateToTest.profile_id,
      jobTitle: currentJd?.role || 'Evaluated Job',
      company: selectedCompany,
      talentCheckScore: tRes ? tRes.readiness_score : undefined,
      skillMatchScore: mRes ? mRes.match_score : undefined,
      talentResult: tRes,
      skillMatchResult: mRes,
      jdResult: currentJd,
    });

    setCurrentStep('completed');
  };

  // Retry Module 4 individually
  const handleRetryTalentCheck = async () => {
    setWorkflowState((prev) => ({ ...prev, m4Status: 'running', m4Error: undefined }));
    try {
      const res = await runTalentCheck(reviewDraft, selectedCompany);
      setWorkflowState((prev) => ({ ...prev, m4Status: 'completed', m4Result: res }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Talent Check retry failed';
      setWorkflowState((prev) => ({ ...prev, m4Status: 'failed', m4Error: msg }));
    }
  };

  // Retry Module 5 individually
  const handleRetrySkillMatch = async () => {
    const currentJd = workflowState.m1Result || activeJd;
    if (!currentJd || !currentJd.skills) return;

    setWorkflowState((prev) => ({ ...prev, m5Status: 'running', m5Error: undefined }));
    try {
      const res = await runSkillMatchDirect(reviewDraft, {
        job_id: currentJd.source_file || 'target-jd',
        job_title: currentJd.role || 'Target Role',
        company: currentJd.company || selectedCompany,
        required_skills: currentJd.skills.map((s) => ({
          name: s.skill_name,
          category_code: s.category_code || null,
          weight: 1.0,
          importance: 'required',
        })),
      });
      setWorkflowState((prev) => ({ ...prev, m5Status: 'completed', m5Result: res }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Skill Match retry failed';
      setWorkflowState((prev) => ({ ...prev, m5Status: 'failed', m5Error: msg }));
    }
  };

  return (
    <div className="radix-page-content">
      {/* Stepper Header */}
      <div className="pipeline-stepper">
        <div
          className={`pipeline-step ${
            currentStep === 'input'
              ? 'active'
              : ['extraction', 'review', 'downstream', 'completed'].includes(currentStep)
                ? 'completed'
                : ''
          }`}
        >
          <div className="pipeline-step-badge">1</div>
          <span>Configure Inputs</span>
        </div>
        <div
          className={`pipeline-divider ${
            ['extraction', 'review', 'downstream', 'completed'].includes(currentStep) ? 'completed' : ''
          }`}
        />

        <div
          className={`pipeline-step ${
            currentStep === 'extraction'
              ? 'active'
              : ['review', 'downstream', 'completed'].includes(currentStep)
                ? 'completed'
                : ''
          }`}
        >
          <div className="pipeline-step-badge">2</div>
          <span>Independent Extraction</span>
        </div>
        <div
          className={`pipeline-divider ${
            ['review', 'downstream', 'completed'].includes(currentStep) ? 'completed' : ''
          }`}
        />

        <div
          className={`pipeline-step ${
            currentStep === 'review'
              ? 'active'
              : ['downstream', 'completed'].includes(currentStep)
                ? 'completed'
                : ''
          }`}
        >
          <div className="pipeline-step-badge">3</div>
          <span>Candidate Review</span>
        </div>
        <div
          className={`pipeline-divider ${
            ['downstream', 'completed'].includes(currentStep) ? 'completed' : ''
          }`}
        />

        <div
          className={`pipeline-step ${
            currentStep === 'downstream' ? 'active' : currentStep === 'completed' ? 'completed' : ''
          }`}
        >
          <div className="pipeline-step-badge">4</div>
          <span>Downstream Analysis</span>
        </div>
        <div className={`pipeline-divider ${currentStep === 'completed' ? 'completed' : ''}`} />

        <div className={`pipeline-step ${currentStep === 'completed' ? 'completed' : ''}`}>
          <div className="pipeline-step-badge">5</div>
          <span>Unified Results</span>
        </div>
      </div>

      {/* STEP 1: CONFIGURE INPUTS */}
      {currentStep === 'input' && (
        <div className="workspace-card">
          <div className="workspace-header">
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>
                Step 1: Set Assessment Targets
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Select an existing candidate profile or upload a fresh resume, and specify the Job Description and benchmark company.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Candidate Box */}
            <div className="naukri-input-block">
              <label className="naukri-input-label" htmlFor="flow-candidate-select">
                <Users size={15} color="#2563eb" />
                <span>Candidate Profile Selection</span>
              </label>
              <select
                id="flow-candidate-select"
                className="naukri-input-box"
                value={activeProfile.profile_id}
                onChange={(e) => {
                  const found = savedProfiles.find((p) => p.profile_id === e.target.value);
                  if (found) {
                    onSelectActiveProfile(found);
                    setReviewDraft(found);
                  }
                }}
              >
                {savedProfiles.map((p) => (
                  <option key={p.profile_id} value={p.profile_id}>
                    {p.personal_info.full_name || p.profile_id} ({p.skills.length} skills)
                  </option>
                ))}
              </select>

              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                  Or upload fresh resume file (PDF/DOCX):
                </span>
                <input
                  id="flow-resume-input"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setResumeFile(f);
                  }}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="flow-resume-input"
                  className="radix-btn radix-btn-secondary"
                  style={{ marginTop: '0.4rem', cursor: 'pointer', display: 'inline-flex' }}
                >
                  <FileText size={14} />
                  <span>{resumeFile ? resumeFile.name : 'Select Resume File'}</span>
                </label>
              </div>
            </div>

            {/* Job Description Box */}
            <div className="naukri-input-block">
              <label className="naukri-input-label">
                <Briefcase size={15} color="#2563eb" />
                <span>Job Description Source</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {activeJd && (
                  <button
                    onClick={() => setJdMode('existing')}
                    className={`radix-btn ${jdMode === 'existing' ? 'radix-btn-primary' : 'radix-btn-secondary'}`}
                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                    type="button"
                  >
                    Active JD ({activeJd.role || 'Extracted'})
                  </button>
                )}
                <button
                  onClick={() => setJdMode('text')}
                  className={`radix-btn ${jdMode === 'text' ? 'radix-btn-primary' : 'radix-btn-secondary'}`}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                  type="button"
                >
                  Enter Text
                </button>
                <button
                  onClick={() => setJdMode('file')}
                  className={`radix-btn ${jdMode === 'file' ? 'radix-btn-primary' : 'radix-btn-secondary'}`}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                  type="button"
                >
                  Upload JD File
                </button>
              </div>

              {jdMode === 'existing' && activeJd && (
                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#eff6ff',
                    border: '1px solid rgba(37, 99, 235, 0.2)',
                    fontSize: '0.85rem',
                  }}
                >
                  <strong>{activeJd.role || 'Job Requirements'}</strong> — {activeJd.skills?.length || 0} skills extracted
                </div>
              )}

              {jdMode === 'text' && (
                <textarea
                  className="naukri-input-box"
                  rows={4}
                  placeholder="Paste job description requirements here..."
                  value={jdTextInput}
                  onChange={(e) => setJdTextInput(e.target.value)}
                />
              )}

              {jdMode === 'file' && (
                <div>
                  <input
                    id="flow-jd-file"
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setJdFileInput(f);
                    }}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="flow-jd-file" className="radix-btn radix-btn-secondary" style={{ cursor: 'pointer' }}>
                    <Briefcase size={14} />
                    <span>{jdFileInput ? jdFileInput.name : 'Browse JD Document'}</span>
                  </label>
                </div>
              )}
            </div>

            {/* Benchmark Company Box */}
            <div className="naukri-input-block">
              <label className="naukri-input-label" htmlFor="flow-company-select">
                <Building2 size={15} color="#2563eb" />
                <span>Benchmark Company (Module 4)</span>
              </label>
              <select
                id="flow-company-select"
                className="naukri-input-box"
                value={selectedCompany}
                onChange={(e) => onSelectCompany(e.target.value)}
              >
                {companiesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              onClick={handleStartExtraction}
              className="radix-btn radix-btn-primary"
              style={{ padding: '0.65rem 1.6rem' }}
              type="button"
            >
              <span>Begin Extraction (Step 2)</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: INDEPENDENT EXTRACTION PROGRESS */}
      {currentStep === 'extraction' && (
        <div className="workspace-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader2 size={44} className="animate-spin" color="#2563eb" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            Running Independent Microservice Extraction...
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '500px', margin: '0 auto' }}>
            Querying Module 1 (port 8020) and Module 2 (port 8000) concurrently without sequential blockages.
          </p>
        </div>
      )}

      {/* STEP 3: CANDIDATE REVIEW & VERIFICATION */}
      {currentStep === 'review' && (
        <div className="workspace-card">
          <div className="workspace-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <CheckCircle2 size={18} color="#16a34a" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a' }}>
                  EXTRACTION COMPLETE — CANDIDATE REVIEW
                </span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>
                Step 3: Review Extracted Candidate Information
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Inspect extracted fields before downstream assessment. Correct or update any missing details.
              </p>
            </div>

            <button
              onClick={handleConfirmProfileAndRunDownstream}
              className="radix-btn radix-btn-primary"
              type="button"
            >
              <span>Confirm & Run Assessment (Step 4)</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Quick review inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div className="naukri-input-block">
              <label className="naukri-input-label" htmlFor="review-name">
                Full Name
              </label>
              <input
                id="review-name"
                className="naukri-input-box"
                value={reviewDraft.personal_info.full_name}
                onChange={(e) =>
                  setReviewDraft((prev) => ({
                    ...prev,
                    personal_info: { ...prev.personal_info, full_name: e.target.value },
                  }))
                }
              />
            </div>
            <div className="naukri-input-block">
              <label className="naukri-input-label" htmlFor="review-email">
                Email Address
              </label>
              <input
                id="review-email"
                className="naukri-input-box"
                value={reviewDraft.personal_info.email}
                onChange={(e) =>
                  setReviewDraft((prev) => ({
                    ...prev,
                    personal_info: { ...prev.personal_info, email: e.target.value },
                  }))
                }
              />
            </div>
            <div className="naukri-input-block">
              <label className="naukri-input-label" htmlFor="review-headline">
                Professional Headline
              </label>
              <input
                id="review-headline"
                className="naukri-input-box"
                value={reviewDraft.personal_info.headline}
                onChange={(e) =>
                  setReviewDraft((prev) => ({
                    ...prev,
                    personal_info: { ...prev.personal_info, headline: e.target.value },
                  }))
                }
              />
            </div>
          </div>

          {/* Skills badges */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Extracted Skills ({reviewDraft.skills.length})
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {reviewDraft.skills.map((s, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid rgba(37, 99, 235, 0.2)',
                  }}
                >
                  {s.skill_name} ({s.category_code})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: DOWNSTREAM ANALYSIS PROGRESS */}
      {currentStep === 'downstream' && (
        <div className="workspace-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader2 size={44} className="animate-spin" color="#16a34a" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            Evaluating Talent Check & Skill Match...
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '500px', margin: '0 auto' }}>
            Evaluating against {selectedCompany} benchmark (Module 4) and matching against Job Requirements (Module 5).
          </p>
        </div>
      )}

      {/* STEP 5: COMPLETED RESULTS VIEW */}
      {currentStep === 'completed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header Banner */}
          <div className="workspace-card">
            <div className="workspace-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <CheckCircle2 size={18} color="#16a34a" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a' }}>
                    ASSESSMENT PIPELINE COMPLETED
                  </span>
                </div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#0f172a' }}>
                  Unified Results: {reviewDraft.personal_info.full_name || 'Candidate'}
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Benchmark: <strong>{selectedCompany}</strong> • Target Role:{' '}
                  <strong>{workflowState.m1Result?.role || 'Job Requirements'}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setCurrentStep('input')}
                  className="radix-btn radix-btn-secondary"
                  type="button"
                >
                  New Assessment
                </button>
                <button
                  onClick={() => onNavigate('assessment-results')}
                  className="radix-btn radix-btn-primary"
                  type="button"
                >
                  View Full Report
                </button>
              </div>
            </div>

            {/* Score Grid: Module 4 and Module 5 Distinct Scores */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '0.5rem' }}>
              {/* Module 4 Talent Check Score */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid #bbf7d0',
                  backgroundColor: '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
                    MODULE 4 • BENCHMARK READINESS
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0.2rem 0' }}>
                    Corporate Readiness
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    Target: {selectedCompany} (CSV Benchmark)
                  </div>
                </div>
                {workflowState.m4Result ? (
                  <div className="score-badge-large" style={{ borderColor: '#16a34a', width: '90px', height: '90px' }}>
                    <div className="score-badge-number" style={{ fontSize: '1.5rem' }}>
                      {workflowState.m4Result.readiness_score}
                    </div>
                    <div className="score-badge-label">Readiness</div>
                  </div>
                ) : (
                  <div>
                    <span style={{ color: '#dc2626', fontSize: '0.82rem', fontWeight: 600 }}>Failed</span>
                    <button
                      onClick={handleRetryTalentCheck}
                      className="radix-btn radix-btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginTop: '0.25rem' }}
                      type="button"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>

              {/* Module 5 Skill Match Score */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid #bfdbfe',
                  backgroundColor: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                    MODULE 5 • JOB SKILL MATCH
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0.2rem 0' }}>
                    Requirements Match
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    {workflowState.m5Result
                      ? `${workflowState.m5Result.matched_skills_count} of ${workflowState.m5Result.total_required_skills} skills`
                      : 'Skill matching'}
                  </div>
                </div>
                {workflowState.m5Result ? (
                  <div className="score-badge-large" style={{ borderColor: '#2563eb', width: '90px', height: '90px' }}>
                    <div className="score-badge-number" style={{ fontSize: '1.5rem' }}>
                      {workflowState.m5Result.match_score.toFixed(0)}%
                    </div>
                    <div className="score-badge-label">Match Score</div>
                  </div>
                ) : (
                  <div>
                    <span style={{ color: '#dc2626', fontSize: '0.82rem', fontWeight: 600 }}>Failed</span>
                    <button
                      onClick={handleRetrySkillMatch}
                      className="radix-btn radix-btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginTop: '0.25rem' }}
                      type="button"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
