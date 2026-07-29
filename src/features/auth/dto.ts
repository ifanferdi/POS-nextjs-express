import { User } from '@/domain/user.types';

export interface LoginResponseDto {
  token: string;
  refreshToken: string;
  tokenExpiry: number;
  user: User;
}

export interface RefreshTokenResponseDto extends LoginResponseDto {}
