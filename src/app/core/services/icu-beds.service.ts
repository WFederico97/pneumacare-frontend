import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { IcuBed, IcuBedsApiResponse } from '../models/icu-bed.model';

@Injectable({ providedIn: 'root' })
export class IcuBedsService {
  private readonly http = inject(HttpClient);

  /**
   * Calls GET /api/v1/icu-beds and normalizes data for UI use.
   *
   * The backend currently returns bedNumber and status only. For interaction
   * events that require a stable identifier, the frontend derives bedId from
   * bedNumber in this MVP.
   */
  getBeds(): Observable<IcuBed[]> {
    return this.http.get<IcuBedsApiResponse>('/api/v1/icu-beds').pipe(
      map(response =>
        response.data.map(item => ({
          bedId: item.bedNumber,
          bedNumber: item.bedNumber,
          status: item.status,
        }))
      )
    );
  }
}
