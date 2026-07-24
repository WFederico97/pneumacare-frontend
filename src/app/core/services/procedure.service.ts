import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import {
  AirwayEventApiResponse,
  AirwayTransitionsApiResponse,
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

  /**
   * The airway state machine as published by the server. Cached for the app's
   * lifetime: the transition table only changes when the backend is redeployed,
   * and every modal open would otherwise refetch it.
   */
  private airwayTransitions$?: Observable<AirwayTransitionsApiResponse>;

  getAirwayTransitions(): Observable<AirwayTransitionsApiResponse> {
    this.airwayTransitions$ ??= this.http
      .get<AirwayTransitionsApiResponse>('/api/v1/procedures/airway/transitions')
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    return this.airwayTransitions$;
  }
}
