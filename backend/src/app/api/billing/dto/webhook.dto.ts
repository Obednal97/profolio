import { IsString, IsObject } from 'class-validator';

export class StripeWebhookDto {
  @IsString()
  signature!: string;

  @IsObject()
  body!: Buffer | Record<string, unknown>;
}