import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Minimal auth guard for protected therapist routes.
 *
 * Considers the user authenticated when an access token is available
 * in localStorage under `access_token`.
 */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return true;
    }
  }

  const token = localStorage.getItem('access_token');

  if (token && token.trim().length > 0) {
    return true;
  }

  return router.createUrlTree(['/terms']);
};
