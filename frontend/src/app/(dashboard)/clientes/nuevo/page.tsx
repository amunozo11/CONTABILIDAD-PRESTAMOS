'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/services/api';

const schema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres').max(150),
  cedula: z.string().min(5, 'Cédula inválida').max(20),
  celular: z.string().min(7, 'Celular inválido').max(20),
  direccion: z.string().min(5, 'Mínimo 5 caracteres'),
  barrio: z.string().min(2).max(100),
  ciudad: z.string().min(2).max(100),
  referencia: z.string().max(300).optional(),
  observaciones: z.string().max(1000).optional(),
});

type FormData = z.infer<typeof schema>;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="input-label">{label}</label>
      {children}
      {error && <p className="input-error">{error}</p>}
    </div>
  );
}

export default function NuevoClientePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => apiClient.post('/api/clientes', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      router.push(`/clientes/${res.data.data._id}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(msg || 'Error al crear el cliente');
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Nuevo Cliente</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
          Completa los datos del cliente
        </p>
      </div>

      <form onSubmit={handleSubmit((data) => mutate(data))} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Sección: Datos personales */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Datos personales
          </h2>

          <Field label="Nombre completo *" error={errors.nombre?.message}>
            <input className="input-field" placeholder="Ej: María García López" autoCapitalize="words" {...register('nombre')} />
          </Field>

          <Field label="Cédula *" error={errors.cedula?.message}>
            <input className="input-field" placeholder="Ej: 1234567890" inputMode="numeric" autoComplete="off" {...register('cedula')} />
          </Field>

          <Field label="Celular *" error={errors.celular?.message}>
            <input className="input-field" placeholder="Ej: 3001234567" inputMode="tel" autoComplete="tel" {...register('celular')} />
          </Field>
        </div>

        {/* Sección: Ubicación */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Ubicación
          </h2>

          <Field label="Dirección *" error={errors.direccion?.message}>
            <input className="input-field" placeholder="Calle 10 # 5-20" autoCapitalize="words" {...register('direccion')} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Barrio *" error={errors.barrio?.message}>
              <input className="input-field" placeholder="El Centro" autoCapitalize="words" {...register('barrio')} />
            </Field>
            <Field label="Ciudad *" error={errors.ciudad?.message}>
              <input className="input-field" placeholder="Bogotá" autoCapitalize="words" {...register('ciudad')} />
            </Field>
          </div>
        </div>

        {/* Sección: Adicional */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Información adicional
          </h2>

          <Field label="Referencia personal" error={errors.referencia?.message}>
            <input className="input-field" placeholder="Nombre y teléfono de referencia" {...register('referencia')} />
          </Field>

          <Field label="Observaciones" error={errors.observaciones?.message}>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Notas adicionales sobre el cliente..."
              style={{ resize: 'none' }}
              {...register('observaciones')}
            />
          </Field>
        </div>

        {serverError && (
          <div style={{
            background: 'rgb(239 68 68 / 0.1)', border: '1px solid rgb(239 68 68 / 0.3)',
            borderRadius: 'var(--radius-md)', padding: '12px 14px',
            fontSize: 13, color: 'var(--danger-600)',
          }}>
            {serverError}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={isPending} id="btn-crear-cliente">
          {isPending ? <><Loader2 size={18} className="animate-pulse-soft" /> Guardando...</> : 'Crear Cliente'}
        </button>
      </form>
    </div>
  );
}
