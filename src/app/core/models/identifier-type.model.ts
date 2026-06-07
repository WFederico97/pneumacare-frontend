import { ApiResponse } from './health.model';

export interface IdentifierType {
  id: number;
  name: string;
  description: string;
}

export type IdentifierTypeApiResponse = ApiResponse<IdentifierType[]>;
