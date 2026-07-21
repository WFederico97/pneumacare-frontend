import { ApiResponse } from './health.model';

export type ShiftStatus = 'OPEN' | 'CLOSED';

/**
 * Mirrors the backend ShiftResponse DTO (camelCase, as serialized by Jackson).
 */
export interface Shift {
  id: string;
  icuId: string;
  startedBy: string;
  status: ShiftStatus;
  /** ISO-8601 UTC timestamp when the shift was opened. */
  startedAt: string;
  /** ISO-8601 UTC timestamp when closed; null while OPEN. */
  endTime: string | null;
}

/**
 * GET /api/v1/shifts/active wraps a Shift OR null in the standard envelope:
 * `{ status, message, data: Shift | null, traceId }` (200 with `data: null`
 * when no shift is open — see PNMC-132).
 */
export type ActiveShiftApiResponse = ApiResponse<Shift | null>;

/** POST /api/v1/shifts and PATCH /api/v1/shifts/{id}/close both return a Shift. */
export type ShiftApiResponse = ApiResponse<Shift>;

/**
 * Mirrors the backend HandoverResponse DTO — an immutable shift handover note.
 */
export interface Handover {
  id: string;
  shiftId: string;
  authorId: string;
  notesContent: string;
  /** ISO-8601 UTC timestamp when the note was created. */
  createdAt: string;
}

/** POST /api/v1/shifts/{id}/handovers returns the created Handover. */
export type HandoverApiResponse = ApiResponse<Handover>;
