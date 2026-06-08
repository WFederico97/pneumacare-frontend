import { ApiResponse } from './health.model';

export interface PatientIdentifierRequest {
  identifierTypeId: number;
  value: string;
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  birthDate: string;
  identifier: PatientIdentifierRequest;
  icuId: string;
  bedId: string;
}

export interface PatientIdentifierApiItem {
  typeName: string;
  value: string;
}

export interface PatientApiItem {
  patientId: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  identifier: PatientIdentifierApiItem;
  icuId: string;
  bedId: string;
  admissionDate: string;
  clinicalStatus: string;
}

export type CreatePatientApiResponse = ApiResponse<PatientApiItem>;
