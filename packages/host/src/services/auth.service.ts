/**
 * Auth Service — login / session HTTP calls.
 *
 * Intentionally thin: no Redux, no side effects.
 * The calling code (loginAsync thunk) decides what to do with the response.
 *
 * Why separate from user.service:
 *   auth.service  = "who are you?" — identity verification, tokens
 *   user.service  = "tell me about you" — profile data, preferences
 *   They map to different API domains (/auth vs /users) and will evolve
 *   independently (OAuth2 changes auth but not profile).
 */
import { apiClient } from './api/client';
import { ENDPOINTS } from './api/endpoints';
import type { ApiResponse } from '@/types';
import type { UserProfile } from '@/store/slices/userSlice';

// ── Types ──────────────────────────────────────────────────────────────────

export interface LoginCredentials {
  email:    string;
  password: string;
}

export interface LoginResponse {
  /** Opaque session token — in production this would be a signed JWT. */
  token: string;
  /** Full user profile returned alongside the token on login. */
  user:  UserProfile;
}

// ── Service ────────────────────────────────────────────────────────────────

export const authService = {
  /**
   * POST /auth/login
   *
   * Sends credentials, receives a token + user profile.
   * The caller is responsible for persisting the token and updating Redux.
   *
   * In production this would also set an httpOnly refresh-token cookie
   * (handled by the server's Set-Cookie header, invisible to JS).
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const res = await apiClient.post<ApiResponse<LoginResponse>>(
      ENDPOINTS.auth.login,
      credentials,
    );
    return res.data.data;
  },
};
