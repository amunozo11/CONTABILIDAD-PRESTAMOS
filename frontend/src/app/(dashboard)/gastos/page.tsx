'use client';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Loader2, Camera, X, Receipt } from 'lucide-react';
import { apiClient } from '@/services/api';
import { formatCOP, fechaHoyISO } from '@/lib/utils';

const schema = z.object({
  categoria: z.enum(['combustible', 'reparaciones', 'alimentacion', 'otro']),
  descripcion: z.string().min(3).max(500),
  monto: z.string().min(1).transform(Number).pipe(z.number().positive()),
  fecha: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const CATEGORIAS = [
  { val: 'combustible', emoji: '⛽', label: 'Combustible' },
  { val: 'reparaciones', emoji: '🔧', label: 'Reparaciones' },
  { val: 'alimentacion', emoji: '🍽️', label: 'Alimentación' },
  { val: 'otro', emoji: '📦', label: 'Otro' },
];

export default function GastosPage() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fotos, setFotos] = useState<File[]>([]);
  const [montoVal, setMontoVal] = useState('');
  const [categoriaVal, setCategoriaVal] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fecha: fechaHoyISO(), categoria: 'combustible' as FormData['categoria'] },
  });

  const categoriaActual = watch('categoria') || 'combustible';

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      formData.append('categoria', data.categoria);
      formData.append('descripcion', data.descripcion);
      formData.append('monto', String(data.monto));
      if (data.fecha) formData.append('fecha', data.fecha);
      fotos.forEach((f) => formData.append('fotos', f));
      return apiClient.post('/api/gastos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      reset(); setMontoVal(''); setFotos([]); setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const handleFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setFotos((prev) => [...prev, ...files].slice(0, 5));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Registrar Gasto</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
          Combustible, reparaciones, alimentación y más
        </p>
      </div>

      {success && (
        <div className="animate-fade-in" style={{
          background: 'rgb(16 185 129 / 0.12)', border: '1.5px solid var(--success-500)',
          borderRadius: 'var(--radius-md)', padding: '12px 14px', fontSize: 14,
          color: 'var(--success-600)', fontWeight: 600, textAlign: 'center',
        }}>
          ✅ Gasto registrado exitosamente
        </div>
      )}

      <form onSubmit={handleSubmit((d) => mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Categoría */}
        <div className="card">
          <label className="input-label">Categoría *</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 8 }}>
            {CATEGORIAS.map(({ val, emoji, label }) => (
              <label key={val} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '12px 6px', gap: 6,
                border: `2px solid ${categoriaActual === val ? 'var(--brand-500)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                background: categoriaActual === val ? 'var(--brand-50)' : 'transparent',
                cursor: 'pointer',
              }}>
                <input type="radio" value={val} style={{ display: 'none' }}
                  {...register('categoria')}
                  onChange={() => { setCategoriaVal(val); setValue('categoria', val as FormData['categoria']); }}
                />
                <span style={{ fontSize: 24 }}>{emoji}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: categoriaActual === val ? 'var(--brand-600)' : 'var(--text-muted)',
                  textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Detalles */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="input-label">Descripción *</label>
            <input className="input-field" placeholder="Describe el gasto..." {...register('descripcion')} />
            {errors.descripcion && <p className="input-error">{errors.descripcion.message}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="input-label">Monto *</label>
              <input
                className="input-field"
                inputMode="numeric"
                placeholder="$ 0"
                value={montoVal}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setMontoVal(raw ? `$ ${Number(raw).toLocaleString('es-CO')}` : '');
                  setValue('monto', raw as unknown as number);
                }}
              />
              {errors.monto && <p className="input-error">{errors.monto.message as string}</p>}
            </div>
            <div>
              <label className="input-label">Fecha</label>
              <input type="date" className="input-field" {...register('fecha')} />
            </div>
          </div>
        </div>

        {/* Fotos */}
        <div className="card">
          <label className="input-label">Fotos (opcional)</label>
          <input ref={fileRef} type="file" accept="image/*" multiple capture="environment"
            style={{ display: 'none' }} onChange={handleFotos} />

          {fotos.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {fotos.map((f, i) => (
                <div key={i} style={{ position: 'relative', width: 72, height: 72 }}>
                  <img src={URL.createObjectURL(f)} alt="" style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    borderRadius: 'var(--radius-sm)',
                  }} />
                  <button type="button" onClick={() => setFotos(fotos.filter((_, j) => j !== i))}
                    style={{
                      position: 'absolute', top: -6, right: -6, background: 'var(--danger-500)',
                      border: 'none', borderRadius: '50%', width: 20, height: 20,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}>
                    <X size={12} color="white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button type="button" className="btn-secondary"
            onClick={() => fileRef.current?.click()}
            style={{ width: 'auto', padding: '10px 16px', display: 'inline-flex', gap: 8 }}>
            <Camera size={18} />
            {fotos.length === 0 ? 'Tomar / Adjuntar foto' : 'Agregar más fotos'}
          </button>
        </div>

        <button type="submit" className="btn-primary" disabled={isPending} id="btn-crear-gasto">
          {isPending
            ? <><Loader2 size={18} className="animate-pulse-soft" /> Guardando...</>
            : <><Receipt size={18} /> Registrar gasto</>
          }
        </button>
      </form>
    </div>
  );
}
