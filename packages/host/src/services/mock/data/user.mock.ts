/**
 * User mock data — static (no randomness needed, user identity is stable).
 * Must match the profile already seeded in userSlice initialState
 * so the "fetch current user" response is consistent with what's in the store.
 */
import type { UserProfile, UserPreferences } from '@/store/slices/userSlice';

export const MOCK_USER_PROFILE: UserProfile = {
  id:             'usr_001',
  name:           'John Doe',
  email:          'john@acme.com',
  role:           'admin',
  avatarInitials: 'JD',
};

export const MOCK_USER_PREFERENCES: UserPreferences = {
  theme:        'dark',
  notifications: true,
  compactMode:   false,
};
