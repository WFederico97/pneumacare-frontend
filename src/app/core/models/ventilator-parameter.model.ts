import { ApiResponse } from './health.model';
import { VentilatorBrand } from './evaluation.model';

/** One brand-specific extended parameter the evaluation form renders dynamically. */
export interface VentilatorParameterField {
  key: string;
  label: string;
  unit: string;
  valueType: string;
  min: number;
  max: number;
  step: number;
  required: boolean;
}

export interface VentilatorParameterSchema {
  brand: VentilatorBrand;
  extendedFields: VentilatorParameterField[];
}

export type VentilatorParameterSchemaApiResponse = ApiResponse<VentilatorParameterSchema[]>;
