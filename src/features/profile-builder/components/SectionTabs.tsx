import React from 'react';
import {
  User,
  Briefcase,
  GraduationCap,
  Brain,
  FolderGit2,
  Building2,
  Award,
  Eye,
  CheckCircle,
} from 'lucide-react';
import type { SectionCompletionStatus } from '../services';

export type SectionTabId =
  | 'personal'
  | 'preferred_roles'
  | 'education'
  | 'skills'
  | 'projects'
  | 'experience'
  | 'certifications'
  | 'preview';

interface SectionTabsProps {
  activeTab: SectionTabId;
  onSelectTab: (tab: SectionTabId) => void;
  sectionStatus: Record<string, SectionCompletionStatus>;
  skillCount: number;
  projectCount: number;
}

const SECTION_DEFINITIONS: { id: SectionTabId; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'preferred_roles', label: 'Preferred Roles', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills & RADIX', icon: Brain },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'experience', label: 'Experience', icon: Building2 },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'preview', label: 'Full Preview', icon: Eye },
];

export const SectionTabs: React.FC<SectionTabsProps> = ({
  activeTab,
  onSelectTab,
  sectionStatus,
  skillCount,
  projectCount,
}) => {
  return (
    <nav className="section-tabs-nav" aria-label="Profile Sections">
      {SECTION_DEFINITIONS.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        const status = sectionStatus[id];
        const isComplete = status?.isComplete;

        let badgeCount: number | null = null;
        if (id === 'skills' && skillCount > 0) badgeCount = skillCount;
        if (id === 'projects' && projectCount > 0) badgeCount = projectCount;

        return (
          <button
            key={id}
            type="button"
            className={`section-tab-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(id)}
          >
            <span className="tab-icon-wrapper">
              <Icon size={16} />
            </span>
            <span className="tab-label">{label}</span>

            {badgeCount !== null && (
              <span className="tab-count-badge">{badgeCount}</span>
            )}

            {isComplete && id !== 'preview' && (
              <span className="tab-complete-dot" title="Section requirements satisfied">
                <CheckCircle size={12} color="#10b981" />
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
