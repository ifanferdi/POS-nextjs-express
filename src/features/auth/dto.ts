import { UserProfile } from '@/domain/user.types';

export interface LoginResponseDto {
  token: string;
  refreshToken: string;
  exp: number;
  user: UserProfile;
}

export type RefreshTokenResponseDto = LoginResponseDto;
