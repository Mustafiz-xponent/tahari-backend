import { OrderStatus } from "@/generated/prisma/client";
import prisma from "@/prisma-client/prismaClient";
import { getErrorMessage } from "@/utils/errorHandler";
import {
  DashboardSummary,
  MonthwisePayment,
  RecentOrder,
} from "./dashboard.interfaces";

// Service function
export const getDashboardSummary = async (
  year?: number
): Promise<DashboardSummary> => {
  try {
    // Default to current year if no year is provided
    const targetYear = year ?? new Date().getFullYear();
    // Execute all queries in parallel for better performance
    const [
      totalProducts,
      confirmedOrders,
      completedPaymentsSum,
      totalCustomers,
      monthwiseData,
      recentOrdersData,
    ] = await Promise.all([
      // Count total products
      prisma.product.count(),

      // Count completed & delivered orders
      prisma.order.count({
        where: {
          status: {
            in: [OrderStatus.CONFIRMED, OrderStatus.DELIVERED],
          }, // Assuming OrderStatus.COMPLETED exists
        },
      }),

      // // Count completed payments
      // prisma.payment.count({
      //   where: {
      //     paymentStatus: "COMPLETED", // Adjust based on your payment status enum/string
      //   },
      // }),

      // Sum of completed payment amounts
      prisma.payment.aggregate({
        where: {
          paymentStatus: "COMPLETED",
        },
        _sum: {
          amount: true,
        },
      }),

      // Count total customers
      prisma.customer.count(),

      // Get monthwise payment data
      getMonthwisePaymentData(targetYear),

      // Get recent 5 orders
      getRecentOrders(),
    ]);

    return {
      totalProducts,
      totalConfirmedOrders: confirmedOrders,
      totalCompletedPaymentsAmount:
        completedPaymentsSum._sum.amount?.toNumber() || 0,
      totalCustomers,
      monthwisePayments: monthwiseData,
      year: targetYear,
      recentOrders: recentOrdersData,
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch dashboard summary: ${getErrorMessage(error)}`
    );
  }
};

// Helper function to get monthwise payment data
const getMonthwisePaymentData = async (
  year: number
): Promise<MonthwisePayment> => {
  try {
    // Get payments grouped by month for the specified year
    const monthwisePayments = await prisma.payment.groupBy({
      by: ["createdAt"], // Adjust field name if different (e.g., 'paymentDate', 'completedAt')
      where: {
        paymentStatus: "COMPLETED",
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Initialize month data with zeros
    const monthData: MonthwisePayment = {
      jan: 0,
      feb: 0,
      mar: 0,
      apr: 0,
      may: 0,
      jun: 0,
      jul: 0,
      aug: 0,
      sep: 0,
      oct: 0,
      nov: 0,
      dec: 0,
    };

    // Map month numbers to month names
    const monthNames = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ] as const;

    // Process the grouped data
    monthwisePayments.forEach((payment) => {
      const month = new Date(payment.createdAt).getMonth(); // 0-11
      const monthName = monthNames[month];
      monthData[monthName] += payment._sum.amount?.toNumber() || 0;
    });

    return monthData;
  } catch (error) {
    throw new Error(
      `Failed to fetch monthwise payment data: ${getErrorMessage(error)}`
    );
  }
};

// Helper function to get recent 5 orders
const getRecentOrders = async (): Promise<RecentOrder[]> => {
  try {
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc", // Most recent first
      },
      select: {
        orderId: true, // BigInt field
        orderDate: true, // DateTime field (already exists, no need to map from createdAt)
        status: true, // OrderStatus enum
        totalAmount: true, // Decimal field
        paymentStatus: true, // PaymentStatus enum
      },
    });

    // Map to match your interface with proper type conversion
    return recentOrders.map((order) => ({
      orderId: order.orderId.toString(), // Convert BigInt to string
      orderDate: order.orderDate, // Already DateTime
      status: order.status, // OrderStatus enum
      totalAmount: order.totalAmount.toNumber(), // Convert Decimal to number
      paymentStatus: order.paymentStatus.toString(), // Convert PaymentStatus enum to string
    }));
  } catch (error) {
    throw new Error(`Failed to fetch recent orders: ${getErrorMessage(error)}`);
  }
};
