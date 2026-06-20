import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreatePatientApiResponse, CreatePatientRequest, GetPatientApiResponse } from '../models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly http = inject(HttpClient);

  createPatient(payload: CreatePatientRequest): Observable<CreatePatientApiResponse> {
    return this.http.post<CreatePatientApiResponse>('/api/v1/patients', payload);
  }

  getPatient(patientId: string): Observable<GetPatientApiResponse> {
    return this.http.get<GetPatientApiResponse>(`/api/v1/patients/${patientId}`);
  }
}
