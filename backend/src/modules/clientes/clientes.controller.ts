import { Request, Response, NextFunction } from 'express';
import { clientesService } from './clientes.service';
import { CrearClienteDto, ActualizarClienteDto, FiltrosClienteDto } from './clientes.dto';
import { ResponseHelper } from '../../shared/utils/responses';

export class ClientesController {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filtros = FiltrosClienteDto.parse(req.query);
      const result = await clientesService.listar(filtros);
      ResponseHelper.paginated(res, result.data, result.pagination);
    } catch (error) { next(error); }
  }

  async obtener(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cliente = await clientesService.obtener(req.params['id']!);
      ResponseHelper.success(res, cliente);
    } catch (error) { next(error); }
  }

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = CrearClienteDto.parse(req.body);
      const cliente = await clientesService.crear(dto, req.user!.sub);
      ResponseHelper.created(res, cliente, 'Cliente creado exitosamente');
    } catch (error) { next(error); }
  }

  async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = ActualizarClienteDto.parse(req.body);
      const cliente = await clientesService.actualizar(req.params['id']!, dto, req.user!.sub);
      ResponseHelper.success(res, cliente, 'Cliente actualizado exitosamente');
    } catch (error) { next(error); }
  }

  async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await clientesService.eliminar(req.params['id']!);
      ResponseHelper.success(res, null, 'Cliente eliminado exitosamente');
    } catch (error) { next(error); }
  }

  async subirFoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tipo = req.params['tipo'] as 'cliente' | 'documento' | 'vivienda';
      if (!req.file) {
        ResponseHelper.error(res, 'No se proporcionó ninguna imagen', 400);
        return;
      }
      const url = await clientesService.subirFoto(
        req.params['id']!,
        tipo,
        req.file.buffer,
        req.file.mimetype
      );
      ResponseHelper.success(res, { url }, 'Foto subida exitosamente');
    } catch (error) { next(error); }
  }

  async obtenerPrestamos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prestamos = await clientesService.obtenerPrestamos(req.params['id']!);
      ResponseHelper.success(res, prestamos);
    } catch (error) { next(error); }
  }
}

export const clientesController = new ClientesController();
