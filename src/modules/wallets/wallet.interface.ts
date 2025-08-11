import { WalletTransaction } from "@/generated/prisma/client";

export interface IDepositData {
  walletTransaction: WalletTransaction;
  redirectUrl: string;
}
