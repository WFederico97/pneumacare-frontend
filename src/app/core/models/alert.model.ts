import { ApiResponse } from './health.model';

/** One active clinical alert: an admitted patient whose latest evaluation tripped a threshold. */
export interface ActiveAlert {
  patientId: string;
  bedNumber: string;
  icuName: string;
  evaluationTime: string;
  rsbi: number | null;
  rsbiInterpretation: string | null;
  pafi: number | null;
  pafiClassification: string | null;
  cstat: number | null;
  cstatInterpretation: string | null;
}

export type ActiveAlertsApiResponse = ApiResponse<ActiveAlert[]>;
