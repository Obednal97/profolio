import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

/**
 * Gates the first-run setup wizard.
 *
 * These endpoints are unauthenticated by design: they run before any user
 * exists, during a self-hosted install. That is safe behind someone's router
 * and unsafe on a public URL, where they were reachable in production:
 *
 *  - POST /api/setup/initialize writes .env, runs migrations and creates an
 *    admin user, all from an unauthenticated request body.
 *  - POST /api/setup/test-database opens a Postgres connection to an
 *    arbitrary caller-supplied host and port, which is a server-side request
 *    forgery primitive usable to probe private networks.
 *
 * The wizard now has to be switched on deliberately. It stays available to the
 * installer, which can set ENABLE_SETUP_WIZARD=true, and is off everywhere
 * else. A 404 rather than a 403 avoids advertising that the route exists.
 */
@Injectable()
export class SetupEnabledGuard implements CanActivate {
  private readonly logger = new Logger(SetupEnabledGuard.name);

  canActivate(context: ExecutionContext): boolean {
    if (process.env.ENABLE_SETUP_WIZARD === 'true') {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ path?: string }>();
    this.logger.warn(
      `Blocked setup endpoint ${request?.path ?? 'unknown'} - ENABLE_SETUP_WIZARD is not enabled`,
    );
    throw new NotFoundException();
  }
}
