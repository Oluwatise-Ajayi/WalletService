import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { KeysService } from '../../keys/keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private readonly keysService: KeysService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const rawKey = req.headers['x-api-key'];

        if (!rawKey) return false;

        const user = await this.keysService.validateKey(rawKey);
        if (!user) {
            throw new UnauthorizedException('Invalid, expired or revoked API Key');
        }

        req.user = user;
        return true;
    }
}
