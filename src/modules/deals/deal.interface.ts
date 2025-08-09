import { Deal, Product } from "@/generated/prisma/client";

export interface IGetDealsResult {
  data: Deal[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}
export interface ProductWithAccessibleImages extends Product {
  accessibleImageUrls?: string[];
}

export type DealWithProducts = Deal & {
  products: ProductWithAccessibleImages[];
};
