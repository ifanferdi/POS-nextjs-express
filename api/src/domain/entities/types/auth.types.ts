import { JwtPayload } from 'jsonwebtoken';
import { IUser } from '../models/user';

export interface JwtData extends JwtPayload, IUser {
  iatDate?: Date;
  expDate?: Date;
  isBearerToken: boolean;
}

export interface RedisDataAuth {
  token: string;
  refreshToken?: string;
  macAddress?: string;
  createdAt: Date;
}
