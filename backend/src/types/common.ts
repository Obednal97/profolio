/**
 * Common Type Utilities for Type Safety Migration
 * 
 * This file provides utilities to help migrate away from 'any' types
 * while maintaining code functionality during the transition.
 */

/**
 * SafeAny - Use this instead of 'any' during migration
 * Requires a reason/TODO comment for tracking
 * 
 * @example
 * // Instead of: data: any
 * data: SafeAny<"TODO: Define proper API response type">
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SafeAny<Reason extends string = "TODO: Replace with proper type"> = any & {
  __reason?: Reason;
};

/**
 * UnknownObject - Use for objects that need runtime validation
 * Better than 'any' because it requires explicit type checking
 */
export type UnknownObject = Record<string, unknown>;

/**
 * Common Express Request types with proper typing
 */
import { Request as ExpressRequest } from 'express';
import { User } from '@prisma/client';

export interface AuthenticatedRequest extends ExpressRequest {
  user?: User | { id: string; email: string; role?: string };
  userId?: string;
}

/**
 * Type guards for runtime type checking
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type assertion with runtime checking
 */
export function assertType<T>(
  value: unknown,
  checker: (value: unknown) => value is T,
  errorMessage?: string
): asserts value is T {
  if (!checker(value)) {
    throw new TypeError(errorMessage || 'Type assertion failed');
  }
}

/**
 * Common API response types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Transform decorator type helpers
 */
export type TransformFn<T = unknown> = (params: {
  value: unknown;
  key: string;
  obj: unknown;
  type: unknown;
}) => T;

/**
 * Prisma helpers for common patterns
 */
export type PrismaWhereInput<T> = {
  [K in keyof T]?: T[K] | { in?: T[K][]; contains?: string; gt?: T[K]; lt?: T[K] };
};

/**
 * Utility type to make specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Utility type to make all properties optional except specified ones
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Extract array element type
 */
export type ArrayElement<ArrayType extends readonly unknown[]> = 
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

/**
 * Deep partial type for nested objects
 */
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

/**
 * Type for monetary values (in cents)
 */
export type CentsValue = number & { __brand: 'cents' };
export type DollarsValue = number & { __brand: 'dollars' };

export function toCents(dollars: number): CentsValue {
  return Math.round(dollars * 100) as CentsValue;
}

export function toDollars(cents: number): DollarsValue {
  return (cents / 100) as DollarsValue;
}