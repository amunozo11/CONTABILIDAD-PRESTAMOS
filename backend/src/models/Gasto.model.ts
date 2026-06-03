import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGasto extends Document {
  categoria: 'combustible' | 'reparaciones' | 'alimentacion' | 'otro';
  descripcion: string;
  monto: number;
  fecha: Date;
  usuario: Types.ObjectId;
  fotos: string[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GastoSchema = new Schema<IGasto>(
  {
    categoria: {
      type: String,
      enum: ['combustible', 'reparaciones', 'alimentacion', 'otro'],
      required: true,
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción es requerida'],
      trim: true,
      maxlength: [500, 'La descripción no puede superar 500 caracteres'],
    },
    monto: {
      type: Number,
      required: true,
      min: [1, 'El monto debe ser mayor a 0'],
    },
    fecha: {
      type: Date,
      required: true,
      default: Date.now,
    },
    usuario: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    fotos: {
      type: [String],
      default: [],
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

GastoSchema.index({ fecha: -1 });
GastoSchema.index({ usuario: 1 });
GastoSchema.index({ categoria: 1 });
GastoSchema.index({ deletedAt: 1 });

GastoSchema.pre(/^find/, function (this: mongoose.Query<unknown, IGasto>, next) {
  this.where({ deletedAt: null });
  next();
});

export const GastoModel = mongoose.model<IGasto>('Gasto', GastoSchema);
