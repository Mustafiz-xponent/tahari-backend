"use strict";

import dotenv from "dotenv";
import app from "@/app";

// Load environment variables
dotenv.config();

// handling uncaught exceptions--
process.on("uncaughtException", (err) => {
  console.log(`error: ${err.message}`);
  console.log(`Uncaught exception: ${err.stack}`);
  process.exit(1);
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Accounting API server running on http://localhost:${PORT}`);
});

// unhandled promise rejection--
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err}`);
  console.log(`Shuting down the server due to unhandled promise rejection!`);

  server.close(() => {
    process.exit(1);
  });
});
