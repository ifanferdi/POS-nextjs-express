import { Role } from '@/domain/role.types';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}
export const GENDER_VALUES = Object.values(Gender);

export interface User {
  id: number;
  username: string;
  isActive: boolean;
  roleId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface UserProfile extends User {
  profile: Profile;
}

export interface UserDetail extends UserProfile {
  role: Role;
}

export interface UserList extends UserProfile {
  role: Role;
}

export interface Profile {
  id: number;
  userId: number;
  fullName: string;
  placeOfBirth: string;
  dateOfBirth: string;
  gender: Gender;
  age: number;
  imagePath?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRelation {
  PROFILE = 'profile',
  ROLE = 'role',
  ROLE_PERMISSIONS = 'role.permissions',
  PERMISSIONS = 'permissions',
  SOFT_DELETE = 'soft-delete',
}
