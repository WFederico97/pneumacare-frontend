/**
 * Mirrors the backend ApiResponseBase<T> envelope.
 */
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  traceId: string | null;
}

/**
 * Mirrors the backend HealthStatusResponse record.
 */
export interface HealthStatusData {
  /** Always "UP" when the backend is reachable. */
  status: string;
  /** ISO-8601 timestamp generated on the server. */
  timestamp: string;
}

export type HealthApiResponse = ApiResponse<HealthStatusData>;
