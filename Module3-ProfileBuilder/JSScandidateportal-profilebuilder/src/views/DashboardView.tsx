import React from 'react';
import {
  Sparkles,
  PlayCircle,
  UploadCloud,
  FileText,
  Briefcase,
  UserCheck,
  ShieldCheck,
  Layers,
  ArrowRight,
  Building2,
  Users,
  Award,
} from 'lucide-react';
import type { AppViewId } from '../components/navigation/Sidebar';
import type { CandidateProfile } from '../features/profile-builder/types';
import type { SystemHealthReport } from '../features/profile-builder/services/healthService';
import type { JDExtractionResponse } from '../features/profile-builder/services/jdAnalyzerService';

interface DashboardViewProps {
  onNavigate: (view: AppViewId) => void;
  savedProfiles: CandidateProfile[];
  activeProfile: CandidateProfile;
  onSelectActiveProfile: (profile: CandidateProfile) => void;
  activeJd: JDExtractionResponse | null;
  onOpenResumeModal: () => void;
  selectedCompany: string;
  onSelectCompany: (company: string) => void;
  companiesList: string[];
  healthReport: SystemHealthReport | null;
  recentAssessmentHistory: Array<{
    id: string;
    timestamp: string;
    candidateName: string;
    jobTitle: string;
    company: string;
    talentCheckScore?: number;
    skillMatchScore?: number;
  }>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  savedProfiles,
  activeProfile,
  onSelectActiveProfile,
  activeJd,
  onOpenResumeModal,
  selectedCompany,
  onSelectCompany,
  companiesList,
  healthReport,
  recentAssessmentHistory,
}) => {
  const candidateName =
    activeProfile.personal_info.full_name?.trim() || activeProfile.profile_id || 'Candidate Draft';

  const moduleCards = [
    {
      id: 'jd-analyzer' as AppViewId,
      code: 'Module 1',
      title: 'JD Analyzer',
      port: 8020,
      desc: 'Extract technical requirements, categories, and evidence quotes from job descriptions.',
      icon: Briefcase,
      color: '#2563eb',
      serviceKey: 'module1',
    },
    {
      id: 'resume-parser' as AppViewId,
      code: 'Module 2',
      title: 'Resume Parser',
      port: 8000,
      desc: 'Parse PDF/DOCX resumes, extract proven skills, projects, and verify provenance.',
      icon: FileText,
      color: '#0284c7',
      serviceKey: 'module2',
    },
    {
      id: 'profile-builder' as AppViewId,
      code: 'Module 3',
      title: 'Profile Builder',
      port: 5173,
      desc: 'Full candidate editing, section tabs, live preview, multi-profile manager, and JSON export.',
      icon: UserCheck,
      color: '#4f46e5',
      serviceKey: 'module3',
    },
    {
      id: 'talent-check' as AppViewId,
      code: 'Module 4',
      title: 'Talent Check',
      port: 8010,
      desc: 'Benchmark candidate competencies and identify 12-category skillset gaps against target companies.',
      icon: ShieldCheck,
      color: '#059669',
      serviceKey: 'module4',
    },
    {
      id: 'skill-match' as AppViewId,
      code: 'Module 5',
      title: 'Skill Match',
      port: 8030,
      desc: 'Deterministically match candidate profile skills against extracted job requirements with evidence.',
      icon: Layers,
      color: '#d97706',
      serviceKey: 'module5',
    },
  ];

  return (
    <div className="radix-page-content">
      {/* Naukri-Inspired Hero Assessment Workspace Area */}
      <section className="naukri-hero-workspace" aria-label="Assessment Workspace">
        <div className="naukri-hero-header">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 700,
              marginBottom: '0.75rem',
            }}
          >
            <Sparkles size={14} />
            <span>RADIX TALENT INTELLIGENCE PLATFORM</span>
          </div>
          <h1 className="naukri-hero-heading">Find the right talent, faster.</h1>
          <p className="naukri-hero-subheading">
            Analyze job requirements, understand candidate skills, and make more informed talent
            decisions across five synchronized evaluation engines.
          </p>
        </div>

        {/* Centralized Console Card */}
        <div className="naukri-console-card">
          <div className="naukri-console-inputs">
            {/* Input 1: Active Candidate */}
            <div className="naukri-input-block">
              <label className="naukri-input-label" htmlFor="dashboard-candidate-select">
                <Users size={14} color="#2563eb" />
                <span>Candidate Profile</span>
              </label>
              <select
                id="dashboard-candidate-select"
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
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button
                  onClick={onOpenResumeModal}
                  style={{
                    fontSize: '0.75rem',
                    color: '#2563eb',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                  type="button"
                >
                  <UploadCloud size={12} />
                  <span>Upload New Resume</span>
                </button>
              </div>
            </div>

            {/* Input 2: Job Description */}
            <div className="naukri-input-block">
              <label className="naukri-input-label" htmlFor="dashboard-jd-context">
                <Briefcase size={14} color="#2563eb" />
                <span>Job Description Target</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div
                  id="dashboard-jd-context"
                  className="naukri-input-box"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <span style={{ fontSize: '0.88rem', color: activeJd ? '#0f172a' : '#64748b' }}>
                    {activeJd
                      ? `${activeJd.role || 'Job'} (${activeJd.skills?.length || 0} skills)`
                      : 'No Job Description loaded yet'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button
                  onClick={() => onNavigate('jd-analyzer')}
                  style={{
                    fontSize: '0.75rem',
                    color: '#2563eb',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                  type="button"
                >
                  <FileText size={12} />
                  <span>{activeJd ? 'View / Change JD' : 'Extract from JD Document or Text'}</span>
                </button>
              </div>
            </div>

            {/* Input 3: Benchmark Company */}
            <div className="naukri-input-block">
              <label className="naukri-input-label" htmlFor="dashboard-company-select">
                <Building2 size={14} color="#2563eb" />
                <span>Target Company Benchmark</span>
              </label>
              <select
                id="dashboard-company-select"
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
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Used by Module 4 for company competency grading
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="naukri-action-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                Active Profile: <strong style={{ color: '#0f172a' }}>{candidateName}</strong>
              </span>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                Benchmark: <strong style={{ color: '#0f172a' }}>{selectedCompany}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => onNavigate('assessment-workflow')}
                className="radix-btn radix-btn-primary"
                style={{ padding: '0.65rem 1.4rem', fontSize: '0.92rem' }}
                type="button"
              >
                <PlayCircle size={18} />
                <span>Start Full 5-Module Assessment</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Five Module Workspaces Section */}
      <section aria-label="Individual Module Workspaces">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              Analysis Modules
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Independent microservices coordinated through the unified RADIX architecture
            </p>
          </div>
        </div>

        <div className="module-cards-grid">
          {moduleCards.map((mod) => {
            const Icon = mod.icon;
            const serviceHealth = healthReport?.services?.[mod.serviceKey];
            const isOnline = serviceHealth?.status === 'healthy';

            return (
              <div key={mod.id} className="module-card">
                <div>
                  <div className="module-card-top">
                    <div
                      className="module-icon-badge"
                      style={{
                        backgroundColor: `${mod.color}15`,
                        color: mod.color,
                        border: `1px solid ${mod.color}30`,
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: isOnline ? '#f0fdf4' : '#fef2f2',
                        color: isOnline ? '#16a34a' : '#dc2626',
                        border: `1px solid ${isOnline ? '#bbf7d0' : '#fecaca'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <span
                        className={`radix-status-dot ${isOnline ? 'healthy' : 'offline'}`}
                        style={{ width: '6px', height: '6px' }}
                      />
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: mod.color, textTransform: 'uppercase' }}>
                    {mod.code} • Port {mod.port}
                  </div>
                  <h3 className="module-card-title">{mod.title}</h3>
                  <p className="module-card-desc">{mod.desc}</p>
                </div>

                <div className="module-card-footer">
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {serviceHealth?.runtimeMode ? serviceHealth.runtimeMode.slice(0, 24) : `Port ${mod.port}`}
                  </span>
                  <button
                    onClick={() => onNavigate(mod.id)}
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#2563eb',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                    type="button"
                  >
                    <span>Open</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Section: Saved Profiles & Recent Assessments */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Saved Profiles Quick Card */}
        <div className="workspace-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Saved Candidate Profiles</h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                {savedProfiles.length} candidate record{savedProfiles.length === 1 ? '' : 's'} stored in browser
              </p>
            </div>
            <button
              onClick={() => onNavigate('candidates')}
              className="radix-btn radix-btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
              type="button"
            >
              Manage All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {savedProfiles.slice(0, 4).map((prof) => {
              const isSelected = prof.profile_id === activeProfile.profile_id;
              return (
                <div
                  key={prof.profile_id}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem' }}>
                      {prof.personal_info.full_name || 'Unnamed Candidate'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {prof.skills.length} skills • Updated{' '}
                      {prof.last_updated ? new Date(prof.last_updated).toLocaleDateString() : 'recently'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {!isSelected && (
                      <button
                        onClick={() => onSelectActiveProfile(prof)}
                        className="radix-btn radix-btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        type="button"
                      >
                        Select
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onSelectActiveProfile(prof);
                        onNavigate('profile-builder');
                      }}
                      className="radix-btn radix-btn-primary"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                      type="button"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Assessment Runs */}
        <div className="workspace-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Recent Assessments</h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Persisted multi-module assessment history
              </p>
            </div>
            {recentAssessmentHistory.length > 0 && (
              <button
                onClick={() => onNavigate('assessment-results')}
                className="radix-btn radix-btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                type="button"
              >
                View Results
              </button>
            )}
          </div>

          <div>
            {recentAssessmentHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
                <Award size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem auto' }} />
                <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>
                  No assessments executed yet
                </p>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1rem' }}>
                  Select a candidate profile and job description, then click "Start Assessment" to generate your first verified result.
                </p>
                <button
                  onClick={() => onNavigate('assessment-workflow')}
                  className="radix-btn radix-btn-primary"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
                  type="button"
                >
                  <PlayCircle size={14} />
                  <span>Launch Assessment Pipeline</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {recentAssessmentHistory.slice(0, 4).map((run) => (
                  <div
                    key={run.id}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem' }}>
                        {run.candidateName} vs {run.jobTitle || 'Role'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {run.company} • {new Date(run.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {run.talentCheckScore !== undefined && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: '#f0fdf4',
                            color: '#16a34a',
                          }}
                        >
                          Talent: {run.talentCheckScore}%
                        </span>
                      )}
                      {run.skillMatchScore !== undefined && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                          }}
                        >
                          Match: {run.skillMatchScore.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
