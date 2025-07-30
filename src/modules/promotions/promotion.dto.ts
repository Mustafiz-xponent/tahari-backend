import { PromoPlacement, PromoTargetType } from "@/generated/prisma/client";
import { z } from "zod";

export const zCreatePromotionDto = {
  body: z
    .object({
      title: z
        .string()
        .min(3, { message: "Title must be at least 3 characters long" })
        .optional(),
      description: z.string().optional(),
      targetType: z.nativeEnum(PromoTargetType, {
        errorMap: () => ({
          message: "Invalid target type",
        }),
      }),
      productId: z
        .union([z.string(), z.number()])
        .refine((val) => val !== "", { message: "Product ID is required" })
        .transform((val) => BigInt(val))
        .refine((val) => val > 0n, {
          message: "Product ID must be a positive integer",
        })
        .optional(),
      placement: z.nativeEnum(PromoPlacement, {
        errorMap: () => ({
          message: "Invalid placement",
        }),
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
