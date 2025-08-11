import pino from "pino";
const isProd = process.env.NODE_ENV === "production";

const logger = pino(
  isProd
    ? {
        level: "info",
        formatters: {
          level: (label) => ({ level: label }),
        },
      }
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
        level: "debug",
      }
);

export default logger;
