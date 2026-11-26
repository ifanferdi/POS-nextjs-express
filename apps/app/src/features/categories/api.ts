import { ApiResponse, Category, PaginatedResponse } from '@/domain';
import {
  CategoryRelationParams,
  CreateCategoryInput,
  GetAllCategoryParams,
  GetAllCategorySchema,
  UpdateCategoryInput,
} from '@/features/categories/schema';
import { createServerApiClient } from '@/lib/api-server';

interface CategoryApiResponse extends ApiResponse {
  category: Category;
}

export async function getAllCategories<T = Category>(params: GetAllCategoryParams) {
  const api = await createServerApiClient();
  const validatedParams = GetAllCategorySchema.parse(params);
  const response = await api.get<PaginatedResponse<T>>('/v1/categories', {
    params: validatedParams,
  });

  return response.data;
}

export async function getCategoryById<T = Category>(id: number, relation?: CategoryRelationParams) {
  const api = await createServerApiClient();
  const validatedRelation = GetAllCategorySchema.shape.with.parse(relation);
  const response = await api.get<T>(`/v1/categories/${id}`, {
    params: { with: validatedRelation },
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
