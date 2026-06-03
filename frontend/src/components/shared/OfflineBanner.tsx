'use client';
import { useOfflineStore } from '@/stores/offlineStore';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const { isOnline, cobrosPendientes } = useOfflineStore();

  if (isOnline && cobrosPendientes.length === 0) return null;

  return (
    <div className="offline-banner" role="alert">
      <WifiOff size={16} />
      {!isOnline
        ? `Sin conexión${cobrosPendientes.length > 0 ? ` · ${cobrosPendientes.length} cobro(s) pendientes` : ''}`
        : `${cobrosPendientes.length} cobro(s) sincronizando...`
      }
    </div>
  );
}
