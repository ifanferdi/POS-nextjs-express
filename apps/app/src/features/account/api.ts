import { createServerApiClient } from '@/lib/api-server';

export interface AccountProfilePayload {
  fullName: string;
  placeOfBirth: string;
  dateOfBirth: string;
  gender: string;
  imagePath?: string;
}

export interface UpdateAccountPayload {
  username: string;
  profile?: AccountProfilePayload;
  oldPassword?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * Update akun sendiri via `PUT /v1/users/me`.
 * User id diambil backend dari JWT — client tidak mengirim id.
 * `isActive`/`roleId` diabaikan backend (cegah self role escalation).
 */
export async function updateAccount(payload: UpdateAccountPayload) {
  const api = await createServerApiClient();
  const response = await api.put('/v1/users/me', payload);
  return response.data;
}
