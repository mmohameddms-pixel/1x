import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class CreateVodafonePaymentDto {
  @ApiProperty({ example: 100, description: 'Amount in EGP' })
  @IsNumber()
  @Min(10)
  amount: number;

  @ApiProperty({ example: '+201234567890' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'VF123456789' })
  @IsString()
  transactionReference: string;
}
