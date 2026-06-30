import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/** Same-origin app API prefix; only these requests carry the auth cookie. */
const API_PREFIX = '/api/';

/**
 * Sends the auth cookie on the application's own API requests (PNMC-113, AC3).
 *
 * <p>Angular has no global {@code withCredentials} switch, so we set it here for
 * relative {@code /api/} URLs only — never for third-party origins, keeping the
 * cookie scoped to our backend. Angular's built-in XSRF support
 * ({@code withXsrfConfiguration} in app.config) then adds {@code X-XSRF-TOKEN}
 * from the {@code XSRF-TOKEN} cookie on mutating requests.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_PREFIX)) {
    return next(req);
  }
  return next(req.clone({ withCredentials: true }));
};

/** Endpoints whose own 401 must not trigger the global redirect. */
const AUTH_ENDPOINTS = ['/api/v1/auth/login', '/api/v1/auth/logout'];

/**
 * Handles {@code 401} globally (PNMC-113, AC4): clears auth Signals and
 * redirects to {@code /login}, preserving where the user was. The login/logout
 * calls are excluded so a bad-credentials {@code 401} surfaces as a form error
 * instead of bouncing the page.
 */
export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      const isAuthEndpoint = AUTH_ENDPOINTS.some((url) => req.url.startsWith(url));
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthEndpoint) {
        auth.clearState();
        const returnUrl = router.url;
        void router.navigate(['/login'], {
          queryParams: returnUrl && returnUrl !== '/login' ? { returnUrl } : undefined,
        });
      }
      return throwError(() => error);
    }),
  );
};
