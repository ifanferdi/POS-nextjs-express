import { Role } from '@/domain';
import 'next-auth';
import 'next-auth/jwt';

/**
 * Module augmentation untuk NextAuth v5.
 *
 * File ini TIDAK pernah di-import manual di file lain.
 * TypeScript otomatis menerapkan augmentasi ini ke seluruh project
 * begitu file ini ter-include di tsconfig.json.
 *
 * Field di sini ada 2 kategori:
 * - GENERIC (reusable di project lain): accessToken, refreshToken, tokenExpiry
 * - PROJECT-SPECIFIC (khusus DigiPro RBAC): role, permissions
 */

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    error?: 'RefreshTokenError';
    user: {
      id: string;
      name: string; // eksplisit, jangan andalkan DefaultSession saja
      username: string;
      role: Role; //todo
      permissions: Permissions[];
    };
  }

  interface User {
    token: string;
    refreshToken: string;
    tokenExpiry: number;
    user: {
      id: number;
      username: string;
      isActive: boolean;
      roleId: number;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: Date | null;
      profile: Profile;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    tokenExpiry: number; // generic — dipakai logic refresh proaktif
    user: User;
    role: string; //todo
    permissions: string[];
    error?: 'RefreshTokenError';
  }
}

enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

interface Profile {
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
