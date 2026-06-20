import { Injectable, computed, signal } from '@angular/core';

export type UserRole = 'ROLE_CHIEF_OF_GUARD' | 'ROLE_THERAPIST';

/**
 * Minimal role context for the UI (PNMC-93).
 *
 * <p>Authentication/login is not implemented yet (a separate backlog effort), so
 * this is a temporary seam — the same role the JWT will eventually carry. It reads
 * an optional {@code pnmc_role} override from localStorage and otherwise defaults to
 * {@code ROLE_CHIEF_OF_GUARD} so the shift open/close control is visible in dev.
 * When auth lands, only this service changes — components keep reading {@link isChief}.
 */
@Injectable({ providedIn: 'root' })
export class UserContext {
  readonly role = signal<UserRole>(this.resolveInitialRole());

  /** Only the Chief of Guard may open/close shifts (AC4). */
  readonly isChief = computed(() => this.role() === 'ROLE_CHIEF_OF_GUARD');

  private resolveInitialRole(): UserRole {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('pnmc_role');
      if (stored === 'ROLE_THERAPIST' || stored === 'ROLE_CHIEF_OF_GUARD') {
        return stored;
      }
    }
    return 'ROLE_CHIEF_OF_GUARD';
  }
}
