import { Category, PaginatedResponse } from '@/domain';
import {
  CategoryRelationParams,
  CreateCategoryInput,
  GetAllCategoryParams,
  UpdateCategoryInput,
} from '@/features/categories/schema';
import { createServerApiClient } from '@/lib/api-server';

export async function getAllCategories<T = Category>(params: GetAllCategoryParams) {
  const api = await createServerApiClient();
  const response = await api.get<PaginatedResponse<T>>('/v1/categories', { params });
  return response.data;
}

export async function getCategoryById<T = Category>(id: number, relation?: CategoryRelationParams) {
  const api = await createServerApiClient();
  const response = await api.get<T>(`/v1/categories/${id}`, {
    params: { with: relation },
  });
  return response.data;
}

export async function createCategory(input: CreateCategoryInput) {
  const api = await createServerApiClient();
  const response = await api.post('/v1/categories', input);

  return response.data;
}

export async function updateCategory(id: number, input: UpdateCategoryInput) {
  const api = await createServerApiClient();
  const response = await api.put(`/v1/categories/${id}`, input);

  return response.data;
}

export async function deleteCategory(id: number) {
  const api = await createServerApiClient();
  const response = await api.delete(`/v1/categories/${id}`);

  return response.data;
}
