'use client';
import { useRef, useState, use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Phone, MapPin, ChevronRight, CreditCard, Plus, Camera, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/api';
import { formatCOP, formatFechaCO, porcentajeProgreso } from '@/lib/utils';

const ESTADO_COLORS: Record<string, string> = {
  activo: 'badge-success', moroso: 'badge-danger', inactivo: 'badge-muted', cancelado: 'badge-muted',
};
const ESTADO_LABELS: Record<string, string> = {
  activo: 'Activo', moroso: 'En mora', inactivo: 'Inactivo', cancelado: 'Cancelado',
};

// ─── Componente de subida de foto ─────────────────────────────
function FotoUploader({ clienteId, fotoActual }: { clienteId: string; fotoActual?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<string | null>(fotoActual ?? null);

  const { mutate: subirFoto, isPending } = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('foto', file);
      const res = await apiClient.post(
        `/api/clientes/${clienteId}/fotos/cliente`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return res.data.data as string; // URL de Cloudinary
    },
    onSuccess: (url) => {
      setPreview(url);
      queryClient.invalidateQueries({ queryKey: ['cliente', clienteId] });
    },
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Preview local inmediato (Safari compatible con FileReader)
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    subirFoto(file);
  }

  return (
    <div
      onClick={() => !isPending && inputRef.current?.click()}
      style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'rgb(255 255 255 / 0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', flexShrink: 0,
        cursor: isPending ? 'wait' : 'pointer',
        position: 'relative',
      }}
      title="Toca para cambiar foto"
    >
      {isPending ? (
        <Loader2 size={24} color="white" style={{ animation: 'spin 1s linear infinite' }} />
      ) : preview ? (
        <>
          <img src={preview} alt="Foto cliente" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {/* Overlay cámara */}
          <div style={{
            position: 'absolute', inset: 0, background: 'rgb(0 0 0 / 0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 0.2s',
          }} className="foto-overlay">
            <Camera size={18} color="white" />
          </div>
        </>
      ) : (
        <Camera size={24} color="white" />
      )}
      {/* Input oculto — accept="image/*" funciona en iOS Safari */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleChange}
        aria-label="Subir foto del cliente"
      />
    </div>
  );
}

export default function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: cliente, isLoading } = useQuery({
    queryKey: ['cliente', id],
    queryFn: () => apiClient.get(`/api/clientes/${id}`).then((r) => r.data.data),
  });

  const { data: prestamos } = useQuery({
    queryKey: ['cliente-prestamos', id],
    queryFn: () => apiClient.get(`/api/clientes/${id}/prestamos`).then((r) => r.data.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-lg)' }} />)}
      </div>
    );
  }

  if (!cliente) return <div className="empty-state">Cliente no encontrado</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header del cliente */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
        color: 'white', padding: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <FotoUploader clienteId={id} fotoActual={cliente.fotos?.cliente} />
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{cliente.nombre}</h1>
            <p style={{ margin: '2px 0 0', opacity: 0.85, fontSize: 14 }}>CC: {cliente.cedula}</p>
            <span style={{
              display: 'inline-block', marginTop: 6,
              background: 'rgb(255 255 255 / 0.2)',
              padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
            }}>
              {ESTADO_LABELS[cliente.estado] ?? cliente.estado}
            </span>
          </div>
        </div>
      </div>

      {/* Datos de contacto */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0, overflow: 'hidden' }}>
        <a href={`tel:${cliente.celular}`} className="list-item" style={{ cursor: 'pointer' }}>
          <Phone size={20} color="var(--brand-500)" />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Celular</p>
            <p style={{ margin: '2px 0 0', fontWeight: 600 }}>{cliente.celular}</p>
          </div>
          <span style={{ fontSize: 12, color: 'var(--brand-500)', fontWeight: 600 }}>Llamar</span>
        </a>

        <div className="list-item" style={{ cursor: 'default' }}>
          <MapPin size={20} color="var(--text-muted)" />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Dirección</p>
            <p style={{ margin: '2px 0 0', fontWeight: 600, fontSize: 14 }}>
              {cliente.direccion}, {cliente.barrio}, {cliente.ciudad}
            </p>
          </div>
        </div>

        {cliente.referencia && (
          <div className="list-item" style={{ cursor: 'default' }}>
            <div style={{ width: 20, flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Referencia</p>
              <p style={{ margin: '2px 0 0', fontWeight: 600, fontSize: 14 }}>{cliente.referencia}</p>
            </div>
          </div>
        )}
      </div>

      {/* Resumen financiero */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { label: 'Préstamos activos', value: String(cliente.prestamosActivos), color: 'var(--brand-500)' },
          { label: 'Total prestado', value: formatCOP(cliente.totalPrestado ?? 0), color: 'var(--text-primary)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color }}>{value}</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Préstamos del cliente */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Préstamos</h2>
          <Link href={`/prestamos/nuevo?clienteId=${id}`}>
            <button className="btn-primary" style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }}>
              <Plus size={16} /> Nuevo
            </button>
          </Link>
        </div>

        {!prestamos || prestamos.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px' }}>
            <CreditCard size={36} color="var(--border)" />
            <p style={{ margin: 0, fontWeight: 600 }}>Sin préstamos registrados</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {prestamos.map((p: Prestamo) => {
              const prog = porcentajeProgreso(p.totalCobrado, p.totalPagar);
              const isActivo = p.estado === 'activo';
              return (
                <Link key={p._id} href={`/prestamos/${p._id}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{formatCOP(p.capital)}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                          {p.modalidad === 'diaria' ? '115 cuotas diarias' : '4 cuotas semanales'} de {formatCOP(p.cuotaDiaria)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className={`badge ${isActivo ? 'badge-success' : 'badge-muted'}`}>
                          {p.estado}
                        </span>
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                          {formatFechaCO(p.fechaInicio)}
                        </p>
                      </div>
                    </div>

                    <div className="progress-bar">
                      <div className={`progress-fill ${prog >= 100 ? 'success' : ''}`} style={{ width: `${prog}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Cobrado: {formatCOP(p.totalCobrado)}
                      </span>
                      <span style={{ fontSize: 11, color: isActivo ? 'var(--danger-500)' : 'var(--text-muted)', fontWeight: 600 }}>
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
    </div>
  );
}

interface Prestamo {
  _id: string; capital: number; totalPagar: number; totalCobrado: number;
  saldoPendiente: number; cuotaDiaria: number; modalidad: string;
  estado: string; fechaInicio: string;
}
