import { Server } from 'socket.io';
import { JwtData } from '../../../domain/entities/types/auth.types';
import { UseCases } from '../../../domain/use-cases/use-case.interface';
import chatHandlers from './chat-handlers';

export default function socketIoHandlers(io: Server, useCases: UseCases) {
  chatHandlers(io, useCases);

  io.on('connection', (socket) => {
    const user = socket.data.user as JwtData;
    console.log(`✅ New user connected [${user.id}:${user.username}] socketId:${socket.id}`);

    // 1. Join Room
    socket.on('join_project', (msg) => {
      socket.join('projectId:' + msg.projectId);
      socket.emit('joined', `user-id:${user.id} join project:${msg.projectId}`);
    });

    // emit task to all user in project
    socket.on('send_task', (msg) => {
      socket.to('projectId:' + msg.projectId).emit('task_updated', { task: msg.task });
    });

    socket.on('typing', (msg) => {
      socket.volatile
        .to('projectId:' + msg.projectId)
        .emit('user_typing', `${user.profile?.fullName} is typing...`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`❌ ${user.username} disconnected: ${reason}`);
    });
  });
}
