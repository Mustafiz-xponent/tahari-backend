import prisma from "@/prisma-client/prismaClient";
import { AppError } from "@/utils/appError";
import httpStatus from "http-status";
import { CreateDealDto } from "./deal.dto";
import { Deal } from "@/generated/prisma/client";

/**
 * Creates a new deal entry in the database
 * - Accepts deal data in `CreateDealDto`
 * - Returns the created deal
 */
export async function createDeal(data: CreateDealDto): Promise<Deal> {
  if (data.isGlobal) {
    const existingGlobalDeal = await prisma.deal.findFirst({
      where: {
        isGlobal: true,
        startDate: { lte: new Date() },
        endDate: { gt: new Date() },
      },
    });

    if (existingGlobalDeal) {
      throw new AppError(
        "An active global deal already exists.",
        httpStatus.BAD_REQUEST
      );
    }

    // Create global deal
    return await prisma.deal.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        discountType: data.discountType,
        discountValue: data.discountValue,
        startDate: data.startDate,
        endDate: data.endDate,
        isGlobal: data.isGlobal,
      },
    });
  }
  // Not global – must have productIds
  if (data?.productIds?.length === 0) {
    throw new AppError(
      "Please provide productIds for non-global deals.",
      httpStatus.BAD_REQUEST
    );
  }

  // Check if any product already has an active deal
  const productsWithDeal = await prisma.product.findMany({
    where: {
      productId: { in: data.productIds },
      deal: {
        startDate: { lte: new Date() },
        endDate: { gt: new Date() }, // the deal is still ongoing
      },
    },
  });

  if (productsWithDeal.length > 0) {
    const ids = productsWithDeal.map((p) => p.productId);
    throw new AppError(
      `These products already have active deals: ${ids.join(", ")}`,
      httpStatus.BAD_REQUEST
    );
  }

  // Create deal and assign to products
  return await prisma.$transaction(async (tx) => {
    const deal = await tx.deal.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        discountType: data.discountType,
        discountValue: data.discountValue,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });

    await tx.product.updateMany({
      where: { productId: { in: data.productIds } },
      data: { dealId: deal.dealId },
    });

    return deal;
  });
}
