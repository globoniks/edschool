import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** Field-level messages for a failed Zod parse, e.g. `{ "profile.firstName": "Required" }`. */
const zodFieldErrors = (err: ZodError): Record<string, string> =>
  err.issues.reduce<Record<string, string>>((acc, issue) => {
    acc[issue.path.join('.') || '_'] = issue.message;
    return acc;
  }, {});

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isDev = process.env.NODE_ENV !== 'production';

  // Always log the real error server-side, whatever we choose to tell the client.
  console.error(`Error: ${req.method} ${req.originalUrl}`, err);

  // Request validation — a client mistake (400), not a server fault, and the
  // caller needs to know which field was wrong.
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      fields: zodFieldErrors(err),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.join(', ');
      return res.status(409).json({
        error: target ? `That ${target} is already in use` : 'That value is already in use',
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Related record does not exist' });
    }
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;

  // Only messages we wrote ourselves are safe to show. An unexpected 500 can
  // carry a query, a file path, or a schema detail, so it gets a generic reply
  // in production.
  const message =
    err instanceof AppError || isDev
      ? err.message || 'Internal server error'
      : 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(isDev && { stack: err.stack }),
  });
};
