import { ClienteModel, ICliente } from '../../models/Cliente.model';
import { Types, FilterQuery } from 'mongoose';
import { buildPagination, PaginationMeta } from '../../shared/utils/responses';
import type { FiltrosClienteDto } from './clientes.dto';

export class ClientesRepository {
  async findAll(filtros: FiltrosClienteDto): Promise<{ data: ICliente[]; pagination: PaginationMeta }> {
    const query: FilterQuery<ICliente> = {};

    if (filtros.estado) query.estado = filtros.estado;
    if (filtros.ciudad) query.ciudad = new RegExp(filtros.ciudad, 'i');

    if (filtros.busqueda) {
      const regex = new RegExp(filtros.busqueda, 'i');
      query.$or = [
        { nombre: regex },
        { cedula: regex },
        { celular: regex },
      ];
    }

    const skip = (filtros.page - 1) * filtros.limit;
    const [data, total] = await Promise.all([
      ClienteModel.find(query)
        .sort({ nombre: 1 })
        .skip(skip)
        .limit(filtros.limit)
        .lean(),
      ClienteModel.countDocuments(query),
    ]);

    return {
      data: data as unknown as ICliente[],
      pagination: buildPagination(total, filtros.page, filtros.limit),
    };
  }

  async findById(id: string): Promise<ICliente | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return ClienteModel.findById(id).lean() as Promise<ICliente | null>;
  }

  async findByCedula(cedula: string): Promise<ICliente | null> {
    return ClienteModel.findOne({ cedula }).lean() as Promise<ICliente | null>;
  }

  async create(data: Partial<ICliente>): Promise<ICliente> {
    const cliente = new ClienteModel(data);
    return cliente.save();
  }

  async update(id: string, data: Partial<ICliente>): Promise<ICliente | null> {
    return ClienteModel.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean() as Promise<ICliente | null>;
  }

  async softDelete(id: string): Promise<ICliente | null> {
    return ClienteModel.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true }
    ).lean() as Promise<ICliente | null>;
  }

  async incrementarPrestamosActivos(id: string, delta: 1 | -1): Promise<void> {
    await ClienteModel.findByIdAndUpdate(id, {
      $inc: { prestamosActivos: delta },
    });
  }
}

export const clientesRepository = new ClientesRepository();
