import winston, { createLogger, format } from 'winston';
import { config } from '../../configs/config.ts';
import TransportStream from 'winston-transport';
import path from 'path';

const { combine, timestamp, json, errors, colorize, printf } = format;

const isProduction = config.app.env === 'prod';
const transports: TransportStream[] = [];

if (!isProduction) {
  winston.addColors({
    debug: 'cyan',
  });

  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        printf(logEntry => {
          const { timestamp, level, message, stack, ...metadata } = logEntry;
          let log = `[${timestamp}] ${level}: ${message}`;

          if (Object.keys(metadata).length !== 0) {
            try {
              log += `\n${JSON.stringify(metadata, null, 2)}`;
            } catch (e) {
              if (e instanceof Error) {
                log += `Metadata: ${String(metadata)} (Serialization failed: ${e.message})`;
              } else {
                log += `Metadata: ${String(metadata)} (Serialization failed.`;
              }
            }
          }

          if (stack) {
            log += `\n${stack}`;
          }

          return log;
        })
      ),
    })
  );
}

if (isProduction) {
  transports.push(
    new winston.transports.File({
      format: json(),
      filename: path.join('logs', 'app.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      format: json(),
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.Console({
      format: json(),
    })
  );
}

const logger = createLogger({
  level: config.app.logLevel || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS',
    }),
    json()
  ),
  transports,
});

export default logger;
