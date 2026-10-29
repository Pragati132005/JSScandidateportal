import React from 'react';
import {
  Cpu,
  Save,
  RotateCcw,
  Sparkles,
  LayoutTemplate,
  SplitSquareVertical,
  Users,
  Download,
  UploadCloud,
  FileText,
} from 'lucide-react';
import { ProgressBar } from '../../../components';

interface ProfileBuilderHeaderProps {
  completionPercentage: number;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onCancel: () => void;
  onLoadSample: () => void;
  onResetEmpty: () => void;
  isSplitView: boolean;
  onToggleSplitView: () => void;
  savedProfilesCount: number;
  onToggleProfileManager: () => void;
  isManagerView: boolean;
  onExportCurrent: () => void;
  onOpenImportModal: () => void;
  onOpenResumeModal: () => void;
}

export const ProfileBuilderHeader: React.FC<ProfileBuilderHeaderProps> = ({
  completionPercentage,
  hasUnsavedChanges,
  onSave,
  onCancel,
  onLoadSample,
  onResetEmpty,
  isSplitView,
  onToggleSplitView,
  savedProfilesCount,
  onToggleProfileManager,
  isManagerView,
  onExportCurrent,
  onOpenImportModal,
  onOpenResumeModal,
}) => {
  return (
    <header className="builder-top-nav">
      <div className="builder-nav-inner">
        {/* Left: Branding */}
        <div className="builder-brand-group">
          <div className="brand-logo-badge">
            <Cpu size={20} strokeWidth={2.4} />
          </div>
          <div>
            <div className="brand-title-row">
              <span className="brand-title">
                RADIX <span className="brand-title-accent">Talent Match</span>
              </span>
              <span className="module-badge">Module 3: Profile Builder</span>
            </div>
            <div className="brand-subtext">
              Canonical Candidate Verification &amp; RADIX Skill Coding Engine
            </div>
          </div>
        </div>

        {/* Center: Completion Progress Meter */}
        <div className="builder-progress-container">
          <ProgressBar
            percentage={completionPercentage}
            label="Candidate Readiness"
            showPercentText={true}
          />
        </div>

        {/* Right: Actions */}
        <div className="builder-nav-actions">
          {/* Multi-Profile Manager Button */}
          <button
            type="button"
            className={`btn btn-secondary btn-sm ${isManagerView ? 'active-toggle' : ''}`}
            onClick={onToggleProfileManager}
            title="View and manage all locally saved candidate profiles"
          >
            <Users size={14} color="var(--primary-light)" />
            <span>Profiles ({savedProfilesCount})</span>
          </button>

          {/* Import JSON */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenImportModal}
            title="Import candidate profile from JSON file"
          >
            <UploadCloud size={14} color="#38bdf8" />
            <span className="hide-on-mobile">Import</span>
          </button>

          {/* Export JSON (current profile) */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onExportCurrent}
            title="Export candidate profile as downloadable JSON"
          >
            <Download size={14} color="#38bdf8" />
            <span className="hide-on-mobile">Export</span>
          </button>

          {/* Split view toggle */}
          {!isManagerView && (
            <button
              type="button"
              className={`btn btn-secondary btn-sm ${isSplitView ? 'active-toggle' : ''}`}
              onClick={onToggleSplitView}
              title={isSplitView ? 'Switch to Standard Tabbed View' : 'Switch to Split Live-Preview View'}
            >
              <SplitSquareVertical size={14} />
              <span className="hide-on-mobile">{isSplitView ? 'Single View' : 'Split Preview'}</span>
            </button>
          )}

          {/* Load Sample Demo */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onLoadSample}
            title="Load realistic candidate demo profile"
          >
            <Sparkles size={14} color="#38bdf8" />
            <span className="hide-on-mobile">Load Sample</span>
          </button>

          {/* Prefill from Resume */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenResumeModal}
            title="Prefill candidate profile from resume document (PDF/DOCX)"
          >
            <FileText size={14} color="#38bdf8" />
            <span className="hide-on-mobile">Prefill Resume</span>
          </button>

          {/* Reset button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onResetEmpty}
            title="Clear form to empty candidate"
          >
            <LayoutTemplate size={14} />
            <span className="hide-on-mobile">Clear</span>
          </button>

          {/* Cancel button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onCancel}
            disabled={!hasUnsavedChanges}
            title="Discard current unsaved edits"
          >
            <RotateCcw size={14} />
            <span>Cancel</span>
          </button>

          {/* Save button */}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onSave}
            title="Validate and save candidate profile to localStorage"
          >
            <Save size={14} />
            <span>Save Profile</span>
          </button>
        </div>
      </div>
    </header>
  );
};
