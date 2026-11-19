import { Permission, Profile, Role } from '@/domain';
import { UserProfile } from '@/domain/user.types';

export interface LoginResponseDto {
  token: string;
  refreshToken: string;
  exp: number;
  user: UserProfile;
}

export interface OtpChallengeResponseDto {
  requiresOtp: true;
  userId: number;
  challengeId: string;
}

export type LoginResultDto = LoginResponseDto | OtpChallengeResponseDto;
export type RefreshTokenResponseDto = LoginResponseDto;

export interface MeResponseDto {
  id: number;
  username: string;
  email: string;
  isActive: boolean;
  roleId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  profile: Profile | null;
  role: Role;
  permissions: Permission[];
}
