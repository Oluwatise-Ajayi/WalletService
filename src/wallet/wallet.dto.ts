import { IsNumber, IsString, IsPositive, IsOptional, Min, IsEmail } from 'class-validator';

export class DepositDto {
    @IsNumber()
    @IsPositive()
    @Min(100, { message: 'Minimum deposit is 1.00' })
    amount: number;
}

export class TransferDto {
    @IsOptional()
    @IsString()
    wallet_number?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsNumber()
    @IsPositive()
    @Min(1, { message: 'Minimum transfer is 0.01' })
    amount: number;
}
