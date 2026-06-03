import { Request, Response, NextFunction } from 'express';
import { AuditLogModel } from '../../models/AuditLog.model';
import { logger } from '../utils/logger';

interface AuditOptions {
  accion: string;
  recurso: string;
  getRecursoId?: (req: Request) => string | undefined;
}

// ─── Middleware de auditoría ─────────────────────────────────
export function auditMiddleware(options: AuditOptions) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // Capturar datos originales de la respuesta
    const originalJson = _res.json.bind(_res);

    _res.json = function (body: unknown) {
      // Registrar auditoría solo en operaciones exitosas (2xx)
      if (_res.statusCode >= 200 && _res.statusCode < 300 && req.user) {
        const recursoId = options.getRecursoId
          ? options.getRecursoId(req)
          : (req.params?.['id']);

        AuditLogModel.create({
          usuario: req.user.sub,
          accion: options.accion,
          recurso: options.recurso,
          recursoId: recursoId,
          datosAntes: req.method !== 'POST' ? req.body : undefined,
          datosDespues: req.method !== 'GET' ? (body as Record<string, unknown>)?.data : undefined,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          timestamp: new Date(),
        }).catch((err) => logger.error('Error en auditoría:', err));
      }

      return originalJson(body);
    };

    next();
  };
}
