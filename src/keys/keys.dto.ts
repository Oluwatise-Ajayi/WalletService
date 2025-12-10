import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsEnum, IsNotEmpty } from 'class-validator';

export class CreateKeyDto {
    @ApiProperty({ example: 'My Production Key', description: 'Friendly name for the API key' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: '30D', description: 'Expiration duration (e.g., 1H, 7D, 3M, 1Y)' })
    @IsString()
    @IsNotEmpty()
    expiry: string;

    @ApiProperty({ example: ['*'], description: 'List of permissions (scopes) for the key', required: false })
    @IsArray()
    permissions: string[];
}

export class RolloverKeyDto {
    @ApiProperty({ example: 'uuid-of-expired-key', description: 'ID of the expired key to rollover' })
    @IsString()
    @IsNotEmpty()
    expired_key_id: string;

    @ApiProperty({ example: '30D', description: 'New expiration duration' })
    @IsString()
    @IsNotEmpty()
    expiry: string;
}
