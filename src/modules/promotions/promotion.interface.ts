import {
  PromoPlacement,
  PromoTargetType,
  Promotion,
} from "@/generated/prisma/client";
export interface IGetPromotionsQuery {
  page?: string;
  limit?: string;
  sort?: string;
  placement?: PromoPlacement;
  targetType?: PromoTargetType;
}
export type PromotionWithUrl = Promotion & {
  accessibleImageUrl?: string;
};

export interface IGetPromotionsResult {
  data: PromotionWithUrl[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}
