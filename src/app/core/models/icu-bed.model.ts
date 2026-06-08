import { ApiResponse } from './health.model';

export type IcuBedStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';

export interface IcuBed {
  bedId: string;
  bedNumber: string;
  status: IcuBedStatus;
  patientId: string | null;
}

export interface IcuBedApiItem {
  bedId: string;
  bedNumber: string;
  status: IcuBedStatus;
  patientId: string | null;
}

export type IcuBedsApiResponse = ApiResponse<IcuBedApiItem[]>;
export type CreateIcuBedApiResponse = ApiResponse<IcuBedApiItem>;
