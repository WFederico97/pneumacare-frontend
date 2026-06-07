import { ApiResponse } from './health.model';

export type IcuBedStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';

export interface IcuBed {
  bedId: string;
  bedNumber: string;
  status: IcuBedStatus;
}

export interface IcuBedApiItem {
  bedNumber: string;
  status: IcuBedStatus;
}

export type IcuBedsApiResponse = ApiResponse<IcuBedApiItem[]>;
