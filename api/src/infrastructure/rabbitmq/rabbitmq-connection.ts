import client from 'amqplib';
import config from '../../config/config';

const RABBITMQ_URL = config.rabbitmq.url;

export default async function RabbitMqConnection() {
  try {
    const connection = await client.connect(RABBITMQ_URL);
    return await connection
      .createChannel()
      .then((res) => {
        console.log(`✅  RabbitMQ connected to: ${RABBITMQ_URL}`);
        return res;
      })
      .catch((e) => console.error(e));
  } catch (e) {
    console.error(e);
  }
}
