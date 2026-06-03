import http from 'http';
import app from './app';
import { connectDatabase } from './config/database';
import { initSocket } from './config/socket';
import { env } from './config/env';
import { logger } from './shared/utils/logger';
import { prestamosService } from './modules/prestamos/prestamos.service';

async function bootstrap() {
  // Conectar MongoDB
  await connectDatabase();

  // Crear servidor HTTP
  const server = http.createServer(app);

  // Inicializar Socket.IO
  initSocket(server);

  // Iniciar servidor
  server.listen(env.PORT, () => {
    logger.info(`🚀 GotaGota API corriendo en puerto ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`🕐 Zona horaria: ${env.TZ}`);
  });

  // ─── Cron job: actualizar cuotas vencidas ────────────────
  // Ejecutar cada día a las 00:01 hora Colombia
  const actualizarVencidas = async () => {
    try {
      const modificados = await prestamosService.actualizarCuotasVencidas();
      if (modificados > 0) {
        logger.info(`📅 Cuotas vencidas actualizadas: ${modificados} préstamos`);
      }
    } catch (err) {
      logger.error('Error actualizando cuotas vencidas:', err);
    }
  };

  // Ejecutar al inicio y luego cada 24 horas
  await actualizarVencidas();
  setInterval(actualizarVencidas, 24 * 60 * 60 * 1000);

  // ─── Graceful Shutdown ───────────────────────────────────
  const shutdown = (signal: string) => {
    logger.info(`⚠️ ${signal} recibido. Cerrando servidor...`);
    server.close(() => {
      logger.info('✅ Servidor cerrado correctamente');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('⏰ Timeout forzado en shutdown');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.error('💥 Excepción no capturada:', err);
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('💥 Promise rechazada sin manejar:', reason);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Error en bootstrap:', err);
  process.exit(1);
});
