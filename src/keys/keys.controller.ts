
import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { KeysService } from './keys.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('keys')
export class KeysController {
    constructor(private readonly keysService: KeysService) { }

    @Post('create')
    @UseGuards(AuthGuard('jwt'))
    async create(@Req() req, @Body() body: { name: string; permissions: string[]; expiry: string }) {
        return this.keysService.createKey(req.user.userId, body);
    }

    @Post('rollover')
    @UseGuards(AuthGuard('jwt'))
    async rollover(@Req() req, @Body() body: { expired_key_id: string; expiry: string }) {
        return this.keysService.rollover(req.user.userId, body);
    }
}
