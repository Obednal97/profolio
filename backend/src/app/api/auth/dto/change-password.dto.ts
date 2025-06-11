import { IsString, MinLength, IsOptional, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ChangePasswordDto {
  @ApiProperty({
    example: "currentPassword123",
    required: false,
    description:
      "Current password (required for users with existing passwords)",
  })
  @IsString({ message: "Current password must be a string" })
  @IsOptional()
  currentPassword?: string;

  @ApiProperty({ example: "newSecurePassword123!" })
  @IsString({ message: "New password must be a string" })
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
  })
  newPassword!: string;
}
