import { ApiResponse } from './health.model';

/** Admin view of a user (mirrors the backend UserResponse). */
export interface UserItem {
  id: string;
  username: string;
  displayName: string;
  roles: string[];
  enabled: boolean;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  displayName: string;
  roles: string[];
  enabled: boolean;
}

export interface UpdateUserRequest {
  displayName: string;
  roles: string[];
  enabled: boolean;
  /** Optional — when present, resets the user's password. */
  password?: string;
}

export type UserListApiResponse = ApiResponse<UserItem[]>;
export type UserApiResponse = ApiResponse<UserItem>;
