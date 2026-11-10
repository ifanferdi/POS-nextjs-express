import * as argon2 from 'argon2';

export async function hash(password: string) {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // memori (KiB) yang dipakai per hash — memperlambat serangan GPU
    timeCost: 3, // iterasi hashing — menambah waktu komputasi
    parallelism: 4, // jumlah thread paralel — batas buat GPU/ASIC, bukan percepatan serangan
  });
}

export function verify(hashPassword: string, checkPassword: string) {
  return argon2.verify(hashPassword, checkPassword);
}
