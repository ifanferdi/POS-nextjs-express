import { sseManager } from '@/infrastructure/event-stream/sse-manager';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';

export default class SseController {
  sseHandler = async (req: Request & Record<string, any>, res: Response) => {
    const userId = req.user!.id; // asumsi udah lewat auth middleware
    const clientId = randomUUID();

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // penting kalau di belakang Nginx, biar gak di-buffer
    });

    res.write('\n');
    sseManager.addClient({ id: clientId, userId, res });

    // Heartbeat biar koneksi gak di-timeout proxy/LB
    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30_000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseManager.removeClient(clientId);
    });
  };
}
