import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PaymobService } from './services/paymob.service';
import { VodafoneService } from './services/vodafone.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaymobPaymentDto } from './dto/create-paymob-payment.dto';
import { CreateVodafonePaymentDto } from './dto/create-vodafone-payment.dto';
import { PaymobWebhookDto } from './dto/paymob-webhook.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private paymobService: PaymobService,
    private vodafoneService: VodafoneService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('paymob/create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Paymob payment' })
  async createPaymobPayment(
    @Request() req,
    @Body() createPaymentDto: CreatePaymobPaymentDto,
  ) {
    return this.paymobService.createPayment(req.user.id, createPaymentDto);
  }

  @Post('paymob/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paymob webhook handler' })
  async paymobWebhook(@Body() webhookData: any, @Headers('hmac') hmac: string) {
    return this.paymobService.handleWebhook(webhookData, hmac);
  }

  @UseGuards(JwtAuthGuard)
  @Post('vodafone/create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Vodafone Cash deposit request' })
  async createVodafonePayment(
    @Request() req,
    @Body() createPaymentDto: CreateVodafonePaymentDto,
  ) {
    return this.vodafoneService.createDeposit(req.user.id, createPaymentDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user payment history' })
  async getPaymentHistory(@Request() req) {
    return this.paymentsService.getUserTransactions(req.user.id);
  }
}
