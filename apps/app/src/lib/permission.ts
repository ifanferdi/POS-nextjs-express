import { Permission } from '@/domain';

/** String persis mengikuti permission di backend (`api/src/adapters/http/routes/*`). */
export const PERMISSION = {
  SHOW_USER: 'Show User',
  SHOW_TRAINEE: 'Show Trainee',
  MANAGE_USER: 'Manage User',
  MANAGE_TRAINEE: 'Manage Trainee',
  SHOW_CATEGORY: 'Show Category',
  MANAGE_CATEGORY: 'Manage Category',
  SHOW_PRODUCT: 'Show Product',
  MANAGE_PRODUCT: 'Manage Product',
  SHOW_ORDER: 'Show Order',
  MANAGE_ORDER: 'Manage Order',
  SHOW_PAYMENT: 'Show Payment',
  SHOW_ROLE: 'Show Role',
  MANAGE_ROLE: 'Manage Role',
  SHOW_PERMISSION: 'Show Permission',
  MANAGE_PERMISSION: 'Manage Permission',
} as const;

/** OR semantics bila array — mirror backend `check-request-permission`. */
export function hasPermission(
  permissions: Permission[] | undefined,
  name: string | string[],
): boolean {
  const names = Array.isArray(name) ? name : [name];
  return names.some((n) => permissions?.some((p) => p.name === n) ?? false);
}

export function requirePermission(
  permissions: Permission[] | undefined,
  name: string | string[],
): void {
  if (!hasPermission(permissions, name)) {
    throw new Error(
      `Forbidden: missing permission "${Array.isArray(name) ? name.join(', ') : name}"`,
    );
  }
}
