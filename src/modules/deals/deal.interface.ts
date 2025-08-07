import { Deal } from "@/generated/prisma/client";

export interface IGetDealsResult {
  data: Deal[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}
