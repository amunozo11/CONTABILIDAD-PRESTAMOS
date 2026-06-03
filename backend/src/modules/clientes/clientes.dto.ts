import { z } from 'zod';

export const CrearClienteDto = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(150),
  cedula: z.string().min(5, 'Cédula inválida').max(20),
  celular: z.string().min(7, 'Celular inválido').max(20),
  direccion: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  barrio: z.string().min(2).max(100),
  ciudad: z.string().min(2).max(100),
  referencia: z.string().max(300).optional(),
  observaciones: z.string().max(1000).optional(),
  estado: z.enum(['activo', 'inactivo', 'moroso', 'cancelado']).default('activo'),
});

export const ActualizarClienteDto = CrearClienteDto.partial();

export const FiltrosClienteDto = z.object({
  busqueda: z.string().optional(),
  estado: z.enum(['activo', 'inactivo', 'moroso', 'cancelado']).optional(),
  ciudad: z.string().optional(),
  page: z.string().default('1').transform(Number),
  limit: z.string().default('20').transform(Number),
});

export type CrearClienteDto = z.infer<typeof CrearClienteDto>;
export type ActualizarClienteDto = z.infer<typeof ActualizarClienteDto>;
export type FiltrosClienteDto = z.infer<typeof FiltrosClienteDto>;
