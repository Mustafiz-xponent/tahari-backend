"use strict";

import dotenv from "dotenv";
import { server } from "@/utils/socket";
import logger from "@/utils/logger";

// Load environment variables
dotenv.config();

// handling uncaught exceptions--
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message} | ${err.stack}`);
  process.exit(1);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info(`Accounting API server running on http://localhost:${PORT}`);
});

// unhandled promise rejection--
process.on("unhandledRejection", (err) => {
  logger.error(`Unhandled Rejection: ${err} | ${err}`);
  server.close(() => {
    process.exit(1);
  });
});
// Handle graceful shutdown
const shutdown = () => {
  console.log("Gracefully shutting down...");
  server.close(() => {
    process.exit(0);
  });
};
// Handle manual termination
process.on("SIGINT", shutdown);
// Handle system termination
process.on("SIGTERM", shutdown);
