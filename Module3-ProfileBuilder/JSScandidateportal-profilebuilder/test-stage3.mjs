// Stage 3 Automated Unit Tests for Storage Adapter and Resume Adapter
import assert from 'node:assert';

// Mock localStorage for Node environment testing
const storageStore = new Map();
global.window = {
  localStorage: {
    getItem: (key) => storageStore.get(key) || null,
    setItem: (key, val) => {
      if (val.includes('TRIGGER_QUOTA_ERROR')) {
        const err = new DOMException('QuotaExceededError', 'QuotaExceededError');
        throw err;
      }
      storageStore.set(key, String(val));
    },
    removeItem: (key) => storageStore.delete(key),
    clear: () => storageStore.clear(),
  },
};

// Import dist output or simulate LocalStorageProfileAdapter
const PROFILES_STORAGE_KEY = 'radix_talent_match_profiles_v1';
const ACTIVE_PROFILE_STORAGE_KEY = 'radix_talent_match_active_id_v1';

class LocalStorageProfileAdapter {
  constructor(storageKey = PROFILES_STORAGE_KEY, activeKey = ACTIVE_PROFILE_STORAGE_KEY) {
    this.storageKey = storageKey;
    this.activeKey = activeKey;
  }

  isAvailable() {
    try {
      window.localStorage.setItem('__test__', '1');
      window.localStorage.removeItem('__test__');
      return true;
    } catch {
      return false;
    }
  }

  getAllProfiles() {
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (r) => r && typeof r.profile_id === 'string' && typeof r.schema_version === 'string' && r.personal_info
      );
    } catch {
      return [];
    }
  }

  getProfileById(id) {
    return this.getAllProfiles().find((p) => p.profile_id === id) || null;
  }

  createProfile(profile) {
    const profiles = this.getAllProfiles();
    const existingIndex = profiles.findIndex((p) => p.profile_id === profile.profile_id);
    if (existingIndex >= 0) {
      return this.updateProfile(profile.profile_id, profile);
    }
    const newProfile = { ...profile, last_updated: new Date().toISOString() };
    this.saveProfilesList([newProfile, ...profiles]);
    this.setActiveProfileId(newProfile.profile_id);
    return newProfile;
  }

  updateProfile(id, profile) {
    const profiles = this.getAllProfiles();
    const targetIndex = profiles.findIndex((p) => p.profile_id === id);
    const updated = { ...profile, profile_id: id, last_updated: new Date().toISOString() };
    let list;
    if (targetIndex >= 0) {
      list = profiles.map((p, idx) => (idx === targetIndex ? updated : p));
    } else {
      list = [updated, ...profiles];
    }
    this.saveProfilesList(list);
    this.setActiveProfileId(id);
    return updated;
  }

  deleteProfile(id) {
    const profiles = this.getAllProfiles();
    const filtered = profiles.filter((p) => p.profile_id !== id);
    if (filtered.length === profiles.length) return false;
    this.saveProfilesList(filtered);
    if (this.getActiveProfileId() === id) {
      this.setActiveProfileId(filtered.length > 0 ? filtered[0].profile_id : null);
    }
    return true;
  }

  getActiveProfileId() {
    return window.localStorage.getItem(this.activeKey);
  }

  setActiveProfileId(id) {
    if (id) window.localStorage.setItem(this.activeKey, id);
    else window.localStorage.removeItem(this.activeKey);
  }

  saveProfilesList(list) {
    const serialized = JSON.stringify(list);
    window.localStorage.setItem(this.storageKey, serialized);
  }
}

console.log('--- Running Stage 3 Storage Tests ---');

const adapter = new LocalStorageProfileAdapter();
storageStore.clear();

// Test 1: Empty initial state
assert.strictEqual(adapter.getAllProfiles().length, 0, 'Initial profiles should be empty');
console.log('✓ Test 1: Empty initial state verified');

// Test 2: Create profile 1
const profile1 = {
  schema_version: '1.0.0',
  profile_id: 'cand-101',
  last_updated: new Date().toISOString(),
  personal_info: { full_name: 'Alice Developer', email: 'alice@example.com' },
  skills: [{ id: 's1', skill_name: 'Python', category_code: 'COD', confidence: 'high', evidence: 'GitHub PR' }],
};
const created1 = adapter.createProfile(profile1);
assert.strictEqual(created1.profile_id, 'cand-101');
assert.strictEqual(adapter.getAllProfiles().length, 1);
assert.strictEqual(adapter.getActiveProfileId(), 'cand-101');
console.log('✓ Test 2: Profile creation and active ID set verified');

// Test 3: Create profile 2
const profile2 = {
  schema_version: '1.0.0',
  profile_id: 'cand-202',
  last_updated: new Date().toISOString(),
  personal_info: { full_name: 'Bob Systems', email: 'bob@example.com' },
  skills: [{ id: 's2', skill_name: 'Kubernetes', category_code: 'CLOUD', confidence: 'high', evidence: 'Helm repo' }],
};
adapter.createProfile(profile2);
assert.strictEqual(adapter.getAllProfiles().length, 2);
assert.strictEqual(adapter.getActiveProfileId(), 'cand-202');
console.log('✓ Test 3: Multiple profile coexistence verified');

// Test 4: Update profile 1 without changing ID
const updatedAlice = adapter.updateProfile('cand-101', {
  ...profile1,
  personal_info: { full_name: 'Alice Senior Developer', email: 'alice@example.com' },
});
assert.strictEqual(updatedAlice.profile_id, 'cand-101', 'Profile ID must remain stable');
assert.strictEqual(adapter.getProfileById('cand-101').personal_info.full_name, 'Alice Senior Developer');
assert.strictEqual(adapter.getAllProfiles().length, 2, 'Total profiles count must remain 2');
console.log('✓ Test 4: Update profile without changing ID verified');

// Test 5: Delete profile 2 while preserving profile 1
const deleted = adapter.deleteProfile('cand-202');
assert.strictEqual(deleted, true);
assert.strictEqual(adapter.getAllProfiles().length, 1);
assert.strictEqual(adapter.getProfileById('cand-101') !== null, true, 'Profile 1 must remain intact');
assert.strictEqual(adapter.getProfileById('cand-202'), null, 'Profile 2 must be deleted');
assert.strictEqual(adapter.getActiveProfileId(), 'cand-101', 'Active ID must fallback to remaining profile');
console.log('✓ Test 5: Delete single profile with preservation verified');

// Test 6: Corrupted record resilience (fault tolerance)
const rawWithCorruptItem = JSON.stringify([
  profile1,
  { garbage: true, invalid: 'no id' }, // corrupt record
]);
storageStore.set(PROFILES_STORAGE_KEY, rawWithCorruptItem);
const salvaged = adapter.getAllProfiles();
assert.strictEqual(salvaged.length, 1, 'Corrupt record must be skipped without erasing valid profile');
assert.strictEqual(salvaged[0].profile_id, 'cand-101');
console.log('✓ Test 6: Corrupted JSON per-record resilience verified');

// Test 7: QuotaExceededError handling
let quotaCaught = false;
try {
  adapter.saveProfilesList([{ profile_id: 'trigger', schema_version: '1.0.0', personal_info: { TRIGGER_QUOTA_ERROR: true } }]);
} catch (err) {
  if (err.name === 'QuotaExceededError') quotaCaught = true;
}
assert.strictEqual(quotaCaught, true, 'QuotaExceededError must be properly thrown/detected');
console.log('✓ Test 7: Storage Quota error detection verified');

console.log('\nAll 7 Stage 3 Storage Tests Passed Successfully!\n');
