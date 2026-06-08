import { ApiResponse } from './health.model';

export type RsbiInterpretation = 'FAVORABLE' | 'BORDERLINE' | 'UNFAVORABLE';
export type PafiClassification = 'NORMAL' | 'AT_RISK' | 'MILD_ARDS' | 'MODERATE_ARDS' | 'SEVERE_ARDS';
export type CstatInterpretation = 'HIGH' | 'NORMAL' | 'LOW';
export type VentilatorBrand = 'TECME' | 'NEUMOVENT';

export interface CreateEvaluationRequest {
  patientId: string;
  shiftId: string;
  physicalVentilatorId: string;
  brand: VentilatorBrand;
  f: number;
  vt: number;
  pao2: number;
  fio2: number;
  pplat: number;
  peep: number;
  extendedParameters?: Record<string, unknown>;
}

export interface EvaluationResult {
  id: string;
  patientId: string;
  shiftId: string;
  physicalVentilatorId: string;
  evaluationTime: string;
  f: number;
  vt: number;
  pao2: number;
  fio2: number;
  pplat: number;
  peep: number;
  rsbiSnapshot: number;
  rsbiInterpretation: RsbiInterpretation;
  pafiSnapshot: number;
  pafiClassification: PafiClassification;
  cstatSnapshot: number;
  cstatInterpretation: CstatInterpretation;
  alertTriggered: boolean;
  createdBy: string;
}

export type EvaluationApiResponse = ApiResponse<EvaluationResult>;
