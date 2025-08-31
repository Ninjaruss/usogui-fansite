import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Transform responses to ensure a single, consistent shape for the frontend.
 * - Preserve explicit shapes (auth tokens, other non-list payloads).
 * - Normalize raw arrays into `{ data: [...] }` and set `X-Total-Count` header.
 * - Normalize existing canonical paginated responses `{ data: [...], total }` and expose `X-Total-Count`.
 *
 * Note: resource-keyed envelopes (e.g. `{ gambles: [...], meta: { total } }`) and
 * `{ data, meta }` shaped responses are not supported by default. Controllers must
 * return the canonical paginated shape `{ data, total, page, perPage, totalPages }`.
 */
@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, any>
{
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((response) => {
        const httpResponse = context
          .switchToHttp()
          .getResponse<ExpressResponse>();

        // If response is falsy, return as-is
        if (response === null || response === undefined) return response;

        // If auth responses (e.g. { access_token, user }) or other explicit shapes, preserve them
        if (
          typeof response === 'object' &&
          ('access_token' in response || 'token' in response)
        ) {
          return response;
        }

        // If the service already returns the canonical paginated shape expected by the client
        // e.g. { data: [...], total: number }
        if (typeof response === 'object' && response !== null) {
          // Primary: { data: [...], total }
          const topData = response.data;
          const topTotal = response.total;

          if (Array.isArray(topData) && typeof topTotal === 'number') {
            const totalValue = topTotal;
            httpResponse.setHeader('X-Total-Count', String(totalValue));
            // Ensure browsers can read the header when CORS is enabled
            httpResponse.setHeader(
              'Access-Control-Expose-Headers',
              'X-Total-Count',
            );
            return {
              data: topData,
              total: totalValue,
              page: response.page ?? 1,
              perPage: response.perPage ?? response.limit ?? null,
              totalPages:
                response.totalPages ??
                Math.ceil(
                  totalValue /
                    (response.perPage || response.limit || topData.length || 1),
                ),
            };
          }
        }

        // If response is a raw array, wrap it into { data: [...] } and set X-Total-Count
        if (Array.isArray(response)) {
          httpResponse.setHeader('X-Total-Count', String(response.length));
          // Ensure browsers can read the header when CORS is enabled
          httpResponse.setHeader(
            'Access-Control-Expose-Headers',
            'X-Total-Count',
          );
          return { data: response };
        }

        // For any other object, return as-is to avoid breaking expected shapes
        return response;
      }),
    );
  }
}
