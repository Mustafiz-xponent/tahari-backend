import { OrderStatus } from "@/generated/prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// Types
export interface MonthwisePayment {
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
}

// Type for recent order
export interface RecentOrder {
  orderId: bigint;
  orderDate: Date;
  status: OrderStatus;
  totalAmount: Decimal;
  paymentStatus: string;
}

export interface DashboardSummary {
  totalProducts: number;
  totalConfirmedOrders: number;
  totalCompletedPaymentsAmount: number;
  totalCustomers: number;
  monthwisePayments: MonthwisePayment;
  year: number; // The year for which monthwise data is shown
  recentOrders: RecentOrder[]; // Recent 5 orders
}
