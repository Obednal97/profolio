import { 
  Controller, 
  Post, 
  Get,
  Delete,
  Body, 
  Req, 
  Res,
  UseGuards,
  Headers,
  RawBodyRequest,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * Create a checkout session for subscription
   */
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckoutSession(
    @Body() dto: CreateCheckoutSessionDto,
    @Req() req: Request,
  ): Promise<{ url: string }> {
    const userId = (req as any).user.userId;
    
    // Default URLs if not provided
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successUrl = dto.successUrl || `${baseUrl}/app/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = dto.cancelUrl || `${baseUrl}/app/billing`;

    const url = await this.billingService.createCheckoutSession(
      userId,
      dto.priceId,
      successUrl,
      cancelUrl,
    );

    return { url };
  }

  /**
   * Create a customer portal session
   */
  @Post('portal')
  @UseGuards(JwtAuthGuard)
  async createPortalSession(@Req() req: Request): Promise<{ url: string }> {
    const userId = (req as any).user.userId;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/app/billing`;

    const url = await this.billingService.createPortalSession(userId, returnUrl);
    return { url };
  }

  /**
   * Get current subscription details
   */
  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  async getSubscription(@Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.billingService.getSubscription(userId);
  }

  /**
   * Cancel subscription
   */
  @Delete('subscription')
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(@Req() req: Request): Promise<{ message: string }> {
    const userId = (req as any).user.userId;
    await this.billingService.cancelSubscription(userId);
    return { message: 'Subscription will be canceled at the end of the billing period' };
  }

  /**
   * Handle Stripe webhooks
   * Note: This endpoint should NOT use JwtAuthGuard as it's called by Stripe
   */
  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ): Promise<void> {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    try {
      await this.billingService.handleWebhook(signature, req.rawBody);
      res.status(200).send('Webhook processed');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).send('Webhook error');
    }
  }
}