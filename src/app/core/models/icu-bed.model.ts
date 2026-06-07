import { ApiResponse } from './health.model';

export type IcuBedStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';

export interface IcuBed {
  bedId: string;
  bedNumber: string;
  status: IcuBedStatus;
}

export interface IcuBedApiItem {
  bedId: string;
  bedNumber: string;
  status: IcuBedStatus;
}

export type IcuBedsApiResponse = ApiResponse<IcuBedApiItem[]>;
export type CreateIcuBedApiResponse = ApiResponse<IcuBedApiItem>;
