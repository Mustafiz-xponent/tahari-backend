//src/modules/farmer_payments/farmer_payment.service.ts

/**
 * Service layer for FarmerPayment entity operations.
 * Contains business logic and database interactions for farmer payments.
 */

import prisma from "../../prisma-client/prismaClient";
import { FarmerPayment } from "../../../generated/prisma/client";
import { CreateFarmerPaymentDto, UpdateFarmerPaymentDto } from "./farmer_payment.dto";
import { getErrorMessage } from "@/utils/errorHandler";

/**
 * Create a new farmer payment
 * @param data - Data required to create a farmer payment
 * @returns The created farmer payment
 * @throws Error if the farmer payment cannot be created (e.g., invalid foreign keys)
 */
export async function createFarmerPayment(data: CreateFarmerPaymentDto): Promise<FarmerPayment> {
  try {
    const farmerPayment = await prisma.farmerPayment.create({
      data: {
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate ?? new Date(),
        notes: data.notes,
        transactionId: data.transactionId,
        farmerFarmerId: data.farmerFarmerId,
      },
    });
    return farmerPayment;
  } catch (error) {
    throw new Error(`Failed to create farmer payment: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieve all farmer payments
 * @returns An array of all farmer payments
 * @throws Error if the query fails
 */
export async function getAllFarmerPayments(): Promise<FarmerPayment[]> {
  try {
    const farmerPayments = await prisma.farmerPayment.findMany();
    return farmerPayments;
  } catch (error) {
    throw new Error(`Failed to fetch farmer payments: ${getErrorMessage(error)}`);
  }
}

/**
 * Retrieve a farmer payment by its ID
 * @param paymentId - The ID of the farmer payment
 * @returns The farmer payment if found, or null if not found
 * @throws Error if the query fails
 */
export async function getFarmerPaymentById(paymentId: BigInt): Promise<FarmerPayment | null> {
  try {
    const farmerPayment = await prisma.farmerPayment.findUnique({
      where: { paymentId: Number(paymentId) },
    });
    return farmerPayment;
  } catch (error) {
    throw new Error(`Failed to fetch farmer payment: ${getErrorMessage(error)}`);
  }
}

/**
 * Update a farmer payment by its ID
 * @param paymentId - The ID of the farmer payment to update
 * @param data - Data to update the farmer payment
 * @returns The updated farmer payment
 * @throws Error if the farmer payment is not found or update fails
 */
export async function updateFarmerPayment(paymentId: BigInt, data: UpdateFarmerPaymentDto): Promise<FarmerPayment> {
  try {
    const farmerPayment = await prisma.farmerPayment.update({
      where: { paymentId: Number(paymentId) },
      data: {
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate,
        notes: data.notes,
        transactionId: data.transactionId,
        farmerFarmerId: data.farmerFarmerId,
      },
    });
    return farmerPayment;
  } catch (error) {
    throw new Error(`Failed to update farmer payment: ${getErrorMessage(error)}`);
  }
}

/**
 * Delete a farmer payment by its ID
 * @param paymentId - The ID of the farmer payment to delete
 * @throws Error if the farmer payment is not found or deletion fails
 */
export async function deleteFarmerPayment(paymentId: BigInt): Promise<void> {
  try {
    await prisma.farmerPayment.delete({
      where: { paymentId : Number(paymentId) },
    });
  } catch (error) {
    throw new Error(`Failed to delete farmer payment: ${getErrorMessage(error)}`);
  }
}