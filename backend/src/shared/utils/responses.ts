import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class ResponseHelper {
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = 200
  ): Response {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
    } satisfies ApiResponse<T>);
  }

  static created<T>(res: Response, data: T, message?: string): Response {
    return ResponseHelper.success(res, data, message, 201);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    pagination: PaginationMeta
  ): Response {
    return res.status(200).json({
      success: true,
      data,
      pagination,
    } satisfies ApiResponse<T[]>);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 400,
    error?: string
  ): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      error,
    } satisfies ApiResponse);
  }

  static notFound(res: Response, resource: string = 'Recurso'): Response {
    return ResponseHelper.error(res, `${resource} no encontrado`, 404);
  }

  static unauthorized(res: Response, message: string = 'No autorizado'): Response {
    return ResponseHelper.error(res, message, 401);
  }

  static forbidden(res: Response, message: string = 'Acceso denegado'): Response {
    return ResponseHelper.error(res, message, 403);
  }

  static serverError(res: Response, message: string = 'Error interno del servidor'): Response {
    return ResponseHelper.error(res, message, 500);
  }
}

// Helper para paginación con cursor
export function buildPagination(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
