import { ApiResponse } from './health.model';
import {
  AirwayEventPayload,
  AirwayEventType,
  RespiratoryStatus,
  SbtPayload,
  ToleranceResult,
} from './timeline.model';

/** Request body for POST /api/v1/procedures/airway (mirrors CreateAirwayEventRequest). */
export interface CreateAirwayEventRequest {
  patientId: string;
  eventType: AirwayEventType;
  /** Clinically-reported event timestamp, ISO-8601 UTC. */
  eventTimestamp: string;
}

/** Request body for POST /api/v1/procedures/sbt (mirrors CreateSbtRequest). */
export interface CreateSbtRequest {
  patientId: string;
  durationMinutes: number;
  toleranceResult: ToleranceResult;
}

export type AirwayEventApiResponse = ApiResponse<AirwayEventPayload>;
export type SbtApiResponse = ApiResponse<SbtPayload>;

/**
 * One legal airway transition as published by the server
 * (GET /api/v1/procedures/airway/transitions). The client renders the state
 * machine from this rather than declaring its own copy — the drift that once
 * left DECANNULATION unreachable in the UI.
 */
export interface AirwayTransition {
  eventType: AirwayEventType;
  requiredCurrentStatus: RespiratoryStatus;
  resultingStatus: RespiratoryStatus;
  label: string;
}

export type AirwayTransitionsApiResponse = ApiResponse<AirwayTransition[]>;
