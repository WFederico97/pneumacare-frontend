import { ApiResponse } from '../models/health.model';

/** Credentials posted to POST /api/v1/auth/login. */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Non-sensitive profile returned by the backend on successful login.
 * Mirrors the backend LoginResponse record — never carries the token, which
 * lives only in the HttpOnly auth cookie.
 */
export interface LoginData {
  displayName: string;
  roles: string[];
}

export type LoginApiResponse = ApiResponse<LoginData>;

/** Roles a user may self-assign at registration (mirrors the backend whitelist). */
export type SelfRegisterRole = 'ROLE_THERAPIST' | 'ROLE_CHIEF_OF_GUARD';


/** Human-readable Spanish labels for the backend role authorities. */
const ROLE_LABELS: Record<string, string> = {
  ROLE_ADMIN: 'Administrador',
  ROLE_CHIEF_OF_GUARD: 'Jefe de guardia',
  ROLE_THERAPIST: 'Terapista',
  ROLE_COMPLIANCE: 'Cumplimiento',
};

/** Maps a role authority (e.g. {@code ROLE_THERAPIST}) to its display label. */
export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role.replace(/^ROLE_/, '');
}

/**
 * Up-to-two-letter initials from a display name, for the avatar monogram.
 * Falls back to {@code '?'} when the name is empty.
 */
export function initialsFrom(displayName: string | null | undefined): string {
  const parts = (displayName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
