import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { env } from './env';
import { logger } from '../shared/utils/logger';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../shared/middleware/auth.middleware';

let io: SocketServer | null = null;

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS.split(','),
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // ─── Autenticación Socket.IO ──────────────────────────────
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth['token'] as string;
    if (!token) return next(new Error('Token requerido'));

    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
      socket.data['user'] = payload;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  // ─── Conexión ─────────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const user = socket.data['user'] as JwtPayload;
    logger.info(`Socket conectado: ${user.email} (${socket.id})`);

    // Unirse a sala de dashboard automáticamente
    socket.join('dashboard');
    socket.join(`user:${user.sub}`);

    // Notificar a todos que alguien se conectó
    socket.to('dashboard').emit('usuario:conectado', {
      usuarioId: user.sub,
      email: user.email,
    });

    // ─── Eventos del cliente ─────────────────────────────────
    socket.on('join:room', (room: string) => {
      socket.join(room);
    });

    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket desconectado: ${user.email} — ${reason}`);
      socket.to('dashboard').emit('usuario:desconectado', {
        usuarioId: user.sub,
      });
    });
  });

  logger.info('✅ Socket.IO inicializado');
  return io;
}

export function getSocketIO(): SocketServer | null {
  return io;
}
