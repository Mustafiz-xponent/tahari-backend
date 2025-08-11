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
        .union([z.string(), z.number()])
        .refine((val) => !isNaN(Number(val)), {
          message: "Must be a valid number",
        })
        .transform((val) => Number(val)),
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
// Inferred types
type CreateDealBodyDto = z.infer<typeof zCreateDealDto.body>;
// Combined type for usage
export type CreateDealDto = {
  body: CreateDealBodyDto;
};
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
type GetAllDealsQueryDto = z.infer<typeof zGetAllDealsDto.query>;
export type GetAllDealsDto = {
  query: GetAllDealsQueryDto;
};

/*
 **   Schema: Get Single Deal by ID (Route Param)
 */
export const zGetDealDto = {
  params: z.object({
    id: zBigIntId("Deal ID"),
  }),
};

type GetDealParamsDto = z.infer<typeof zGetDealDto.params>;
export type GetDealDto = {
  params: GetDealParamsDto;
};
/**
 * Schema: Update Deal
 * @description All fields optional, but validated similarly to creation
 **/
export const zUpdateDealDto = {
  params: z.object({
    id: zBigIntId("Deal ID"),
  }),
  body: z
    .object({
      title: z.string().min(3).max(100).optional(),
      description: z.string().max(255).optional(),
      discountType: z.nativeEnum(DiscountType).optional(),
      discountValue: z
        .union([z.string(), z.number()])
        .refine((val) => !isNaN(Number(val)), {
          message: "Must be a valid number",
        })
        .transform((val) => Number(val))
        .optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      isGlobal: z.boolean().optional(),
      productIds: z
        .array(zBigIntId("Product ID"))
        .optional()
        .refine((arr) => arr === undefined || arr.length > 0, {
          message: "At least one product must be selected",
        }),
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          return data.endDate > data.startDate;
        }
        return true;
      },
      {
        message: "End date must be after start date",
        path: ["endDate"],
      }
    )
    .refine(
      (data) => {
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
        if (
          data.isGlobal === false &&
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
type updateDealParamsDto = z.infer<typeof zUpdateDealDto.params>;
type UpdateDealBodyDto = z.infer<typeof zUpdateDealDto.body>;
export type UpdateDealDto = {
  params: updateDealParamsDto;
  body: UpdateDealBodyDto;
};
/*
 ** Schema: Delete Deal by ID (Route Param)
 */
export const zDeleteDealDto = {
  params: z.object({
    id: zBigIntId("Deal ID"),
  }),
};

type DeleteDealParamsDto = z.infer<typeof zDeleteDealDto.params>;
export type DeleteDealDto = {
  params: DeleteDealParamsDto;
};
