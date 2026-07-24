import { ApiResponse } from './health.model';

export type VentilatorStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';

/** Inventory catalogue brands accepted by the backend (inventory context enum). */
export type VentilatorBrand = 'TECME' | 'NEUMOVENT';

export interface CreateVentilatorRequest {
  serialNumber: string;
  brand: VentilatorBrand;
  modelName: string;
  icuId: string;
}

export interface Ventilator {
  id: string;
  serialNumber: string;
  brand: string;
  modelName: string;
  icuId: string;
  status: VentilatorStatus;
  createdAt: string;
  updatedAt: string;
}

/** Only `content` is consumed; the backend PageResponse carries more fields. */
export interface PageResponse<T> {
  content: T[];
}

export interface ActiveAssignment {
  ventilatorId: string;
  serialNumber: string;
  assignedAt: string;
}

export interface AssetAssignment {
  id: string;
  ventilatorId: string;
  patientId: string;
  status: VentilatorStatus;
  assignedAt: string;
  releasedAt: string | null;
}

export interface AssignAssetRequest {
  ventilatorId: string;
  patientId: string;
}

export type VentilatorPageApiResponse = ApiResponse<PageResponse<Ventilator>>;
export type VentilatorApiResponse = ApiResponse<Ventilator>;
export type ActiveAssignmentApiResponse = ApiResponse<ActiveAssignment | null>;
export type AssetAssignmentApiResponse = ApiResponse<AssetAssignment>;
