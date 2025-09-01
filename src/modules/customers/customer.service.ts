/**
 * Service layer for Customer entity operations.
 * Contains business logic and database interactions for customers.
 */

import prisma from "@/prisma-client/prismaClient";
import { Customer } from "@/generated/prisma/client";
import {
  CreateCustomerDto,
  UpdateCustomerDto,
} from "@/modules/customers/customer.dto";
import { getErrorMessage } from "@/utils/errorHandler";
import bcrypt from "bcrypt";
import {
  GetAllCusotmersResult,
  GetAllCustomersPaginationParams,
} from "@/modules/customers/customer.interface";

/**
 * Create a new customer
 * @param data - Data required to create a customer
 * @returns The created customer
 * @throws Error if the customer cannot be created (e.g., duplicate email or firebaseUid)
 */
// export async function createCustomer(
//   data: CreateCustomerDto
// ): Promise<Customer> {
//   try {
//     const hashedPassword = await bcrypt.hash(data.password, 10);
//     const customer = await prisma.customer.create({
//       data: {
//         firebaseUid: data.firebaseUid,
//         name: data.name,
//         email: data.email,
//         phone: data.phone,
//         address: data.address,
//         passwordHash: hashedPassword,
//       },
//     });
//     return customer;
//   } catch (error) {
//     throw new Error(`Failed to create customer: ${getErrorMessage(error)}`);
//   }
// }

/**
 * Retrieve all customers
 * @returns An array of all customers
 * @throws Error if the query fails
 */
export async function getAllCustomers(
  paginationParams: GetAllCustomersPaginationParams
): Promise<GetAllCusotmersResult> {
  try {
    const { page, limit, skip, sort } = paginationParams;

    const customers = await prisma.$queryRaw<
      Array<{
        customerId: bigint;
        userId: bigint;
        name: string | null;
        email: string | null;
        phone: string;
        lastMessageId: bigint | null;
        lastMessage: string | null;
        lastMessageCreatedAt: Date | null;
        unreadMessageCount: number;
      }>
    >`
        SELECT 
            c."customerId",
            u."userId",
            u."name",
            u."email",
            u."phone",
            m."messageId" as "lastMessageId",
            m."message"   as "lastMessage",
            m."createdAt" as "lastMessageCreatedAt",
            COALESCE(unread_counts."unreadCount", 0) as "unreadMessageCount"
        FROM "Customer" c
        JOIN "User" u ON u."userId" = c."userId"

        -- find last message per user (sent or received)
        LEFT JOIN LATERAL (
            SELECT msg."messageId", msg."message", msg."createdAt"
            FROM "Message" msg
            WHERE msg."senderId" = u."userId" OR msg."receiverId" = u."userId"
            ORDER BY msg."createdAt" DESC
            LIMIT 1
        ) m ON TRUE

        -- count unread messages (for admin/support)
        LEFT JOIN LATERAL (
            SELECT COUNT(*) as "unreadCount"
            FROM "Message" um
            WHERE um."senderId" = u."userId"
              AND um."receiverId" IS NULL
              AND um."status" = 'UNREAD'
        ) unread_counts ON TRUE

        ORDER BY m."createdAt" DESC NULLS LAST
        LIMIT ${limit} OFFSET ${skip};
        `;

    const totalCount = await prisma.customer.count();
    const totalPages = Math.ceil(totalCount / limit);

    return {
      customers,
      totalCount,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Retrieve a customer by its ID
 * @param customerId - The ID of the customer
 * @returns The customer if found, or null if not found
 * @throws Error if the query fails
 */
export async function getCustomerById(
  customerId: BigInt
): Promise<Customer | null> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { customerId: Number(customerId) },
    });
    return customer;
  } catch (error) {
    throw new Error(`Failed to fetch customer: ${getErrorMessage(error)}`);
  }
}

/**
 * Update a customer by its ID
 * @param customerId - The ID of the customer to update
 * @param data - Data to update the customer
 * @returns The updated customer
 * @throws Error if the customer is not found or update fails
 */
export async function updateCustomer(
  customerId: BigInt,
  data: UpdateCustomerDto
): Promise<Customer> {
  try {
    const updateData: any = {
      firebaseUid: data.firebaseUid,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
    };

    // Only hash and update password if provided
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const customer = await prisma.customer.update({
      where: { customerId: Number(customerId) },
      data: updateData,
    });
    return customer;
  } catch (error) {
    throw new Error(`Failed to update customer: ${getErrorMessage(error)}`);
  }
}

/**
 * Delete a customer by its ID
 * @param customerId - The ID of the customer to delete
 * @throws Error if the customer is not found or deletion fails
 */
export async function deleteCustomer(customerId: BigInt): Promise<void> {
  try {
    await prisma.customer.delete({
      where: { customerId: Number(customerId) },
    });
  } catch (error) {
    throw new Error(`Failed to delete customer: ${getErrorMessage(error)}`);
  }
}
