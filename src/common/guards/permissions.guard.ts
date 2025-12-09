
import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const Permissions = (...permissions: string[]) => SetMetadata('permissions', permissions);

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
        if (!requiredPermissions) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();
        // user.permissions should be populated by JwtStrategy or ApiKeyGuard
        // In JwtStrategy validation, I added `permissions`.
        // In ApiKeyGuard, I need to attach permissions to `req.user`.

        if (!user || !user.permissions) {
            return false;
        }

        if (user.permissions.includes('*')) return true;

        return requiredPermissions.some((permission) => user.permissions.includes(permission));
    }
}
