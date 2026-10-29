import React, { useState, useRef } from 'react';
import {
  Users,
  Briefcase,
  PlayCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UploadCloud,
  FileText,
} from 'lucide-react';
import type { CandidateProfile } from '../features/profile-builder/types';
import {
  extractJdFromFile,
  type JDExtractionResponse,
} from '../features/profile-builder/services/jdAnalyzerService';
import { OFFICIAL_SAMPLE_JDS } from '../data/sampleJds';
import {
  runSkillMatchDirect,
  type SkillMatchResponse,
} from '../features/profile-builder/services/skillMatchService';
import {
  ANANYA_RAO_PARSED_RESUME,
  PRIYA_MENON_PARSED_RESUME,
  mapParsedResumeToCandidateProfile,
} from '../features/profile-builder/services/resumeAdapter';
import type { AppViewId } from '../components/navigation/Sidebar';

interface SkillMatchViewProps {
  savedProfiles: CandidateProfile[];
  activeProfile: CandidateProfile;
  onSelectActiveProfile: (profile: CandidateProfile) => void;
  activeJd: JDExtractionResponse | null;
  onSetActiveJd: (jd: JDExtractionResponse) => void;
  onNavigate: (view: AppViewId) => void;
}

export const SkillMatchView: React.FC<SkillMatchViewProps> = ({
  savedProfiles,
  activeProfile,
  onSelectActiveProfile,
  activeJd,
  onSetActiveJd,
  onNavigate,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingJd, setIsUploadingJd] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<SkillMatchResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingJd(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const extracted = await extractJdFromFile(file);
      onSetActiveJd(extracted);
      setMatchResult(null);
      setSuccessNotice(
        `Successfully loaded JD from "${file.name}": ${extracted.role} at ${extracted.company || 'Company'} (${extracted.skills.length} required skills extracted).`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to extract JD from file';
      setErrorMessage(`${msg}. Ensure Module 1 is running on port 8020.`);
    } finally {
      setIsUploadingJd(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRunMatch = async () => {
    if (!activeJd || !activeJd.skills || activeJd.skills.length === 0) {
      setErrorMessage(
        'No Job Requirements available. Please select or upload a Job Description first.'
      );
      return;
    }

    if (activeProfile.skills.length === 0) {
      setErrorMessage('Candidate profile has 0 skills. Add skills or upload a resume first.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const requiredSkills = activeJd.skills.map((s) => ({
        name: s.skill_name,
        category_code: s.category_code || null,
        weight: 1.0,
        importance: 'required',
      }));

      const result = await runSkillMatchDirect(activeProfile, {
        job_id: activeJd.source_file || 'job-req-1',
        job_title: activeJd.role || 'Target Role',
        company: activeJd.company || '',
        required_skills: requiredSkills,
      });

      setMatchResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Skill matching failed';
      setErrorMessage(`${msg}. Ensure Module 5 is running on port 8030.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="radix-page-content">
      {/* Workspace Header */}
      <div className="workspace-card">
        <div className="workspace-header">
          <div className="workspace-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: '#fffbeb',
                  color: '#d97706',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                }}
              >
                MODULE 5 • PORT 8030
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Mode: <strong>Deterministic Matching Engine</strong> with factual justifications
              </span>
            </div>
            <h2>Skill Match Workspace</h2>
            <p>
              Compares candidate skills against job requirements, identifies matched vs missing skills, and generates factual justifications.
            </p>
          </div>
        </div>

        {/* Input Pair */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* Candidate Selection */}
          <div className="naukri-input-block">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="naukri-input-label" htmlFor="match-candidate-select" style={{ marginBottom: 0 }}>
                <Users size={14} color="#d97706" />
                <span>Candidate Profile</span>
              </label>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    const ananya = mapParsedResumeToCandidateProfile(ANANYA_RAO_PARSED_RESUME);
                    onSelectActiveProfile(ananya);
                    setMatchResult(null);
                  }}
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.18rem 0.5rem',
                    borderRadius: '5px',
                    border: '1px solid #38bdf8',
                    backgroundColor: activeProfile.personal_info.full_name?.includes('Ananya') ? '#e0f2fe' : '#ffffff',
                    color: '#0284c7',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  title="Switch active candidate to Ananya Rao (SWE / Systems)"
                >
                  ⚡ Ananya Rao (SWE)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const priya = mapParsedResumeToCandidateProfile(PRIYA_MENON_PARSED_RESUME);
                    onSelectActiveProfile(priya);
                    setMatchResult(null);
                  }}
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.18rem 0.5rem',
                    borderRadius: '5px',
                    border: '1px solid #10b981',
                    backgroundColor: activeProfile.personal_info.full_name?.includes('Priya') ? '#d1fae5' : '#ffffff',
                    color: '#059669',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  title="Switch active candidate to Priya Menon (Support Analyst)"
                >
                  ⚡ Priya Menon (Support)
                </button>
              </div>
            </div>
            <select
              id="match-candidate-select"
              className="naukri-input-box"
              style={{ marginTop: '0.35rem' }}
              value={activeProfile.profile_id}
              onChange={(e) => {
                const found = savedProfiles.find((p) => p.profile_id === e.target.value);
                if (found) {
                  onSelectActiveProfile(found);
                  setMatchResult(null);
                }
              }}
            >
              {savedProfiles.map((p) => (
                <option key={p.profile_id} value={p.profile_id}>
                  {p.personal_info.full_name || p.profile_id} ({p.skills.length} skills)
                </option>
              ))}
              {savedProfiles.length === 0 && (
                <option value={activeProfile.profile_id}>
                  {activeProfile.personal_info.full_name || 'Active Candidate'} (
                  {activeProfile.skills.length} skills)
                </option>
              )}
            </select>
          </div>

          {/* Job Requirements Selection */}
          <div className="naukri-input-block">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="naukri-input-label" htmlFor="match-jd-select">
                <Briefcase size={14} color="#d97706" />
                <span>Job Requirements Source (Module 1)</span>
              </label>

              {/* Upload JD Document Button */}
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingJd}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    padding: '0.22rem 0.6rem',
                    borderRadius: '6px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1d4ed8',
                    cursor: 'pointer',
                  }}
                  title="Upload any PDF or DOCX Job Description to match against"
                >
                  {isUploadingJd ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Parsing PDF...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={12} />
                      <span>Upload JD (PDF)</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('jd-analyzer')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    padding: '0.22rem 0.6rem',
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                  title="Open full JD Analyzer"
                >
                  <FileText size={12} />
                  <span>JD Analyzer</span>
                </button>
              </div>
            </div>

            <select
              id="match-jd-select"
              className="naukri-input-box"
              value={activeJd?.source_file || activeJd?.role || ''}
              onChange={(e) => {
                const val = e.target.value;
                const found = OFFICIAL_SAMPLE_JDS.find(
                  (j) => (j.source_file === val || j.role === val)
                );
                if (found) {
                  onSetActiveJd(found);
                  setMatchResult(null);
                  setSuccessNotice(`Switched to: ${found.role} — ${found.company} (${found.skills.length} skills)`);
                }
              }}
            >
              {/* If activeJd was custom uploaded from PDF, show it in the dropdown */}
              {activeJd &&
                !OFFICIAL_SAMPLE_JDS.some(
                  (j) => j.source_file === activeJd.source_file && j.role === activeJd.role
                ) && (
                  <option value={activeJd.source_file || activeJd.role}>
                    📄 [Uploaded PDF] {activeJd.role || 'Role'} — {activeJd.company || 'Company'} ({activeJd.skills?.length || 0} skills)
                  </option>
                )}
              {OFFICIAL_SAMPLE_JDS.map((j) => (
                <option key={j.source_file || j.role} value={j.source_file || j.role}>
                  {j.role} — {j.company} ({j.skills.length} skills)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active JD Details Preview */}
        {activeJd && (
          <div
            style={{
              marginTop: '0.85rem',
              padding: '0.65rem 0.85rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.78rem',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontWeight: 700, color: '#334155' }}>Selected Job Requirements:</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>
                {activeJd.role} ({activeJd.company || 'Company'})
              </span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span style={{ color: '#64748b' }}>
                File: <em>{activeJd.source_file || 'Document'}</em>
              </span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span style={{ color: '#d97706', fontWeight: 700 }}>
                {activeJd.skills?.length || 0} required skills
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {activeJd.skills?.slice(0, 10).map((sk, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    padding: '0.12rem 0.45rem',
                    fontSize: '0.72rem',
                    color: '#334155',
                  }}
                >
                  {sk.skill_name} <strong style={{ color: '#2563eb' }}>({sk.category_code})</strong>
                </span>
              ))}
              {(activeJd.skills?.length || 0) > 10 && (
                <span style={{ color: '#64748b', fontSize: '0.72rem', padding: '0.12rem 0.45rem' }}>
                  +{activeJd.skills.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Success notification */}
        {successNotice && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.85rem',
            }}
          >
            <AlertTriangle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            onClick={handleRunMatch}
            disabled={isLoading || !activeJd}
            className="radix-btn radix-btn-primary"
            style={{ backgroundColor: '#d97706', padding: '0.65rem 1.5rem' }}
            type="button"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Evaluating Matches...</span>
              </>
            ) : (
              <>
                <PlayCircle size={16} />
                <span>Run Skill Match</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {matchResult && (
        <div className="workspace-card">
          <div className="workspace-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <CheckCircle2 size={18} color="#16a34a" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a' }}>
                  MATCH EVALUATION COMPLETE
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '0.1rem 0.45rem',
                    borderRadius: '9999px',
                    backgroundColor: '#fffbeb',
                    color: '#d97706',
                  }}
                >
                  Job: {matchResult.job_title}
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                Skill Match Summary
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Matched: <strong>{matchResult.matched_skills_count}</strong> of{' '}
                <strong>{matchResult.total_required_skills}</strong> required skills • Additional:{' '}
                <strong>{matchResult.additional_candidate_skills?.length || 0}</strong> skills
              </p>
            </div>

            {/* Match Score Badge */}
            <div
              className="score-badge-large"
              style={{
                borderColor:
                  matchResult.match_score >= 70
                    ? '#16a34a'
                    : matchResult.match_score >= 40
                      ? '#d97706'
                      : '#dc2626',
              }}
            >
              <div className="score-badge-number">{matchResult.match_score.toFixed(0)}%</div>
              <div className="score-badge-label">Match Score</div>
            </div>
          </div>

          {/* Factual Summary */}
          {matchResult.summary && (
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '0.85rem',
                color: '#334155',
                lineHeight: '1.5',
              }}
            >
              <strong>Factual Justification:</strong> {matchResult.summary}
            </div>
          )}

          {/* Matched vs Missing Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Matched Skills */}
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#16a34a' }}>
                  Matched Skills ({matchResult.matched_skills?.length || 0})
                </h4>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {matchResult.matched_skills?.map((sk, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: '#ffffff',
                      color: '#16a34a',
                      border: '1px solid #bbf7d0',
                    }}
                  >
                    ✓ {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing or Unverified Skills */}
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <XCircle size={16} color="#dc2626" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#dc2626' }}>
                  Missing / Unverified Skills ({matchResult.missing_or_unverified_skills?.length || 0})
                </h4>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {matchResult.missing_or_unverified_skills?.map((sk, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: '#ffffff',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                    }}
                  >
                    ✕ {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Per-skill Details Table */}
          {matchResult.skill_details && matchResult.skill_details.length > 0 && (
            <div className="radix-table-wrapper" style={{ marginTop: '0.5rem' }}>
              <table className="radix-table">
                <thead>
                  <tr>
                    <th>Required Skill</th>
                    <th>Status</th>
                    <th>Candidate Match</th>
                    <th>Factual Justification</th>
                  </tr>
                </thead>
                <tbody>
                  {matchResult.skill_details.map((detail, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{detail.skill}</td>
                      <td>
                        {detail.status === 'matched' ? (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: '#16a34a',
                              backgroundColor: '#f0fdf4',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '9999px',
                            }}
                          >
                            Matched
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: '#dc2626',
                              backgroundColor: '#fef2f2',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '9999px',
                            }}
                          >
                            Missing / Unverified
                          </span>
                        )}
                      </td>
                      <td style={{ color: '#475569' }}>
                        {detail.candidate_skill_matched || '—'}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#334155' }}>
                        {detail.explanation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
