import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class FluxerAuthGuard extends AuthGuard('fluxer') {}
