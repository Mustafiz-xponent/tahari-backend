"use strict";

import dotenv from "dotenv";
import app from "@/app";
import logger from "@/utils/logger";

// Load environment variables
dotenv.config();

// handling uncaught exceptions--
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message} | ${err.stack}`);
  process.exit(1);
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`Accounting API server running on http://localhost:${PORT}`);
});

// unhandled promise rejection--
process.on("unhandledRejection", (err) => {
  logger.error(`Unhandled Rejection: ${err} | ${err}`);

  server.close(() => {
    process.exit(1);
  });
});
