import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";

// import routes
import adminRoutes from "../src/modules/admins/admins.routes"

// 

dotenv.config();
// Initialize the app
const app = express();

// Core Middleware
app.use(bodyParser.json());

app.use("/api/admins",adminRoutes)


// Basic Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

export default app;