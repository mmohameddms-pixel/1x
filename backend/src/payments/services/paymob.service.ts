import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments.service';
import { CreatePaymobPaymentDto } from '../dto/create-paymob-payment.dto';

@Injectable()
export class PaymobService {
  private readonly apiKey: string;
  private readonly integrationId: string;
  private readonly iframeId: string;
  private readonly hmacSecret: string;
  private readonly baseUrl = 'https://accept.paymob.com/api';

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
  ) {
    this.apiKey = this.configService.get<string>('PAYMOB_API_KEY');
    this.integrationId = this.configService.get<string>('PAYMOB_INTEGRATION_ID');
    this.iframeId = this.configService.get<string>('PAYMOB_IFRAME_ID');
    this.hmacSecret = this.configService.get<string>('PAYMOB_HMAC_SECRET');
  }

  async createPayment(userId: string, createPaymentDto: CreatePaymobPaymentDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      const authToken = await this.authenticate();

      const order = await this.createOrder(
        authToken,
        createPaymentDto.amount,
        user.email,
      );

      const paymentKey = await this.getPaymentKey(
        authToken,
        order.id,
        createPaymentDto.amount,
        user,
      );

      const transaction = await this.paymentsService.createTransaction(
        userId,
        'PAYMOB',
        'DEPOSIT',
        createPaymentDto.amount,
        order.id.toString(),
        {
          orderId: order.id,
          paymentKey,
        },
      );

      return {
        transactionId: transaction.id,
        iframeUrl: `https://accept.paymob.com/api/acceptance/iframes/${this.iframeId}?payment_token=${paymentKey}`,
        paymentKey,
      };
    } catch (error) {
      throw new BadRequestException('Failed to create Paymob payment');
    }
  }

  private async authenticate(): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/auth/tokens`, {
        api_key: this.apiKey,
      }),
    );
    return response.data.token;
  }

  private async createOrder(
    authToken: string,
    amount: number,
    email: string,
  ): Promise<any> {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/ecommerce/orders`,
        {
          auth_token: authToken,
          delivery_needed: 'false',
          amount_cents: Math.round(amount * 100),
          currency: 'EGP',
          items: [],
        },
      ),
    );
    return response.data;
  }

  private async getPaymentKey(
    authToken: string,
    orderId: number,
    amount: number,
    user: any,
  ): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/acceptance/payment_keys`, {
        auth_token: authToken,
        amount_cents: Math.round(amount * 100),
        expiration: 3600,
        order_id: orderId,
        billing_data: {
          apartment: 'NA',
          email: user.email,
          floor: 'NA',
          first_name: user.name.split(' ')[0] || 'User',
          street: 'NA',
          building: 'NA',
          phone_number: 'NA',
          shipping_method: 'NA',
          postal_code: 'NA',
          city: 'NA',
          country: 'EG',
          last_name: user.name.split(' ')[1] || 'User',
          state: 'NA',
        },
        currency: 'EGP',
        integration_id: parseInt(this.integrationId),
      }),
    );
    return response.data.token;
  }

  async handleWebhook(webhookData: any, hmac: string): Promise<any> {
    const isValid = this.verifyHmac(webhookData, hmac);

    if (!isValid) {
      throw new BadRequestException('Invalid HMAC signature');
    }

    const obj = webhookData.obj;
    const orderId = obj.order?.id?.toString();
    const success = obj.success === true || obj.success === 'true';

    if (!orderId) {
      return { message: 'No order ID found' };
    }

    const transaction = await this.prisma.transaction.findFirst({
      where: { reference: orderId },
    });

    if (!transaction) {
      return { message: 'Transaction not found' };
    }

    if (success) {
      await this.paymentsService.updateTransactionStatus(
        transaction.id,
        'SUCCESS',
        { webhookData: obj },
      );

      await this.prisma.user.update({
        where: { id: transaction.userId },
        data: {
          balance: {
            increment: transaction.amount,
          },
        },
      });
    } else {
      await this.paymentsService.updateTransactionStatus(
        transaction.id,
        'FAILED',
        { webhookData: obj },
      );
    }

    return { message: 'Webhook processed successfully' };
  }

  private verifyHmac(webhookData: any, receivedHmac: string): boolean {
    const obj = webhookData.obj;

    const concatenatedString = [
      obj.amount_cents,
      obj.created_at,
      obj.currency,
      obj.error_occured,
      obj.has_parent_transaction,
      obj.id,
      obj.integration_id,
      obj.is_3d_secure,
      obj.is_auth,
      obj.is_capture,
      obj.is_refunded,
      obj.is_standalone_payment,
      obj.is_voided,
      obj.order?.id,
      obj.owner,
      obj.pending,
      obj.source_data?.pan,
      obj.source_data?.sub_type,
      obj.source_data?.type,
      obj.success,
    ].join('');

    const calculatedHmac = crypto
      .createHmac('sha512', this.hmacSecret)
      .update(concatenatedString)
      .digest('hex');

    return calculatedHmac === receivedHmac;
  }
}
