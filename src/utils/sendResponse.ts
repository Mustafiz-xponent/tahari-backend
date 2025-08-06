import { Response } from "express";

export interface IPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface IApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  pagination?: IPagination;
  meta?: Record<string, unknown>;
}

const sendResponse = <T>(
  res: Response,
  { success, statusCode, message, data, pagination, meta }: IApiResponse<T>
): Response<IApiResponse<T>> => {
  const responseBody: IApiResponse<T> = {
    success,
    statusCode,
    message,
    data,
    ...(pagination && { pagination }),
    ...(meta && { meta }),
  };

  return res.status(statusCode).json(responseBody);
};

export default sendResponse;
