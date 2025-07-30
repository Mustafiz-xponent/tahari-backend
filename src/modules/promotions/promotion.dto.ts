import { PromoPlacement, PromoTargetType } from "@/generated/prisma/client";
import { z } from "zod";

const zBigIntId = (fieldName: string) =>
  z
    .union([z.string(), z.number()])
    .refine((val) => val !== "", { message: `${fieldName} is required` })
    .transform((val) => BigInt(val))
    .refine((val) => val > 0n, {
      message: `${fieldName} must be a positive integer`,
    });

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
      productId: zBigIntId("Product ID").optional(),
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
