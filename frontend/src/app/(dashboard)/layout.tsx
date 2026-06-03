'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { BottomNav } from '@/components/layout/BottomNav';
import { TopBar } from '@/components/layout/TopBar';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { useSocket } from '@/hooks/useSocket';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Proteger todas las rutas del dashboard
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  // Activar Socket.IO globalmente
  useSocket();

  if (!isAuthenticated) return null;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-base)' }}>
      <TopBar />
      <OfflineBanner />
      <main className="main-content">
        <div style={{ padding: '16px', maxWidth: '430px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
