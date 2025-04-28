import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";

// import routes


// 


// Initialize the app
const app = express();

// Core Middleware
app.use(bodyParser.json());




// Basic Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

export default app;