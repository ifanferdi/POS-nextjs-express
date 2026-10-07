export interface PaginatedResponse<T> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: T[];
}

export interface ApiResponse {
  message: string;
  stack?: string;
}
export interface ActionResult<T> {
  success: boolean;
  error?: string;
  data?: T;
}
