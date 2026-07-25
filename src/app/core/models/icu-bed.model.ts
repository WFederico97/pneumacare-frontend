import { ApiResponse } from './health.model';

export type IcuBedStatus = 'AVAILABLE' | 'OCCUPIED';

export interface IcuBed {
  bedId: string;
  bedNumber: string;
  status: IcuBedStatus;
  patientId: string | null;
  /** True when the occupying patient's latest evaluation tripped a clinical threshold. */
  criticalAlert: boolean;
}

export interface IcuBedApiItem {
  bedId: string;
  bedNumber: string;
  status: IcuBedStatus;
  patientId: string | null;
  criticalAlert?: boolean;
}

export type IcuBedsApiResponse = ApiResponse<IcuBedApiItem[]>;
export type CreateIcuBedApiResponse = ApiResponse<IcuBedApiItem>;
