import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreatePatientApiResponse,
  CreatePatientRequest,
  DischargePatientApiResponse,
  DischargePatientRequest,
  GetPatientApiResponse,
  GetPatientsApiResponse,
} from '../models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly http = inject(HttpClient);

  createPatient(payload: CreatePatientRequest): Observable<CreatePatientApiResponse> {
    return this.http.post<CreatePatientApiResponse>('/api/v1/patients', payload);
  }

  getPatient(patientId: string): Observable<GetPatientApiResponse> {
    return this.http.get<GetPatientApiResponse>(`/api/v1/patients/${patientId}`);
  }

  getPatients(): Observable<GetPatientsApiResponse> {
    return this.http.get<GetPatientsApiResponse>('/api/v1/patients');
  }

  /**
   * Closes the patient's ICU episode. The server sets the terminus, frees the
   * bed and releases any assigned ventilator in one transaction.
   */
  discharge(
    patientId: string,
    payload: DischargePatientRequest,
  ): Observable<DischargePatientApiResponse> {
    return this.http.post<DischargePatientApiResponse>(
      `/api/v1/patients/${patientId}/discharge`,
      payload,
    );
  }
}
