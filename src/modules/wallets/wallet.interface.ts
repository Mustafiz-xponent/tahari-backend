import { WalletTransaction } from "@/generated/prisma/client";

export interface WalletDepositeResult {
  walletTransaction: WalletTransaction;
  redirectUrl: string;
}
