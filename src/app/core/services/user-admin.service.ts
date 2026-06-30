import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserApiResponse,
  UserListApiResponse,
} from '../models/user.model';

/**
 * Administrative user CRUD against {@code /api/v1/users}.
 *
 * <p>The auth cookie and {@code X-XSRF-TOKEN} header are attached globally by
 * the HTTP interceptors; the backend enforces chief/admin authorization.
 */
@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/users';

  list(): Observable<UserListApiResponse> {
    return this.http.get<UserListApiResponse>(this.baseUrl);
  }

  create(payload: CreateUserRequest): Observable<UserApiResponse> {
    return this.http.post<UserApiResponse>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateUserRequest): Observable<UserApiResponse> {
    return this.http.put<UserApiResponse>(`${this.baseUrl}/${id}`, payload);
  }

  /** Soft delete — the backend disables the account. */
  disable(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
