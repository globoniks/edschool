import { vi } from 'vitest';
import type { Response } from 'express';
import type { AuthRequest } from '../src/middleware/auth.middleware.js';

/** Minimal AuthRequest stand-in — middleware only ever touches these fields. */
export const fakeRequest = (overrides: Partial<AuthRequest> = {}): AuthRequest =>
  ({
    headers: {},
    params: {},
    body: {},
    query: {},
    ip: '127.0.0.1',
    ...overrides,
  }) as AuthRequest;

/** Response double that records status/json rather than writing to a socket. */
export const fakeResponse = () => {
  const res = {
    statusCode: 0,
    payload: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.payload = body;
      return res;
    },
  };
  return res as unknown as Response & { statusCode: number; payload: unknown };
};

/**
 * Runs a middleware and reports how it finished.
 *
 * `error` is the AppError passed to next(); `passed` means next() was called
 * with nothing, i.e. the request was allowed through.
 */
export async function runMiddleware(
  middleware: (req: AuthRequest, res: Response, next: (err?: unknown) => void) => unknown,
  req: AuthRequest
): Promise<{ passed: boolean; error?: { message: string; statusCode?: number } }> {
  const res = fakeResponse();
  const next = vi.fn();
  await middleware(req, res, next);

  const arg = next.mock.calls[0]?.[0];
  if (next.mock.calls.length === 0) return { passed: false };
  if (arg === undefined) return { passed: true };
  return {
    passed: false,
    error: arg as { message: string; statusCode?: number },
  };
}
