import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TimelineApiResponse } from '../models/timeline.model';

/**
 * Reads the unified patient clinical timeline (PNMC-96), served pre-merged and
 * ordered newest-first by GET /api/v1/patients/{id}/timeline (PNMC-133).
 */
@Injectable({ providedIn: 'root' })
export class TimelineService {
  private readonly http = inject(HttpClient);

  getTimeline(patientId: string): Observable<TimelineApiResponse> {
    return this.http.get<TimelineApiResponse>(`/api/v1/patients/${patientId}/timeline`);
  }
}
