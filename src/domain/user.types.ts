import { Permission } from '@/domain/permission.types';
import { Role } from '@/domain/role.types';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export interface User {
  id: number;
  username: string;
  isActive: boolean;
  roleId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  profile: Profile;
  role: Role;
  permissions: Permission[];
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
