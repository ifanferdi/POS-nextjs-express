export interface Role {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum RoleRelation {
  USERS = 'users',
  PERMISSIONS = 'permissions',
}

export type RoleOption = Pick<Role, 'id' | 'name'>;
