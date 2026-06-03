import { z } from 'zod';

export const LoginDto = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  deviceInfo: z.string().optional().default('Desconocido'),
});

export const RefreshTokenDto = z.object({
  refreshToken: z.string().min(1, 'Refresh token requerido'),
});

export const ForgotPasswordDto = z.object({
  email: z.string().email('Email inválido'),
});

export const ResetPasswordDto = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
});

export const CambiarPasswordDto = z.object({
  passwordActual: z.string().min(1, 'La contraseña actual es requerida'),
  passwordNueva: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
});

export type LoginDto = z.infer<typeof LoginDto>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenDto>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordDto>;
export type ResetPasswordDto = z.infer<typeof ResetPasswordDto>;
export type CambiarPasswordDto = z.infer<typeof CambiarPasswordDto>;
