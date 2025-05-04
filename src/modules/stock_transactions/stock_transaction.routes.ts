/**
 * Routes for StockTransaction entity operations.
 * Defines API endpoints for stock transaction-related CRUD operations.
 */

import { Router } from "express";
import * as StockTransactionController from "./stock_transaction.controller";

const router = Router();

// Route to create a new stock transaction
router.post("/", StockTransactionController.createStockTransaction);

// Route to get all stock transactions
router.get("/", StockTransactionController.getAllStockTransactions);

// Route to get a stock transaction by ID
router.get("/:id", StockTransactionController.getStockTransactionById);

// Route to update a stock transaction's details
router.put("/:id", StockTransactionController.updateStockTransaction);

// Route to delete a stock transaction
router.delete("/:id", StockTransactionController.deleteStockTransaction);

export default router;
