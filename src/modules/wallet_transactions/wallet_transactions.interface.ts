export interface CustomerTransactionQuery {
  page?: string;
  limit?: string;
  sort?: "asc" | "desc";
  transactionStatus?: string;
  transactionType?: string;
}
