import config from '@/config/config';
import AppError from '@/helpers/error.helper';
import arp from '@network-utils/arp-lookup';
import { Request } from 'express';
import _ from 'lodash';
import moment from 'moment';
import ms, { StringValue } from 'ms';
import z from 'zod';

export const isLink = (string: string) => z.string().url().safeParse(string).success;

export const reformatStorageKey = (str: string) =>
  str
    .replace(/\s+/g, '_') // ubah spasi jadi underscore
    .replace(/\/+/g, '/'); // ubah multiple slash jadi single slash

export const isJsonValue = (str: string) => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

export const extractUserId = (req: Request) =>
  req.headers.userId ? Number(req.headers.userId) : undefined;

const TIMEOUT = config.auth.tokenTimeout;

export const ttl = (time: StringValue | number = TIMEOUT) =>
  _.isNumber(time) ? time : ms(time) / 1000;

export const getClientMacAddress = async (ip: string) => await arp.toMAC(ip.replace('::ffff:', ''));

export const handleOrderByRequest = <T>(req: Record<string, any>) => {
  if (!req.orderBy) return undefined;
  else {
    if (!(req.orderBy instanceof Array)) throw new AppError('OrderBy must be an array of string.');

    return req.orderBy.map((order: string) => {
      const [field, direction] = order.split(':');
      return { field: field as T, direction: direction as 'asc' | 'desc' };
    });
  }
};

export const handleNumberOrArrayRequest = (value?: string | string[]) => {
  if (!value) return undefined;
  return Array.isArray(value) ? value.map((val: string) => Number(val)) : Number(value);
};
export const calculateAge = (dateOfBirth: Date) => moment().diff(moment(dateOfBirth), 'years');

/**
 * Hitung pembulatan ke kelipatan terdekat (default: 100)
 * Contoh: 20.921 → { rounding: 79, total: 21.000 }
 */
export function calculateRounding(
  subtotal: number,
  roundTo: number = 100,
): { rounding: number; total: number } {
  const total = Math.ceil(subtotal / roundTo) * roundTo;
  const rounding = total - subtotal;

  return {
    rounding: Number(rounding.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}
