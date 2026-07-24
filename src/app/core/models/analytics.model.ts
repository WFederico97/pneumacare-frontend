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

/**
 * Episode mortality over the 30-day window. `withdrawalOfCare` is reported
 * apart from `deceased`; `icuMortalityPercent` counts both. The weaning-failure
 * cohort is closed episodes with a failed SBT or a 48 h reintubation.
 */
export interface MortalityStats {
  closedEpisodes: number;
  deceased: number;
  withdrawalOfCare: number;
  icuMortalityPercent: number;
  weaningFailureCohort: number;
  weaningFailureDeceased: number;
  weaningFailureMortalityPercent: number;
}

/** Readmissions of the same person after a windowed discharge. */
export interface ReadmissionStats {
  readmissions48h: number;
  readmissions7d: number;
  rate48hPercent: number;
  rate7dPercent: number;
}

export interface ExecutiveDashboard {
  occupancyRatePercent: number;
  alertFrequencyLast7Days: number;
  equipmentInMaintenanceCount: number;
  assetUtilization: AssetUtilization;
  /** True ALOS: mean stay of episodes CLOSED in the window (not the census). */
  averageStayDays: number;
  /** Mean current stay of patients still admitted. */
  currentCensusMeanStayDays: number;
  /** Episodes closed in the window / total beds. */
  bedTurnover: number;
  mortality: MortalityStats;
  readmissions: ReadmissionStats;
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
