import { ApiResponse } from './health.model';
import { EvaluationResult } from './evaluation.model';

/** Discriminator for a timeline entry's source (mirrors backend TimelineEventType). */
export type TimelineEventType = 'EVALUATION' | 'AIRWAY' | 'SBT';

/** Airway event kinds (mirrors backend AirwayEventType). */
export type AirwayEventType = 'INTUBATION' | 'EXTUBATION' | 'TRACHEOSTOMY';

/** Patient airway/respiratory state (mirrors backend RespiratoryStatus). */
export type RespiratoryStatus = 'SPONTANEOUS' | 'INTUBATED' | 'TRACHEOSTOMY';

/** SBT outcome (mirrors backend ToleranceResult). */
export type ToleranceResult = 'SUCCESS' | 'FAILURE';

/** Payload for an AIRWAY entry — mirrors backend AirwayEventResponse. */
export interface AirwayEventPayload {
  id: string;
  patientId: string;
  shiftId: string;
  eventType: AirwayEventType;
  resultingStatus: RespiratoryStatus;
  eventTimestamp: string;
  createdBy: string;
  createdAt: string;
}

/** Payload for an SBT entry — mirrors backend SbtResponse. */
export interface SbtPayload {
  id: string;
  patientId: string;
  shiftId: string;
  durationMinutes: number;
  toleranceResult: ToleranceResult;
  performedBy: string;
  recordedAt: string;
}

/** The evaluation payload is the same shape returned by POST /evaluations. */
export type EvaluationPayload = EvaluationResult;

export type TimelinePayload = EvaluationPayload | AirwayEventPayload | SbtPayload;

/**
 * One entry in the unified patient timeline served by
 * GET /api/v1/patients/{id}/timeline (PNMC-133). The concrete {@link payload}
 * shape is selected by {@link type}.
 */
export interface TimelineEntry {
  type: TimelineEventType;
  occurredAt: string;
  payload: TimelinePayload;
}

export type TimelineApiResponse = ApiResponse<TimelineEntry[]>;
