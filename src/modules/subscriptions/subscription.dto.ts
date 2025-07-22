/**
 * Data Transfer Objects (DTOs) for the Subscription entity
 * These interfaces define the expected shape of data when creating or updating a subscription.
 */

import { z } from "zod";

const subscriptionStatusEnum = z.enum([
  "ACTIVE",
  "CANCELLED",
  "EXPIRED",
  "PENDING",
]);
const zBigIntId = (fieldName: string) =>
  z
    .union([z.string(), z.number()])
    .transform(BigInt)
    .refine((val) => val > 0n, {
      message: `${fieldName} must be a positive integer`,
    });
/**
 * Zod schema for creating a new subscription.
 */
export const zCreateSubscriptionDto = {
  body: z.object({
    planId: zBigIntId("Plan ID"),
    paymentMethod: z.enum(["WALLET", "COD"]),
    shippingAddress: z.string().min(1, "Shipping address is required"),
  }),
};

export type CreateSubscriptionDto = z.infer<typeof zCreateSubscriptionDto.body>;
export const zGetSubscriptionDto = {
  params: z.object({
    id: zBigIntId("Subscription ID"),
  }),
};
/**
 * Zod schema for updating a subscription.
 */
export const zUpdateSubscriptionDto = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: subscriptionStatusEnum.optional(),
  renewalDate: z.string().datetime().optional(),
  customerId: zBigIntId("Customer ID").optional(),
  planId: zBigIntId("Plan ID").optional(),
});
export type UpdateSubscriptionDto = z.infer<typeof zUpdateSubscriptionDto>;

/**
 * Zod schema for pause a subscription.
 */

export const zPauseSubscriptionDto = {
  params: z.object({
    id: zBigIntId("Subscription ID"),
  }),
};
export const zResumeSubscriptionDto = {
  params: z.object({
    id: zBigIntId("Subscription ID"),
  }),
};

export const zCancelSubscriptionDto = {
  params: z.object({
    id: zBigIntId("Subscription ID"),
  }),
};
