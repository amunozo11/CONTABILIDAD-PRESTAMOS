'use client';
import { useState, useEffect, useRef } from 'react';

// Implementación simple de Toaster sin dependencias externas
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

const toastQueue: Toast[] = [];
const listeners: Array<(toasts: Toast[]) => void> = [];

export function toast(message: string, type: Toast['type'] = 'info', duration = 4000) {
  const id = crypto.randomUUID();
  toastQueue.push({ id, message, type, duration });
  listeners.forEach((fn) => fn([...toastQueue]));
  setTimeout(() => {
    const idx = toastQueue.findIndex((t) => t.id === id);
    if (idx !== -1) toastQueue.splice(idx, 1);
    listeners.forEach((fn) => fn([...toastQueue]));
  }, duration);
}

const COLORS: Record<Toast['type'], string> = {
  success: 'var(--success-500)',
  error: 'var(--danger-500)',
  warning: 'var(--warning-500)',
  info: 'var(--brand-500)',
};

const EMOJIS: Record<Toast['type'], string> = {
  success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️',
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      const idx = listeners.indexOf(setToasts);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 'calc(56px + env(safe-area-inset-top) + 8px)',
      left: 16, right: 16,
      zIndex: 1000,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {toasts.map((t) => (
        <div key={t.id} className="animate-slide-up" style={{
          background: 'var(--bg-card)',
          border: `1.5px solid ${COLORS[t.type]}`,
          borderLeft: `4px solid ${COLORS[t.type]}`,
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: 'var(--shadow-lg)',
          fontSize: 14,
          fontWeight: 500,
        }}>
          <span style={{ fontSize: 18 }}>{EMOJIS[t.type]}</span>
          <span style={{ flex: 1, color: 'var(--text-primary)' }}>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
