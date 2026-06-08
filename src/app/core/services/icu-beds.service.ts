import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CreateIcuBedApiResponse, IcuBed, IcuBedsApiResponse } from '../models/icu-bed.model';

@Injectable({ providedIn: 'root' })
export class IcuBedsService {
  private readonly http = inject(HttpClient);

  /**
   * Calls GET /api/v1/icu-beds and normalizes data for UI use.
   */
  getBeds(): Observable<IcuBed[]> {
    return this.http.get<IcuBedsApiResponse>('/api/v1/icu-beds').pipe(
      map(response =>
        response.data.map(item => ({
          bedId: item.bedId,
          bedNumber: item.bedNumber,
          status: item.status,
          patientId: item.patientId,
        }))
      )
    );
  }

  createBed(bedNumber: string): Observable<IcuBed> {
    return this.http
      .post<CreateIcuBedApiResponse>('/api/v1/icu-beds', { bedNumber })
      .pipe(
        map(response => ({
          bedId: response.data.bedId,
          bedNumber: response.data.bedNumber,
          status: response.data.status,
          patientId: response.data.patientId,
        }))
      );
  }
}
