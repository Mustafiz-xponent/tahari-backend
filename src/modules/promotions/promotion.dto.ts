import { PromoPlacement, PromoTargetType } from "@/generated/prisma/client";
import { z } from "zod";

/**
 * Returns a Zod schema for a positive integer ID, with the given field name used
 * for error messages.
 * @param fieldName The name of the field, used for error messages.
 * @returns A Zod schema for a positive integer ID.
 */
const zBigIntId = (fieldName: string) =>
  z
    .union([z.string(), z.number()])
    .refine((val) => val !== "", { message: `${fieldName} is required` })
    .transform((val) => BigInt(val))
    .refine((val) => val > 0n, {
      message: `${fieldName} must be a positive integer`,
    });

/*
 **  Schema: Create Promotion
 */
export const zCreatePromotionDto = {
  body: z
    .object({
      title: z.string().min(3).max(60).optional(),
      description: z.string().min(3).max(80).optional(),
      targetType: z.nativeEnum(PromoTargetType, {
        errorMap: () => ({ message: "Invalid target type" }),
      }),
      productId: zBigIntId("Product ID").optional(),
      dealId: zBigIntId("Deal ID").optional(),
      placement: z.nativeEnum(PromoPlacement, {
        errorMap: () => ({ message: "Invalid placement" }),
      }),
      priority: z.number().min(1).default(1),
      isActive: z.boolean().default(true),
    })
    .refine(
      (data) => {
        if (data.productId !== undefined) {
          return (
            data.targetType === "PRODUCT" || data.targetType === "PREORDER"
          );
        }
        if (data.targetType === "PRODUCT" || data.targetType === "PREORDER") {
          return data.productId !== undefined;
        }
        return true;
      },
      {
        message:
          "productId requires targetType to be 'PRODUCT' or 'PREORDER', and vice versa.",
        path: ["productId"],
      }
    )
    .refine(
      (data) =>
        (data.dealId === undefined || data.targetType === "DEAL") &&
        (data.targetType !== "DEAL" || data.dealId !== undefined),
      {
        message: "dealId requires targetType 'DEAL', and vice versa.",
        path: ["dealId"],
      }
    ),
};

export type CreatePromotionDto = z.infer<typeof zCreatePromotionDto.body>;

/*
 ** Schema: Get All Promotions (Query Parameters)
 ** Includes pagination, sorting, filtering
 */
export const zGetAllPromotionsDto = {
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
    sort: z.enum(["asc", "desc"]).optional().default("desc"),
    placement: z.nativeEnum(PromoPlacement).optional(),
    targetType: z.nativeEnum(PromoTargetType).optional(),
  }),
};

export type GetAllPromotionsQueryDto = z.infer<
  typeof zGetAllPromotionsDto.query
>;

/*
 **   Schema: Get Single Promotion by ID (Route Param)
 */
export const zGetPromotionDto = {
  params: z.object({
    id: zBigIntId("Promotion ID"),
  }),
};

/*
 ** Schema: Update Promotion
 ** All fields optional, but validated similarly to creation
 */
export const zUpdatePromotionDto = {
  params: z.object({
    id: zBigIntId("Promotion ID"),
  }),
  body: z
    .object({
      title: z.string().min(3).max(60).optional(),
      description: z.string().min(3).max(80).optional(),
      targetType: z
        .nativeEnum(PromoTargetType, {
          errorMap: () => ({ message: "Invalid target type" }),
        })
        .optional(),

      productId: zBigIntId("Product ID").optional(),
      dealId: zBigIntId("Deal ID").optional(),

      placement: z
        .nativeEnum(PromoPlacement, {
          errorMap: () => ({ message: "Invalid placement" }),
        })
        .optional(),

      priority: z.number().min(1).optional(),

      isActive: z.boolean().optional(),
    })
    .refine(
      (data) => {
        if (data.productId !== undefined) {
          return (
            data.targetType === "PRODUCT" || data.targetType === "PREORDER"
          );
        }
        if (data.targetType === "PRODUCT" || data.targetType === "PREORDER") {
          return data.productId !== undefined;
        }
        return true;
      },
      {
        message:
          "productId requires targetType to be 'PRODUCT' or 'PREORDER', and vice versa.",
        path: ["productId"],
      }
    )
    .refine(
      (data) =>
        data.dealId === undefined ||
        data.targetType === undefined ||
        (data.dealId !== undefined && data.targetType === "DEAL") ||
        (data.targetType !== "DEAL" && data.dealId === undefined),
      {
        message: "dealId requires targetType 'DEAL', and vice versa.",
        path: ["dealId"],
      }
    ),
};
export type UpdatePromotionDto = z.infer<typeof zUpdatePromotionDto.body>;
/*
 ** Schema: Delete Promotion by ID (Route Param)
 */
export const zDeletePromotionDto = {
  params: z.object({
    id: zBigIntId("Promotion ID"),
  }),
};
