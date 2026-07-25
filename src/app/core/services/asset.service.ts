import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ActiveAssignmentApiResponse,
  AssetAssignmentApiResponse,
  AssignAssetRequest,
} from '../models/asset.model';

/** Links physical ventilators to patients (PNMC-103/104). */
@Injectable({ providedIn: 'root' })
export class AssetService {
  private readonly http = inject(HttpClient);

  assign(request: AssignAssetRequest): Observable<AssetAssignmentApiResponse> {
    return this.http.post<AssetAssignmentApiResponse>('/api/v1/assets/assign', request);
  }

  /** The patient's current assignment, or `data: null` when none. */
  getActive(patientId: string): Observable<ActiveAssignmentApiResponse> {
    return this.http.get<ActiveAssignmentApiResponse>(
      `/api/v1/assets/active?patientId=${encodeURIComponent(patientId)}`,
    );
  }
}
