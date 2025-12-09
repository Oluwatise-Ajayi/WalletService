import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Login with Google' })
    async googleAuth(@Req() req) {
        // Guard redirects
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Google login callback' })
    async googleAuthRedirect(@Req() req, @Res() res) {
        // 1. VALIDATE: Save/Find the user in your database first!
        // req.user currently holds the Google profile details
        const dbUser = await this.authService.validateGoogleUser(req.user);

        // 2. LOGIN: Now pass the *database user* (which has an .id) to login
        const { access_token } = await this.authService.login(dbUser);
        
        res.json({ access_token });
    }
}