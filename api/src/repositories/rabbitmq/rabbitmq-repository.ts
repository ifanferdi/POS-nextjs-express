import { Channel } from 'amqplib';
import { PublishQueue, SubscribeQueue } from '../../domain/infrastructures/rabbitmq.interface';
import { isError } from '../../helpers/error.helper';

export default class RabbitmqRepository {
  constructor(protected channel: Channel) {}

  private deadQueue = (queue: string) => `dead.${queue}`;

  async publish(params: PublishQueue) {
    const { key, exchange, payload, delay } = params;

    await this.channel.assertExchange(exchange, 'x-delayed-message', {
      durable: true,
      arguments: { 'x-delayed-type': 'direct' },
    });

    const publish = this.channel.publish(exchange, key, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
      headers: { 'x-delay': delay },
    });

    if (publish)
      console.log(
        `------------------------------------ \n Success create event to exchange:${exchange} - key:${key} : ${JSON.stringify(payload)}`,
      );
  }

  async subscribe(params: SubscribeQueue, cb: Function) {
    const { key, exchange } = params;

    await this.channel.assertExchange(exchange, 'x-delayed-message', {
      durable: true,
      arguments: { 'x-delayed-type': 'direct' },
    });

    const { queue } = await this.channel.assertQueue(key, { durable: true });

    await this.channel.bindQueue(queue, exchange, key);

    await this.channel.consume(queue, (value) => {
      if (!value) return;

      const data = JSON.parse(value.content.toString());
      cb(data);

      this.channel.ack(value);
    });
  }

  async subscribeWithDLQ(params: SubscribeQueue, cb: Function) {
    const { key, exchange } = params;

    const DEAD_EXCHANGE = `dead.${exchange}`;
    const DEAD_QUEUE = this.deadQueue(key);
    const DEAD = `dead.${key}`;
    const MAIN_QUEUE = `main.${key}`;

    // Declare Dead Letter Exchange & Queue
    await this.channel.assertExchange(DEAD_EXCHANGE, 'direct', { durable: true });
    await this.channel.assertQueue(DEAD_QUEUE, { durable: true });
    await this.channel.bindQueue(DEAD_QUEUE, DEAD_EXCHANGE, DEAD);

    await this.channel.assertExchange(exchange, 'x-delayed-message', {
      durable: true,
      arguments: { 'x-delayed-type': 'direct' },
    });
    await this.channel.assertQueue(MAIN_QUEUE, {
      durable: true,
      deadLetterExchange: DEAD_EXCHANGE,
      deadLetterRoutingKey: DEAD,
      messageTtl: 5000, // 5 seconds delay
    });
    await this.channel.bindQueue(MAIN_QUEUE, exchange, key);

    await this.channel.consume(MAIN_QUEUE, (value) => {
      if (!value) return;

      const data = JSON.parse(value.content.toString());

      const callback = cb(data);

      if (isError(callback)) this.channel.nack(value, false, false);
      else this.channel.ack(value);
    });
  }

  async subscribeDeadQueue(params: SubscribeQueue, cb: Function) {
    const { key } = params;

    await this.channel.consume(this.deadQueue(key), async (value) => {
      if (!value) return;

      const data = JSON.parse(value.content.toString());
      cb(data);

      this.channel.ack(value);
    });
  }
}
