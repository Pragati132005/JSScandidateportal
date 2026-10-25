import type { CandidateProfile } from '../types';

export const PROFILES_STORAGE_KEY = 'radix_talent_match_profiles_v1';
export const ACTIVE_PROFILE_STORAGE_KEY = 'radix_talent_match_active_id_v1';

export class StorageError extends Error {
  public readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'StorageError';
    this.cause = cause;
  }
}

export class StorageQuotaError extends StorageError {
  constructor(message: string = 'Browser storage quota exceeded. Please remove older profiles.') {
    super(message);
    this.name = 'StorageQuotaError';
  }
}

export interface ProfileStorageAdapter {
  getAllProfiles(): CandidateProfile[];
  getProfileById(profileId: string): CandidateProfile | null;
  createProfile(profile: CandidateProfile): CandidateProfile;
  updateProfile(profileId: string, profile: CandidateProfile): CandidateProfile;
  deleteProfile(profileId: string): boolean;
  getActiveProfileId(): string | null;
  setActiveProfileId(profileId: string | null): void;
  isAvailable(): boolean;
}

const isBrowser = (): boolean => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

/**
 * Validates basic structural conformity of a raw profile object
 * to ensure corrupt entries do not break the whole storage collection.
 */
const isValidProfileRecord = (record: unknown): record is CandidateProfile => {
  if (!record || typeof record !== 'object') return false;
  const r = record as Partial<CandidateProfile>;
  return (
    typeof r.profile_id === 'string' &&
    typeof r.schema_version === 'string' &&
    typeof r.personal_info === 'object' &&
    Array.isArray(r.skills)
  );
};

export class LocalStorageProfileAdapter implements ProfileStorageAdapter {
  private readonly storageKey: string;
  private readonly activeKey: string;

  constructor(
    storageKey: string = PROFILES_STORAGE_KEY,
    activeKey: string = ACTIVE_PROFILE_STORAGE_KEY
  ) {
    this.storageKey = storageKey;
    this.activeKey = activeKey;
  }

  isAvailable(): boolean {
    if (!isBrowser()) return false;
    try {
      const testKey = '__radix_storage_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  getAllProfiles(): CandidateProfile[] {
    if (!this.isAvailable()) return [];

    try {
      const rawData = window.localStorage.getItem(this.storageKey);
      if (!rawData) return [];

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawData);
      } catch (parseErr) {
        console.warn('[RADIX Storage] Corrupt JSON found in profiles store. Initializing clean store.', parseErr);
        return [];
      }

      if (!Array.isArray(parsed)) {
        console.warn('[RADIX Storage] Stored profiles data is not an array.');
        return [];
      }

      // Filter and salvage only valid profile records (per-record fault tolerance)
      const validProfiles: CandidateProfile[] = [];
      parsed.forEach((item, index) => {
        if (isValidProfileRecord(item)) {
          validProfiles.push(item);
        } else {
          console.warn(`[RADIX Storage] Skipping invalid profile record at index ${index}:`, item);
        }
      });

      return validProfiles;
    } catch (err) {
      console.error('[RADIX Storage] Failed to retrieve profiles:', err);
      return [];
    }
  }

  getProfileById(profileId: string): CandidateProfile | null {
    if (!profileId) return null;
    const profiles = this.getAllProfiles();
    return profiles.find((p) => p.profile_id === profileId) || null;
  }

  createProfile(profile: CandidateProfile): CandidateProfile {
    if (!this.isAvailable()) {
      throw new StorageError('Browser localStorage is unavailable or cookies are disabled.');
    }

    const profiles = this.getAllProfiles();
    const existingIndex = profiles.findIndex((p) => p.profile_id === profile.profile_id);

    if (existingIndex >= 0) {
      // Profile with this ID already exists, update instead
      return this.updateProfile(profile.profile_id, profile);
    }

    const newProfile: CandidateProfile = {
      ...profile,
      last_updated: new Date().toISOString(),
    };

    const updatedList = [newProfile, ...profiles];
    this.saveProfilesList(updatedList);
    this.setActiveProfileId(newProfile.profile_id);
    return newProfile;
  }

  updateProfile(profileId: string, profile: CandidateProfile): CandidateProfile {
    if (!this.isAvailable()) {
      throw new StorageError('Browser localStorage is unavailable or cookies are disabled.');
    }

    const profiles = this.getAllProfiles();
    const targetIndex = profiles.findIndex((p) => p.profile_id === profileId);

    const updatedProfile: CandidateProfile = {
      ...profile,
      profile_id: profileId, // Guarantee profile ID stability
      last_updated: new Date().toISOString(),
    };

    let updatedList: CandidateProfile[];
    if (targetIndex >= 0) {
      updatedList = profiles.map((p, idx) => (idx === targetIndex ? updatedProfile : p));
    } else {
      updatedList = [updatedProfile, ...profiles];
    }

    this.saveProfilesList(updatedList);
    this.setActiveProfileId(profileId);
    return updatedProfile;
  }

  deleteProfile(profileId: string): boolean {
    if (!this.isAvailable()) return false;

    const profiles = this.getAllProfiles();
    const filtered = profiles.filter((p) => p.profile_id !== profileId);

    if (filtered.length === profiles.length) {
      // Profile not found
      return false;
    }

    this.saveProfilesList(filtered);

    // If deleted profile was active, reset active ID
    if (this.getActiveProfileId() === profileId) {
      const nextActiveId = filtered.length > 0 ? filtered[0].profile_id : null;
      this.setActiveProfileId(nextActiveId);
    }

    return true;
  }

  getActiveProfileId(): string | null {
    if (!this.isAvailable()) return null;
    try {
      return window.localStorage.getItem(this.activeKey);
    } catch {
      return null;
    }
  }

  setActiveProfileId(profileId: string | null): void {
    if (!this.isAvailable()) return;
    try {
      if (profileId) {
        window.localStorage.setItem(this.activeKey, profileId);
      } else {
        window.localStorage.removeItem(this.activeKey);
      }
    } catch (err) {
      console.warn('[RADIX Storage] Failed to set active profile id:', err);
    }
  }

  private saveProfilesList(list: CandidateProfile[]): void {
    try {
      const serialized = JSON.stringify(list);
      window.localStorage.setItem(this.storageKey, serialized);
    } catch (err: unknown) {
      if (
        err instanceof DOMException &&
        (err.name === 'QuotaExceededError' || err.code === 22 || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
      ) {
        throw new StorageQuotaError();
      }
      throw new StorageError('Failed to write profiles to local storage.', err);
    }
  }
}

// Default singleton adapter instance
export const profileStorage = new LocalStorageProfileAdapter();
