import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFotosCliente {
  cliente?: string;
  documento?: string;
  vivienda?: string;
}

export interface ICliente extends Document {
  nombre: string;
  cedula: string;
  celular: string;
  direccion: string;
  barrio: string;
  ciudad: string;
  referencia?: string;
  fotos: IFotosCliente;
  observaciones?: string;
  estado: 'activo' | 'inactivo' | 'moroso' | 'cancelado';
  prestamosActivos: number;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ClienteSchema = new Schema<ICliente>(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
      maxlength: [150, 'El nombre no puede superar 150 caracteres'],
    },
    cedula: {
      type: String,
      required: [true, 'La cédula es requerida'],
      trim: true,
      maxlength: [20, 'Cédula inválida'],
    },
    celular: {
      type: String,
      required: [true, 'El celular es requerido'],
      trim: true,
      maxlength: [20, 'Celular inválido'],
    },
    direccion: {
      type: String,
      required: [true, 'La dirección es requerida'],
      trim: true,
    },
    barrio: {
      type: String,
      required: [true, 'El barrio es requerido'],
      trim: true,
    },
    ciudad: {
      type: String,
      required: [true, 'La ciudad es requerida'],
      trim: true,
    },
    referencia: {
      type: String,
      trim: true,
    },
    fotos: {
      cliente: String,
      documento: String,
      vivienda: String,
    },
    observaciones: {
      type: String,
      maxlength: [1000, 'Las observaciones no pueden superar 1000 caracteres'],
    },
    estado: {
      type: String,
      enum: ['activo', 'inactivo', 'moroso', 'cancelado'],
      default: 'activo',
    },
    prestamosActivos: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Índices ──────────────────────────────────────────────────
ClienteSchema.index({ cedula: 1 }, { unique: true, sparse: true });
ClienteSchema.index({ celular: 1 });
ClienteSchema.index({ estado: 1 });
ClienteSchema.index({ nombre: 'text', cedula: 'text' });
ClienteSchema.index({ deletedAt: 1 });

// ─── Soft delete ─────────────────────────────────────────────
ClienteSchema.pre(/^find/, function (this: mongoose.Query<unknown, ICliente>, next) {
  this.where({ deletedAt: null });
  next();
});

export const ClienteModel = mongoose.model<ICliente>('Cliente', ClienteSchema);
