'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { apiClient } from '@/services/api';
import { formatCOP, formatFechaHoraCO } from '@/lib/utils';

const TIPO_BADGES: Record<string, string> = {
  diario: 'badge-brand', parcial: 'badge-warning',
  adelantado: 'badge-success', total: 'badge-success',
};
const TIPO_LABELS: Record<string, string> = {
  diario: 'Diario', parcial: 'Parcial', adelantado: 'Adelantado', total: 'Total',
};

interface Cobro {
  _id: string;
  monto: number;
  tipo: string;
  fecha: string;
  hora: string;
  cliente: { nombre: string };
  cobrador: { nombre: string };
  saldoDespues: number;
  anulado: boolean;
}

export default function CobrosPage() {
  const { data: resumen } = useQuery({
    queryKey: ['cobros-resumen'],
    queryFn: () => apiClient.get('/api/cobros/resumen/dia').then((r) => r.data.data),
    refetchInterval: 30_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['cobros'],
    queryFn: () => apiClient.get('/api/cobros?limit=50').then((r) => r.data),
  });

  const cobros: Cobro[] = data?.data ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Cobros</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Historial de pagos</p>
        </div>
        <Link href="/cobros/registrar">
          <button className="btn-primary" style={{ width: 'auto', padding: '10px 16px' }}>
            <Plus size={18} />
          </button>
        </Link>
      </div>

      {/* Resumen del día */}
      {resumen && (
        <div className="animate-fade-in" style={{
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          borderRadius: 'var(--radius-xl)', padding: '20px', color: 'white',
        }}>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Cobrado hoy
          </p>
          <p style={{ margin: '6px 0', fontSize: 28, fontWeight: 800 }}>
            {formatCOP(resumen.totalMonto ?? 0)}
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} opacity={0.8} />
              <span style={{ fontSize: 12, opacity: 0.8 }}>{resumen.cantidad ?? 0} cobros</span>
            </div>
          </div>
        </div>
      )}

      {/* Lista de cobros */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : cobros.length === 0 ? (
        <div className="empty-state">
          <TrendingUp size={48} color="var(--border)" />
          <p style={{ margin: 0, fontWeight: 600 }}>Sin cobros registrados</p>
          <p style={{ margin: 0, fontSize: 13 }}>Registra el primer cobro del día</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {cobros.map((cobro) => (
            <div key={cobro._id} className="list-item" style={{
              opacity: cobro.anulado ? 0.5 : 1,
            }}>
              <div style={{
                width: 40, height: 40, flexShrink: 0,
                background: 'var(--success-500)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle2 size={20} color="white" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cobro.cliente?.nombre}
                  </p>
                  <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--success-600)', flexShrink: 0, marginLeft: 8 }}>
                    {formatCOP(cobro.monto)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span className={`badge ${TIPO_BADGES[cobro.tipo] ?? 'badge-muted'}`}>
                    {TIPO_LABELS[cobro.tipo] ?? cobro.tipo}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={11} /> {cobro.hora}
                  </span>
                  {cobro.anulado && (
                    <span className="badge badge-danger">Anulado</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
