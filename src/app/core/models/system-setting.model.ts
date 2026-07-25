import { ApiResponse } from './health.model';

export type SettingCategory = 'SYSTEM' | 'CLINICAL_RULES' | 'HARDWARE' | 'NOTIFICATIONS';
export type SettingValueType = 'text' | 'number' | 'boolean';

export interface SystemSetting {
  settingKey: string;
  value: string;
  category: SettingCategory;
  label: string;
  description: string | null;
  valueType: SettingValueType;
  editable: boolean;
}

export type SystemSettingsApiResponse = ApiResponse<SystemSetting[]>;
export type SystemSettingApiResponse = ApiResponse<SystemSetting>;
