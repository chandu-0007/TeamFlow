export interface ApiResponse<T = unknown> {
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  count: number;
}

export interface PaginatedResponse<T, K extends string> extends PaginationMeta {
  [key: string]: unknown;
}
