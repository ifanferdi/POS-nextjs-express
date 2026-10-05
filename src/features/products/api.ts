import { ApiResponse, PaginatedResponse, Product } from '@/domain';
import {
  CreateProductInput,
  GetAllProductParams,
  ProductRelationParams,
  UpdateProductInput,
} from '@/features/products/schema';
import { createServerApiClient } from '@/lib/api-server';
import { defaultPaginatedResponse } from '@/lib/helper';
import { unstable_rethrow } from 'next/navigation';

interface ProductApiResponse extends ApiResponse {
  product: Product;
}

export async function getAllProducts<T = Product>(params: GetAllProductParams) {
  try {
    const api = await createServerApiClient();
    const response = await api.get<PaginatedResponse<T>>('/v1/products', { params });
    return response.data;
  } catch (e) {
    unstable_rethrow(e);
    console.error('Error fetching products:', e);
    return defaultPaginatedResponse;
  }
}

export async function getProductById<T = Product>(id: number, relation?: ProductRelationParams) {
  const api = await createServerApiClient();
  const response = await api.get<T>(`/v1/products/${id}`, {
    params: { with: relation },
  });
  return response.data;
}

export async function createProduct(input: CreateProductInput) {
  const api = await createServerApiClient();
  const response = await api.post<ProductApiResponse>('/v1/products', input);

  return response.data;
}

export async function updateProduct(id: number, input: UpdateProductInput) {
  const api = await createServerApiClient();
  const response = await api.put<ProductApiResponse>(`/v1/products/${id}`, input);

  return response.data;
}

export async function deleteProduct(id: number) {
  const api = await createServerApiClient();
  const response = await api.delete<ApiResponse>(`/v1/products/${id}`);

  return response.data;
}
