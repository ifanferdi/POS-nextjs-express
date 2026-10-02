import { ApiResponse, Category, PaginatedResponse } from '@/domain';
import {
  CategoryRelationParams,
  CreateCategoryInput,
  GetAllCategoryParams,
  UpdateCategoryInput,
} from '@/features/categories/schema';
import { createServerApiClient } from '@/lib/api-server';
import { defaultPaginatedResponse } from '@/lib/helper';

interface CategoryApiResponse extends ApiResponse {
  category: Category;
}

export async function getAllCategories<T = Category>(params: GetAllCategoryParams) {
  try {
    const api = await createServerApiClient();
    const response = await api.get<PaginatedResponse<T>>('/v1/categories', { params });

    return response.data;
  } catch {
    return defaultPaginatedResponse;
  }
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
  const response = await api.post<CategoryApiResponse>('/v1/categories', input);

  return response.data;
}

export async function updateCategory(id: number, input: UpdateCategoryInput) {
  const api = await createServerApiClient();
  const response = await api.put<CategoryApiResponse>(`/v1/categories/${id}`, input);

  return response.data;
}

export async function deleteCategory(id: number) {
  const api = await createServerApiClient();
  const response = await api.delete<ApiResponse>(`/v1/categories/${id}`);

  return response.data;
}
