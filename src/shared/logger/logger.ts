import winston, { createLogger, format } from 'winston';
import { config } from '../../configs/config.ts';
import TransportStream from 'winston-transport';
import path from 'path';

const isProduction = config.app.env === 'prod';
const transports: TransportStream[] = [];

if (!isProduction) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    })
  );
}

if (isProduction) {
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'app.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

winston.addColors({
  debug: 'cyan',
});

const logger = createLogger({
  level: config.app.logLevel,
  format: format.json(),
  transports,
});

export default logger;
