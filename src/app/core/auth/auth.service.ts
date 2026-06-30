import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginApiResponse, LoginData, RegisterRequest } from './auth.model';

/** sessionStorage key holding the non-sensitive auth marker (never the token). */
const AUTH_MARKER_KEY = 'pnmc_auth';

/**
 * Cookie-based authentication state for the SPA (PNMC-113).
 *
 * <p>The JWT is never visible to JavaScript: it lives only in the backend's
 * HttpOnly auth cookie (PNMC-112). This service holds only the non-sensitive
 * profile (display name + roles) returned by {@code /auth/login} and
 * {@code /auth/register}, exposed as Signals. The browser attaches the cookie
 * automatically on every request (see the credentials interceptor), so there is
 * no Bearer header.
 *
 * <p>To let the guard redirect unauthenticated users — and keep the session
 * across a page refresh without an {@code /auth/me} round-trip — the profile
 * marker is mirrored into {@code sessionStorage}. This is intentionally not the
 * token: it only gates UI. The real security boundary is the HttpOnly cookie
 * validated server-side, and a stale marker is corrected by the
 * {@link authErrorInterceptor} on the next {@code 401}.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  /**
   * {@code null} = unknown (no marker yet), {@code true} = authenticated,
   * {@code false} = known logged out (after explicit logout or a {@code 401}).
   */
  private readonly authState = signal<boolean | null>(null);
  private readonly roles = signal<readonly string[]>([]);
  private readonly displayNameState = signal<string | null>(null);

  readonly isAuthenticated = computed(() => this.authState() === true);
  readonly currentUserRoles = computed(() => this.roles());
  readonly displayName = computed(() => this.displayNameState());

  /** True when the user holds at least one of the given role authorities. */
  hasAnyRole(...allowed: readonly string[]): boolean {
    const mine = new Set(this.roles());
    return allowed.some((role) => mine.has(role));
  }

  constructor() {
    this.restoreFromStorage();
  }

  /** Posts credentials; on success stores the profile Signals + marker. */
  login(username: string, password: string): Observable<LoginApiResponse> {
    return this.http
      .post<LoginApiResponse>('/api/v1/auth/login', { username, password })
      .pipe(tap((response) => this.applyProfile(response.data)));
  }

  /** Creates an account; the backend logs the user in and returns the profile. */
  register(request: RegisterRequest): Observable<LoginApiResponse> {
    return this.http
      .post<LoginApiResponse>('/api/v1/auth/register', request)
      .pipe(tap((response) => this.applyProfile(response.data)));
  }

  /** Clears server cookies, then resets in-memory + persisted state regardless of outcome. */
  logout(): Observable<unknown> {
    return this.http
      .post('/api/v1/auth/logout', {})
      .pipe(tap({ next: () => this.clearState(), error: () => this.clearState() }));
  }

  /** Resets to the known-logged-out state. Called on logout and on global 401. */
  clearState(): void {
    this.authState.set(false);
    this.roles.set([]);
    this.displayNameState.set(null);
    this.writeStorage(null);
  }

  private applyProfile(data: LoginData): void {
    const profile: LoginData = { displayName: data.displayName, roles: data.roles ?? [] };
    this.authState.set(true);
    this.roles.set(profile.roles);
    this.displayNameState.set(profile.displayName ?? null);
    this.writeStorage(profile);
  }

  private restoreFromStorage(): void {
    const raw = this.readStorage();
    if (!raw) {
      return;
    }
    try {
      const profile = JSON.parse(raw) as Partial<LoginData>;
      this.authState.set(true);
      this.roles.set(Array.isArray(profile.roles) ? profile.roles : []);
      this.displayNameState.set(profile.displayName ?? null);
    } catch {
      this.writeStorage(null);
    }
  }

  private readStorage(): string | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }
    return sessionStorage.getItem(AUTH_MARKER_KEY);
  }

  private writeStorage(profile: LoginData | null): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    if (profile) {
      sessionStorage.setItem(AUTH_MARKER_KEY, JSON.stringify(profile));
    } else {
      sessionStorage.removeItem(AUTH_MARKER_KEY);
    }
  }
}
