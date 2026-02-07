import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class CreateWithdrawalDto {
  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(10)
  amount: number;

  @ApiProperty({ example: 'VODAFONE' })
  @IsString()
  method: string;

  @ApiProperty({ example: '+201234567890' })
  @IsString()
  phone: string;
}
