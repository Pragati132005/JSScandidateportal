import React, { useState, useMemo, useCallback } from 'react';
import { saveProfileToBackend } from './features/profile-builder/services/profileApiService';
import { runSkillMatch } from './features/profile-builder/services/skillMatchService';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  FileCheck2,
} from 'lucide-react';
import { runTalentCheck } from './features/profile-builder/services/talentCheckService';
import type { TalentCheckResult } from './features/profile-builder/services/talentCheckService';
import type { CandidateProfile } from './features/profile-builder/types';
import { createEmptyProfile, SAMPLE_CANDIDATE_PROFILE } from './data/defaultProfile';
import {
  calculateProfileCompletion,
  validatePersonalInfo,
  validateFullProfile,
  profileStorage,
  StorageError,
  exportProfileToJsonFile,
  mergeResumeIntoCandidateProfile,
  type ParsedResumeInput,
} from './features/profile-builder';
import {
  ProfileBuilderHeader,
  SectionTabs,
  PersonalInfoSection,
  PreferredRolesSection,
  EducationSection,
  SkillsSection,
  ProjectsSection,
  ExperienceSection,
  CertificationsSection,
  ProfilePreview,
  ProfileListManager,
  ImportProfileModal,
  ResumeUploadModal,
} from './features/profile-builder/components';
import type { SectionTabId } from './features/profile-builder/components';

export const App: React.FC = () => {
  // Stored profiles collection initialized from local storage
  const [savedProfiles, setSavedProfiles] = useState<CandidateProfile[]>(() => {
    try {
      return profileStorage.getAllProfiles();
    } catch {
      return [];
    }
  });

  // Baseline saved state
  const [savedBaseline, setSavedBaseline] = useState<CandidateProfile>(() => {
    try {
      const activeId = profileStorage.getActiveProfileId();
      if (activeId) {
        const found = profileStorage.getProfileById(activeId);
        if (found) return found;
      }
      const all = profileStorage.getAllProfiles();
      if (all.length > 0) return all[0];
    } catch {
      // Fallback to empty profile
    }
    return createEmptyProfile();
  });

  // Current working editable state
  const [profile, setProfile] = useState<CandidateProfile>(() => {
    try {
      const activeId = profileStorage.getActiveProfileId();
      if (activeId) {
        const found = profileStorage.getProfileById(activeId);
        if (found) return JSON.parse(JSON.stringify(found));
      }
      const all = profileStorage.getAllProfiles();
      if (all.length > 0) return JSON.parse(JSON.stringify(all[0]));
    } catch {
      // Fallback
    }
    return createEmptyProfile();
  });

  // Active view: 'editor' or 'manager'
  const [activeView, setActiveView] = useState<'editor' | 'manager'>('editor');


  // Module 1 + Module 5 skill matching state
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdCompany, setJdCompany] = useState('');
  const [jdRole, setJdRole] = useState('');
  const [matchResult, setMatchResult] = useState<unknown>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchError, setMatchError] = useState('');

  // Navigation tab within the editor
  const [activeTab, setActiveTab] = useState<SectionTabId>('personal');

  // Split-screen toggle (Editor + Preview side-by-side)
  const [isSplitView, setIsSplitView] = useState<boolean>(true);

  // Validation messages & Toast notification
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  
  const [selectedCompany, setSelectedCompany] = useState('Wipro Limited');

  const [talentCheckResult, setTalentCheckResult] =
    useState<TalentCheckResult | null>(null);

  const [isCheckingTalent, setIsCheckingTalent] = useState(false);

  const [talentCheckError, setTalentCheckError] =
    useState<string | null>(null);


  const showToast = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage((cur) => (cur?.text === text ? null : cur));
    }, 4500);
  }, []);

  // Check if current draft differs from baseline
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(profile) !== JSON.stringify(savedBaseline);
  }, [profile, savedBaseline]);

  // Profile completion report
  const completionReport = useMemo(() => {
    return calculateProfileCompletion(profile);
  }, [profile]);

  // Field errors for personal info
  const personalErrors = useMemo(() => {
    return validatePersonalInfo(profile.personal_info);
  }, [profile.personal_info]);

  // Actions
  const handleRunSkillMatch = async () => {
  if (!jdFile) {
    setMatchError('Please select a job description file first.');
    return;
  }

  if (profile.skills.length === 0) {
    setMatchError('Add at least one candidate skill before matching.');
    return;
  }

  setIsMatching(true);
  setMatchError('');
  setMatchResult(null);

  try {
    const result = await runSkillMatch(
      profile as unknown as Record<string, unknown>,
      jdFile,
      jdCompany,
      jdRole,
    );

    setMatchResult(result);
    showToast('success', 'Skill matching completed.');
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Skill matching failed. Check that Modules 1 and 5 are running.';

    setMatchError(message);
    showToast('error', message);
  } finally {
    setIsMatching(false);
  }
};
const handleTalentCheck = async () => {
  if (hasUnsavedChanges) {
    showToast('error', 'Save your profile before running Talent Check.');
    return;
  }

  setIsCheckingTalent(true);
  setTalentCheckError(null);
  setTalentCheckResult(null);

  try {
    const result = await runTalentCheck(profile, selectedCompany);
    setTalentCheckResult(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown API error';

    setTalentCheckError(message);
    showToast('error', message);
  } finally {
    setIsCheckingTalent(false);
  }
};

const handleSave = async () => {
    // 1. Validate complete draft using canonical schema
    const { isValid, errors } = validateFullProfile(profile);
    if (!isValid) {
      setValidationErrors(errors);
      showToast(
        'error',
        `Validation failed with ${errors.length} issue${errors.length > 1 ? 's' : ''}. Fix required fields before saving.`
      );
      return;
    }

    setValidationErrors([]);

    // 2. Prepare updated profile with stable ID and refreshed timestamp
    const profileToSave: CandidateProfile = {
      ...profile,
      profile_id: profile.profile_id || `radix-cand-${Date.now().toString(36)}`,
      last_updated: new Date().toISOString(),
    };

    // 3. Persist to local storage before committing React saved baseline
    
 try {
  // Save to Supabase through the Profile Backend API first.
  await saveProfileToBackend(
    profileToSave as unknown as Record<string, unknown>
  );

  // Preserve the existing local profile storage.
  const exists = savedProfiles.some(
    (p) => p.profile_id === profileToSave.profile_id
  );

  const persisted = exists
    ? profileStorage.updateProfile(
        profileToSave.profile_id,
        profileToSave
      )
    : profileStorage.createProfile(profileToSave);

  setProfile(persisted);
  setSavedBaseline(persisted);
  setSavedProfiles(profileStorage.getAllProfiles());

  showToast(
    'success',
    `Candidate profile "${persisted.personal_info.full_name || 'Candidate'}" saved to Supabase and local storage.`
  );
} catch (err: unknown) {
  const errorMsg =
    err instanceof Error
      ? err.message
      : 'Could not save the candidate profile.';

  showToast('error', errorMsg);
 }
};


  const handleCancel = () => {
    // Restores last successfully saved profile without modifying storage
    setProfile(JSON.parse(JSON.stringify(savedBaseline)));
    setValidationErrors([]);
    showToast('info', 'Unsaved edits were discarded. Reverted to previous saved state.');
  };

  const handleLoadSample = () => {
    // Generates a separate fresh sample draft to avoid silently overwriting existing candidate records
    const sampleCopy = JSON.parse(JSON.stringify(SAMPLE_CANDIDATE_PROFILE));
    sampleCopy.profile_id = `radix-cand-sample-${Date.now().toString(36)}`;
    sampleCopy.last_updated = new Date().toISOString();

    setProfile(sampleCopy);
    // Note: savedBaseline is kept separate until user explicitly clicks Save Profile
    setValidationErrors([]);
    setActiveView('editor');
    showToast(
      'success',
      'Loaded verified sample profile (Alex Rivera) into editor draft. Click "Save Profile" to persist.'
    );
  };

  const handleResetEmpty = () => {
    // Reset active editor to blank; does NOT delete other saved profiles
    const empty = createEmptyProfile();
    setProfile(empty);
    setSavedBaseline(empty);
    setValidationErrors([]);
    showToast('info', 'Editor reset to blank candidate structure. Stored profiles remain safe.');
  };

  const handleCreateNewProfile = () => {
    const fresh = createEmptyProfile();
    setProfile(fresh);
    setSavedBaseline(fresh);
    setValidationErrors([]);
    profileStorage.setActiveProfileId(null);
    setActiveView('editor');
    setActiveTab('personal');
    showToast('info', 'Started new candidate profile.');
  };

  const handleSelectProfile = (profileId: string) => {
    const target = savedProfiles.find((p) => p.profile_id === profileId);
    if (target) {
      setProfile(JSON.parse(JSON.stringify(target)));
      setSavedBaseline(JSON.parse(JSON.stringify(target)));
      profileStorage.setActiveProfileId(profileId);
      setValidationErrors([]);
      setActiveView('editor');
      showToast('info', `Opened profile: ${target.personal_info.full_name || 'Candidate'}`);
    }
  };

  const handlePreviewProfile = (targetProfile: CandidateProfile) => {
    setProfile(JSON.parse(JSON.stringify(targetProfile)));
    setSavedBaseline(JSON.parse(JSON.stringify(targetProfile)));
    setActiveView('editor');
    setActiveTab('preview');
  };

  const handleDeleteProfile = (profileId: string) => {
    const success = profileStorage.deleteProfile(profileId);
    if (success) {
      const refreshed = profileStorage.getAllProfiles();
      setSavedProfiles(refreshed);

      // If we deleted the profile currently being edited, reset editor
      if (profile.profile_id === profileId) {
        if (refreshed.length > 0) {
          setProfile(JSON.parse(JSON.stringify(refreshed[0])));
          setSavedBaseline(JSON.parse(JSON.stringify(refreshed[0])));
          profileStorage.setActiveProfileId(refreshed[0].profile_id);
        } else {
          const fresh = createEmptyProfile();
          setProfile(fresh);
          setSavedBaseline(fresh);
          profileStorage.setActiveProfileId(null);
        }
      }
      showToast('success', 'Profile was permanently deleted from local storage.');
    } else {
      showToast('error', 'Could not delete profile. Record was not found.');
    }
  };

  // State for Import Profile & Resume Intake Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState<boolean>(false);

  const handleConfirmResumePrefill = (
    prefilledProfile: CandidateProfile,
    mode: 'replace' | 'merge' = 'replace',
    rawParsedInput?: ParsedResumeInput
  ) => {
    let finalProfile: CandidateProfile;
    if (mode === 'merge' && rawParsedInput) {
      finalProfile = mergeResumeIntoCandidateProfile(profile, rawParsedInput);
    } else {
      finalProfile = prefilledProfile;
    }
    setProfile(finalProfile);
    setValidationErrors([]);
    setActiveView('editor');
    showToast(
      'success',
      `Prefilled profile from resume (${finalProfile.personal_info.full_name || 'Candidate'}). Missing fields remain blank for your input.`
    );
  };

  // Export handlers
  const handleExportProfile = (targetProfile: CandidateProfile) => {
    const res = exportProfileToJsonFile(targetProfile);
    if (res.success) {
      showToast('success', `Exported candidate profile to "${res.filename}".`);
    } else {
      showToast('error', `Failed to export profile JSON: ${res.error}`);
    }
  };

  const handleExportCurrent = () => {
    if (hasUnsavedChanges) {
      const { isValid, errors } = validateFullProfile(profile);
      if (!isValid) {
        setValidationErrors(errors);
        showToast(
          'error',
          `Working draft has ${errors.length} validation errors. Save or resolve errors before exporting.`
        );
        return;
      }
      const res = exportProfileToJsonFile(profile);
      if (res.success) {
        showToast(
          'info',
          `Exported current working draft to "${res.filename}". (Remember to click Save Profile to persist changes).`
        );
      } else {
        showToast('error', `Failed to export profile JSON: ${res.error}`);
      }
      return;
    }
    handleExportProfile(savedBaseline);
  };

  // Import handler with collision protection
  const handleConfirmImport = (
    importedProfile: CandidateProfile,
    mode: 'create_new' | 'overwrite'
  ) => {
    try {
      let persisted: CandidateProfile;
      if (mode === 'overwrite') {
        persisted = profileStorage.updateProfile(importedProfile.profile_id, importedProfile);
      } else {
        persisted = profileStorage.createProfile(importedProfile);
      }

      setSavedProfiles(profileStorage.getAllProfiles());
      setProfile(persisted);
      setSavedBaseline(persisted);
      setActiveView('editor');
      showToast(
        'success',
        `Candidate profile "${persisted.personal_info.full_name || 'Candidate'}" successfully imported.`
      );
    } catch (err: unknown) {
      const msg = err instanceof StorageError ? err.message : 'Storage write failed';
      showToast('error', `Import persistence failed: ${msg}`);
    }
  };

  return (
    <div className="app-container">
      {/* Top Application Header */}
      <ProfileBuilderHeader
        completionPercentage={completionReport.overallScore}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave}
        onCancel={handleCancel}
        onLoadSample={handleLoadSample}
        onResetEmpty={handleResetEmpty}
        isSplitView={isSplitView}
        onToggleSplitView={() => setIsSplitView(!isSplitView)}
        savedProfilesCount={savedProfiles.length}
        onToggleProfileManager={() => setActiveView(activeView === 'manager' ? 'editor' : 'manager')}
        isManagerView={activeView === 'manager'}
        onExportCurrent={handleExportCurrent}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenResumeModal={() => setIsResumeModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Module Sub-Header Description */}
        <div className="section-title-row" style={{ marginBottom: '-0.75rem' }}>
          <div>
            <h1 className="hero-title" style={{ fontSize: '1.45rem' }}>
              {activeView === 'manager' ? 'Local Profiles Manager' : 'Candidate Profile Builder'}
            </h1>
            <p className="hero-description" style={{ fontSize: '0.88rem' }}>
              {activeView === 'manager'
                ? 'Review, switch, or manage multi-profile candidate records persisted in browser localStorage.'
                : 'Create an evidence-backed candidate profile with 13 standardized RADIX technical categories for downstream Talent Check.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {hasUnsavedChanges ? (
              <span
                className="candidate-status-pill"
                style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}
              >
                <AlertTriangle size={12} color="#f59e0b" />
                <span>Unsaved Edits</span>
              </span>
            ) : (
              <span
                className="candidate-status-pill"
                style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
              >
                <CheckCircle2 size={12} color="#10b981" />
                <span>All Edits Saved</span>
              </span>
            )}
          </div>
        </div>
        
        {/* Talent Check Results */}
        {activeView === 'editor' && (
        <section
        className="validation-summary-card"
        style={{ marginBottom: '1.25rem' }}
        >
          <h2>Talent Check</h2>

          <div
            style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            marginBottom: '1rem',
            }}
          >
          <label htmlFor="talent-check-company">
            Select company:
          </label>

          <input
            id="talent-check-company"
            value={selectedCompany}
            onChange={(event) => setSelectedCompany(event.target.value)}
            placeholder="Enter exact company name"
            disabled={isCheckingTalent}
          />

      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={handleTalentCheck}
        disabled={isCheckingTalent || hasUnsavedChanges}
      >
        {isCheckingTalent ? 'Analyzing...' : 'Run Talent Check'}
      </button>
    </div>

    {hasUnsavedChanges && (
      <p>Save your profile before running Talent Check.</p>
    )}

    {talentCheckError && (
      <p role="alert" style={{ color: '#ef4444' }}>
        {talentCheckError}
      </p>
    )}

    {talentCheckResult && (
      <>
        <h3>
          Readiness Score: {talentCheckResult.readiness_score}/100
        </h3>

        <p>
          Company: {talentCheckResult.company}
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th align="left">Skill Category</th>
                <th align="left">Required Level</th>
                <th align="left">Candidate Level</th>
                <th align="left">Gap</th>
              </tr>
            </thead>

            <tbody>
              {talentCheckResult.skillset_gap.map((skill) => (
                <tr key={skill.category_code}>
                  <td>{skill.category_code}</td>
                  <td>{skill.required_level}</td>
                  <td>{skill.candidate_level}</td>
                  <td>{skill.gap ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )}
  </section>
)}


{/* Module 1 + Module 5: Skill Matching */}
{activeView === 'editor' && (
  <section
    style={{
      marginBottom: '1.5rem',
      padding: '1.25rem',
      border: '1px solid var(--border-color, #d1d5db)',
      borderRadius: '12px',
    }}
  >
    <h3 style={{ marginTop: 0 }}>Job Description Skill Matching</h3>

    <p>
      Upload a job description to extract required skills with Module 1
      and compare them with the current candidate profile using Module 5.
    </p>

    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <label>
        Job description file
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={(event) => {
            setJdFile(event.target.files?.[0] ?? null);
            setMatchError('');
            setMatchResult(null);
          }}
          style={{ display: 'block', marginTop: '0.4rem' }}
        />
      </label>

      <label>
        Company (optional)
        <input
          type="text"
          value={jdCompany}
          onChange={(event) => setJdCompany(event.target.value)}
          placeholder="e.g. Google"
          style={{ display: 'block', width: '100%', marginTop: '0.4rem' }}
        />
      </label>

      <label>
        Job role (optional)
        <input
          type="text"
          value={jdRole}
          onChange={(event) => setJdRole(event.target.value)}
          placeholder="e.g. Software Engineer Intern"
          style={{ display: 'block', width: '100%', marginTop: '0.4rem' }}
        />
      </label>

      <button
        type="button"
        className="btn btn-primary"
        onClick={handleRunSkillMatch}
        disabled={isMatching}
      >
        {isMatching ? 'Matching skills...' : 'Match Skills'}
      </button>

      {matchError && (
        <p role="alert" style={{ color: '#dc2626' }}>
          {matchError}
        </p>
      )}

      {matchResult !== null && (
        <div>
          <h4>Skill Matching Result</h4>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
              padding: '1rem',
              borderRadius: '8px',
              background: 'var(--surface-secondary, #f3f4f6)',
              maxHeight: '500px',
              overflow: 'auto',
            }}
          >
            {JSON.stringify(matchResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  </section>
)}
  
        {/* Validation Errors Notice */}
        {validationErrors.length > 0 && activeView === 'editor' && (
          <div className="validation-summary-card">
            <div className="validation-summary-title">
              <AlertTriangle size={16} />
              <span>Please address the following validation issues before saving:</span>
            </div>
            <ul className="validation-summary-list">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* View Switcher: Manager View vs. Editor View */}
        {activeView === 'manager' ? (
          <ProfileListManager
            profiles={savedProfiles}
            activeProfileId={profile.profile_id}
            onSelectProfile={handleSelectProfile}
            onPreviewProfile={handlePreviewProfile}
            onCreateNew={handleCreateNewProfile}
            onDeleteProfile={handleDeleteProfile}
            onBackToEditor={() => setActiveView('editor')}
            onLoadSample={handleLoadSample}
            onExportProfile={handleExportProfile}
            onOpenImportModal={() => setIsImportModalOpen(true)}
          />
        ) : (
          <>
            {/* Section Navigation Tabs */}
            <SectionTabs
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              sectionStatus={completionReport.sections}
              skillCount={profile.skills.length}
              projectCount={profile.projects.length}
            />
            

            {/* Layout Grid: Split View or Full View */}
            {activeTab === 'preview' ? (
              /* Full Preview Tab */
              <ProfilePreview profile={profile} completionScore={completionReport.overallScore} />
            ) : isSplitView ? (
              /* Side-by-Side Split View (Editor on Left, Live Preview on Right) */
              <div className="builder-split-grid">
                <div className="builder-editor-pane">
                  {activeTab === 'personal' && (
                    <PersonalInfoSection
                      data={profile.personal_info}
                      onChange={(personal_info) => setProfile({ ...profile, personal_info })}
                      errors={personalErrors}
                    />
                  )}

                  {activeTab === 'preferred_roles' && (
                    <PreferredRolesSection
                      data={profile.preferred_roles}
                      onChange={(preferred_roles) => setProfile({ ...profile, preferred_roles })}
                    />
                  )}

                  {activeTab === 'education' && (
                    <EducationSection
                      data={profile.education}
                      onChange={(education) => setProfile({ ...profile, education })}
                    />
                  )}

                  {activeTab === 'skills' && (
                    <SkillsSection
                      data={profile.skills}
                      onChange={(skills) => setProfile({ ...profile, skills })}
                    />
                  )}

                  {activeTab === 'projects' && (
                    <ProjectsSection
                      data={profile.projects}
                      onChange={(projects) => setProfile({ ...profile, projects })}
                    />
                  )}

                  {activeTab === 'experience' && (
                    <ExperienceSection
                      data={profile.internships_and_experience}
                      onChange={(internships_and_experience) =>
                        setProfile({ ...profile, internships_and_experience })
                      }
                    />
                  )}

                  {activeTab === 'certifications' && (
                    <CertificationsSection
                      data={profile.certifications}
                      onChange={(certifications) => setProfile({ ...profile, certifications })}
                    />
                  )}
                </div>

                {/* Live Synchronized Preview Pane */}
                <div className="builder-preview-pane">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FileCheck2 size={16} color="var(--primary-light)" />
                      <span
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        Live Synchronized Preview
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Updates in real time
                    </span>
                  </div>
                  <ProfilePreview profile={profile} completionScore={completionReport.overallScore} />
                </div>
              </div>
            ) : (
              /* Single Editor View */
              <div className="builder-main-layout">
                {activeTab === 'personal' && (
                  <PersonalInfoSection
                    data={profile.personal_info}
                    onChange={(personal_info) => setProfile({ ...profile, personal_info })}
                    errors={personalErrors}
                  />
                )}

                {activeTab === 'preferred_roles' && (
                  <PreferredRolesSection
                    data={profile.preferred_roles}
                    onChange={(preferred_roles) => setProfile({ ...profile, preferred_roles })}
                  />
                )}

                {activeTab === 'education' && (
                  <EducationSection
                    data={profile.education}
                    onChange={(education) => setProfile({ ...profile, education })}
                  />
                )}

                {activeTab === 'skills' && (
                  <SkillsSection
                    data={profile.skills}
                    onChange={(skills) => setProfile({ ...profile, skills })}
                  />
                )}

                {activeTab === 'projects' && (
                  <ProjectsSection
                    data={profile.projects}
                    onChange={(projects) => setProfile({ ...profile, projects })}
                  />
                )}

                {activeTab === 'experience' && (
                  <ExperienceSection
                    data={profile.internships_and_experience}
                    onChange={(internships_and_experience) =>
                      setProfile({ ...profile, internships_and_experience })
                    }
                  />
                )}

                {activeTab === 'certifications' && (
                  <CertificationsSection
                    data={profile.certifications}
                    onChange={(certifications) => setProfile({ ...profile, certifications })}
                  />
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={`toast-notification ${toastMessage.type}`}>
          {toastMessage.type === 'success' && <CheckCircle2 size={18} />}
          {toastMessage.type === 'error' && <AlertTriangle size={18} />}
          {toastMessage.type === 'info' && <Info size={18} />}
          <span>{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            style={{ color: 'inherit', opacity: 0.8, cursor: 'pointer', marginLeft: '0.5rem' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Import Profile Modal */}
      <ImportProfileModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingProfiles={savedProfiles}
        onConfirmImport={handleConfirmImport}
      />

      {/* Resume Prefill Modal */}
      <ResumeUploadModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        currentProfile={profile}
        hasUnsavedChanges={hasUnsavedChanges}
        onConfirmPrefill={handleConfirmResumePrefill}
      />

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div>
            <strong>RADIX Talent Match</strong> — Module 3: Profile Builder (Stage 5 Verified)
          </div>
          <div>
            JSON Import/Export • Local Multi-Profile Storage • Schema v1.0.0 • Offline-Ready
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
