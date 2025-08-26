import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Transform responses to ensure a consistent shape for the frontend.
 * - Preserve already-shaped responses (auth tokens, explicit `quotes`/`data` objects).
 * - Normalize arrays into `{ data: [...] }` and set `X-Total-Count` header.
 * - Normalize paginated responses that include `data` + `total`.
 */
@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((response) => {
        const httpResponse = context.switchToHttp().getResponse<ExpressResponse>();

        // If response is falsy, return as-is
        if (response === null || response === undefined) return response;

        // If auth responses (e.g. { access_token, user }) or other explicit shapes, preserve them
        if (typeof response === 'object' && (('access_token' in response) || ('token' in response))) {
          return response;
        }

        // If the service already returns a paginated shape expected by the client
        // e.g. { data: [...], total: number } or { quotes: [...], total }
        if (typeof response === 'object' && response !== null) {
          if (Array.isArray((response as any).data) && typeof (response as any).total === 'number') {
            // set header
            httpResponse.setHeader('X-Total-Count', String((response as any).total));
            // return normalized object but keep `total` top-level for compatibility
            return {
              data: (response as any).data,
              total: (response as any).total,
              page: (response as any).page ?? 1,
              limit: (response as any).limit ?? null,
              totalPages: (response as any).totalPages ?? Math.ceil((response as any).total / ((response as any).limit || (response as any).data.length || 1)),
            };
          }

          if (Array.isArray((response as any).quotes) && typeof (response as any).total === 'number') {
            httpResponse.setHeader('X-Total-Count', String((response as any).total));
            return response; // keep { quotes, total } shape
          }
        }

        // If response is a raw array, wrap it into { data: [...] } and set X-Total-Count
        if (Array.isArray(response)) {
          httpResponse.setHeader('X-Total-Count', String(response.length));
          return { data: response };
        }

        // For any other object, return as-is to avoid breaking expected shapes
        return response;
      }),
    );
  }
}
