import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsPhoneNumber } from 'class-validator';

export class CreateAgentDto {
  @ApiProperty({ example: '+201234567890' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Egypt' })
  @IsString()
  country: string;
}
