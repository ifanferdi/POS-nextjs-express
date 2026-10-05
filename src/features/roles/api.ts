import { PaginatedResponse, Role } from '@/domain';
import { GetAllRoleParams } from '@/features/roles/schema';
import { createServerApiClient } from '@/lib/api-server';
import { defaultPaginatedResponse } from '@/lib/helper';
import { unstable_rethrow } from 'next/navigation';

export async function getAllRoles<T = Role>(params: GetAllRoleParams) {
  try {
    const api = await createServerApiClient();
    const response = await api.get<PaginatedResponse<T>>('/v1/roles', { params });
    return response.data;
  } catch (e) {
    unstable_rethrow(e);
    return defaultPaginatedResponse;
  }
}
