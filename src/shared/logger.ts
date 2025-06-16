import { createLogger, format, transports } from 'winston';
import * as path from 'path';
import { app } from 'electron';

// 로그 디렉토리 Setup
const logDir = app?.getPath('logs') || path.join(__dirname, '../../logs');

// 로거 생성
export const logger = createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
    })
  ),
  transports: [
    // 콘솔 출력
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    // 파일 출력
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error'
    }),
    new transports.File({
      filename: path.join(logDir, 'combined.log')
    })
  ]
});

export default logger;
