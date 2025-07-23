import { startSubscriptionRenewalJob } from "@/jobs/subscription.job";

export function initJobs() {
  startSubscriptionRenewalJob();
}
