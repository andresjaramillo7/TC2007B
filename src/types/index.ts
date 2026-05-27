export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface ApiResponse<T = unknown> {
  status: 'success' | 'fail' | 'error';
  data?: T;
  message?: string;
  errors?: unknown[];
  results?: number;
  total?: number;
  page?: number;
  pages?: number;
}
