'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, CreditCard, Filter } from 'lucide-react';
import { useState } from 'react';
import { apiClient } from '@/services/api';
import { formatCOP, formatFechaCO, porcentajeProgreso } from '@/lib/utils';

type Estado = 'activo' | 'completado' | 'cancelado' | 'refinanciado';

const ESTADO_LABELS: Record<Estado, string> = {
  activo: 'Activo', completado: 'Pagado', cancelado: 'Cancelado', refinanciado: 'Refinanciado',
};
const ESTADO_COLORS: Record<Estado, string> = {
  activo: 'badge-success', completado: 'badge-brand', cancelado: 'badge-danger', refinanciado: 'badge-warning',
};

interface Prestamo {
  _id: string; capital: number; totalPagar: number; totalCobrado: number;
  saldoPendiente: number; cuotaDiaria: number; modalidad: string; estado: string;
  fechaInicio: string; fechaFin: string;
  cliente: { nombre: string; cedula: string };
}

export default function PrestamosPage() {
  const [estadoFiltro, setEstadoFiltro] = useState<Estado | ''>('activo');
  const [modalidadFiltro, setModalidadFiltro] = useState<'diaria' | 'semanal' | ''>('');

  const { data, isLoading } = useQuery({
    queryKey: ['prestamos', estadoFiltro, modalidadFiltro],
    queryFn: () => apiClient.get('/api/prestamos', {
      params: {
        estado: estadoFiltro || undefined,
        modalidad: modalidadFiltro || undefined,
        limit: 50,
      }
    }).then((r) => r.data),
  });

  const prestamos: Prestamo[] = data?.data ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Préstamos</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            {data?.pagination?.total ?? 0} registros
          </p>
        </div>
        <Link href="/prestamos/nuevo">
          <button className="btn-primary" style={{ width: 'auto', padding: '10px 16px' }}>
            <Plus size={18} />
          </button>
        </Link>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {(['', 'activo', 'completado', 'cancelado'] as const).map((est) => (
          <button key={est || 'todos'} onClick={() => setEstadoFiltro(est)} style={{
            flex: '0 0 auto', padding: '6px 14px',
            borderRadius: 'var(--radius-full)', border: '1.5px solid',
            borderColor: estadoFiltro === est ? 'var(--brand-500)' : 'var(--border)',
            background: estadoFiltro === est ? 'var(--brand-500)' : 'transparent',
            color: estadoFiltro === est ? 'white' : 'var(--text-secondary)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            {est === '' ? 'Todos' : ESTADO_LABELS[est]}
          </button>
        ))}
        <div style={{ height: 28, width: 1, background: 'var(--border)', flexShrink: 0, alignSelf: 'center' }} />
        {(['', 'diaria', 'semanal'] as const).map((m) => (
          <button key={m || 'todas'} onClick={() => setModalidadFiltro(m as '' | 'diaria' | 'semanal')} style={{
            flex: '0 0 auto', padding: '6px 14px',
            borderRadius: 'var(--radius-full)', border: '1.5px solid',
            borderColor: modalidadFiltro === m ? 'var(--success-500)' : 'var(--border)',
            background: modalidadFiltro === m ? 'var(--success-500)' : 'transparent',
            color: modalidadFiltro === m ? 'white' : 'var(--text-secondary)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            {m === '' ? 'Todos' : m === 'diaria' ? 'Diaria' : 'Semanal'}
          </button>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : prestamos.length === 0 ? (
        <div className="empty-state">
          <CreditCard size={48} color="var(--border)" />
          <p style={{ margin: 0, fontWeight: 600 }}>No hay préstamos</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {prestamos.map((p) => {
            const prog = porcentajeProgreso(p.totalCobrado, p.totalPagar);
            const estado = p.estado as Estado;
            return (
              <Link key={p._id} href={`/prestamos/${p._id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 15,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.cliente?.nombre}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                        {p.modalidad === 'diaria' ? '115 cuotas' : '4 semanas'} de {formatCOP(p.cuotaDiaria)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', marginLeft: 12, flexShrink: 0 }}>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: 16 }}>{formatCOP(p.capital)}</p>
                      <span className={`badge ${ESTADO_COLORS[estado] ?? 'badge-muted'}`}>
                        {ESTADO_LABELS[estado] ?? estado}
                      </span>
                    </div>
                  </div>

                  <div className="progress-bar">
                    <div className={`progress-fill ${prog >= 100 ? 'success' : ''}`} style={{ width: `${prog}%` }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Inicio: {formatFechaCO(p.fechaInicio)}
                    </span>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: p.estado === 'activo' ? 'var(--danger-500)' : 'var(--text-muted)',
                    }}>
                      Saldo: {formatCOP(p.saldoPendiente)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
