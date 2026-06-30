import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

/**
 * Role context for the UI, derived from the authenticated session.
 *
 * <p>Originally a localStorage placeholder used before authentication existed
 * (PNMC-93); now that {@link AuthService} carries the real roles from the
 * session cookie, this reads from there. Consumers keep reading {@link isChief}.
 */
@Injectable({ providedIn: 'root' })
export class UserContext {
  private readonly auth = inject(AuthService);

  /**
   * Only the Chief of Guard may open/close shifts. Admins inherit the chief
   * capability, matching the backend role hierarchy.
   */
  readonly isChief = computed(() => this.auth.hasAnyRole('ROLE_CHIEF_OF_GUARD', 'ROLE_ADMIN'));
}
