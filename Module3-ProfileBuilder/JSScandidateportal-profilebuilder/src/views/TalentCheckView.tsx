import React, { useState } from 'react';
import {
  Building2,
  Users,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  PlayCircle,
  ArrowRight,
} from 'lucide-react';
import type { CandidateProfile } from '../features/profile-builder/types';
import {
  runTalentCheck,
  type TalentCheckResult,
} from '../features/profile-builder/services/talentCheckService';
import type { AppViewId } from '../components/navigation/Sidebar';


interface TalentCheckViewProps {
  savedProfiles: CandidateProfile[];
  activeProfile: CandidateProfile;
  onSelectActiveProfile: (profile: CandidateProfile) => void;
  selectedCompany: string;
  onSelectCompany: (company: string) => void;
  companiesList: string[];
  onNavigate: (view: AppViewId) => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  COD: 'Coding & Programming',
  DSA: 'Data Structures & Algorithms',
  OOD: 'Object-Oriented Design',
  APTI: 'Aptitude & Problem Solving',
  COMM: 'Professional Communication',
  AI: 'AI & Machine Learning',
  CLOUD: 'DevOps & Cloud Systems',
  SQL: 'Databases & SQL Design',
  SWE: 'Software Engineering Best Practices',
  SYSD: 'System Design & Architecture',
  NETW: 'Computer Networking',
  OS: 'Operating Systems & Linux',
  OTHER: 'Other Domain Skills',
};

export const TalentCheckView: React.FC<TalentCheckViewProps> = ({
  savedProfiles,
  activeProfile,
  onSelectActiveProfile,
  selectedCompany,
  onSelectCompany,
  companiesList,
  onNavigate,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [talentResult, setTalentResult] = useState<TalentCheckResult | null>(null);

  const handleRunCheck = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (activeProfile.skills.length === 0) {
        throw new Error('Candidate profile has 0 skills. Add skills or upload a resume first.');
      }

      const result = await runTalentCheck(activeProfile, selectedCompany);
      setTalentResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Talent Check failed';
      setErrorMessage(`${msg}. Ensure Module 4 is running on port 8010.`);
    } finally {
      setIsLoading(false);
    }
  };

  const gapCount = talentResult?.skillset_gap?.filter((g) => g.gap).length || 0;
  const matchCount = talentResult?.skillset_gap?.filter((g) => !g.gap).length || 0;

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
                  backgroundColor: '#f0fdf4',
                  color: '#16a34a',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                }}
              >
                MODULE 4 • PORT 8010
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Mode: <strong>Local CSV Benchmark Mode</strong> (Pre-indexed company standard competency matrices)
              </span>
            </div>
            <h2>Talent Check Benchmark Workspace</h2>
            <p>
              Quantitatively evaluates candidate readiness and pinpoints 12-category skillset gaps against target enterprise hiring benchmarks.
            </p>
          </div>
        </div>

        {/* Input Block */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* Candidate Selection */}
          <div className="naukri-input-block">
            <label className="naukri-input-label" htmlFor="talent-candidate-select">
              <Users size={14} color="#16a34a" />
              <span>Select Candidate Profile</span>
            </label>
            <select
              id="talent-candidate-select"
              className="naukri-input-box"
              value={activeProfile.profile_id}
              onChange={(e) => {
                const found = savedProfiles.find((p) => p.profile_id === e.target.value);
                if (found) onSelectActiveProfile(found);
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

          {/* Company Selection */}
          <div className="naukri-input-block">
            <label className="naukri-input-label" htmlFor="talent-company-select">
              <Building2 size={14} color="#16a34a" />
              <span>Benchmark Company</span>
            </label>
            <select
              id="talent-company-select"
              className="naukri-input-box"
              value={selectedCompany}
              onChange={(e) => onSelectCompany(e.target.value)}
            >
              {companiesList.map((comp) => (
                <option key={comp} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div
            style={{
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

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            onClick={handleRunCheck}
            disabled={isLoading}
            className="radix-btn radix-btn-primary"
            style={{ backgroundColor: '#16a34a', padding: '0.65rem 1.5rem' }}
            type="button"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Evaluating Benchmark...</span>
              </>
            ) : (
              <>
                <PlayCircle size={16} />
                <span>Run Talent Check</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {talentResult && (
        <div className="workspace-card">
          <div className="workspace-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <CheckCircle2 size={18} color="#16a34a" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a' }}>
                  TALENT CHECK BENCHMARK COMPLETE
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '0.1rem 0.45rem',
                    borderRadius: '9999px',
                    backgroundColor: '#f0fdf4',
                    color: '#16a34a',
                  }}
                >
                  Benchmark: {talentResult.company}
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                Readiness Evaluation: {activeProfile.personal_info.full_name || 'Candidate'}
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Passed Categories: <strong>{matchCount}</strong> • Gaps Detected:{' '}
                <strong style={{ color: gapCount > 0 ? '#dc2626' : '#16a34a' }}>{gapCount}</strong>
              </p>
            </div>

            {/* Readiness Score Gauge & Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div
                className="score-badge-large"
                style={{
                  borderColor:
                    talentResult.readiness_score >= 70
                      ? '#16a34a'
                      : talentResult.readiness_score >= 40
                        ? '#d97706'
                        : '#dc2626',
                }}
              >
                <div className="score-badge-number">{talentResult.readiness_score}</div>
                <div className="score-badge-label">Readiness / 100</div>
              </div>

              <button
                onClick={() => onNavigate('skill-match')}
                className="radix-btn radix-btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                type="button"
              >
                <span>Compare Skills</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>


          {/* Clarity Disclaimer Note */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '0.78rem',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <HelpCircle size={15} color="#2563eb" />
            <span>
              <strong>Note:</strong> The Readiness Score represents hiring readiness against standard corporate competency levels in <strong>{talentResult.company}</strong>. It is independent of Job Description Skill Match (Module 5).
            </span>
          </div>

          {/* Skillset Gap Table */}
          <div className="radix-table-wrapper">
            <table className="radix-table">
              <thead>
                <tr>
                  <th>Category Code</th>
                  <th>Skill Category</th>
                  <th>Required Level</th>
                  <th>Candidate Level</th>
                  <th>Gap Status</th>
                </tr>
              </thead>
              <tbody>
                {talentResult.skillset_gap?.map((item) => (
                  <tr key={item.category_code}>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                        }}
                      >
                        {item.category_code}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      {CATEGORY_NAMES[item.category_code] || item.category_code}
                    </td>
                    <td style={{ fontWeight: 600, color: '#475569' }}>Level {item.required_level} / 10</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>Level {item.candidate_level} / 10</td>
                    <td>
                      {item.gap ? (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '9999px',
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <XCircle size={12} />
                          Gap (-{item.required_level - item.candidate_level})
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '9999px',
                            backgroundColor: '#f0fdf4',
                            color: '#16a34a',
                            border: '1px solid #bbf7d0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <CheckCircle2 size={12} />
                          Pass
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
