import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', textAlign: 'center',
      background: 'var(--bg-base)',
    }}>
      <div style={{ fontSize: 72, marginBottom: 24 }}>📡</div>
      <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800 }}>Sin conexión</h1>
      <p style={{ margin: '0 0 32px', fontSize: 15, color: 'var(--text-muted)', maxWidth: 280 }}>
        Verifica tu conexión a internet. Los cobros guardados se sincronizarán automáticamente cuando vuelvas a estar online.
      </p>
      <Link href="/">
        <button className="btn-primary" style={{ maxWidth: 280 }}>
          Reintentar
        </button>
      </Link>
    </div>
  );
}
