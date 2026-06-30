import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnalyticsSummaryApiResponse } from '../models/analytics.model';
import { CachedRequest } from '../util/cached-request';

/**
 * Reads the role-scoped analytics summary (GET /api/v1/analytics/summary).
 *
 * <p>The auth cookie rides along via the global credentials interceptor; the
 * backend returns only the sections the caller's role is allowed to see.
 * Responses are cached briefly so the dashboard strip and the analytics page
 * (and quick re-navigations) share a single request instead of refetching.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);

  private readonly summaryCache = new CachedRequest<AnalyticsSummaryApiResponse>(30_000, () =>
    this.http.get<AnalyticsSummaryApiResponse>('/api/v1/analytics/summary'),
  );

  getSummary(): Observable<AnalyticsSummaryApiResponse> {
    return this.summaryCache.get();
  }

  /** Forces the next {@link getSummary} to refetch (e.g. after data changes). */
  invalidate(): void {
    this.summaryCache.invalidate();
  }
}
