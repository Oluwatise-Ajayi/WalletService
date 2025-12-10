import { IsString, IsNotEmpty, IsEnum, IsArray, ArrayMinSize, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Define allowed permissions strictly
export enum ApiPermission {
    DEPOSIT = 'deposit',
    TRANSFER = 'transfer',
    READ = 'read',
}

export class CreateApiKeyDto {
    @ApiProperty({ example: 'Checkout Service', description: 'Friendly name for the key' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        example: ['deposit', 'read'],
        enum: ApiPermission,
        isArray: true,
        description: 'List of permissions this key is allowed to perform'
    })
    @IsArray()
    @ArrayMinSize(1)
    @IsEnum(ApiPermission, { each: true })
    permissions: ApiPermission[];

    @ApiProperty({
        example: '1M',
        description: 'Validity period: 1H (Hour), 1D (Day), 1M (Month), 1Y (Year)',
        pattern: '^[1-9][0-9]*[HDMY]$'
    })
    @IsString()
    @Matches(/^[1-9][0-9]*[HDMY]$/, { message: 'Expiry must be format like 1D, 1M, 1Y' })
    expiry: string;
}
