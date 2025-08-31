import { Customer } from "@/generated/prisma/client";

export interface GetAllCusotmersResult {
  customers: Customer[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}
export interface GetAllCustomersQueryParams {
  page: number;
  limit: number;
  skip: number;
  sort: string;
}
