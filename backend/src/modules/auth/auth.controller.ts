import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { LoginDto, RefreshTokenDto, CambiarPasswordDto } from './auth.dto';
import { ResponseHelper } from '../../shared/utils/responses';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = LoginDto.parse(req.body);
      const ip = req.ip ?? 'unknown';
      const result = await authService.login(dto, ip);
      ResponseHelper.success(res, result, 'Inicio de sesión exitoso');
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = RefreshTokenDto.parse(req.body);
      const tokens = await authService.refresh(dto);
      ResponseHelper.success(res, tokens, 'Token renovado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const sessionId = req.user!.sessionId;
      const ip = req.ip ?? 'unknown';
      await authService.logout(userId, sessionId, ip);
      ResponseHelper.success(res, null, 'Sesión cerrada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const ip = req.ip ?? 'unknown';
      await authService.logoutAll(userId, ip);
      ResponseHelper.success(res, null, 'Todas las sesiones cerradas exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async cambiarPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { passwordActual, passwordNueva } = CambiarPasswordDto.parse(req.body);
      await authService.cambiarPassword(req.user!.sub, passwordActual, passwordNueva);
      ResponseHelper.success(res, null, 'Contraseña actualizada. Por favor inicia sesión nuevamente.');
    } catch (error) {
      next(error);
    }
  }

  async perfil(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sub, email, rol } = req.user!;
      ResponseHelper.success(res, { id: sub, email, rol });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
