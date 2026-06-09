'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, ChevronRight, Phone, User } from 'lucide-react';
import { apiClient } from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';

type Estado = 'activo' | 'inactivo' | 'moroso' | 'cancelado';

const ESTADO_COLORS: Record<Estado, string> = {
  activo: 'badge-success',
  moroso: 'badge-danger',
  inactivo: 'badge-muted',
  cancelado: 'badge-muted',
};

const ESTADO_LABELS: Record<Estado, string> = {
  activo: 'Activo',
  moroso: 'En mora',
  inactivo: 'Inactivo',
  cancelado: 'Cancelado',
};

export default function ClientesPage() {
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<Estado | ''>('');
  const debouncedBusqueda = useDebounce(busqueda, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', debouncedBusqueda, estadoFiltro],
    queryFn: () => apiClient.get('/api/clientes', {
      params: { busqueda: debouncedBusqueda || undefined, estado: estadoFiltro || undefined, limit: 50 }
    }).then((r) => r.data),
    staleTime: 30_000,
  });

  const clientes: Cliente[] = data?.data ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Clientes</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            {data?.pagination?.total ?? 0} registros
          </p>
        </div>
        <Link href="/clientes/nuevo">
          <button className="btn-primary" style={{ width: 'auto', padding: '10px 16px' }}>
            <Plus size={18} />
          </button>
        </Link>
      </div>

      {/* Buscador */}
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-muted)',
        }} />
        <input
          type="search"
          placeholder="Buscar por nombre, cédula o celular..."
          className="input-field"
          style={{ paddingLeft: 44 }}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* Filtros de estado */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {(['', 'activo', 'moroso', 'inactivo'] as const).map((estado) => (
          <button
            key={estado || 'todos'}
            onClick={() => setEstadoFiltro(estado as Estado | '')}
            style={{
              flex: '0 0 auto',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1.5px solid',
              borderColor: estadoFiltro === estado ? 'var(--brand-500)' : 'var(--border)',
              background: estadoFiltro === estado ? 'var(--brand-500)' : 'transparent',
              color: estadoFiltro === estado ? 'white' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {estado === '' ? 'Todos' : ESTADO_LABELS[estado]}
          </button>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : clientes.length === 0 ? (
        <div className="empty-state">
          <User size={48} color="var(--border)" />
          <p style={{ margin: 0, fontWeight: 600 }}>No se encontraron clientes</p>
          <p style={{ margin: 0, fontSize: 13 }}>Agrega tu primer cliente con el botón +</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {clientes.map((cliente) => (
            <Link
              key={cliente._id}
              href={`/clientes/${cliente._id}`}
              className="list-item"
            >
              {/* Avatar */}
              <div style={{
                width: 44, height: 44, flexShrink: 0,
                borderRadius: '50%',
                background: 'var(--brand-100)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {cliente.fotos?.cliente ? (
                  <img
                    src={cliente.fotos.cliente}
                    alt={cliente.nombre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-text)' }}>
                    {cliente.nombre[0].toUpperCase()}
                  </span>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 15,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cliente.nombre}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cliente.celular}</span>
                  {cliente.prestamosActivos > 0 && (
                    <span style={{ fontSize: 11, background: 'var(--brand-50)', color: 'var(--brand-text)',
                      padding: '1px 6px', borderRadius: 99, fontWeight: 600 }}>
                      {cliente.prestamosActivos} activo{cliente.prestamosActivos > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Estado + chevron */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span className={`badge ${ESTADO_COLORS[cliente.estado as Estado] ?? 'badge-muted'}`}>
                  {ESTADO_LABELS[cliente.estado as Estado] ?? cliente.estado}
                </span>
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

interface Cliente {
  _id: string;
  nombre: string;
  cedula: string;
  celular: string;
  estado: string;
  prestamosActivos: number;
  fotos?: { cliente?: string };
}
