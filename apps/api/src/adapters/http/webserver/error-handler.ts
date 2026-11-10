import e from 'express';
import { ZodError } from 'zod';
import config from '@/config/config';
import { HttpStatusCode } from '@/constants/http-status.constant';
import { Prisma } from '@/infrastructure/database/prisma/generated/client';

// Error Prisma yang umum → status 4xx (jangan bocor sebagai 500).
const PRISMA_ERRORS: Record<string, { status: number; message: string }> = {
  P2002: { status: HttpStatusCode.CONFLICT, message: 'Data sudah ada (duplikat).' },
  P2025: { status: HttpStatusCode.NOT_FOUND, message: 'Data tidak ditemukan.' },
  P2003: { status: HttpStatusCode.BAD_REQUEST, message: 'Data terkait tidak valid.' },
  P2000: { status: HttpStatusCode.BAD_REQUEST, message: 'Nilai input tidak valid.' },
  P2007: { status: HttpStatusCode.BAD_REQUEST, message: 'Data tidak valid.' },
};

export default function (err: any, _req: e.Request, res: e.Response, _next: e.NextFunction) {
  let message = err.message;

  if (err instanceof ZodError) {
    if (err.issues[0])
      if (err.issues[0].path.length > 1)
        message = `Column ${err.issues[0].path.map((val) => val).join('.')}: ${err.issues[0].message}`;
      else message = `Column ${err.issues[0].path[0]}: ${err.issues[0].message}`;

    err = err as any;
    err.statusCode = HttpStatusCode.BAD_REQUEST;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = PRISMA_ERRORS[err.code];
    if (mapped) {
      (err as any).statusCode = mapped.status;
      message = mapped.message;
    } else {
      // Prisma error tak dikenal: jangan bocorkan detail internal.
      (err as any).statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
      message = 'Terjadi kesalahan pada server.';
    }
  }

  // Apa pun APP_ENV-nya, error handler WAJIB merespons (sebelumnya env selain
  // development/production menggantung tanpa respons). Stack hanya di development.
  const status = err.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
  const body = config.app.env === 'development' ? { message, stack: err.stack } : { message };

  return res.status(status).json(body);
}
