export interface PaginatedResponse<T> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: T[];
}

interface BaseResponse {
  message: string;
}
export interface ActionResult<T> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface ApiResponse extends BaseResponse {}
