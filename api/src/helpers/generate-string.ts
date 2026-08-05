import { randomInt } from 'crypto';
import moment from 'moment';

export function generateOrderNumber(): string {
  const timestamp = moment().format('YYYYMMDDHHmmss');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${timestamp}-${random}`;
}

export function generateOtp(digit = 6): string {
  const n = randomInt(0, 1_000_000); // 0 .. 999999
  return String(n).padStart(digit, '0');
}
