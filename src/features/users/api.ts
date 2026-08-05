import { ApiResponse, PaginatedResponse, User } from '@/domain';
import {
  CreateUserInput,
  GetAllUserParams,
  UpdateUserInput,
  UserRelationParams,
} from '@/features/users/schema';
import { createServerApiClient } from '@/lib/api-server';

interface UserApiResponse extends ApiResponse {
  user: User;
}

export async function getAllUser<T = User>(params: GetAllUserParams) {
  const api = await createServerApiClient();
  const response = await api.get<PaginatedResponse<T>>('/v1/users', { params });
  return response.data;
}

export async function getUserById<T = User>(id: number, relation?: UserRelationParams) {
  const api = await createServerApiClient();
  const response = await api.get<T>(`/v1/users/${id}`, {
    params: { with: relation },
  });
  return response.data;
}

export async function createUser(input: CreateUserInput) {
  const api = await createServerApiClient();
  const response = await api.post<UserApiResponse>('/v1/users', input);

  return response.data;
}

export async function updateUser(id: number, input: UpdateUserInput) {
  const api = await createServerApiClient();
  const response = await api.put<UserApiResponse>(`/v1/users/${id}`, input);

  return response.data;
}

export async function deleteUser(id: number) {
  const api = await createServerApiClient();
  const response = await api.delete<ApiResponse>(`/v1/users/${id}`);

  return response.data;
}
