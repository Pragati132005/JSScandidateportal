import React from 'react';
import {
  User,
  Briefcase,
  PlayCircle,
  UploadCloud,
  Activity,
  Menu,
} from 'lucide-react';
import type { AppViewId } from './Sidebar';
import type { CandidateProfile } from '../../features/profile-builder/types';
import type { JDExtractionResponse } from '../../features/profile-builder/services/jdAnalyzerService';

interface TopBarProps {
  currentView: AppViewId;
  activeProfile: CandidateProfile;
  activeJd: JDExtractionResponse | null;
  onNavigate: (view: AppViewId) => void;
  onOpenResumeModal: () => void;
  onOpenHealthModal: () => void;
  onToggleMobileSidebar?: () => void;
  completionPercentage: number;
}

const VIEW_TITLES: Record<AppViewId, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'RADIX Talent Match Dashboard',
    subtitle: 'Unified talent intelligence console across all five analysis modules',
  },
  'assessment-workflow': {
    title: 'Full Assessment Workflow',
    subtitle: 'Dependency-aware 5-module candidate and job matching pipeline',
  },
  candidates: {
    title: 'Candidate Profiles',
    subtitle: 'Manage, review, switch, and export candidate records',
  },
  'profile-builder': {
    title: 'Module 3: Profile Builder',
    subtitle: 'Candidate profile editor, live preview, and skill evidence grounding',
  },
  'resume-parser': {
    title: 'Module 2: Resume Parser Workspace',
    subtitle: 'Extract candidate information and verify provenance from PDF/DOCX',
  },
  'jd-analyzer': {
    title: 'Module 1: JD Analyzer Workspace',
    subtitle: 'Extract required technical skills and benchmarks from job descriptions',
  },
  'talent-check': {
    title: 'Module 4: Talent Check Benchmark',
    subtitle: 'Evaluate readiness levels and gap analysis against corporate benchmarks',
  },
  'skill-match': {
    title: 'Module 5: Skill Match Engine',
    subtitle: 'Deterministic skill matching with factual explanations and justifications',
  },
  'assessment-results': {
    title: 'Unified Assessment Results',
    subtitle: 'Comprehensive evaluation findings across all analysis modules',
  },
};

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  activeProfile,
  activeJd,
  onNavigate,
  onOpenResumeModal,
  onOpenHealthModal,
  onToggleMobileSidebar,
  completionPercentage,
}) => {
  const currentInfo = VIEW_TITLES[currentView] || {
    title: 'RADIX Talent Match',
    subtitle: 'Talent Intelligence',
  };

  const candidateName =
    activeProfile.personal_info.full_name?.trim() || activeProfile.profile_id || 'Draft Candidate';

  return (
    <header className="radix-topbar">
      <div className="radix-topbar-left">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="radix-btn-secondary"
            style={{ padding: '0.4rem', display: 'flex' }}
            type="button"
            aria-label="Toggle menu"
          >
            <Menu size={18} />
          </button>
        )}
        <div>
          <h1 className="radix-page-title">{currentInfo.title}</h1>
          <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="radix-topbar-context" style={{ display: 'flex', alignItems: 'center' }}>
        {/* Active Candidate Badge */}
        <button
          onClick={() => onNavigate('profile-builder')}
          className="radix-context-pill active"
          type="button"
          title="Click to view candidate in Profile Builder"
        >
          <User size={13} />
          <span>{candidateName}</span>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              backgroundColor: '#ffffff',
              padding: '0.05rem 0.35rem',
              borderRadius: '9999px',
              color: '#2563eb',
            }}
          >
            {completionPercentage}%
          </span>
        </button>

        {/* Active Job Badge */}
        {activeJd && (
          <button
            onClick={() => onNavigate('jd-analyzer')}
            className="radix-context-pill"
            type="button"
            title="Click to view Job Description workspace"
          >
            <Briefcase size={13} />
            <span>{activeJd.role || activeJd.company || 'Extracted JD'}</span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                backgroundColor: '#f1f5f9',
                padding: '0.05rem 0.35rem',
                borderRadius: '9999px',
                color: '#475569',
              }}
            >
              {activeJd.skills?.length || 0} skills
            </span>
          </button>
        )}

        {/* Quick Action Buttons */}
        <div className="radix-topbar-actions">
          <button
            onClick={onOpenResumeModal}
            className="radix-btn radix-btn-secondary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
            type="button"
          >
            <UploadCloud size={15} />
            <span>Upload Resume</span>
          </button>

          <button
            onClick={() => onNavigate('assessment-workflow')}
            className="radix-btn radix-btn-primary"
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
            type="button"
          >
            <PlayCircle size={15} />
            <span>Run Assessment</span>
          </button>

          <button
            onClick={onOpenHealthModal}
            className="radix-btn radix-btn-secondary"
            style={{ padding: '0.45rem 0.65rem' }}
            type="button"
            title="Service Health Status"
          >
            <Activity size={15} color="#2563eb" />
          </button>
        </div>
      </div>
    </header>
  );
};
