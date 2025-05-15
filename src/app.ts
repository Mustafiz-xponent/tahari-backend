import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";

// import routes
// import adminRoutes from "../src/modules/admins/admins.routes";
import customerUserRoutes from "../src/modules/auth/customer/customer.routes";
import adminUserRoutes from "../src/modules/auth/admin/admin.routes";
// import farmerRoutes from "../src/modules/farmers/farmers.routes";

//

dotenv.config();
// Initialize the app
const app = express();

// Core Middleware
app.use(bodyParser.json());

// Global BigInt Serializer
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// app.use("/api/admins", adminRoutes);
app.use("/api/auth/customer", customerUserRoutes);
app.use("/api/auth/admin", adminUserRoutes);
// app.use("/api/farmers", farmerRoutes);

// Basic Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

export default app;
