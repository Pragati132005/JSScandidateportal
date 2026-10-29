import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  UserCheck,
  ShieldCheck,
  Layers,
  Award,
  Cpu,
  Sparkles,
  Server,
} from 'lucide-react';
import type { SystemHealthReport } from '../../features/profile-builder/services/healthService';

export type AppViewId =
  | 'dashboard'
  | 'candidates'
  | 'resume-parser'
  | 'jd-analyzer'
  | 'profile-builder'
  | 'talent-check'
  | 'skill-match'
  | 'assessment-workflow'
  | 'assessment-results';

interface SidebarProps {
  currentView: AppViewId;
  onNavigate: (view: AppViewId) => void;
  candidateCount: number;
  healthReport?: SystemHealthReport | null;
  onOpenHealthModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  candidateCount,
  healthReport,
  onOpenHealthModal,
}) => {
  const onlineCount = healthReport
    ? Object.values(healthReport.services).filter((s) => s.status === 'healthy').length
    : 0;
  const totalCount = healthReport ? Object.keys(healthReport.services).length : 6;

  const navItems = [
    {
      id: 'dashboard' as AppViewId,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      id: 'assessment-workflow' as AppViewId,
      label: 'Full Assessment',
      icon: Cpu,
      badge: '5-in-1',
    },
    {
      id: 'candidates' as AppViewId,
      label: 'Candidate Profiles',
      icon: Users,
      badge: candidateCount > 0 ? String(candidateCount) : undefined,
    },
    {
      id: 'assessment-results' as AppViewId,
      label: 'Assessment Results',
      icon: Award,
      badge: undefined,
    },
  ];

  const moduleWorkspaces = [
    {
      id: 'jd-analyzer' as AppViewId,
      label: 'Module 1: JD Analyzer',
      icon: Briefcase,
      badge: 'Port 8020',
    },
    {
      id: 'resume-parser' as AppViewId,
      label: 'Module 2: Resume Parser',
      icon: FileText,
      badge: 'Port 8000',
    },
    {
      id: 'profile-builder' as AppViewId,
      label: 'Module 3: Profile Builder',
      icon: UserCheck,
      badge: 'Client',
    },
    {
      id: 'talent-check' as AppViewId,
      label: 'Module 4: Talent Check',
      icon: ShieldCheck,
      badge: 'Port 8010',
    },
    {
      id: 'skill-match' as AppViewId,
      label: 'Module 5: Skill Match',
      icon: Layers,
      badge: 'Port 8030',
    },
  ];

  return (
    <aside className="radix-sidebar" aria-label="Main Navigation">
      {/* Brand Header */}
      <div className="radix-sidebar-brand">
        <div className="radix-logo-icon">
          <Sparkles size={20} />
        </div>
        <div>
          <div className="radix-brand-title">RADIX</div>
          <div className="radix-brand-subtitle">Talent Match Intelligence</div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="radix-sidebar-nav">
        <div className="radix-nav-section-title">Core Navigation</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`radix-sidebar-item ${isActive ? 'active' : ''}`}
              type="button"
            >
              <Icon className="radix-sidebar-icon" size={18} />
              <span>{item.label}</span>
              {item.badge && <span className="radix-sidebar-badge">{item.badge}</span>}
            </button>
          );
        })}

        <div className="radix-nav-section-title" style={{ marginTop: '0.75rem' }}>
          Module Workspaces
        </div>
        {moduleWorkspaces.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`radix-sidebar-item ${isActive ? 'active' : ''}`}
              type="button"
            >
              <Icon className="radix-sidebar-icon" size={18} />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className="radix-sidebar-badge"
                  style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Health Indicator */}
      <div className="radix-sidebar-footer">
        <button
          onClick={onOpenHealthModal}
          className="radix-health-indicator-card"
          type="button"
          title="Click to view live microservice health"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server size={14} color="#64748b" />
            <span style={{ fontWeight: 600, color: '#0f172a' }}>Microservices</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              className={`radix-status-dot ${
                onlineCount >= 5 ? 'healthy' : onlineCount > 0 ? 'degraded' : 'offline'
              }`}
            />
            <span style={{ fontWeight: 700, color: onlineCount >= 5 ? '#16a34a' : '#d97706' }}>
              {onlineCount}/{totalCount}
            </span>
          </div>
        </button>
      </div>
    </aside>
  );
};
