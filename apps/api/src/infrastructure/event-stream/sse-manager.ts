import { Response } from 'express';

type SSEClient = {
  id: string;
  userId: string;
  canReadOrders: boolean;
  canReadProducts: boolean;
  canReadAllOrders: boolean;
  res: Response;
};

type SSEOrderUpdate = {
  ownerUserId: string;
  data: {
    id: number;
    orderNumber: string;
    status: string;
  };
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

  sendOrderUpdates({
    event,
    entity,
    action,
    updates,
  }: {
    event: string;
    entity: string;
    action: string;
    updates: SSEOrderUpdate[];
  }) {
    for (const client of this.clients.values()) {
      if (!client.canReadOrders) continue;

      const data = updates
        .filter((update) => client.canReadAllOrders || update.ownerUserId === client.userId)
        .map((update) => update.data);

      if (data.length) this.write(client.res, event, { entity, action, event, data });
    }
  }

  sendProductUpdate({
    event,
    entity,
    action,
    data,
  }: {
    event: string;
    entity: string;
    action: string;
    data: unknown;
  }) {
    for (const client of this.clients.values()) {
      if (client.canReadProducts) this.write(client.res, event, { entity, action, event, data });
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
