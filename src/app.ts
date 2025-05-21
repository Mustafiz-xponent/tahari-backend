import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";

// import routes
// import adminRoutes from "../src/modules/admins/admins.routes";
import customerUserRoutes from "../src/modules/auth/customer/customer.routes";
import adminUserRoutes from "../src/modules/auth/admin/admin.routes";
import farmerRoutes from "../src/modules/farmers/farmers.routes";
import categoryRoutes from "../src/modules/categories/category.routes";
import productRoutes from "../src/modules/products/product.routes";
import inventoryPurchaseRoutes from "../src/modules/inventory_purchases/inventory_purchase.routes";
import farmerTransactionRoutes from "./modules/farmer_transactions/farmer_transactions.routes";
import farmerPaymentRoutes from "./modules/farmer_payments/farmer_payment.routes";
import stockTransactionRoutes from "./modules/stock_transactions/stock_transaction.routes";
import orderRoutes from "./modules/orders/orders.routes";

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
app.use("/api/farmers", farmerRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory-purchases", inventoryPurchaseRoutes);
app.use("/api/farmer-transactions", farmerTransactionRoutes);
app.use("/api/farmer-payments", farmerPaymentRoutes);
app.use("/api/stock-transactions", stockTransactionRoutes);
app.use("/api/orders", orderRoutes);

// Basic Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

export default app;
