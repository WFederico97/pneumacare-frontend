import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  withXsrfConfiguration,
} from '@angular/common/http';

// The whole UI is Argentine Spanish; pipes (date, number) must match.
registerLocaleData(localeEsAr);

import { routes } from './app.routes';
import {
  authErrorInterceptor,
  credentialsInterceptor,
} from './core/auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-AR' },
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
    provideHttpClient(
      // credentials first so the auth cookie rides along (AC3); Angular's XSRF
      // support adds X-XSRF-TOKEN from the XSRF-TOKEN cookie on mutating
      // requests; the error interceptor handles 401 globally (AC4).
      withInterceptors([credentialsInterceptor, authErrorInterceptor]),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      }),
    ),
  ],
};
