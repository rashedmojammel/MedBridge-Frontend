import { io, Socket } from 'socket.io-client';
import { getToken } from './auth';

let socket: Socket | null = null;

/**
 * Single Socket.IO connection to the backend's /chat namespace.
 * The JWT goes in the handshake - the gateway verifies it on connect
 * and disconnects immediately if it's invalid.
 */
export function getSocket(): Socket {
  if (!socket) {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    socket = io(`${base}/chat`, {
      auth: { token: getToken() },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
