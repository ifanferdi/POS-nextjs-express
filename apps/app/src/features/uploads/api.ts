'use server';

import { PresignUrlInput, PresignUrlResponse, PresignUrlSchema } from '@/features/uploads/schema';
import { createServerApiClient } from '@/lib/api-server';

export async function generatePresignUrlAction(
  input: PresignUrlInput,
): Promise<PresignUrlResponse> {
  const api = await createServerApiClient();
  const validatedInput = PresignUrlSchema.parse(input);
  const { data } = await api.post<PresignUrlResponse>(
    '/v1/uploads/generate-presign-url',
    validatedInput,
  );

  return data;
}
