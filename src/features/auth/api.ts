import { config } from '@/config/config';
import { User, UserRelation } from '@/domain';
import axios from 'axios';
import { LoginResponseDto, RefreshTokenResponseDto } from './dto';

/**
 * "Repository" khusus auth — SENGAJA pakai axios plain (bukan createServerApiClient()),
 * karena endpoint ini dipanggil SEBELUM session/token ada.
 */

export async function loginRequest(username: string, password: string) {
  const response = await axios.post<LoginResponseDto>(`${config.api.baseUrl}/v1/auth/sign-in`, {
    username,
    password,
  });
  return response.data; // { accessToken, refreshToken, accessTokenExpiry, ... }
}

export async function refreshTokenRequest(refreshToken: string) {
  const response = await axios.post<RefreshTokenResponseDto>(
    `${config.api.baseUrl}/v1/auth/refresh-token`,
    { refreshToken },
  );
  return response.data;
}

export async function getMyAccountRequest(accessToken: string, params?: { with: UserRelation[] }) {
  const response = await axios.get<User>(`${config.api.baseUrl}/v1/user/my-account`, {
    params,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}
