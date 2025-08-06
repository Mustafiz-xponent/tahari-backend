import { Promotion } from "@/generated/prisma/client";

export type PromotionWithUrl = Promotion & {
  accessibleImageUrl?: string;
};

export interface IGetPromotionsResult {
  data: PromotionWithUrl[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}
