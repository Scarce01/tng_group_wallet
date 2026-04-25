import winston from "winston";
import { env } from "../config/env.js";

const fmt =
  env.NODE_ENV === "production"
    ? winston.format.combine(winston.format.timestamp(), winston.format.json())
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "HH:mm:ss" }),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
          return `${timestamp} ${level} ${message}${metaStr}`;
        })
      );

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: fmt,
  transports: [new winston.transports.Console()],
});
