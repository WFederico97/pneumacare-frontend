import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Protects routes behind the cookie-based session (PNMC-113, AC2).
 *
 * <p>The JWT cookie is HttpOnly, so the guard reads the in-memory auth Signal
 * (rehydrated from the non-sensitive session marker in {@link AuthService}).
 * When the user is not authenticated it redirects to {@code /login}, preserving
 * the originally requested URL in {@code returnUrl}. A session that has since
 * expired server-side is caught on the next call by {@link authErrorInterceptor},
 * which clears state and redirects.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
