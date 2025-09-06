import { verify } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export function verifyToken<T = unknown>(token: string): T | null {
  try {
    return verify(token, JWT_SECRET) as T;
  } catch (error) {
    return null;
  }
}
