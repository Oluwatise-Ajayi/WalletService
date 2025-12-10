import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyGuard } from './api-key.guard';
import { Reflector } from '@nestjs/core';

@Injectable()
export class CompositeAuthGuard implements CanActivate {
    constructor(
        private apiKeyGuard: ApiKeyGuard,
        // We can't inject 'JwtAuthGuard' if it's just AuthGuard('jwt') class expression unless we wrap it or instantiate it.
        // Simpler approach: Use super.canActivate if extending, but here we compose.
        // We'll instantiate separate checks or use DI if JwtAuthGuard is a provider.
        // For now, let's assume we can use the standard Passport guard dynamically.
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();

        // 1. Check for API Key Header
        if (req.headers['x-api-key']) {
            return this.apiKeyGuard.canActivate(context) as Promise<boolean>;
        }

        // 2. Default to JWT Bearer check
        // Since we can't easily inject the mixin return value, we construct a temporary guard or injection.
        // Better way: extends AuthGuard('jwt') and override canActivate to check API key first.
        // But user requested "CompositeAuthGuard".

        const jwtGuard = new (AuthGuard('jwt'))();
        return jwtGuard.canActivate(context) as Promise<boolean>;
    }
}
