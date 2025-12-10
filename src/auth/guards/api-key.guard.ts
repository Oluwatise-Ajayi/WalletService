
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'];

        if (!apiKey) {
            // If this guard is explicitly used, we expect an API key. 
            throw new UnauthorizedException('API Key is missing');
        }

        return this.validateKey(apiKey);
    }

    private async validateKey(apiKey: string): Promise<boolean> {
        // Simple default deny for this stub to ensure no insecurity.
        // In a real implementation with `prisma` injected, we would:
        // const key = await this.prisma.apiKey.findFirst({ where: { key: apiKey } });
        // return !!key;
        return false;
    }
}
