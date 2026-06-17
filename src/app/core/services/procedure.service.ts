import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AirwayEventApiResponse,
  CreateAirwayEventRequest,
  CreateSbtRequest,
  SbtApiResponse,
} from '../models/procedure.model';

/**
 * Records clinical procedures (PNMC-97): airway events (PNMC-94) and SBTs
 * (PNMC-95). The backend derives the OPEN shift and the acting user server-side,
 * so those are not part of the request bodies.
 */
@Injectable({ providedIn: 'root' })
export class ProcedureService {
  private readonly http = inject(HttpClient);

  createAirwayEvent(payload: CreateAirwayEventRequest): Observable<AirwayEventApiResponse> {
    return this.http.post<AirwayEventApiResponse>('/api/v1/procedures/airway', payload);
  }

  createSbt(payload: CreateSbtRequest): Observable<SbtApiResponse> {
    return this.http.post<SbtApiResponse>('/api/v1/procedures/sbt', payload);
  }
}
