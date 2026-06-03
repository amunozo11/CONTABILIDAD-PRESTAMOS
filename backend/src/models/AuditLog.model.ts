import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAuditLog extends Document {
  usuario?: Types.ObjectId;
  accion: string;
  recurso: string;
  recursoId?: string;
  datosAntes?: Record<string, unknown>;
  datosDespues?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    usuario: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    accion: {
      type: String,
      required: true,
      // ej: 'CREATE_COBRO', 'EDIT_PRESTAMO', 'LOGIN', 'LOGOUT_ALL'
    },
    recurso: {
      type: String,
      required: true,
    },
    recursoId: String,
    datosAntes: Schema.Types.Mixed,
    datosDespues: Schema.Types.Mixed,
    ip: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
    // AuditLogs NUNCA tienen createdAt/updatedAt automáticos
    // ni soft delete — son inmutables
  }
);

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ usuario: 1, timestamp: -1 });
AuditLogSchema.index({ recurso: 1, recursoId: 1 });

// TTL automático: eliminar logs con más de 2 años (en segundos)
AuditLogSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 63_072_000 } // 2 años
);

export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
