import "server-only";

/**
 * Application errors that map to HTTP status codes.
 *
 * NestJS mapped HttpException subclasses to statuses automatically, and
 * anything else to a 500. That default bit: AssetsService threw a plain Error
 * on invalid monetary input, so bad money became a 500 rather than a 400, and
 * the registered AllExceptionsFilter was never actually wired up. Services here
 * throw these instead, and withRoute() does the mapping in one place.
 */
export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** 400 - the request was understood but is not acceptable. */
export class BadRequest extends AppError {
  constructor(message = "Bad request") {
    super(message, 400, "BAD_REQUEST");
  }
}

/** 401 - no valid credentials. */
export class Unauthorized extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

/** 403 - authenticated, but not allowed to do this. */
export class Forbidden extends AppError {
  constructor(message = "You do not have access to this resource") {
    super(message, 403, "FORBIDDEN");
  }
}

/** 404 - no such resource, or not visible to this caller. */
export class NotFound extends AppError {
  constructor(message = "Not found") {
    super(message, 404, "NOT_FOUND");
  }
}

/** 409 - conflicts with existing state, e.g. a duplicate email. */
export class Conflict extends AppError {
  constructor(message = "Already exists") {
    super(message, 409, "CONFLICT");
  }
}

/** 429 - rate limited. */
export class TooManyRequests extends AppError {
  constructor(
    message = "Too many requests",
    readonly retryAfterSeconds?: number,
  ) {
    super(message, 429, "TOO_MANY_REQUESTS");
  }
}

/** 503 - a dependency the request needs is not configured or reachable. */
export class ServiceUnavailable extends AppError {
  constructor(message = "Service unavailable") {
    super(message, 503, "SERVICE_UNAVAILABLE");
  }
}

/**
 * Ownership assertion.
 *
 * Returns 404 rather than 403 when a record belongs to someone else, so the
 * API does not confirm that an id exists to a caller who cannot see it.
 * Use Forbidden explicitly where the caller is allowed to know it exists.
 */
export function assertOwned<T extends { userId: string }>(
  record: T | null,
  userId: string,
  what = "Resource",
): T {
  if (!record || record.userId !== userId) {
    throw new NotFound(`${what} not found`);
  }
  return record;
}
