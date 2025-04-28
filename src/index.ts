"use strict";
// src/index.ts
import dotenv from "dotenv";
import app from "./app";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Accounting API server running on http://localhost:${PORT}`);
});
