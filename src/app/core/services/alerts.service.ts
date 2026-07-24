import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ActiveAlert, ActiveAlertsApiResponse } from '../models/alert.model';

/** Reads the active clinical alerts (GET /api/v1/alerts). */
@Injectable({ providedIn: 'root' })
export class AlertsService {
  private readonly http = inject(HttpClient);

  list(): Observable<ActiveAlert[]> {
    return this.http
      .get<ActiveAlertsApiResponse>('/api/v1/alerts')
      .pipe(map((r) => r.data));
  }
}
