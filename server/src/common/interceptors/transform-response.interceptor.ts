import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  meta?: {
    count?: number;
    page?: number;
    totalPages?: number;
    hasMore?: boolean;
  };
}

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => {
        // Handle paginated responses
        if (data && data.items && data.meta) {
          return {
            data: data.items,
            meta: {
              count: data.meta.totalItems,
              page: data.meta.currentPage,
              totalPages: data.meta.totalPages,
              hasMore: data.meta.currentPage < data.meta.totalPages
            }
          };
        }
        // Handle regular responses
        return { data };
      }),
    );
  }
}
