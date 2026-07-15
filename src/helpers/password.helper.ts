import * as argon2 from 'argon2';

export async function hash(password: string) {
  return await argon2.hash(password, { type: 0, saltLength: 50 });
}

export function verify(hashPassword: string, checkPassword: string) {
  return argon2.verify(hashPassword, checkPassword);
}
