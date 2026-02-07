import { ApiProperty } from '@nestjs/swagger';

export class PaymobWebhookDto {
  @ApiProperty()
  obj: any;

  @ApiProperty()
  type: string;
}
