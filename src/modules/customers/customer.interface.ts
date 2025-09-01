import { Customer } from "@/generated/prisma/client";

export interface GetAllCusotmersResult {
  customers: Customer[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  totalUnreadMessageCount: number;
}
export interface GetAllCustomersPaginationParams {
  page: number;
  limit: number;
  skip: number;
  sort: string;
}
