import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  FileCheck2,
} from 'lucide-react';
import type { CandidateProfile, Module2Metadata } from './features/profile-builder/types';
import { createEmptyProfile, SAMPLE_CANDIDATE_PROFILE } from './data/defaultProfile';
import {
  calculateProfileCompletion,
  validatePersonalInfo,
  validateFullProfile,
  profileStorage,
  StorageError,
  exportProfileToJsonFile,
  mapParsedResumeToCandidateProfile,
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
import { Sidebar, type AppViewId } from './components/navigation/Sidebar';
import { TopBar } from './components/navigation/TopBar';
import { HealthModal } from './components/health/HealthModal';
import { DashboardView } from './views/DashboardView';
import { JdAnalyzerView } from './views/JdAnalyzerView';
import { ResumeParserView } from './views/ResumeParserView';
import { TalentCheckView } from './views/TalentCheckView';
import { SkillMatchView } from './views/SkillMatchView';
import { AssessmentWorkflowView } from './views/AssessmentWorkflowView';
import { AssessmentResultsView } from './views/AssessmentResultsView';

import {
  saveProfileToBackend,
} from './features/profile-builder/services/profileApiService';
import {
  checkAllServices,
  type SystemHealthReport,
} from './features/profile-builder/services/healthService';
import {
  getBenchmarkCompanies,
  type TalentCheckResult,
} from './features/profile-builder/services/talentCheckService';
import type { SkillMatchResponse } from './features/profile-builder/services/skillMatchService';
import type { JDExtractionResponse } from './features/profile-builder/services/jdAnalyzerService';
import { DEFAULT_ACTIVE_JD } from './data/sampleJds';

const RECENT_ASSESSMENTS_KEY = 'radix_recent_assessments_v1';

export const App: React.FC = () => {
  // Navigation View: 'dashboard' | 'candidates' | 'resume-parser' | 'jd-analyzer' | 'profile-builder' | 'talent-check' | 'skill-match' | 'assessment-workflow' | 'assessment-results'
  const [currentView, setCurrentView] = useState<AppViewId>('dashboard');

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

  // Current working editable candidate profile
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

  // Active Job Description from Module 1
  const [activeJd, setActiveJdState] = useState<JDExtractionResponse>(() => {
    try {
      const saved = localStorage.getItem('radix_active_jd_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_ACTIVE_JD;
  });

  const setActiveJd = useCallback((jd: JDExtractionResponse) => {
    setActiveJdState(jd);
    try {
      localStorage.setItem('radix_active_jd_v1', JSON.stringify(jd));
    } catch {}
  }, []);

  // Target Benchmark Company from Module 4
  const [selectedCompany, setSelectedCompany] = useState<string>('Accenture plc');
  const [companiesList, setCompaniesList] = useState<string[]>(['Accenture plc', 'Google LLC', 'Wipro Limited']);

  // Multi-Module Evaluation Results
  const [talentResult, setTalentResult] = useState<TalentCheckResult | null>(null);
  const [skillMatchResult, setSkillMatchResult] = useState<SkillMatchResponse | null>(null);

  // Persisted Recent Assessments
  const [recentAssessments, setRecentAssessments] = useState<Array<{
    id: string;
    timestamp: string;
    candidateName: string;
    jobTitle: string;
    company: string;
    talentCheckScore?: number;
    skillMatchScore?: number;
  }>>(() => {
    try {
      const raw = localStorage.getItem(RECENT_ASSESSMENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // System Microservices Health
  const [healthReport, setHealthReport] = useState<SystemHealthReport | null>(null);
  const [isRefreshingHealth, setIsRefreshingHealth] = useState<boolean>(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState<boolean>(false);

  // Editor Sub-view states
  const [activeTab, setActiveTab] = useState<SectionTabId>('personal');
  const [isSplitView, setIsSplitView] = useState<boolean>(true);
  const [profileManagerMode, setProfileManagerMode] = useState<boolean>(false);

  // Validation messages & Toast notification
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState<boolean>(false);

  const showToast = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage((cur) => (cur?.text === text ? null : cur));
    }, 4500);
  }, []);

  // Poll service health and company catalog on mount
  const refreshHealth = useCallback(async () => {
    setIsRefreshingHealth(true);
    try {
      const report = await checkAllServices();
      setHealthReport(report);
    } catch {
      // Safe fallback
    } finally {
      setIsRefreshingHealth(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    checkAllServices().then((report) => {
      if (isMounted) setHealthReport(report);
    }).catch(() => {});

    getBenchmarkCompanies().then((comps) => {
      if (isMounted && comps && comps.length > 0) setCompaniesList(comps);
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
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

  // Save profile to backend and local storage
  const handleSave = async () => {
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

    const profileToSave: CandidateProfile = {
      ...profile,
      profile_id: profile.profile_id || `radix-cand-${Date.now().toString(36)}`,
      last_updated: new Date().toISOString(),
    };

    try {
      // Save to Profile Backend API (port 8040)
      try {
        await saveProfileToBackend(profileToSave);
      } catch (backendErr) {
        console.warn('Profile Backend sync warning:', backendErr);
      }

      // Persist to local storage
      const exists = savedProfiles.some((p) => p.profile_id === profileToSave.profile_id);
      const persisted = exists
        ? profileStorage.updateProfile(profileToSave.profile_id, profileToSave)
        : profileStorage.createProfile(profileToSave);

      setProfile(persisted);
      setSavedBaseline(persisted);
      setSavedProfiles(profileStorage.getAllProfiles());

      showToast(
        'success',
        `Candidate profile "${persisted.personal_info.full_name || 'Candidate'}" saved successfully.`
      );
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Could not save the candidate profile.';
      showToast('error', errorMsg);
    }
  };

  const handleCancel = () => {
    setProfile(JSON.parse(JSON.stringify(savedBaseline)));
    setValidationErrors([]);
    showToast('info', 'Unsaved edits were discarded. Reverted to previous saved state.');
  };

  const handleLoadSample = () => {
    const sampleCopy = JSON.parse(JSON.stringify(SAMPLE_CANDIDATE_PROFILE));
    sampleCopy.profile_id = `radix-cand-sample-${Date.now().toString(36)}`;
    sampleCopy.last_updated = new Date().toISOString();

    setProfile(sampleCopy);
    setValidationErrors([]);
    setCurrentView('profile-builder');
    setProfileManagerMode(false);
    showToast(
      'success',
      'Loaded sample profile (Alex Rivera) into draft. Click "Save Profile" to persist.'
    );
  };

  const handleResetEmpty = () => {
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
    setCurrentView('profile-builder');
    setProfileManagerMode(false);
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
      setCurrentView('profile-builder');
      setProfileManagerMode(false);
      showToast('info', `Switched active candidate to "${target.personal_info.full_name || 'Candidate'}".`);
    }
  };

  const handlePreviewProfile = (targetProfile: CandidateProfile) => {
    setProfile(JSON.parse(JSON.stringify(targetProfile)));
    setSavedBaseline(JSON.parse(JSON.stringify(targetProfile)));
    setCurrentView('profile-builder');
    setProfileManagerMode(false);
    setActiveTab('preview');
  };

  const handleDeleteProfile = (profileId: string) => {
    const success = profileStorage.deleteProfile(profileId);
    if (success) {
      const refreshed = profileStorage.getAllProfiles();
      setSavedProfiles(refreshed);

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
    setCurrentView('profile-builder');
    setProfileManagerMode(false);
    showToast(
      'success',
      `Prefilled profile from resume (${finalProfile.personal_info.full_name || 'Candidate'}). Missing fields remain blank for your input.`
    );
  };

  const handleIntakeFromParserView = (
    parsed: ParsedResumeInput,
    filename: string,
    metadata?: Module2Metadata | null
  ) => {
    const draft = mapParsedResumeToCandidateProfile(parsed, profile);
    if (filename) draft.cv_file = filename;
    if (metadata?.hackathons && metadata.hackathons.length > 0) {
      draft.hackathons = metadata.hackathons.map((h) => ({
        title: h.title || undefined,
        result: h.result || undefined,
        kind: h.kind || undefined,
        description: h.description || undefined,
      }));
    }

    setProfile(draft);
    setValidationErrors([]);
    showToast('success', `Intake complete for ${draft.personal_info.full_name || 'Candidate'}. Ready to edit and save.`);
  };

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
        showToast('info', `Exported current working draft to "${res.filename}".`);
      } else {
        showToast('error', `Failed to export profile JSON: ${res.error}`);
      }
      return;
    }
    handleExportProfile(savedBaseline);
  };

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
      setCurrentView('profile-builder');
      setProfileManagerMode(false);
      showToast(
        'success',
        `Candidate profile "${persisted.personal_info.full_name || 'Candidate'}" successfully imported.`
      );
    } catch (err: unknown) {
      const msg = err instanceof StorageError ? err.message : 'Storage write failed';
      showToast('error', `Import persistence failed: ${msg}`);
    }
  };

  const handleSaveAssessmentResult = (result: {
    candidateName: string;
    jobTitle: string;
    company: string;
    talentCheckScore?: number;
    skillMatchScore?: number;
    talentResult: TalentCheckResult | null;
    skillMatchResult: SkillMatchResponse | null;
    jdResult: JDExtractionResponse | null;
  }) => {
    if (result.talentResult) setTalentResult(result.talentResult);
    if (result.skillMatchResult) setSkillMatchResult(result.skillMatchResult);
    if (result.jdResult) setActiveJd(result.jdResult);

    const record = {
      id: `run-${Date.now()}`,
      timestamp: new Date().toISOString(),
      candidateName: result.candidateName,
      jobTitle: result.jobTitle,
      company: result.company,
      talentCheckScore: result.talentCheckScore,
      skillMatchScore: result.skillMatchScore,
    };

    setRecentAssessments((prev) => {
      const updated = [record, ...prev.slice(0, 9)];
      try {
        localStorage.setItem(RECENT_ASSESSMENTS_KEY, JSON.stringify(updated));
      } catch {
        // Ignored
      }
      return updated;
    });

    showToast('success', 'Assessment completed and results recorded.');
  };

  return (
    <div className="radix-shell">
      {/* Primary Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          if (view === 'candidates') setProfileManagerMode(true);
          else if (view === 'profile-builder') setProfileManagerMode(false);
        }}
        candidateCount={savedProfiles.length}
        healthReport={healthReport}
        onOpenHealthModal={() => setIsHealthModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="radix-main">
        {/* Top Navigation Bar */}
        <TopBar
          currentView={currentView}
          activeProfile={profile}
          activeJd={activeJd}
          onNavigate={(view) => {
            setCurrentView(view);
            if (view === 'candidates') setProfileManagerMode(true);
            else if (view === 'profile-builder') setProfileManagerMode(false);
          }}
          onOpenResumeModal={() => setIsResumeModalOpen(true)}
          onOpenHealthModal={() => setIsHealthModalOpen(true)}
          completionPercentage={completionReport.overallScore}
        />

        {/* VIEW 1: DASHBOARD */}
        {currentView === 'dashboard' && (
          <DashboardView
            onNavigate={(view) => {
              setCurrentView(view);
              if (view === 'candidates') setProfileManagerMode(true);
              else if (view === 'profile-builder') setProfileManagerMode(false);
            }}
            savedProfiles={savedProfiles}
            activeProfile={profile}
            onSelectActiveProfile={(p) => {
              setProfile(p);
              setSavedBaseline(p);
              profileStorage.setActiveProfileId(p.profile_id);
            }}
            activeJd={activeJd}
            onOpenResumeModal={() => setIsResumeModalOpen(true)}
            selectedCompany={selectedCompany}
            onSelectCompany={setSelectedCompany}
            companiesList={companiesList}
            healthReport={healthReport}
            recentAssessmentHistory={recentAssessments}
          />
        )}

        {/* VIEW 2: FULL ASSESSMENT WORKFLOW */}
        {currentView === 'assessment-workflow' && (
          <AssessmentWorkflowView
            savedProfiles={savedProfiles}
            activeProfile={profile}
            onSelectActiveProfile={(p) => {
              setProfile(p);
              setSavedBaseline(p);
              profileStorage.setActiveProfileId(p.profile_id);
            }}
            activeJd={activeJd}
            onSetActiveJd={setActiveJd}
            selectedCompany={selectedCompany}
            onSelectCompany={setSelectedCompany}
            companiesList={companiesList}
            onNavigate={setCurrentView}
            onSaveAssessmentResult={handleSaveAssessmentResult}
          />
        )}

        {/* VIEW 3: CANDIDATE PROFILES LIST */}
        {currentView === 'candidates' && (
          <div className="radix-page-content">
            <ProfileListManager
              profiles={savedProfiles}
              activeProfileId={profile.profile_id}
              onSelectProfile={handleSelectProfile}
              onPreviewProfile={handlePreviewProfile}
              onCreateNew={handleCreateNewProfile}
              onDeleteProfile={handleDeleteProfile}
              onBackToEditor={() => setCurrentView('profile-builder')}
              onLoadSample={handleLoadSample}
              onExportProfile={handleExportProfile}
              onOpenImportModal={() => setIsImportModalOpen(true)}
            />
          </div>
        )}

        {/* VIEW 4: MODULE 1 JD ANALYZER */}
        {currentView === 'jd-analyzer' && (
          <JdAnalyzerView
            activeJd={activeJd}
            onSetActiveJd={setActiveJd}
            onNavigate={setCurrentView}
          />
        )}

        {/* VIEW 5: MODULE 2 RESUME PARSER */}
        {currentView === 'resume-parser' && (
          <ResumeParserView
            onIntakeCandidate={handleIntakeFromParserView}
            onNavigate={setCurrentView}
          />
        )}

        {/* VIEW 6: MODULE 4 TALENT CHECK */}
        {currentView === 'talent-check' && (
          <TalentCheckView
            savedProfiles={savedProfiles}
            activeProfile={profile}
            onSelectActiveProfile={(p) => {
              setProfile(p);
              setSavedBaseline(p);
              profileStorage.setActiveProfileId(p.profile_id);
            }}
            selectedCompany={selectedCompany}
            onSelectCompany={setSelectedCompany}
            companiesList={companiesList}
            onNavigate={setCurrentView}
          />
        )}

        {/* VIEW 7: MODULE 5 SKILL MATCH */}
        {currentView === 'skill-match' && (
          <SkillMatchView
            savedProfiles={savedProfiles}
            activeProfile={profile}
            onSelectActiveProfile={(p) => {
              setProfile(p);
              setSavedBaseline(p);
              profileStorage.setActiveProfileId(p.profile_id);
            }}
            activeJd={activeJd}
            onSetActiveJd={setActiveJd}
            onNavigate={setCurrentView}
          />
        )}

        {/* VIEW 8: UNIFIED ASSESSMENT RESULTS */}
        {currentView === 'assessment-results' && (
          <AssessmentResultsView
            activeProfile={profile}
            activeJd={activeJd}
            selectedCompany={selectedCompany}
            talentResult={talentResult}
            skillMatchResult={skillMatchResult}
            onNavigate={setCurrentView}
          />
        )}

        {/* VIEW 9: MODULE 3 PROFILE BUILDER EDITOR & PREVIEW */}
        {currentView === 'profile-builder' && (
          <div className="radix-page-content" style={{ padding: '1rem 2rem' }}>
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
              onToggleProfileManager={() => setProfileManagerMode(!profileManagerMode)}
              isManagerView={profileManagerMode}
              onExportCurrent={handleExportCurrent}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onOpenResumeModal={() => setIsResumeModalOpen(true)}
            />

            {profileManagerMode ? (
              <ProfileListManager
                profiles={savedProfiles}
                activeProfileId={profile.profile_id}
                onSelectProfile={handleSelectProfile}
                onPreviewProfile={handlePreviewProfile}
                onCreateNew={handleCreateNewProfile}
                onDeleteProfile={handleDeleteProfile}
                onBackToEditor={() => setProfileManagerMode(false)}
                onLoadSample={handleLoadSample}
                onExportProfile={handleExportProfile}
                onOpenImportModal={() => setIsImportModalOpen(true)}
              />
            ) : (
              <>
                {/* Validation Errors Notice */}
                {validationErrors.length > 0 && (
                  <div className="validation-summary-card" style={{ marginTop: '1rem' }}>
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

                {/* Section Navigation Tabs */}
                <div style={{ marginTop: '1rem' }}>
                  <SectionTabs
                    activeTab={activeTab}
                    onSelectTab={setActiveTab}
                    sectionStatus={completionReport.sections}
                    skillCount={profile.skills.length}
                    projectCount={profile.projects.length}
                  />
                </div>

                {/* Split View or Full Tab View */}
                {activeTab === 'preview' ? (
                  <div style={{ marginTop: '1rem' }}>
                    <ProfilePreview profile={profile} completionScore={completionReport.overallScore} />
                  </div>
                ) : isSplitView ? (
                  <div className="builder-split-grid" style={{ marginTop: '1rem' }}>
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
                          <FileCheck2 size={16} color="var(--primary)" />
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>
                            Live Synchronized Preview
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Updates in real time
                        </span>
                      </div>
                      <ProfilePreview profile={profile} completionScore={completionReport.overallScore} />
                    </div>
                  </div>
                ) : (
                  <div className="builder-main-layout" style={{ marginTop: '1rem' }}>
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
          </div>
        )}
      </div>

      {/* Global Modals */}
      <ImportProfileModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingProfiles={savedProfiles}
        onConfirmImport={handleConfirmImport}
      />

      <ResumeUploadModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        currentProfile={profile}
        hasUnsavedChanges={hasUnsavedChanges}
        onConfirmPrefill={handleConfirmResumePrefill}
      />

      <HealthModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        healthReport={healthReport}
        isRefreshing={isRefreshingHealth}
        onRefresh={refreshHealth}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className={`toast-notification toast-${toastMessage.type}`} role="status">
          {toastMessage.type === 'success' && <CheckCircle2 size={16} />}
          {toastMessage.type === 'error' && <AlertTriangle size={16} />}
          {toastMessage.type === 'info' && <Info size={16} />}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="toast-close-btn"
            type="button"
            aria-label="Dismiss message"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
