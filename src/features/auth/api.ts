import { api as configApi } from '@/config/config';
import { User, UserRelation } from '@/domain';
import { LoginResponseDto, RefreshTokenResponseDto } from '@/features/auth/dto';
import axios from 'axios';

/**
 * "Repository" khusus auth — SENGAJA pakai axios plain (bukan createServerApiClient()),
 * karena endpoint ini dipanggil SEBELUM session/token ada.
 */

export async function loginRequest(username: string, password: string) {
  const response = await axios.post<LoginResponseDto>(`${configApi.baseUrl}/v1/auth/sign-in`, {
    username,
    password,
  });
  return response.data; // { accessToken, refreshToken, exp, ... }
}

export async function refreshTokenRequest(refreshToken: string) {
  const response = await axios.post<RefreshTokenResponseDto>(
    `${configApi.baseUrl}/v1/auth/refresh-token`,
    { refreshToken },
  );
  return response.data;
}

export async function getMyAccountRequest(accessToken: string, params?: { with: UserRelation[] }) {
  const response = await axios.get<User>(`${configApi.baseUrl}/v1/user/my-account`, {
    params,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}
