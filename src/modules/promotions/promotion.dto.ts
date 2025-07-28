import { PromoPlacement } from "@/generated/prisma/client";
import { z } from "zod";

export const CreatePromotionDto = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  targetType: z.enum(["PRODUCT", "ROUTE"]),
  productId: z
    .union([z.string(), z.number()])
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
  priority: z.number().min(1).default(1),
  isActive: z.boolean().default(true),
});

export type CreatePromotionInput = z.infer<typeof CreatePromotionDto>;
