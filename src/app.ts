import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import helmet from "helmet";
import morgran from "morgan";
import compression from "compression";

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
import orderItemRoutes from "./modules/order_items/order-item.route";
import orderTrackingRoutes from "./modules/order_tracking/order-tracking.routes";
import paymentRoutes from "./modules/payments/payment.routes";
import walletRoutes from "./modules/wallets/wallet.routes";
import walletTransactionRoutes from "./modules/wallet_transactions/wallet_transaction.routes";
import subscriptionRoutes from "./modules/subscriptions/subscription.routes";
import subscriptionPlanRoutes from "./modules/subscription_plans/subscription_plan.routes";
import subscriptionDeliveryRoutes from "./modules/subscription_deliveries/subscription-delivery.routes";
import { rateLimiter } from "./middlewares/rateLimiter";
import { globalErrorHandler } from "./middlewares/errorHandler";

dotenv.config();
// Initialize the app
const app = express();

// Core Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgran("dev"));
app.use(compression());
app.use(rateLimiter(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

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
app.use("/api/order-items", orderItemRoutes);
app.use("/api/order-tracking", orderTrackingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/wallet-transactions", walletTransactionRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/subscription-plans", subscriptionPlanRoutes);
app.use("/api/subscription-deliveries", subscriptionDeliveryRoutes);

// Health check route
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});
// API route not found
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});
// Basic Error Handler
app.use(globalErrorHandler);

export default app;
