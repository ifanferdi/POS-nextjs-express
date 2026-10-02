'use server';

import { PresignUrlInput, PresignUrlResponse } from '@/features/uploads/schema';
import { createServerApiClient } from '@/lib/api-server';

export async function generatePresignUrlAction(
  input: PresignUrlInput,
): Promise<PresignUrlResponse> {
  const api = await createServerApiClient();
  const { data } = await api.post<PresignUrlResponse>('/v1/uploads/generate-presign-url', input);

  return data;
}
