import { JwtPayload } from 'jsonwebtoken';
import { IUser } from '@/domain/entities/models/user';

export interface JwtData extends JwtPayload, IUser {
  iatDate?: Date;
  expDate?: Date;
  sessionId?: string;
}

export interface RedisDataAuth {
  userId: number;
  refreshTokenHash: string;
  createdAt: Date;
}
