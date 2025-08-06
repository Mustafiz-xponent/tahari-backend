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
      title: z
        .string()
        .min(3, { message: "Title must be at least 3 characters long" })
        .max(30, { message: "Title must be at most 30 characters long" })
        .optional(),
      description: z
        .string()
        .min(3, { message: "Description must be at least 3 characters long" })
        .max(48, { message: "Description must be at most 48 characters long" })
        .optional(),
      targetType: z.nativeEnum(PromoTargetType, {
        errorMap: () => ({ message: "Invalid target type" }),
      }),
      productId: zBigIntId("Product ID").optional(),
      placement: z.nativeEnum(PromoPlacement, {
        errorMap: () => ({ message: "Invalid placement" }),
      }),
      priority: z
        .number()
        .min(1, { message: "Priority must be at least 1" })
        .default(1),
      isActive: z.boolean().default(true),
    })
    .refine(
      (data) =>
        (data.productId === undefined || data.targetType === "PRODUCT") &&
        (data.targetType !== "PRODUCT" || data.productId !== undefined),
      {
        message: "productId requires targetType 'PRODUCT', and vice versa.",
        path: ["productId"],
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
      title: z
        .string()
        .min(3, { message: "Title must be at least 3 characters long" })
        .max(30, { message: "Title must be at most 30 characters long" })
        .optional(),

      description: z
        .string()
        .min(3, { message: "Description must be at least 3 characters long" })
        .max(48, { message: "Description must be at most 48 characters long" })
        .optional(),

      targetType: z
        .nativeEnum(PromoTargetType, {
          errorMap: () => ({ message: "Invalid target type" }),
        })
        .optional(),

      productId: zBigIntId("Product ID").optional(),

      placement: z
        .nativeEnum(PromoPlacement, {
          errorMap: () => ({ message: "Invalid placement" }),
        })
        .optional(),

      priority: z
        .number()
        .min(1, { message: "Priority must be at least 1" })
        .optional(),

      isActive: z.boolean().optional(),
    })
    .refine(
      (data) =>
        (data.productId === undefined || data.targetType === "PRODUCT") &&
        (data.targetType !== "PRODUCT" || data.productId !== undefined),
      {
        message: "productId requires targetType 'PRODUCT', and vice versa.",
        path: ["productId"],
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
