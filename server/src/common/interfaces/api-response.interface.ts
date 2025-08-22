export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    totalItems: number;
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    count?: number;
    page?: number;
    totalPages?: number;
  };
}
