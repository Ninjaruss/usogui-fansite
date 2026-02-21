import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class FluxerAuthGuard extends AuthGuard('fluxer') {
  // Override handleRequest so that strategy errors (network failure, invalid code,
  // Fluxer API errors, DB issues) do NOT bubble up as unhandled 500s.
  // Instead, req.user will be null and the controller redirects to /login?error=…
  handleRequest(err: any, user: any) {
    if (err) {
      console.error('[FLUXER AUTH GUARD] Strategy error:', err?.message || err);
    }
    if (!user && !err) {
      console.error('[FLUXER AUTH GUARD] No user returned and no error — auth silently failed');
    }
    return user || null;
  }
}
