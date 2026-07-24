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

/** Spanish label for the backend ClinicalStatus enum; unknown values pass through. */
export function clinicalStatusLabel(status: string): string {
  if (status === 'ADMITTED') return 'Internado';
  if (status === 'DISCHARGED') return 'Alta';
  if (status === 'TRANSFERRED') return 'Trasladado';
  return status;
}

export type CreatePatientApiResponse = ApiResponse<PatientApiItem>;
export type GetPatientApiResponse = ApiResponse<PatientApiItem>;
export type GetPatientsApiResponse = ApiResponse<PatientApiItem[]>;

/** Clinical disposition of a closed episode (mirrors backend Disposition). */
export type Disposition =
  | 'HOME'
  | 'WARD'
  | 'TRANSFER_EXTERNAL'
  | 'DECEASED'
  | 'WITHDRAWAL_OF_CARE';

/** Spanish label for each disposition, in the order clinicians pick them. */
export const DISPOSITION_OPTIONS: ReadonlyArray<{ value: Disposition; label: string; hint: string }> = [
  { value: 'HOME', label: 'Alta a domicilio', hint: 'El paciente egresa a su casa.' },
  { value: 'WARD', label: 'Pase a sala', hint: 'Continúa internado fuera de la UCI.' },
  { value: 'TRANSFER_EXTERNAL', label: 'Derivación externa', hint: 'Traslado a otra institución.' },
  { value: 'DECEASED', label: 'Fallecimiento', hint: 'El paciente falleció en la UCI.' },
  {
    value: 'WITHDRAWAL_OF_CARE',
    label: 'Adecuación del esfuerzo terapéutico',
    hint: 'Fallecimiento tras limitación del soporte vital.',
  },
];

/** Request body for POST /api/v1/patients/{id}/discharge. */
export interface DischargePatientRequest {
  disposition: Disposition;
  /** ISO-8601; omitted means "now" (the server defaults it). */
  dischargeDate?: string;
}

export type DischargePatientApiResponse = ApiResponse<void>;
