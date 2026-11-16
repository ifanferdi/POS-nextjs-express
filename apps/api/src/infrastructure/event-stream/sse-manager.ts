import { Response } from 'express';

type SSEClient = {
  id: string;
  userId: string;
  res: Response;
};

class SseManager {
  private clients: Map<string, SSEClient> = new Map();
  private isClosing = false;

  addClient = (client: SSEClient): boolean => {
    if (this.isClosing) return false;

    this.clients.set(client.id, client);
    return true;
  };
  removeClient = (clientId: string) => this.clients.delete(clientId);

  closeAll() {
    this.isClosing = true;
    for (const client of this.clients.values()) client.res.end();
    this.clients.clear();
  }

  // Kirim ke satu user spesifik (bisa ada multiple tab/device -> multiple clientId)
  sendToUser({ userId, event, data }: { userId: string; event: string; data: unknown }) {
    for (const client of this.clients.values()) {
      if (client.userId === userId) this.write(client.res, event, data);
    }
  }

  // Broadcast ke semua client yang terhubung di instance ini
  broadcast({ event, data }: { event: string; data: unknown }) {
    for (const client of this.clients.values()) {
      this.write(client.res, event, data);
    }
  }

  private write(res: Response, event: string, data: unknown) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  getConnectedCount() {
    return this.clients.size;
  }
}

export const sseManager = new SseManager();
