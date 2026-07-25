import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AnalyticsSummaryApiResponse,
  ExecutiveDashboardApiResponse,
  HierarchyAnalyticsApiResponse,
  HierarchyLevel,
} from '../models/analytics.model';
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

  /**
   * Reads the summary for an explicit date-range window (in days). Uncached — the
   * analytics view drives this from its filter controls and expects each window
   * change to hit the server. The cached {@link getSummary} still backs the
   * dashboard strip's default 14-day view.
   */
  getSummaryForWindow(windowDays: number): Observable<AnalyticsSummaryApiResponse> {
    const params = new HttpParams().set('windowDays', windowDays);
    return this.http.get<AnalyticsSummaryApiResponse>('/api/v1/analytics/summary', { params });
  }

  /** Forces the next {@link getSummary} to refetch (e.g. after data changes). */
  invalidate(): void {
    this.summaryCache.invalidate();
  }

  private readonly dashboardCache = new CachedRequest<ExecutiveDashboardApiResponse>(30_000, () =>
    this.http.get<ExecutiveDashboardApiResponse>('/api/v1/analytics/dashboard'),
  );

  /** Reads the executive dashboard aggregation (GET /api/v1/analytics/dashboard). */
  getExecutiveDashboard(): Observable<ExecutiveDashboardApiResponse> {
    return this.dashboardCache.get();
  }

  /**
   * Multi-level rollup by province / institution / patient
   * (GET /api/v1/analytics/hierarchy). Org levels are director/admin only,
   * enforced server-side.
   */
  getHierarchy(level: HierarchyLevel, windowDays = 14): Observable<HierarchyAnalyticsApiResponse> {
    const params = new HttpParams().set('level', level).set('windowDays', windowDays);
    return this.http.get<HierarchyAnalyticsApiResponse>('/api/v1/analytics/hierarchy', { params });
  }
}
