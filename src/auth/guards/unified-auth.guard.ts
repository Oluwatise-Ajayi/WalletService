import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { KeysService } from '../../keys/keys.service';

@Injectable()
export class UnifiedAuthGuard extends AuthGuard('jwt') {
    constructor(
        private readonly keysService: KeysService,
        private readonly reflector: Reflector
    ) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'];

        if (apiKey) {
            // API Key Authentication
            const user = await this.keysService.validateKey(apiKey);
            if (!user) {
                throw new UnauthorizedException('Invalid API Key');
            }
            request.user = user;
            return true;
        }

        // Fallback to JWT (Standard AuthGuard)
        return super.canActivate(context) as Promise<boolean>;
    }
}
