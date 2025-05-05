/**
 * Service layer for Wallet entity operations.
 * Contains business logic and database interactions for wallets.
 */

import prisma from "../../prisma-client/prismaClient";
import { Wallet } from "../../../generated/prisma/client";
import { CreateWalletDto, UpdateWalletDto } from "./wallet.dto";
import { getErrorMessage } from "@/utils/errorHandler";

/**
 * Create a new wallet
 * @param data - Data required to create a wallet
 * @returns The created wallet
 * @throws Error if the wallet cannot be created (e.g., duplicate customerId or invalid foreign key)
 */
export async function createWallet(data: CreateWalletDto): Promise<Wallet> {
  try {
    // Check if a wallet already exists for the customer
    const existingWallet = await prisma.wallet.findUnique({
      where: { customerId: data.customerId },
    });
    if (existingWallet) {
      throw new Error("A wallet already exists for this customer");
    }

    const wallet = await prisma.wallet.create({
      data: {
        customerId: data.customerId,
        balance: 0.0, // Default balance as per model
      },
    });
    return wallet;
  } catch (error) {
    throw new Error(`Failed to create wallet: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieve all wallets
 * @returns An array of all wallets
 * @throws Error if the query fails
 */
export async function getAllWallets(): Promise<Wallet[]> {
  try {
    const wallets = await prisma.wallet.findMany();
    return wallets;
  } catch (error) {
    throw new Error(`Failed to fetch wallets: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieve a wallet by its ID
 * @param walletId - The ID of the wallet
 * @returns The wallet if found, or null if not found
 * @throws Error if the query fails
 */
export async function getWalletById(walletId: BigInt): Promise<Wallet | null> {
  try {
    const wallet = await prisma.wallet.findUnique({
         where: { walletId : Number(walletId) },
    });
    return wallet;
  } catch (error) {
    throw new Error(`Failed to fetch wallet: ${getErrorMessage(error)}`);
  }
}

/**
 * Update a wallet by its ID
 * @param walletId - The ID of the wallet to update
 * @param data - Data to update the wallet
 * @returns The updated wallet
 * @throws Error if the wallet is not found, update fails, or customerId is already assigned
 */
export async function updateWallet(
  walletId: BigInt,
  data: UpdateWalletDto
): Promise<Wallet> {
  try {
    // If updating customerId, check for existing wallet with that customerId
    if (data.customerId) {
      const existingWallet = await prisma.wallet.findUnique({
        where: { customerId: data.customerId },
      });
      if (existingWallet && existingWallet.walletId !== walletId) {
        throw new Error("A wallet already exists for this customer");
      }
    }

    const wallet = await prisma.wallet.update({
      where: { walletId : Number(walletId) },
      data: {
        customerId: data.customerId,
        balance: data.balance,
      },
    });
    return wallet;
  } catch (error) {
    throw new Error(`Failed to update wallet: ${getErrorMessage(error)}`);
  }
}

/**
 * Delete a wallet by its ID
 * @param walletId - The ID of the wallet to delete
 * @throws Error if the wallet is not found or deletion fails
 */
export async function deleteWallet(walletId: BigInt): Promise<void> {
  try {
    await prisma.wallet.delete({
      where: { walletId: Number(walletId) },
    });
  } catch (error) {
    throw new Error(`Failed to delete wallet: ${getErrorMessage(error)}`);
  }
}
