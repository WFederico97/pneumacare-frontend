import { ApiResponse } from './health.model';
import {
  AirwayEventPayload,
  AirwayEventType,
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
