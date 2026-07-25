import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  SystemSettingApiResponse,
  SystemSettingsApiResponse,
} from '../models/system-setting.model';

/**
 * Reads and updates the centralized system configuration
 * (GET/PUT /api/v1/admin/settings). Admin-only; the backend enforces the role.
 */
@Injectable({ providedIn: 'root' })
export class SystemSettingsService {
  private readonly http = inject(HttpClient);

  list(): Observable<SystemSettingsApiResponse> {
    return this.http.get<SystemSettingsApiResponse>('/api/v1/admin/settings');
  }

  update(settingKey: string, value: string): Observable<SystemSettingApiResponse> {
    return this.http.put<SystemSettingApiResponse>(
      `/api/v1/admin/settings/${encodeURIComponent(settingKey)}`,
      { value },
    );
  }
}
