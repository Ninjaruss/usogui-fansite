const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
};

export { API_URL };
