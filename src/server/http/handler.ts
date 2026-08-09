import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { AppError, TooManyRequests } from "./errors";

/**
 * One wrapper doing the job of NestJS's ValidationPipe, guards and exception
 * filter.
 *
 * Validation is STRICT: schemas are expected to use `.strict()` so an unknown
 * property is a 400, matching the previous global
 * `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`. Zod strips
 * silently by default, which would have turned today's 400s into 200s with
 * fields quietly dropped - a real risk here, since the frontend and backend
 * disagree about several field names.
 */

export interface RouteContext<TBody, TQuery, TParams> {
  body: TBody;
  query: TQuery;
  params: TParams;
  request: NextRequest;
}

interface RouteOptions<TBody, TQuery, TParams, TResult> {
  /** Schema for the JSON body. Omit for handlers that take none. */
  body?: ZodType<TBody>;
  /** Schema for search params. */
  query?: ZodType<TQuery>;
  /** Schema for dynamic route segments. */
  params?: ZodType<TParams>;
  handler: (ctx: RouteContext<TBody, TQuery, TParams>) => Promise<TResult>;
}

function zodToResponse(error: ZodError): NextResponse {
  const flattened = error.flatten();
  return NextResponse.json(
    {
      success: false,
      error: "VALIDATION_FAILED",
      message: "The request did not pass validation",
      fields: flattened.fieldErrors,
      formErrors: flattened.formErrors,
    },
    { status: 400 },
  );
}

export function withRoute<
  TBody = undefined,
  TQuery = undefined,
  TParams = undefined,
  TResult = unknown,
>(options: RouteOptions<TBody, TQuery, TParams, TResult>) {
  return async function route(
    request: NextRequest,
    segmentData?: { params: Promise<Record<string, string | string[]>> },
  ): Promise<NextResponse> {
    try {
      let body = undefined as TBody;
      if (options.body) {
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          // An unparseable body is the caller's mistake, not a server fault.
          return NextResponse.json(
            {
              success: false,
              error: "INVALID_JSON",
              message: "Request body must be valid JSON",
            },
            { status: 400 },
          );
        }
        body = options.body.parse(raw);
      }

      let query = undefined as TQuery;
      if (options.query) {
        query = options.query.parse(
          Object.fromEntries(request.nextUrl.searchParams.entries()),
        );
      }

      let params = undefined as TParams;
      if (options.params) {
        params = options.params.parse((await segmentData?.params) ?? {});
      }

      const result = await options.handler({ body, query, params, request });

      // A handler returning a Response takes full control (streams, redirects,
      // cookie mutation). Cast through unknown because TResult is generic and
      // Response is not structurally a NextResponse.
      if (result instanceof Response) {
        return result as unknown as NextResponse;
      }

      return NextResponse.json(result ?? { success: true });
    } catch (error) {
      if (error instanceof ZodError) {
        return zodToResponse(error);
      }

      if (error instanceof TooManyRequests) {
        return NextResponse.json(
          { success: false, error: error.code, message: error.message },
          {
            status: error.status,
            headers: error.retryAfterSeconds
              ? { "Retry-After": String(error.retryAfterSeconds) }
              : undefined,
          },
        );
      }

      if (error instanceof AppError) {
        return NextResponse.json(
          { success: false, error: error.code, message: error.message },
          { status: error.status },
        );
      }

      // Anything unrecognised is a server fault. Log it, but never return the
      // message: it can carry connection strings, SQL and stack traces.
      console.error("Unhandled route error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "INTERNAL_ERROR",
          message: "Something went wrong",
        },
        { status: 500 },
      );
    }
  };
}
