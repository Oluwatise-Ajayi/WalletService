import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    @Get()
    @ApiOperation({ summary: 'Check application health' })
    @ApiResponse({ status: 200, description: 'Application is healthy', schema: { example: { status: 'ok', timestamp: '2023-10-27T10:00:00.000Z' } } })
    check() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }
}
