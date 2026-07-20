import { PaginatedResponse, User } from '@/domain';
import { GetAllUserParams, UserRelationParams } from '@/features/users/schema';
import { createServerApiClient } from '@/lib/api-server';

export async function getAllUser(params: GetAllUserParams) {
  const api = await createServerApiClient();

  const response = await api.get<PaginatedResponse<User>>('/v1/users', { params });
  return response.data;
}

export async function getUserById(id: number, relation?: UserRelationParams) {
  const api = await createServerApiClient();
  const response = await api.get<PaginatedResponse<User>>(`/v1/users/${id}`, {
    params: { with: relation },
  });
  return response.data;
}
