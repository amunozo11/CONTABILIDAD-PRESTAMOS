import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { ResponseHelper } from '../utils/responses';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 400, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super(`${resource} no encontrado`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acceso denegado') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

// ─── Middleware global de manejo de errores ───────────────────
export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Error de validación Zod
  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    ResponseHelper.error(res, `Error de validación: ${messages}`, 422);
    return;
  }

  // Error operacional conocido
  if (err instanceof AppError && err.isOperational) {
    ResponseHelper.error(res, err.message, err.statusCode);
    return;
  }

  // Error de MongoDB — documento duplicado
  if ((err as { code?: number | string }).code === 11000) {
    const field = Object.keys((err as { keyValue?: Record<string, unknown> }).keyValue ?? {})[0];
    ResponseHelper.error(res, `Ya existe un registro con ese ${field ?? 'valor'}`, 409);
    return;
  }

  // Error no esperado — loguear y responder genérico
  logger.error('Error no manejado:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  ResponseHelper.serverError(res, 'Error interno del servidor');
}

// ─── Handler de rutas no encontradas ─────────────────────────
export function notFoundMiddleware(req: Request, res: Response): void {
  ResponseHelper.error(res, `Ruta ${req.method} ${req.path} no existe`, 404);
}
