import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    // Handle demo mode
    if (authHeader === 'Bearer demo-token-secure-123') {
      request.user = {
        id: 'demo-user-id',
        email: 'demo@profolio.com',
        name: 'Demo User'
      };
      return true;
    }
    
    // For regular JWT tokens, use passport validation
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Handle demo user case
    if (user && user.id === 'demo-user-id') {
      return user;
    }
    
    // For regular users, throw error if no user or if there's an error
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid JWT token');
    }
    
    return user;
  }
} 