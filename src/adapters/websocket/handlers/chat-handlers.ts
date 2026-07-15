import { Server } from 'socket.io';
import { UseCases } from '../../../domain/use-cases/use-case.interface';

export default function chatHandlers(io: Server, useCases: UseCases) {
  io.of('/chat').on('connection', (socket) => {
    const user = socket.data.user;

    console.log(`New user connected [${user.id}:${user.username}] socketId:${socket.id}`);

    socket.on('private-message', (msg, ack) => {
      socket.to(msg.to).emit('private-message', {
        from: user.username,
        message: msg.message,
      });
      ack(msg);
    });

    socket.on('disconnect', (reason) => {
      console.log(`❌ ${user.username} disconnected: ${reason}`);
    });
  });
}
