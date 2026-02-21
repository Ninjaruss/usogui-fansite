import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class FluxerAuthGuard extends AuthGuard('fluxer') {
  // Override handleRequest so that strategy errors (network failure, invalid code,
  // Fluxer API errors, DB issues) do NOT bubble up as unhandled 500s.
  // Instead, req.user will be null and the controller redirects to /login?error=…
  handleRequest(_err: any, user: any) {
    return user || null;
  }
}
