import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  CreateVentilatorRequest,
  Ventilator,
  VentilatorApiResponse,
  VentilatorPageApiResponse,
  VentilatorStatus,
} from '../models/asset.model';
import {
  VentilatorParameterSchema,
  VentilatorParameterSchemaApiResponse,
} from '../models/ventilator-parameter.model';

/**
 * Physical ventilator inventory CRUD (/api/v1/ventilators).
 *
 * <p>The list endpoint has no status filter, so AVAILABLE machines are selected
 * client-side — acceptable at the current dataset scale.
 */
@Injectable({ providedIn: 'root' })
export class VentilatorService {
  private readonly http = inject(HttpClient);

  /** Full inventory, serial-ordered by the backend. */
  list(): Observable<Ventilator[]> {
    return this.http
      .get<VentilatorPageApiResponse>('/api/v1/ventilators?size=100')
      .pipe(map((r) => r.data.content));
  }

  /** AVAILABLE ventilators for assignment. */
  listAvailable(): Observable<Ventilator[]> {
    return this.list().pipe(map((vents) => vents.filter((v) => v.status === 'AVAILABLE')));
  }

  /** Registers a ventilator; duplicate serials come back as 409. */
  create(request: CreateVentilatorRequest): Observable<Ventilator> {
    return this.http
      .post<VentilatorApiResponse>('/api/v1/ventilators', request)
      .pipe(map((r) => r.data));
  }

  /** Status-only partial update (registration data is immutable by design). */
  updateStatus(id: string, status: VentilatorStatus): Observable<Ventilator> {
    return this.http
      .patch<VentilatorApiResponse>(`/api/v1/ventilators/${id}`, { status })
      .pipe(map((r) => r.data));
  }

  /** Hard delete; 409 when the ventilator has clinical history. */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/ventilators/${id}`);
  }

  /**
   * Config-driven parameter schema per brand (GET /api/v1/ventilator-parameters).
   * Drives the dynamic extended-parameter section of the evaluation form.
   */
  getParameterSchema(): Observable<VentilatorParameterSchema[]> {
    return this.http
      .get<VentilatorParameterSchemaApiResponse>('/api/v1/ventilator-parameters')
      .pipe(map((r) => r.data));
  }
}
