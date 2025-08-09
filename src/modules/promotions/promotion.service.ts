import { Promotion } from "@/generated/prisma/client";
import prisma from "@/prisma-client/prismaClient";
import {
  CreatePromotionDto,
  UpdatePromotionDto,
} from "@/modules/promotions/promotion.dto";
import { multerFileToFileObject } from "@/utils/fileUpload/configMulterUpload";
import {
  deleteFileFromS3,
  getAccessibleImageUrl,
  uploadFileToS3,
} from "@/utils/fileUpload/s3Aws";
import { AppError } from "@/utils/appError";
import httpStatus from "http-status";
import { IMulterFile } from "@/utils/fileUpload/configMulterUpload";
import {
  IGetPromotionsResult,
  PromotionWithUrl,
} from "@/modules/promotions/promotion.interface";

/**
 * Creates a new promotion entry in the database
 * - Requires an image file (uploaded to S3)
 * - Accepts promotion metadata in `CreatePromotionDto`
 * - Stores S3 URL of the image
 */
export async function createPromotion(
  data: CreatePromotionDto,
  file?: IMulterFile
): Promise<Promotion> {
  if (!file) throw new Error("Image is required");
  // Upload image to S3
  let s3Res;
  if (file) {
    const fileObject = multerFileToFileObject(file);
    s3Res = await uploadFileToS3(fileObject, "promotions", undefined, true);
  }

  const promotion = await prisma.promotion.create({
    data: {
      title: data.title ?? null,
      description: data.description ?? null,
      targetType: data.targetType,
      imageUrl: s3Res?.url!,
      productId: data.productId ?? null,
      dealId: data.dealId ?? null,
      placement: data.placement,
      priority: data.priority,
      isActive: data.isActive,
    },
  });
  return promotion;
}
/**
 * Retrieves all promotions with optional filters and pagination
 * - Supports filtering by placement and targetType
 * - Adds a signed, accessible image URL to each promotion
 */
export async function getAllPromotions(
  paginationParams: { page: number; limit: number; skip: number; sort: string },
  filterParams: { placement?: string; targetType?: string }
): Promise<IGetPromotionsResult> {
  const { page, limit, skip, sort } = paginationParams;
  const { placement, targetType } = filterParams;
  const whereConditions: any = {
    isActive: true,
    ...(placement ? { placement } : {}),
    ...(targetType ? { targetType } : {}),
  };

  const promotions = await prisma.promotion.findMany({
    where: whereConditions,
    take: limit,
    skip: skip,
    orderBy: [
      { priority: sort === "asc" ? "asc" : "desc" },
      { createdAt: sort === "asc" ? "asc" : "desc" },
    ],
  });
  // Add signed image URLs
  const promotionWithUrls = await Promise.all(
    promotions.map(async (promotion) => {
      let accessibleUrl: string | undefined;
      if (promotion.imageUrl) {
        accessibleUrl = await getAccessibleImageUrl(
          promotion.imageUrl as string,
          true
        );
      }
      return {
        ...promotion,
        accessibleImageUrl: accessibleUrl,
      };
    })
  );
  const totalPromotions = await prisma.promotion.count({
    where: whereConditions,
  });
  return {
    data: promotionWithUrls,
    currentPage: page,
    totalPages: Math.ceil(totalPromotions / limit),
    totalCount: totalPromotions,
  };
}
/**
 * Retrieves a single promotion by its ID
 * - Returns signed accessible image URL if available
 * - Throws an error if promotion is not found
 */
export async function getPromotionById(
  promotionId: bigint
): Promise<PromotionWithUrl> {
  const promotion = await prisma.promotion.findUnique({
    where: { promotionId: Number(promotionId) },
  });
  if (!promotion) {
    throw new AppError("Promotion not found", httpStatus.NOT_FOUND);
  }

  let accessibleImageUrl: string | undefined;

  if (promotion.imageUrl) {
    accessibleImageUrl = await getAccessibleImageUrl(promotion.imageUrl, true);
  }

  return {
    ...promotion,
    accessibleImageUrl,
  };
}
/**
 * Updates an existing promotion by its ID
 * - Replaces image in S3 if a new file is provided
 * - Falls back to existing image URL if not
 */
export async function updatePromotion(
  promotionId: bigint,
  data: UpdatePromotionDto,
  file?: IMulterFile
): Promise<Promotion> {
  const promotion = await prisma.promotion.findUnique({
    where: { promotionId },
  });
  if (!promotion) {
    throw new AppError("Promotion not found", httpStatus.NOT_FOUND);
  }
  // Upload image to S3
  let s3Res;
  if (file) {
    await deleteFileFromS3(promotion.imageUrl!, true);
    const fileObject = multerFileToFileObject(file);
    s3Res = await uploadFileToS3(fileObject, "promotions", undefined, true);
  }
  // update promotion
  const updatedPromotion = await prisma.promotion.update({
    where: { promotionId },
    data: {
      title: data.title,
      description: data.description,
      targetType: data.targetType,
      productId: data.productId,
      dealId: data.dealId,
      imageUrl: s3Res?.url ? s3Res.url : promotion.imageUrl,
      placement: data.placement,
      priority: data.priority,
      isActive: data.isActive,
    },
  });
  return updatedPromotion;
}

/**
 * Deletes a promotion by its ID
 * - Also deletes associated image from S3
 * - Throws an error if promotion not found
 */
export async function deletePromotion(promotionId: bigint): Promise<void> {
  const promotion = await prisma.promotion.findUnique({
    where: { promotionId },
  });
  if (!promotion) {
    throw new AppError("Promotion not found", httpStatus.NOT_FOUND);
  }
  // Delete image from S3
  await deleteFileFromS3(promotion.imageUrl!, true);
  // Delete promotion
  await prisma.promotion.delete({ where: { promotionId } });
}
