import { Decimal } from "@prisma/client/runtime/library";
import { Deal, Product } from "@/generated/prisma/client";
import prisma from "@/prisma-client/prismaClient";

interface ProductWithDeal {
  unitPrice: Product["unitPrice"];
  deal?: Deal | null;
}
export interface DealPricingResult {
  hasActiveDeal: boolean;
  hasActiveGlobalDeal: boolean;
  discountType: Deal["discountType"] | null;
  discountValue: Deal["discountValue"] | null;
  discountUnitPrice: Decimal | null;
}
/**
 * Calculates the pricing for a product considering both global and product-specific deals.
 * Product-specific deals override global deals if both are active.
 */
export async function calculateDealPricing(
  product: ProductWithDeal
): Promise<DealPricingResult> {
  const now = new Date();
  let activeDeal: Deal | null = null;

  // Check if product-specific deal is active
  if (
    product.deal &&
    product.deal.startDate <= now &&
    product.deal.endDate >= now
  ) {
    activeDeal = product.deal;
  } else {
    //  No product deal → check for global deal
    const globalDeal = await prisma.deal.findFirst({
      where: {
        isGlobal: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    if (globalDeal) {
      activeDeal = globalDeal;
    }
  }

  //  If no deal found, return defaults
  if (!activeDeal) {
    return {
      hasActiveDeal: false,
      hasActiveGlobalDeal: false,
      discountType: null,
      discountValue: null,
      discountUnitPrice: null,
    };
  }

  // Calculate price with the active deal
  let discountUnitPrice: Decimal;
  const discountValue = activeDeal.discountValue;

  if (activeDeal.discountType === "PERCENTAGE") {
    const percentage = discountValue / 100;
    discountUnitPrice = product.unitPrice.mul(new Decimal(1 - percentage));
  } else {
    discountUnitPrice = product.unitPrice.sub(discountValue);
    if (discountUnitPrice.lessThan(0)) {
      discountUnitPrice = new Decimal(0);
    }
  }

  return {
    hasActiveDeal: activeDeal.isGlobal ? false : true,
    hasActiveGlobalDeal: activeDeal.isGlobal,
    discountType: activeDeal.discountType,
    discountValue: activeDeal.discountValue,
    discountUnitPrice,
  };
}
