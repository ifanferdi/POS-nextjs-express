import { Permission, Role } from '@/domain';

export const mockPermissions: Permission[] = [
  { id: 1, name: 'user:create', createdAt: new Date('2026-07-01'), updatedAt: new Date('2026-07-01'), roles: [] },
  { id: 2, name: 'user:read', createdAt: new Date('2026-07-01'), updatedAt: new Date('2026-07-01'), roles: [] },
  { id: 3, name: 'user:update', createdAt: new Date('2026-07-01'), updatedAt: new Date('2026-07-01'), roles: [] },
  { id: 4, name: 'user:delete', createdAt: new Date('2026-07-01'), updatedAt: new Date('2026-07-01'), roles: [] },
  { id: 5, name: 'role:create', createdAt: new Date('2026-07-01'), updatedAt: new Date('2026-07-01'), roles: [] },
  { id: 6, name: 'role:read', createdAt: new Date('2026-07-01'), updatedAt: new Date('2026-07-01'), roles: [] },
  { id: 7, name: 'role:update', createdAt: new Date('2026-07-01'), updatedAt: new Date('2026-07-01'), roles: [] },
  { id: 8, name: 'role:delete', createdAt: new Date('2026-07-01'), updatedAt: new Date('2026-07-01'), roles: [] },
  { id: 9, name: 'permission:create', createdAt: new Date('2026-07-01'), updatedAt: new Date('2026-07-01'), roles: [] },
  { id: 10, name: 'permission:read', createdAt: new Date('2026-07-01'), updatedAt: new Date('2026-07-01'), roles: [] },
  { id: 11, name: 'permission:update', createdAt: new Date('2026-07-01'), updatedAt: new Date('2026-07-01'), roles: [] },
  { id: 12, name: 'permission:delete', createdAt: new Date('2026-07-01'), updatedAt: new Date('2026-07-01'), roles: [] },
];

export const mockRoles: Role[] = [
  {
    id: 1,
    name: 'Super Admin',
    createdAt: new Date('2026-07-15'),
    updatedAt: new Date('2026-07-15'),
    users: [],
    permissions: mockPermissions,
  },
  {
    id: 2,
    name: 'Admin',
    createdAt: new Date('2026-07-10'),
    updatedAt: new Date('2026-07-10'),
    users: [],
    permissions: mockPermissions.filter((p) =>
      ['user:create', 'user:read', 'user:update', 'user:delete', 'role:read', 'role:update', 'permission:read', 'permission:update'].includes(p.name),
    ),
  },
  {
    id: 3,
    name: 'Manager',
    createdAt: new Date('2026-07-08'),
    updatedAt: new Date('2026-07-08'),
    users: [],
    permissions: mockPermissions.filter((p) => ['user:read', 'user:update'].includes(p.name)),
  },
  {
    id: 4,
    name: 'Editor',
    createdAt: new Date('2026-07-05'),
    updatedAt: new Date('2026-07-05'),
    users: [],
    permissions: mockPermissions.filter((p) => ['user:read'].includes(p.name)),
  },
  {
    id: 5,
    name: 'Viewer',
    createdAt: new Date('2026-07-01'),
    updatedAt: new Date('2026-07-01'),
    users: [],
    permissions: mockPermissions.filter((p) => ['user:read'].includes(p.name)),
  },
  {
    id: 6,
    name: 'Content Manager',
    createdAt: new Date('2026-07-12'),
    updatedAt: new Date('2026-07-12'),
    users: [],
    permissions: mockPermissions.filter((p) =>
      ['user:create', 'user:read', 'user:update', 'role:read', 'permission:read'].includes(p.name),
    ),
  },
  {
    id: 7,
    name: 'Auditor',
    createdAt: new Date('2026-07-03'),
    updatedAt: new Date('2026-07-03'),
    users: [],
    permissions: mockPermissions.filter((p) => ['user:read', 'role:read', 'permission:read'].includes(p.name)),
  },
  {
    id: 8,
    name: 'Guest',
    createdAt: new Date('2026-07-02'),
    updatedAt: new Date('2026-07-02'),
    users: [],
    permissions: [],
  },
];

export type RoleWithPermissions = Omit<Role, 'users'> & {
  users: { id: number; username: string; profile: { fullName: string }; isActive: boolean }[];
};

export const mockRolesWithUsers: RoleWithPermissions[] = mockRoles.map((role) => ({
  ...role,
  users: [
    { id: 1, username: 'johndoe', profile: { fullName: 'John Doe' }, isActive: true },
    { id: 2, username: 'janesmith', profile: { fullName: 'Jane Smith' }, isActive: true },
    { id: 3, username: 'robertb', profile: { fullName: 'Robert Brown' }, isActive: false },
  ].slice(0, role.id % 4 || 1),
}));

export function getMockRoleById(id: number): RoleWithPermissions | undefined {
  return mockRolesWithUsers.find((r) => r.id === id);
}
