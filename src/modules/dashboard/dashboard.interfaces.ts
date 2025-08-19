import { OrderStatus } from "@/generated/prisma/client";

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
  orderId: string;
  orderDate: Date;
  status: OrderStatus;
  totalAmount: number;
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
