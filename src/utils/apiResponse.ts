import { Response } from 'express';

interface SuccessBody {
  status: 'success';
  data: unknown;
  results?: number;
  total?: number;
  page?: number;
  pages?: number;
}

interface PaginationSuccessBody {
  status: 'success';
  data: unknown;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

interface ErrorBody {
  status: 'fail' | 'error';
  message: string;
  errors?: unknown[];
  stack?: string;
}

export function sendSuccess(res: Response, data: unknown, statusCode = 200): void {
  const body: SuccessBody = { status: 'success', data };
  res.status(statusCode).json(body);
}

export function sendPaginated(
  res: Response,
  data: unknown[],
  total: number,
  page: number,
  limit: number,
  statusCode = 200,
): void {
  const pages = Math.ceil(total / limit);
  const body: SuccessBody = {
    status: 'success',
    data,
    results: data.length,
    total,
    page,
    pages,
  };
  res.status(statusCode).json(body);
}

export function sendSuccessWithPagination(
  res: Response,
  data: unknown[],
  total: number,
  page: number,
  limit: number,
  statusCode = 200,
): void {
  const totalPages = Math.ceil(total / limit);
  const body: PaginationSuccessBody = {
    status: 'success',
    data,
    pagination: {
      page,
      limit,
      total,
      total_pages: totalPages,
    },
  };
  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  errors?: unknown[],
): void {
  const body: ErrorBody = { status: 'fail', message };
  if (errors) body.errors = errors;
  res.status(statusCode).json(body);
}

export function sendServerError(res: Response, message: string, stack?: string): void {
  const body: ErrorBody = { status: 'error', message };
  if (stack) body.stack = stack;
  res.status(500).json(body);
}
