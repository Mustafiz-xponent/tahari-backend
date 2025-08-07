import { DiscountType } from "@/generated/prisma/client";
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

export const zCreateDealDto = {
  body: z
    .object({
      title: z.string().min(3).max(100),
      description: z.string().max(255).optional(),
      discountType: z.nativeEnum(DiscountType),
      discountValue: z
        .string()
        .refine((val) => !isNaN(Number(val)), {
          message: "Must be a valid number",
        })
        .transform((val) => parseFloat(val)),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      isGlobal: z.boolean().optional().default(false),
      productIds: z
        .array(zBigIntId("Product ID"))
        .optional()
        .refine((arr) => arr === undefined || arr.length > 0, {
          message: "At least one product must be selected",
        }),
    })
    .refine(
      (data) => {
        // Business rule: if isGlobal is true, no productIds should be provided
        if (data.isGlobal && data.productIds?.length) {
          return false;
        }
        return true;
      },
      {
        message: "Global deals should not have product IDs",
        path: ["productIds"],
      }
    )
    .refine(
      (data) => {
        // endDate must be after startDate
        return data.endDate > data.startDate;
      },
      {
        message: "End date must be after start date",
        path: ["endDate"],
      }
    )
    .refine(
      (data) => {
        if (
          !data.isGlobal &&
          (!data.productIds || data.productIds.length === 0)
        ) {
          return false;
        }
        return true;
      },
      {
        message: "At least one product must be selected for non-global deals",
        path: ["productIds"],
      }
    ),
};
export type CreateDealDto = z.infer<typeof zCreateDealDto.body>;

/*
 ** Schema: Get All Deals (Query Parameters)
 ** Includes pagination, sorting
 */
export const zGetAllDealsDto = {
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
    sort: z.enum(["asc", "desc"]).optional().default("desc"),
    isActive: z.coerce.boolean().optional(),
  }),
};
export type GetAllDealsQueryDto = z.infer<typeof zGetAllDealsDto.query>;
