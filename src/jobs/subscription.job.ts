import cron from "node-cron";
import prisma from "@/prisma-client/prismaClient";
import logger from "@/utils/logger";
import {
  SubscriptionWithRelations,
  handleWalletPayment,
  handleCODPayment,
} from "@/utils/processSubscription";

type ProcessingResult = {
  success: boolean;
  subscriptionId: bigint;
  error?: Error;
};

// Configuration
const CONFIG = {
  BATCH_SIZE: 100, // Number of subscriptions to process per batch
  TIMEZONE: "Asia/Dhaka",
  // CRON_SCHEDULE: "0 2 * * *", // Run at 2 AM
  CRON_SCHEDULE: "* * * * *", // Run at every minute for testing
  MAX_RETRIES: 3,
  CONCURRENT_BATCHES: 5, // Process multiple batches concurrently
} as const;

const updateSubscriptionProcessing = (
  subscriptionId: bigint,
  isProcessing: boolean
) =>
  prisma.subscription.update({
    where: { subscriptionId },
    data: { isProcessing },
  });

// Batch processing functions
const fetchSubscriptionBatch = async (
  skip: number,
  batchSize: number,
  today: Date
) => {
  return prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      renewalDate: { lte: today },
      isProcessing: false,
    },
    include: {
      customer: {
        include: {
          wallet: {
            select: {
              walletId: true,
              balance: true,
              lockedBalance: true,
              customerId: true,
            },
          },
        },
      },
      subscriptionPlan: {
        select: {
          planId: true,
          price: true,
          frequency: true,
          productId: true,
        },
      },
    },
    take: batchSize,
    skip,
    orderBy: { renewalDate: "asc" },
  });
};

const processSubscriptionBatch = async (
  subscriptions: SubscriptionWithRelations[],
  today: Date
): Promise<ProcessingResult[]> => {
  const processWithRetry = async (
    subscription: SubscriptionWithRelations,
    retries = 0
  ): Promise<ProcessingResult> => {
    try {
      await updateSubscriptionProcessing(subscription.subscriptionId, true);
      await processSingleSubscription(subscription, today);

      return {
        success: true,
        subscriptionId: subscription.subscriptionId,
      };
    } catch (error) {
      console.log(error);
      if (retries < CONFIG.MAX_RETRIES) {
        logger.warn(
          `Retrying subscription ${subscription.subscriptionId}, attempt ${
            retries + 1
          }`
        );
        return processWithRetry(subscription, retries + 1);
      }

      await updateSubscriptionProcessing(subscription.subscriptionId, false);

      return {
        success: false,
        subscriptionId: subscription.subscriptionId,
        error: error as Error,
      };
    }
  };

  return Promise.allSettled(
    subscriptions.map((subscription) => processWithRetry(subscription))
  ).then((results) =>
    results.map((result) =>
      result.status === "fulfilled"
        ? result.value
        : {
            success: false,
            subscriptionId: BigInt(0),
            error: new Error("Promise rejected"),
          }
    )
  );
};

// Main processing functions
const processSingleSubscription = async (
  subscription: SubscriptionWithRelations,
  today: Date
) => {
  const paymentMethod = subscription.paymentMethod as "COD" | "WALLET";

  const processors = {
    WALLET: () => handleWalletPayment(subscription, today),
    COD: () => handleCODPayment(subscription, today),
  };

  const processor = processors[paymentMethod];
  if (!processor) {
    throw new Error(`Unsupported payment method: ${paymentMethod}`);
  }

  await processor();
};

// Main renewal function
export const renewSubscriptions = async (today: Date = new Date()) => {
  logger.info(`Starting subscription renewal for ${today.toISOString()}`);

  const processAllBatches = async () => {
    let skip = 0;
    let totalProcessed = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;

    while (true) {
      const batches = await Promise.all(
        Array.from({ length: CONFIG.CONCURRENT_BATCHES }, (_, i) =>
          fetchSubscriptionBatch(
            skip + i * CONFIG.BATCH_SIZE,
            CONFIG.BATCH_SIZE,
            today
          )
        )
      );

      const allSubscriptions = batches.flat();

      if (allSubscriptions.length === 0) {
        break;
      }

      // Process batches concurrently
      const batchResults = await Promise.all(
        batches
          .filter((batch) => batch.length > 0)
          .map((batch) => processSubscriptionBatch(batch, today))
      );

      // Collect results
      const results = batchResults.flat();
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      totalProcessed += results.length;
      totalSuccessful += successful;
      totalFailed += failed;

      // Log failed subscriptions
      results
        .filter((r) => !r.success)
        .forEach((r) =>
          logger.error(
            `Failed to process subscription ${r.subscriptionId}:`,
            r.error
          )
        );

      skip += CONFIG.CONCURRENT_BATCHES * CONFIG.BATCH_SIZE;

      logger.info(
        `Processed batch: ${results.length} subscriptions (${successful} successful, ${failed} failed)`
      );
    }

    logger.info(
      `Subscription renewal completed: ${totalProcessed} total, ${totalSuccessful} successful, ${totalFailed} failed`
    );
  };

  try {
    await processAllBatches();
  } catch (error) {
    logger.error("Critical error in subscription renewal:", error);
    throw error;
  }
};

// Cron job starter
export const startSubscriptionRenewalJob = () => {
  logger.info("Starting subscription renewal job");
  cron.schedule(
    CONFIG.CRON_SCHEDULE,
    async () => {
      try {
        await renewSubscriptions();
      } catch (error) {
        logger.error("Subscription cron failed:", error);
        // TODO: send notification to admin if needed
      }
    },
    {
      timezone: CONFIG.TIMEZONE,
    }
  );
};
