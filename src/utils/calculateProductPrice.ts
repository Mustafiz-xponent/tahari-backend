import { Decimal } from "@prisma/client/runtime/library";
import { Deal, Product } from "@/generated/prisma/client";

interface ProductWithDeal {
  unitPrice: Product["unitPrice"];
  deal?: Deal | null;
}

export function calculateProductPricing(product: ProductWithDeal) {
  const now = new Date();
  const { deal, unitPrice } = product;

  const isUnderDeal = !!deal && deal.startDate <= now && deal.endDate >= now;

  let dealUnitPrice = unitPrice;

  if (isUnderDeal) {
    const discountValue = deal.discountValue;

    if (deal.discountType === "PERCENTAGE") {
      const percentage = discountValue / 100;
      dealUnitPrice = unitPrice.mul(new Decimal(1 - percentage));
    } else if (deal.discountType === "FLAT") {
      dealUnitPrice = unitPrice.sub(discountValue);
      if (dealUnitPrice.lessThan(0)) {
        dealUnitPrice = new Decimal(0); // avoid negative price
      }
    }
  }

  return {
    isUnderDeal,
    dealUnitPrice,
  };
}
