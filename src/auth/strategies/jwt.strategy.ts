
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('jwt.secret') || 'default_secret_do_not_use',
        });
    }

    async validate(payload: any) {
        // payload should contain sub (userId) and email
        if (!payload.sub) {
            throw new UnauthorizedException('Invalid token payload: missing sub');
        }
        return { userId: payload.sub, email: payload.email, permissions: ['*'] };
    }
}
