import { IsString, MinLength, Matches, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO for requesting password setup for OAuth users
 * No body needed - user identified by JWT
 */
export class RequestPasswordSetupDto {
  // Empty - user identified by JWT token
}

/**
 * DTO for verifying setup token
 */
export class VerifySetupTokenDto {
  @ApiProperty({ 
    description: "Setup token from email",
    example: "a1b2c3d4e5f6..."
  })
  @IsString()
  @IsNotEmpty()
  token!: string;
}

/**
 * DTO for setting password with token
 */
export class SetPasswordDto {
  @ApiProperty({ 
    description: "Setup token from email",
    example: "a1b2c3d4e5f6..."
  })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ 
    description: "New password (min 12 characters, must contain uppercase, lowercase, number and special character)",
    minimum: 12,
    example: "SecureP@ssw0rd123"
  })
  @IsString()
  @MinLength(12, { message: "Password must be at least 12 characters long" })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { 
      message: "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
    }
  )
  password!: string;

  @ApiProperty({ 
    description: "Password confirmation (must match password)",
    example: "SecureP@ssw0rd123"
  })
  @IsString()
  @IsNotEmpty()
  confirmPassword!: string;
}

/**
 * Response DTO for token validation
 */
export class TokenValidationResponse {
  @ApiProperty({ 
    description: "Whether the token is valid",
    example: true
  })
  valid!: boolean;

  @ApiProperty({ 
    description: "Email address associated with the token",
    example: "user@example.com"
  })
  email!: string;

  @ApiProperty({ 
    description: "Seconds until token expires",
    example: 3542
  })
  expiresIn!: number;
}

/**
 * Response DTO for successful password setup
 */
export class PasswordSetupResponse {
  @ApiProperty({ 
    description: "Whether the operation was successful",
    example: true
  })
  success!: boolean;

  @ApiProperty({ 
    description: "Success message",
    example: "Password set successfully. You can now sign in with email and password."
  })
  message!: string;

  @ApiProperty({ 
    description: "Updated provider status",
    example: "dual",
    enum: ["dual"]
  })
  provider!: "dual";
}

/**
 * Response DTO for password setup request
 */
export class PasswordSetupRequestResponse {
  @ApiProperty({ 
    description: "Whether the operation was successful",
    example: true
  })
  success!: boolean;

  @ApiProperty({ 
    description: "Message to display to user",
    example: "Password setup email sent to your registered email address"
  })
  message!: string;
}

/**
 * Error response DTO
 */
export class OAuthPasswordErrorResponse {
  @ApiProperty({ 
    description: "HTTP status code",
    example: 400
  })
  statusCode!: number;

  @ApiProperty({ 
    description: "Error message",
    example: "User already has a password"
  })
  message!: string;

  @ApiPropertyOptional({ 
    description: "Detailed error information",
    example: "ValidationError"
  })
  @IsOptional()
  error?: string;
}