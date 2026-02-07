import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymobService } from './services/paymob.service';
import { VodafoneService } from './services/vodafone.service';

@Module({
  imports: [HttpModule],
  providers: [PaymentsService, PaymobService, VodafoneService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
