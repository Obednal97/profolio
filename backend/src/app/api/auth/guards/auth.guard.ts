import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { verify } from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
        const decoded = verify(token, process.env.JWT_SECRET!, { maxAge: '7d' });
        if (typeof decoded !== 'object' || !('id' in decoded) || !('email' in decoded)) {
          throw new UnauthorizedException('Malformed token');
        }
        request.user = decoded as {
          id: number;
          email: string;
          name?: string | null;
        };
        return true;
      } catch {
        throw new UnauthorizedException('Invalid or expired token');
      }
  }

  private extractToken(req: Request): string | null {
    const authHeader = req.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    return req.cookies?.token ?? null;
  }
}