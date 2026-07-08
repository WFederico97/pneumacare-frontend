import { ApiResponse } from './health.model';

export interface OccupancyStats {
  total: number;
  occupied: number;
  available: number;
  maintenance: number;
  occupancyRate: number;
}

export interface WeaningStats {
  windowDays: number;
  sbtSuccess: number;
  sbtFailure: number;
  rsbiFavorable: number;
  rsbiBorderline: number;
  rsbiUnfavorable: number;
}

export interface TrendPoint {
  day: string;
  count: number;
}

export interface ClinicalAnalytics {
  occupancy: OccupancyStats;
  weaning: WeaningStats;
  evaluationTrend: TrendPoint[];
}

export interface WardAnalytics {
  activeShiftOpen: boolean;
  shiftsInWindow: number;
  admissionsInWindow: number;
}

export interface IamAnalytics {
  totalUsers: number;
  enabledUsers: number;
  disabledUsers: number;
  byRole: Record<string, number>;
}

export interface AnalyticsSummary {
  clinical?: ClinicalAnalytics;
  ward?: WardAnalytics;
  iam?: IamAnalytics;
}

export type AnalyticsSummaryApiResponse = ApiResponse<AnalyticsSummary>;

export interface ExecutiveDashboard {
  occupancyRatePercent: number;
  alertFrequencyLast7Days: number;
  equipmentInMaintenanceCount: number;
}

export type ExecutiveDashboardApiResponse = ApiResponse<ExecutiveDashboard>;
