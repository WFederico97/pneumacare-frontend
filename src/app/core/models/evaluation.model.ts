import { ApiResponse } from './health.model';

export type RsbiInterpretation = 'FAVORABLE' | 'BORDERLINE' | 'UNFAVORABLE';
export type PafiClassification = 'NORMAL' | 'AT_RISK' | 'MILD_ARDS' | 'MODERATE_ARDS' | 'SEVERE_ARDS';
export type CstatInterpretation = 'HIGH' | 'NORMAL' | 'LOW';
export type DrivingPressureBand = 'PROTECTIVE' | 'HIGH';
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
  drivingPressure: number;
  drivingPressureBand: DrivingPressureBand;
  alertTriggered: boolean;
  createdBy: string;
}

export type EvaluationApiResponse = ApiResponse<EvaluationResult>;

/**
 * Consultant guidance for a single evaluation — mirrors the backend
 * InsightResponse record served by GET /api/v1/evaluations/{id}/insights
 * (PNMC-106). Citations stay embedded inline in {@link insightText}.
 */
export interface InsightResponse {
  evaluationId: string;
  insightText: string;
  /** Runtime flag: true when served from the cache, false when just composed. */
  cached: boolean;
}

export type InsightApiResponse = ApiResponse<InsightResponse>;
