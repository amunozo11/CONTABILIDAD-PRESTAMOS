import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { env } from '../../config/env';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const logDir = env.LOG_DIR;

// ─── Formato para producción (JSON estructurado) ──────────────
const productionFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  json()
);

// ─── Formato para desarrollo (legible) ───────────────────────
const developmentFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  simple()
);

const transports: winston.transport[] = [];

if (env.NODE_ENV === 'production') {
  // Archivo rotativo para errores
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
      zippedArchive: true,
    })
  );

  // Archivo rotativo para todos los logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      zippedArchive: true,
    })
  );
} else {
  // Consola en desarrollo
  transports.push(new winston.transports.Console());
}

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  transports,
  exitOnError: false,
});

// HTTP request logger stream para Morgan
export const loggerStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
