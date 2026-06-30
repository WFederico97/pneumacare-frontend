import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnalyticsSummaryApiResponse } from '../models/analytics.model';

/**
 * Reads the role-scoped analytics summary (GET /api/v1/analytics/summary).
 *
 * <p>The auth cookie rides along via the global credentials interceptor; the
 * backend returns only the sections the caller's role is allowed to see.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);

  getSummary(): Observable<AnalyticsSummaryApiResponse> {
    return this.http.get<AnalyticsSummaryApiResponse>('/api/v1/analytics/summary');
  }
}
