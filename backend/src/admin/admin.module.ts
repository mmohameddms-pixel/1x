import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PaymentsModule } from '../payments/payments.module';
import { WithdrawalsModule } from '../withdrawals/withdrawals.module';

@Module({
  imports: [PaymentsModule, WithdrawalsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
