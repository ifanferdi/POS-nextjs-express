import { PaginatedResponse, Role } from '@/domain';
import { createServerApiClient } from '@/lib/api-server';

export async function getAllRoles() {
  const api = await createServerApiClient();
  const response = await api.get<PaginatedResponse<Role>>('/v1/roles', {
    params: { limit: -1 },
  });
  return response.data.data;
}
