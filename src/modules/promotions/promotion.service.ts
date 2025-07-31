import { Promotion } from "@/generated/prisma/client";
import prisma from "@/prisma-client/prismaClient";
import { getErrorMessage } from "@/utils/errorHandler";
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

interface IMulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}
interface IPromotionsResponse {
  promotions: Promotion[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}
type PromotionWithUrl = Promotion & {
  accessibleImageUrl?: string;
};
/**
 * Create a new promotion
 */
export async function createPromotion(
  data: CreatePromotionDto,
  file?: IMulterFile
): Promise<Promotion> {
  try {
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
        placement: data.placement,
        priority: data.priority,
        isActive: data.isActive,
      },
    });
    return promotion;
  } catch (error) {
    throw new Error(`Failed to create promotion: ${getErrorMessage(error)}`);
  }
}

/**
 * Get all promotions
 */
export async function getAllPromotions(
  paginationParams: { page: number; limit: number; skip: number; sort: string },
  filterParams: { placement?: string; targetType?: string }
): Promise<IPromotionsResponse> {
  try {
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
      promotions: promotionWithUrls,
      currentPage: page,
      totalPages: Math.ceil(totalPromotions / limit),
      totalCount: totalPromotions,
    };
  } catch (error) {
    throw new Error(`Failed to retrive promotion: ${getErrorMessage(error)}`);
  }
}

/**
 * Get promotion by it's ID
 */
export async function getPromotionById(
  promotionId: bigint
): Promise<PromotionWithUrl> {
  try {
    const promotion = await prisma.promotion.findUnique({
      where: { promotionId: Number(promotionId) },
    });
    if (!promotion) throw new Error("Promotion not found");

    let accessibleImageUrl: string | undefined;

    if (promotion.imageUrl) {
      accessibleImageUrl = await getAccessibleImageUrl(
        promotion.imageUrl,
        true
      );
    }

    return {
      ...promotion,
      accessibleImageUrl,
    };
  } catch (error) {
    throw new Error(`Failed to retrive promotion: ${getErrorMessage(error)}`);
  }
}

/**
 * Update a promotion by its ID
 */
export async function updatePromotion(
  promotionId: bigint,
  data: UpdatePromotionDto,
  file?: IMulterFile
): Promise<Promotion> {
  try {
    const promotion = await prisma.promotion.findUnique({
      where: { promotionId },
    });
    if (!promotion) throw new Error("Promotion not found");
    // Upload image to S3
    let s3Res;
    if (file) {
      await deleteFileFromS3(promotion.imageUrl!, true);
      const fileObject = multerFileToFileObject(file);
      s3Res = await uploadFileToS3(fileObject, "promotions", undefined, true);
    }

    const updatedPromotion = await prisma.promotion.update({
      where: { promotionId },
      data: {
        title: data.title,
        description: data.description,
        targetType: data.targetType,
        productId: data.productId,
        imageUrl: s3Res?.url ? s3Res.url : promotion.imageUrl,
        placement: data.placement,
        priority: data.priority,
        isActive: data.isActive,
      },
    });
    return updatedPromotion;
  } catch (error) {
    throw new Error(`Failed to update promotion: ${getErrorMessage(error)}`);
  }
}

/**
 * Delete a promotion by its ID
 */
export async function deletePromotion(promotionId: bigint): Promise<void> {
  try {
    const promotion = await prisma.promotion.findUnique({
      where: { promotionId },
    });
    if (!promotion) throw new Error("Promotion not found");
    // Delete image from S3
    await deleteFileFromS3(promotion.imageUrl!, true);
    // Delete promotion
    await prisma.promotion.delete({ where: { promotionId } });
  } catch (error) {
    throw new Error(`Failed to delete promotion: ${getErrorMessage(error)}`);
  }
}
