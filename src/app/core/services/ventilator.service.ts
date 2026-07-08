import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Ventilator, VentilatorPageApiResponse } from '../models/asset.model';

/**
 * Reads the physical ventilator inventory (GET /api/v1/ventilators).
 *
 * <p>The list endpoint has no status filter, so AVAILABLE machines are selected
 * client-side — acceptable at the current dataset scale.
 */
@Injectable({ providedIn: 'root' })
export class VentilatorService {
  private readonly http = inject(HttpClient);

  /** AVAILABLE ventilators for assignment. */
  listAvailable(): Observable<Ventilator[]> {
    return this.http
      .get<VentilatorPageApiResponse>('/api/v1/ventilators?size=100')
      .pipe(map((r) => r.data.content.filter((v) => v.status === 'AVAILABLE')));
  }
}
