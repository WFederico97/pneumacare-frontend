import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HealthApiResponse } from '../models/health.model';

@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly http = inject(HttpClient);

  /**
   * Calls GET /api/v1/health.
   * In development the proxy (proxy.conf.json) forwards this to
   * http://localhost:8080/api/v1/health automatically.
   */
  getHealth(): Observable<HealthApiResponse> {
    return this.http.get<HealthApiResponse>('/api/v1/health');
  }
}
