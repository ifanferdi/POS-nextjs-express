import { PaginatedResponse, Role } from '@/domain';
import { createServerApiClient } from '@/lib/api-server';
import { GetAllRoleParams } from './schema';

export async function getAllRoles<T = Role>(params: GetAllRoleParams) {
  const api = await createServerApiClient();
  const response = await api.get<PaginatedResponse<T>>('/v1/roles', { params });
  return response.data;
}
