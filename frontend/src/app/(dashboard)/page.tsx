'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { TrendingUp, Users, AlertTriangle, DollarSign, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/api';
import { formatCOP, formatFechaCO } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

// ─── KPI Card ─────────────────────────────────────────────────
function KPICard({
  label, value, sub, gradient, icon: Icon
}: {
  label: string; value: string; sub?: string;
  gradient: string; icon: React.ElementType;
}) {
  return (
    <div className="animate-fade-in" style={{
      background: gradient,
      borderRadius: 'var(--radius-lg)',
      padding: '16px',
      color: 'white',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
          <p style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800 }}>{value}</p>
          {sub && <p style={{ margin: '2px 0 0', fontSize: 12, opacity: 0.75 }}>{sub}</p>}
        </div>
        <div style={{ background: 'rgb(255 255 255 / 0.2)', borderRadius: 10, padding: 8 }}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

// ─── Tooltip COP ──────────────────────────────────────────────
const COPTooltip = ({ active, payload, label }: Record<string, unknown>) => {
  if (active && Array.isArray(payload) && payload.length) {
    return (
      <div className="card" style={{ padding: '8px 12px', fontSize: 12 }}>
        <p style={{ margin: 0, fontWeight: 600 }}>{String(label)}</p>
        {(payload as Array<{name: string; value: number}>).map((p) => (
          <p key={p.name} style={{ margin: '2px 0', color: 'var(--brand-500)' }}>
            {p.name}: {formatCOP(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { usuario } = useAuthStore();

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => apiClient.get('/api/dashboard/kpis').then((r) => r.data.data),
    refetchInterval: 60_000, // Refrescar cada minuto
  });

  const { data: flujoCaja } = useQuery({
    queryKey: ['flujo-caja'],
    queryFn: () => apiClient.get('/api/dashboard/flujo-caja?dias=14').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Loader2 size={32} className="animate-pulse-soft" color="var(--brand-500)" />
      </div>
    );
  }

  const hoy = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
    timeZone: 'America/Bogota',
  });

  // Formatear datos para gráfica
  const chartData = (flujoCaja?.cobros ?? []).map((d: { _id: { day: number; month: number }; cobros: number }) => ({
    dia: `${d._id.day}/${d._id.month}`,
    Cobros: d.cobros,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Saludo */}
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
          Hola, {usuario?.nombre.split(' ')[0]} 👋
        </h1>
        <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
          {hoy}
        </p>
      </div>

      {/* Acción rápida — Registrar cobro */}
      <Link href="/cobros/registrar" style={{ textDecoration: 'none' }}>
        <div style={{
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'white',
          boxShadow: '0 8px 24px rgb(79 70 229 / 0.3)',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>Acción rápida</p>
            <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700 }}>Registrar Cobro</p>
          </div>
          <div style={{
            width: 48, height: 48,
            background: 'rgb(255 255 255 / 0.2)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plus size={24} />
          </div>
        </div>
      </Link>

      {/* KPIs en grid 2x2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <KPICard
          label="Cobros hoy"
          value={formatCOP(kpis?.cobros?.dia?.monto ?? 0)}
          sub={`${kpis?.cobros?.dia?.cantidad ?? 0} cobros`}
          gradient="linear-gradient(135deg, #4f46e5, #7c3aed)"
          icon={DollarSign}
        />
        <KPICard
          label="Esta semana"
          value={formatCOP(kpis?.cobros?.semana?.monto ?? 0)}
          sub={`${kpis?.cobros?.semana?.cantidad ?? 0} cobros`}
          gradient="linear-gradient(135deg, #059669, #0d9488)"
          icon={TrendingUp}
        />
        <KPICard
          label="Clientes activos"
          value={String(kpis?.clientes?.activos ?? 0)}
          sub={`${kpis?.clientes?.morosos ?? 0} en mora`}
          gradient="linear-gradient(135deg, #d97706, #f59e0b)"
          icon={Users}
        />
        <KPICard
          label="Saldo pendiente"
          value={formatCOP(kpis?.capital?.saldoPendiente ?? 0)}
          sub={`${kpis?.capital?.prestamosActivos ?? 0} préstamos`}
          gradient="linear-gradient(135deg, #dc2626, #db2777)"
          icon={AlertTriangle}
        />
      </div>

      {/* Resumen financiero */}
      <div className="card">
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Resumen del mes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Capital colocado', value: kpis?.capital?.colocado ?? 0, color: 'var(--brand-500)' },
            { label: 'Total cobrado', value: kpis?.capital?.recuperado ?? 0, color: 'var(--success-500)' },
            { label: 'Ganancias', value: kpis?.capital?.ganancias ?? 0, color: 'var(--warning-500)' },
            { label: 'Gastos del mes', value: kpis?.financiero?.gastosMes ?? 0, color: 'var(--danger-500)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color }}>{formatCOP(value)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Flujo de caja</span>
            <span style={{
              fontSize: 16, fontWeight: 800,
              color: (kpis?.financiero?.flujoCaja ?? 0) >= 0 ? 'var(--success-500)' : 'var(--danger-500)',
            }}>
              {formatCOP(kpis?.financiero?.flujoCaja ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Gráfica cobros últimos 14 días */}
      {chartData.length > 0 && (
        <div className="card">
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Cobros últimos 14 días</h2>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCobros" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="dia" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis hide />
              <Tooltip content={<COPTooltip />} />
              <Area
                type="monotone"
                dataKey="Cobros"
                stroke="#4f46e5"
                strokeWidth={2}
                fill="url(#colorCobros)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Links rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { href: '/clientes/nuevo', label: 'Nuevo Cliente', color: 'var(--success-500)' },
          { href: '/prestamos/nuevo', label: 'Nuevo Préstamo', color: 'var(--brand-500)' },
          { href: '/cobros', label: 'Ver Cobros', color: 'var(--warning-500)' },
          { href: '/reportes', label: 'Exportar', color: 'var(--text-secondary)' },
        ].map(({ href, label, color }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <div className="card" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', cursor: 'pointer',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color }}>{label}</span>
              <ArrowRight size={16} color={color} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
