import * as argon2 from 'argon2';

export async function hash(password: string) {
  // argon2id (bukan argon2d), cost eksplisit setara hash lama (m=65536,t=3,p=4).
  // Hash lama argon2d tetap bisa diverifikasi (parameter tersimpan di hash).
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

export function verify(hashPassword: string, checkPassword: string) {
  return argon2.verify(hashPassword, checkPassword);
}
