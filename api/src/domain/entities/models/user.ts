import { Permission, Profile, Role, User } from '@/infrastructure/database/prisma/generated/client';
import {
  ProfileScalarFieldEnum,
  UserScalarFieldEnum,
} from '@/infrastructure/database/prisma/generated/internal/prismaNamespace';
import _ from 'lodash';

export interface IUser extends Omit<User, 'password'> {}

export interface UserRelationData extends IUser {
  role: Role & {
    roleHasPermissions: Array<{ permission: Permission }>;
    permissions: Array<Permission>;
  };
  permissions: Array<Permission>;
}

export interface IUserWithPassword extends IUser {
  password: string;
}

export interface IProfile extends Profile {
  imageUrl?: string;
}

export interface IUserProfile extends User {
  profile: IProfile;
}

export const USER_FIELD = UserScalarFieldEnum;
export type USER_FIELD = (typeof USER_FIELD)[keyof typeof USER_FIELD];
export const USER_FIELDS = Object.keys(USER_FIELD) as USER_FIELD[];

export const USER_SELECT_FIELD = _.omit(USER_FIELD, 'password');
export type USER_SELECT_FIELD = (typeof USER_SELECT_FIELD)[keyof typeof USER_SELECT_FIELD];
export const USER_SELECT_FIELDS = Object.keys(
  _.omit(USER_SELECT_FIELD, 'password'),
) as USER_SELECT_FIELD[];

export const USER_SELECT_FIELDS_PRISMA = Object.fromEntries(
  USER_SELECT_FIELDS.map((col) => [col, true]),
);

export const PROFILE_FIELD = ProfileScalarFieldEnum;
export type PROFILE_FIELD = (typeof PROFILE_FIELD)[keyof typeof PROFILE_FIELD];
export const PROFILE_FIELDS = Object.keys(PROFILE_FIELD) as PROFILE_FIELD[];
