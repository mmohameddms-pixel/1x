import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class CreatePaymobPaymentDto {
  @ApiProperty({ example: 100, description: 'Amount in EGP' })
  @IsNumber()
  @Min(10)
  amount: number;
}
