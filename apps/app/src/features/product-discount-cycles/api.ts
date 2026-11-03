import {
  ApiResponse,
  DiscountQuotaShortage,
  PaginatedResponse,
  ProductDiscountCycle,
  ProductDiscountCycleList,
} from '@/domain';
import { ApiArrayError, createServerApiClient } from '@/lib/api-server';
import {
  CheckQuotaInput,
  CreateProductDiscountCycleInput,
  GetAllProductDiscountCycleParams,
  UpdateProductDiscountCycleInput,
} from './schema';

export type CheckQuotaResponse =
  { valid: true } | { valid: false; shortages: DiscountQuotaShortage[]; error?: string };

export async function getAllProductDiscountCycles(params: GetAllProductDiscountCycleParams) {
  const api = await createServerApiClient();
  const response = await api.get<PaginatedResponse<ProductDiscountCycleList>>(
    '/v1/product-discount-cycles',
    { params },
  );
  return response.data;
}

export async function createProductDiscountCycle(input: CreateProductDiscountCycleInput) {
  const api = await createServerApiClient();
  const response = await api.post<ApiResponse & { productDiscountCycle: ProductDiscountCycle }>(
    '/v1/product-discount-cycles',
    input,
  );
  return response.data;
}

export async function updateProductDiscountCycle(
  id: number,
  input: UpdateProductDiscountCycleInput,
) {
  const api = await createServerApiClient();
  const response = await api.put<ApiResponse & { productDiscountCycle: ProductDiscountCycle }>(
    `/v1/product-discount-cycles/${id}`,
    input,
  );
  return response.data;
}

export async function deleteProductDiscountCycle(id: number) {
  const api = await createServerApiClient();
  const response = await api.delete<ApiResponse>(`/v1/product-discount-cycles/${id}`);
  return response.data;
}

export async function checkProductDiscountQuota(
  items: CheckQuotaInput,
): Promise<CheckQuotaResponse> {
  const api = await createServerApiClient();

  try {
    await api.post<{ valid: boolean }>('/v1/product-discount-cycles/check-quota', items);
    return { valid: true };
  } catch (error) {
    if (error instanceof ApiArrayError)
      return { valid: false, shortages: error.data as DiscountQuotaShortage[] };

    throw error;
  }
}
