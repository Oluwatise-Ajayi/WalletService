
import { Controller, Post, Body, Req, UseGuards, Param } from '@nestjs/common';
import { KeysService } from './keys.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiSecurity } from '@nestjs/swagger';
import { CreateApiKeyDto, ApiPermission } from './dto/create-key.dto';
import { RolloverKeyDto } from './keys.dto';
import { UnifiedAuthGuard } from 'src/auth/guards/unified-auth.guard';

@ApiTags('Keys')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('API-Key-auth')
@Controller('keys')
export class KeysController {
    constructor(private readonly keysService: KeysService) { }

    @Post('create')
    @UseGuards(UnifiedAuthGuard)
    @ApiOperation({ summary: 'Create a new API Key' })
    @ApiResponse({ status: 201, description: 'The API Key has been successfully created.' })
    @ApiResponse({ status: 400, description: 'Bad Request.' })
    async create(@Req() req, @Body() dto: CreateApiKeyDto) {
        return this.keysService.createKey(req.user.userId, dto);
    }

    @Post('rollover')
    @UseGuards(UnifiedAuthGuard)
    @ApiOperation({ summary: 'Rollover an expired API Key' })
    @ApiResponse({ status: 201, description: 'The API Key has been successfully rolled over.' })
    @ApiResponse({ status: 400, description: 'Bad Request.' })
    async rollover(@Req() req, @Body() dto: RolloverKeyDto) {
        return this.keysService.rollover(req.user.userId, dto);
    }

    @Post('revoke/:id')
    @UseGuards(UnifiedAuthGuard)
    @ApiOperation({ summary: 'Revoke an API Key' })
    @ApiResponse({ status: 200, description: 'The API Key has been successfully revoked.' })
    async revoke(@Req() req, @Param('id') id: string) {
        return this.keysService.revokeKey(req.user.userId, id);
    }
}
