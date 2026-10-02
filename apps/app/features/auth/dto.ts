import { UserProfile } from '@/domain/user.types';

export interface LoginResponseDto {
  token: string;
  refreshToken: string;
  tokenExpiry: number;
  user: UserProfile;
}

export type RefreshTokenResponseDto = LoginResponseDto;
