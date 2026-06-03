import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env';
import { clientesRepository } from './clientes.repository';
import { NotFoundError, ConflictError } from '../../shared/middleware/error.middleware';
import { PrestamoModel } from '../../models/Prestamo.model';
import type { CrearClienteDto, ActualizarClienteDto, FiltrosClienteDto } from './clientes.dto';
import type { ICliente } from '../../models/Cliente.model';

// Configurar Cloudinary
if (env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export class ClientesService {
  async listar(filtros: FiltrosClienteDto) {
    return clientesRepository.findAll(filtros);
  }

  async obtener(id: string): Promise<ICliente> {
    const cliente = await clientesRepository.findById(id);
    if (!cliente) throw new NotFoundError('Cliente');
    return cliente;
  }

  async crear(dto: CrearClienteDto, usuarioId: string): Promise<ICliente> {
    // Verificar cédula única
    const existente = await clientesRepository.findByCedula(dto.cedula);
    if (existente) {
      throw new ConflictError(`Ya existe un cliente con la cédula ${dto.cedula}`);
    }

    return clientesRepository.create({
      ...dto,
      createdBy: usuarioId as unknown as import('mongoose').Types.ObjectId,
    });
  }

  async actualizar(id: string, dto: ActualizarClienteDto, usuarioId: string): Promise<ICliente> {
    const cliente = await clientesRepository.findById(id);
    if (!cliente) throw new NotFoundError('Cliente');

    // Si se cambia cédula, verificar que no exista
    if (dto.cedula && dto.cedula !== cliente.cedula) {
      const existente = await clientesRepository.findByCedula(dto.cedula);
      if (existente) throw new ConflictError(`Ya existe un cliente con la cédula ${dto.cedula}`);
    }

    const actualizado = await clientesRepository.update(id, {
      ...dto,
      updatedBy: usuarioId as unknown as import('mongoose').Types.ObjectId,
    });

    return actualizado!;
  }

  async eliminar(id: string): Promise<void> {
    const cliente = await clientesRepository.findById(id);
    if (!cliente) throw new NotFoundError('Cliente');

    // No eliminar si tiene préstamos activos
    const prestamosActivos = await PrestamoModel.countDocuments({
      cliente: id,
      estado: 'activo',
    });

    if (prestamosActivos > 0) {
      throw new ConflictError('No se puede eliminar un cliente con préstamos activos');
    }

    await clientesRepository.softDelete(id);
  }

  async subirFoto(
    clienteId: string,
    tipo: 'cliente' | 'documento' | 'vivienda',
    fileBuffer: Buffer,
    _mimetype: string
  ): Promise<string> {
    const cliente = await clientesRepository.findById(clienteId);
    if (!cliente) throw new NotFoundError('Cliente');

    // Subir a Cloudinary
    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `${env.CLOUDINARY_FOLDER}/clientes/${clienteId}`,
          public_id: tipo,
          overwrite: true,
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto', fetch_format: 'webp' },
          ],
        },
        (err, result) => {
          if (err) reject(err);
          else resolve(result as { secure_url: string });
        }
      );
      uploadStream.end(fileBuffer);
    });

    // Actualizar URL en cliente
    await clientesRepository.update(clienteId, {
      [`fotos.${tipo}`]: uploadResult.secure_url,
    } as Partial<ICliente>);

    return uploadResult.secure_url;
  }

  async obtenerPrestamos(clienteId: string) {
    const cliente = await clientesRepository.findById(clienteId);
    if (!cliente) throw new NotFoundError('Cliente');

    return PrestamoModel.find({ cliente: clienteId })
      .sort({ createdAt: -1 })
      .populate('cobrador', 'nombre')
      .lean();
  }
}

export const clientesService = new ClientesService();
