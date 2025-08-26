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
        // e.g. { data: [...], total: number } or { data: [...], meta: { total } } or { gambles: [...], meta: { total } }
        if (typeof response === 'object' && response !== null) {
          // Primary: { data: [...], total }
          const topData = (response as any).data;
          const topTotal = (response as any).total;
          const metaTotal = (response as any).meta?.total;

          if (Array.isArray(topData) && (typeof topTotal === 'number' || typeof metaTotal === 'number')) {
            const totalValue = typeof topTotal === 'number' ? topTotal : metaTotal;
            httpResponse.setHeader('X-Total-Count', String(totalValue));
            // Ensure browsers can read the header when CORS is enabled
            httpResponse.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');
            return {
              data: topData,
              total: totalValue,
              page: (response as any).page ?? (response as any).meta?.page ?? 1,
              limit: (response as any).limit ?? (response as any).meta?.perPage ?? null,
              totalPages: (response as any).totalPages ?? (response as any).meta?.totalPages ?? Math.ceil(totalValue / ((response as any).limit || (response as any).meta?.perPage || topData.length || 1)),
            };
          }

          // Resource-keyed shape: { gambles: [...], meta: { total } }
          const firstArrayKey = Object.keys(response).find(k => Array.isArray((response as any)[k]));
          if (firstArrayKey && typeof (response as any).meta?.total === 'number') {
            const arr = (response as any)[firstArrayKey];
            const totalValue = (response as any).meta.total;
            httpResponse.setHeader('X-Total-Count', String(totalValue));
            // Ensure browsers can read the header when CORS is enabled
            httpResponse.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');
            // Return normalized response with `data` and keep meta for compatibility
            return {
              data: arr,
              total: totalValue,
              page: (response as any).meta?.page ?? 1,
              limit: (response as any).meta?.perPage ?? null,
              totalPages: (response as any).meta?.totalPages ?? Math.ceil(totalValue / ((response as any).meta?.perPage || arr.length || 1)),
            };
          }
        }

        // If response is a raw array, wrap it into { data: [...] } and set X-Total-Count
        if (Array.isArray(response)) {
          httpResponse.setHeader('X-Total-Count', String(response.length));
          // Ensure browsers can read the header when CORS is enabled
          httpResponse.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');
          return { data: response };
        }

        // For any other object, return as-is to avoid breaking expected shapes
        return response;
      }),
    );
  }
}
