'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import type { Metadata } from 'next';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setErrorMsg('');
    try {
      const deviceInfo = navigator.userAgent.substring(0, 100);
      const res = await apiClient.post('/api/auth/login', { ...data, deviceInfo });
      const { usuario, tokens } = res.data.data;
      setAuth(
        { id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
        tokens.accessToken,
        tokens.refreshToken
      );
      router.replace('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorMsg(msg || 'Error al iniciar sesión. Intenta nuevamente.');
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72,
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          borderRadius: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 8px 32px rgb(79 70 229 / 0.3)',
        }}>
          <span style={{ color: 'white', fontSize: 32, fontWeight: 800 }}>G</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>
          GotaGota
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
          Gestión de préstamos diarios
        </p>
      </div>

      {/* Card de login */}
      <div className="card" style={{ width: '100%', maxWidth: 380 }}>
        <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
          Iniciar sesión
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label className="input-label" htmlFor="email">Correo electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }} />
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                className="input-field"
                style={{ paddingLeft: 44 }}
                placeholder="correo@ejemplo.com"
                {...register('email')}
              />
            </div>
            {errors.email && <p className="input-error">{errors.email.message}</p>}
          </div>

          {/* Contraseña */}
          <div style={{ marginBottom: 24 }}>
            <label className="input-label" htmlFor="password">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }} />
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                className="input-field"
                style={{ paddingLeft: 44, paddingRight: 48 }}
                placeholder="Contraseña"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: 4,
                }}
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="input-error">{errors.password.message}</p>}
          </div>

          {/* Error de servidor */}
          {errorMsg && (
            <div style={{
              background: 'rgb(239 68 68 / 0.1)',
              border: '1px solid rgb(239 68 68 / 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: 16,
              fontSize: 13,
              color: 'var(--danger-600)',
            }}>
              {errorMsg}
            </div>
          )}

          {/* Botón */}
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            id="btn-login"
          >
            {isSubmitting ? (
              <><Loader2 size={18} className="animate-pulse-soft" /> Ingresando...</>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
        © 2026 GotaGota · Sistema privado
      </p>
    </div>
  );
}
