import * as http from 'http';
import { Server, Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { UseCases } from '../../domain/use-cases/use-case.interface';
import socketIoHandlers from './handlers';

export default class SocketIoServer {
  constructor(
    private httpServer: http.Server,
    private useCases: UseCases,
  ) {}

  execute() {
    const io = new Server(this.httpServer, { cors: { origin: '*' } });

    io.use(this._checkToken());

    socketIoHandlers(io, this.useCases);

    return io;
  }

  private _checkToken() {
    return async (socket: Socket, next: (err?: ExtendedError) => void) => {
      const token = socket.handshake.headers.authorization?.replace('Bearer ', '') as string;
      try {
        socket.data.user = await this.useCases.authUseCase.checkToken.execute({ token });
        next();
      } catch {
        next(new Error('Socket IO authentication failed!'));
      }
    };
  }
}
