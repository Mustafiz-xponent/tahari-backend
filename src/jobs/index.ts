import { startSubscriptionRenewalJob } from "@/jobs/subscription.job";
import logger from "@/utils/logger";

export function initJobs() {
  startSubscriptionRenewalJob();
}
