
import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Req() req) {
        // Guard redirects
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req, @Res() res) {
        const { access_token } = await this.authService.login(req.user);
        // Ideally redirect to frontend with token, or just return JSON for this API-only task
        // Using JSON response for simplicity as frontend is out of scope, but usually we redirect.
        // To see the token, let's return it.
        res.json({ access_token });
    }
}
