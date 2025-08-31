/**
 * Canonical paginated DTO used across the API.
 * Top-level fields: data, total, page, perPage, totalPages.
 */
export class PaginatedDto<T = any> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  links?: { next?: string; prev?: string };
}
