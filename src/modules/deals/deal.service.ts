import prisma from "@/prisma-client/prismaClient";
import { AppError } from "@/utils/appError";
import httpStatus from "http-status";
import { CreateDealDto, UpdateDealDto } from "@/modules/deals/deal.dto";
import { Deal } from "@/generated/prisma/client";
import {
  DealWithProducts,
  IGetDealsResult,
} from "@/modules/deals/deal.interface";
import { processProductsWithAccessibleUrls } from "@/utils/fileUpload/s3Aws";

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

  // Check for existing *individual* deals on these products
  const productsWithDeal = await prisma.product.findMany({
    where: {
      productId: { in: data.productIds },
      deal: {
        isGlobal: false,
        startDate: { lte: new Date() },
        endDate: { gt: new Date() },
      },
    },
    select: { productId: true },
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

/**
 * - Retrieves all deals with optional pagination and filtering
 */
export async function getAllDeals(
  paginationParams: { page: number; limit: number; skip: number; sort: string },
  filterParams: { isActive?: boolean }
): Promise<IGetDealsResult> {
  const { page, limit, skip, sort } = paginationParams;
  const isActive = filterParams.isActive;
  const now = new Date();
  const whereClause: any = {};

  if (typeof isActive === "boolean") {
    if (isActive) {
      whereClause.startDate = { lte: now };
      whereClause.endDate = { gt: now };
    } else {
      whereClause.OR = [{ startDate: { gt: now } }, { endDate: { lte: now } }];
    }
  }

  const deals = await prisma.deal.findMany({
    where: whereClause,
    include: { products: true },
    take: limit,
    skip: skip,
    orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
  });

  // Process products in each deal to add accessibleImageUrls
  const processedDeals = await Promise.all(
    deals.map(async (deal) => {
      const processedProducts = await processProductsWithAccessibleUrls(
        deal.products,
        300
      );

      return {
        ...deal,
        products: processedProducts,
      };
    })
  );

  const totalPromotions = await prisma.promotion.count();
  return {
    data: processedDeals,
    currentPage: page,
    totalPages: Math.ceil(totalPromotions / limit),
    totalCount: totalPromotions,
  };
}
/**
 * Retrieves a single deal by its ID
 * - Throws an error if promotion is not found
 */
export async function getDealById(dealId: bigint): Promise<DealWithProducts> {
  const deal = await prisma.deal.findUnique({
    where: { dealId },
    include: { products: true },
  });
  if (!deal) {
    throw new AppError("Deal not found", httpStatus.NOT_FOUND);
  }
  const productsWithAccessibleUrls = await processProductsWithAccessibleUrls(
    deal.products,
    300
  );

  return {
    ...deal,
    products: productsWithAccessibleUrls,
  };
}
/**
 * Updates an existing deal by its ID
 * - Throws an error if deal is not found
 */
export async function updateDeal(
  dealId: bigint,
  data: UpdateDealDto
): Promise<Deal> {
  const existingDeal = await prisma.deal.findUnique({ where: { dealId } });

  if (!existingDeal) {
    throw new AppError("Deal not found", httpStatus.NOT_FOUND);
  }

  // If deal is global, ensure there's no other active global deal
  if (data.isGlobal) {
    const now = new Date();
    const otherActiveGlobalDeal = await prisma.deal.findFirst({
      where: {
        isGlobal: true,
        dealId: { not: dealId },
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    if (otherActiveGlobalDeal) {
      throw new AppError(
        "Another active global deal already exists.",
        httpStatus.BAD_REQUEST
      );
    }
  }

  // If not global, must have productIds
  if (
    data.isGlobal === false &&
    (!data.productIds || data.productIds.length === 0)
  ) {
    throw new AppError(
      "Please provide productIds for non-global deals.",
      httpStatus.BAD_REQUEST
    );
  }

  // Check for active deals on the products (excluding this deal)
  if (!data.isGlobal && data.productIds?.length) {
    const now = new Date();
    const productsWithDeal = await prisma.product.findMany({
      where: {
        productId: { in: data.productIds },
        deal: {
          NOT: { dealId },
          startDate: { lte: now },
          endDate: { gte: now },
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
  }

  return await prisma.$transaction(async (tx) => {
    // Update deal
    const updatedDeal = await tx.deal.update({
      where: { dealId },
      data: {
        title: data.title,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        startDate: data.startDate,
        endDate: data.endDate,
        isGlobal: data.isGlobal,
      },
    });

    // If non-global and productIds are provided, reassign them
    if (!data.isGlobal && data.productIds) {
      // Unassign the deal from all previously assigned products
      await tx.product.updateMany({
        where: { dealId },
        data: { dealId: null },
      });

      // Assign the deal to new products
      await tx.product.updateMany({
        where: { productId: { in: data.productIds } },
        data: { dealId },
      });
    }

    return updatedDeal;
  });
}

/**
 * Deletes a deal by its ID
 * - Throws an error if deal not found
 */
export async function deleteDeal(dealId: bigint): Promise<void> {
  const deal = await prisma.deal.findUnique({
    where: { dealId },
  });
  if (!deal) {
    throw new AppError("Deal not found", httpStatus.NOT_FOUND);
  }
  // Delete deal
  await prisma.deal.delete({ where: { dealId } });
}
