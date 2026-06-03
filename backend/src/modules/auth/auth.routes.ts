import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limit estricto para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { success: false, message: 'Demasiados intentos. Espera 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Rutas públicas ───────────────────────────────────────────
router.post('/login', authLimiter, authController.login.bind(authController));
router.post('/refresh', authController.refresh.bind(authController));

// ─── Rutas protegidas ─────────────────────────────────────────
router.use(authMiddleware);
router.post('/logout', authController.logout.bind(authController));
router.post('/logout-all', authController.logoutAll.bind(authController));
router.get('/perfil', authController.perfil.bind(authController));
router.put('/cambiar-password', authController.cambiarPassword.bind(authController));

export default router;
