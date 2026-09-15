export interface Permission {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum PermissionRelation {
  ROLES = 'roles',
}
