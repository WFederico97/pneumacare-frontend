import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Restricts a route to users holding one of {@code allowedRoles}.
 *
 * <p>Pair it with {@link authGuard} (which handles the unauthenticated case);
 * this guard assumes a session exists and only checks authorization. An
 * authenticated user without a matching role is sent back to the dashboard
 * rather than the login screen.
 */
export function roleGuard(...allowedRoles: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.hasAnyRole(...allowedRoles)) {
      return true;
    }
    return router.createUrlTree(['/']);
  };
}
