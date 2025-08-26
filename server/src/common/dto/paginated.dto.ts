export class MetaDto {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class PaginatedDto<T = any> {
  data: T[];
  meta: MetaDto;
  links?: { next?: string; prev?: string };
}

