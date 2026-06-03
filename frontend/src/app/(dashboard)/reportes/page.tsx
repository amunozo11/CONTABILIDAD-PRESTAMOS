'use client';
import { useState } from 'react';
import { Download, FileText, Table } from 'lucide-react';
import { apiClient } from '@/services/api';
import { fechaHoyISO } from '@/lib/utils';

type Formato = 'csv' | 'excel';
type Tipo = 'cobros' | 'prestamos';

export default function ReportesPage() {
  const [mes, setMes] = useState(fechaHoyISO().substring(0, 7));
  const [loading, setLoading] = useState<string | null>(null);

  const descargar = async (tipo: Tipo, formato: Formato) => {
    const key = `${tipo}-${formato}`;
    setLoading(key);
    try {
      const params: Record<string, string> = { formato };
      if (tipo === 'cobros') params['mes'] = mes;
      const res = await apiClient.get(`/api/reportes/${tipo}`, {
        params,
        responseType: 'blob',
      });
      const ext = formato === 'excel' ? 'xlsx' : 'csv';
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tipo}_${mes || 'todos'}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error al descargar el reporte');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Reportes</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
          Exportar datos en CSV o Excel
        </p>
      </div>

      {/* Filtro de mes */}
      <div className="card">
        <label className="input-label">Mes del reporte</label>
        <input
          type="month"
          className="input-field"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
        />
      </div>

      {/* Cobros */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <FileText size={20} color="var(--brand-500)" />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Cobros del mes</h2>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          Todos los cobros realizados en el período seleccionado
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={() => descargar('cobros', 'csv')}
            disabled={loading !== null}
            style={{ gap: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Download size={16} />
            {loading === 'cobros-csv' ? 'Descargando...' : 'CSV'}
          </button>
          <button
            className="btn-primary"
            onClick={() => descargar('cobros', 'excel')}
            disabled={loading !== null}
            style={{ gap: 8 }}
          >
            <Table size={16} />
            {loading === 'cobros-excel' ? 'Descargando...' : 'Excel'}
          </button>
        </div>
      </div>

      {/* Préstamos */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Table size={20} color="var(--success-500)" />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Cartera activa</h2>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          Todos los préstamos activos con saldo pendiente
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={() => descargar('prestamos', 'csv')}
            disabled={loading !== null}
            style={{ gap: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Download size={16} />
            {loading === 'prestamos-csv' ? 'Descargando...' : 'CSV'}
          </button>
          <button
            className="btn-primary"
            onClick={() => descargar('prestamos', 'excel')}
            disabled={loading !== null}
            style={{ gap: 8 }}
          >
            <Table size={16} />
            {loading === 'prestamos-excel' ? 'Descargando...' : 'Excel'}
          </button>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
        Los archivos CSV pueden abrirse en Excel con codificación UTF-8
      </p>
    </div>
  );
}
