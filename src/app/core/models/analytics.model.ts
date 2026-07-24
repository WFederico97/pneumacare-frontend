import { ApiResponse } from './health.model';

export interface OccupancyStats {
  total: number;
  occupied: number;
  available: number;
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

export interface LungProtectionStats {
  /** Patients whose latest evaluation carries ΔP > 15 cmH₂O (mortality-associated). */
  highDrivingPressurePatients: number;
}

export interface VentilationStats {
  currentlyIntubated: number;
  intubationDaysInWindow: number;
}

/** WIND-aligned weaning difficulty (approximated from SBT attempt counts). */
export interface WeaningClassificationStats {
  noAttempt: number;
  simple: number;
  difficult: number;
  prolonged: number;
}

export interface ExtubationStats {
  extubations: number;
  reintubations48h: number;
  successRatePercent: number;
}

export interface ClinicalAnalytics {
  occupancy: OccupancyStats;
  weaning: WeaningStats;
  evaluationTrend: TrendPoint[];
  lungProtection: LungProtectionStats;
  ventilation: VentilationStats;
  weaningClassification: WeaningClassificationStats;
  extubation: ExtubationStats;
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

export interface AssetUtilization {
  inUse: number;
  available: number;
  maintenance: number;
  utilizationPercent: number;
}

export interface ExecutiveDashboard {
  occupancyRatePercent: number;
  alertFrequencyLast7Days: number;
  equipmentInMaintenanceCount: number;
  assetUtilization: AssetUtilization;
  averageStayDays: number;
}

export type ExecutiveDashboardApiResponse = ApiResponse<ExecutiveDashboard>;

export type HierarchyLevel = 'PROVINCE' | 'INSTITUTION' | 'PATIENT';

export interface HierarchyRow {
  entityId: string;
  name: string;
  subtitle: string | null;
  totalBeds: number;
  occupied: number;
  available: number;
  occupancyRatePercent: number;
  activeAlerts: number;
  evaluationsInWindow: number;
}

export interface HierarchyAnalytics {
  level: HierarchyLevel;
  windowDays: number;
  rows: HierarchyRow[];
}

export type HierarchyAnalyticsApiResponse = ApiResponse<HierarchyAnalytics>;
