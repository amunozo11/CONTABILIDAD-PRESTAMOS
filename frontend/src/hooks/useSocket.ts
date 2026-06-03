'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { useQueryClient } from '@tanstack/react-query';

const WS_URL = process.env['NEXT_PUBLIC_WS_URL'] || 'http://localhost:4000';

let socketInstance: Socket | null = null;

export function useSocket() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    // Singleton de socket
    if (!socketInstance) {
      socketInstance = io(WS_URL, {
        auth: { token: accessToken },
        transports: ['websocket'],
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
      });
    }

    socketRef.current = socketInstance;
    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Socket conectado:', socket.id);
      socket.emit('join:room', 'dashboard');
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Socket error:', err.message);
    });

    // ─── Eventos de sincronización ─────────────────────────
    socket.on('cobro:registrado', () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['cobros'] });
      queryClient.invalidateQueries({ queryKey: ['prestamos'] });
    });

    socket.on('prestamo:creado', () => {
      queryClient.invalidateQueries({ queryKey: ['prestamos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    });

    socket.on('prestamo:actualizado', () => {
      queryClient.invalidateQueries({ queryKey: ['prestamos'] });
    });

    socket.on('cliente:actualizado', () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    });

    return () => {
      socket.off('cobro:registrado');
      socket.off('prestamo:creado');
      socket.off('prestamo:actualizado');
      socket.off('cliente:actualizado');
    };
  }, [isAuthenticated, accessToken, queryClient]);

  return socketRef.current;
}
