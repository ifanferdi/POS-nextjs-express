import { User } from '@/domain/user.types';

export interface RefreshTokenResponseDto {
  token: string;
  refreshToken: string;
  tokenExpiry: number;
}

export interface LoginResponseDto extends RefreshTokenResponseDto {
  user: User;
}
