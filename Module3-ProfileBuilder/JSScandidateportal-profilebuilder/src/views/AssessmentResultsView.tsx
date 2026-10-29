import React from 'react';
import {
  Award,
  Briefcase,
  ShieldCheck,
  Layers,
  PlayCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import type { CandidateProfile } from '../features/profile-builder/types';
import type { JDExtractionResponse } from '../features/profile-builder/services/jdAnalyzerService';
import type { TalentCheckResult } from '../features/profile-builder/services/talentCheckService';
import type { SkillMatchResponse } from '../features/profile-builder/services/skillMatchService';
import type { AppViewId } from '../components/navigation/Sidebar';

interface AssessmentResultsViewProps {
  activeProfile: CandidateProfile;
  activeJd: JDExtractionResponse | null;
  selectedCompany: string;
  talentResult: TalentCheckResult | null;
  skillMatchResult: SkillMatchResponse | null;
  onNavigate: (view: AppViewId) => void;
}

export const AssessmentResultsView: React.FC<AssessmentResultsViewProps> = ({
  activeProfile,
  activeJd,
  selectedCompany,
  talentResult,
  skillMatchResult,
  onNavigate,
}) => {
  const candidateName =
    activeProfile.personal_info.full_name || activeProfile.profile_id || 'Candidate';

  const hasAnyResults = Boolean(talentResult || skillMatchResult || activeJd);

  if (!hasAnyResults) {
    return (
      <div className="radix-page-content">
        <div className="workspace-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Award size={48} color="#94a3b8" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            No Assessment Run Yet
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '520px', margin: '0 auto 1.5rem auto' }}>
            To view unified results across all 5 RADIX modules, launch a full assessment or evaluate candidate skills directly.
          </p>
          <button
            onClick={() => onNavigate('assessment-workflow')}
            className="radix-btn radix-btn-primary"
            style={{ padding: '0.65rem 1.5rem' }}
            type="button"
          >
            <PlayCircle size={16} />
            <span>Launch Full Assessment</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="radix-page-content">
      {/* Header Summary Card */}
      <div className="workspace-card">
        <div className="workspace-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                }}
              >
                UNIFIED TALENT INTELLIGENCE REPORT
              </span>
            </div>
            <h2>Assessment Evaluation: {candidateName}</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Hiring Organization: <strong>{selectedCompany}</strong> • Target Role:{' '}
              <strong>{activeJd?.role || 'Job Requirements'}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => onNavigate('assessment-workflow')}
              className="radix-btn radix-btn-primary"
              type="button"
            >
              <span>Run Another Assessment</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Dual Score Cards (Zero False Blending) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
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
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
                MODULE 4 • TALENT CHECK READINESS
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0.25rem 0' }}>
                Corporate Competency Score
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                Benchmark: {selectedCompany} (Local CSV Mode)
              </div>
            </div>
            {talentResult ? (
              <div className="score-badge-large" style={{ borderColor: '#16a34a', width: '90px', height: '90px' }}>
                <div className="score-badge-number" style={{ fontSize: '1.6rem' }}>
                  {talentResult.readiness_score}
                </div>
                <div className="score-badge-label">Readiness</div>
              </div>
            ) : (
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Not Evaluated</span>
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
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                MODULE 5 • SKILL MATCH PERCENTAGE
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0.25rem 0' }}>
                Job Requirements Match
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                {skillMatchResult
                  ? `${skillMatchResult.matched_skills_count} of ${skillMatchResult.total_required_skills} skills verified`
                  : 'Requires active Job Description'}
              </div>
            </div>
            {skillMatchResult ? (
              <div className="score-badge-large" style={{ borderColor: '#2563eb', width: '90px', height: '90px' }}>
                <div className="score-badge-number" style={{ fontSize: '1.6rem' }}>
                  {skillMatchResult.match_score.toFixed(0)}%
                </div>
                <div className="score-badge-label">Match Score</div>
              </div>
            ) : (
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Not Evaluated</span>
            )}
          </div>
        </div>
      </div>

      {/* Module 1 Section */}
      <div className="workspace-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Briefcase size={20} color="#2563eb" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              Module 1 — Job Requirements Extraction
            </h3>
          </div>
          <button
            onClick={() => onNavigate('jd-analyzer')}
            className="radix-btn radix-btn-secondary"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
            type="button"
          >
            <span>Open Workspace</span>
            <ExternalLink size={12} />
          </button>
        </div>

        {activeJd ? (
          <div>
            <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.75rem' }}>
              Source: <strong>{activeJd.source_file || 'Direct text'}</strong> • Extracted Skills:{' '}
              <strong>{activeJd.skills?.length || 0}</strong>
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {activeJd.skills?.map((s, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                  }}
                >
                  {s.skill_name} ({s.category_code})
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            No Job Description was evaluated during this assessment.
          </p>
        )}
      </div>

      {/* Module 4 Section: Talent Check Skillset Gap */}
      {talentResult && (
        <div className="workspace-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldCheck size={20} color="#16a34a" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Module 4 — Benchmark Competency Gaps
              </h3>
            </div>
            <button
              onClick={() => onNavigate('talent-check')}
              className="radix-btn radix-btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
              type="button"
            >
              <span>Open Workspace</span>
              <ExternalLink size={12} />
            </button>
          </div>

          <div className="radix-table-wrapper">
            <table className="radix-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Required Level</th>
                  <th>Candidate Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {talentResult.skillset_gap?.map((item) => (
                  <tr key={item.category_code}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{item.category_code}</td>
                    <td>Level {item.required_level} / 10</td>
                    <td>Level {item.candidate_level} / 10</td>
                    <td>
                      {item.gap ? (
                        <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.78rem' }}>
                          Gap Detected
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.78rem' }}>
                          Verified Benchmark
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

      {/* Module 5 Section: Skill Match Justifications */}
      {skillMatchResult && (
        <div className="workspace-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Layers size={20} color="#d97706" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Module 5 — Factual Skill Match Explanations
              </h3>
            </div>
            <button
              onClick={() => onNavigate('skill-match')}
              className="radix-btn radix-btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
              type="button"
            >
              <span>Open Workspace</span>
              <ExternalLink size={12} />
            </button>
          </div>

          {skillMatchResult.summary && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '0.85rem',
                color: '#334155',
              }}
            >
              <strong>Summary Justification:</strong> {skillMatchResult.summary}
            </div>
          )}

          <div className="radix-table-wrapper">
            <table className="radix-table">
              <thead>
                <tr>
                  <th>Job Requirement</th>
                  <th>Match Status</th>
                  <th>Candidate Match</th>
                  <th>Factual Explanation</th>
                </tr>
              </thead>
              <tbody>
                {skillMatchResult.skill_details?.map((detail, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{detail.skill}</td>
                    <td>
                      {detail.status === 'matched' ? (
                        <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.78rem' }}>
                          ✓ Matched
                        </span>
                      ) : (
                        <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.78rem' }}>
                          ✕ Missing / Unverified
                        </span>
                      )}
                    </td>
                    <td>{detail.candidate_skill_matched || '—'}</td>
                    <td style={{ fontSize: '0.82rem', color: '#475569' }}>{detail.explanation}</td>
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
