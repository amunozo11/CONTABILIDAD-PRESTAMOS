import { z } from 'zod';

export const CrearGastoDto = z.object({
  categoria: z.enum(['combustible', 'reparaciones', 'alimentacion', 'otro']),
  descripcion: z.string().min(3, 'La descripción debe tener al menos 3 caracteres').max(500),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida').optional(),
});

export const FiltrosGastoDto = z.object({
  categoria: z.enum(['combustible', 'reparaciones', 'alimentacion', 'otro']).optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  page: z.string().default('1').transform(Number),
  limit: z.string().default('20').transform(Number),
});

export type CrearGastoDto = z.infer<typeof CrearGastoDto>;
export type FiltrosGastoDto = z.infer<typeof FiltrosGastoDto>;
