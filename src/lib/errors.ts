export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class AuthError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "AUTH_ERROR");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super("Too many requests", 429, "RATE_LIMIT", { retryAfter });
  }
}

export class QuotaError extends AppError {
  constructor(message: string, quota?: any) {
    super(message, 402, "QUOTA_EXCEEDED", quota);
  }
}

// Format error for API response (safe — no stack trace in production)
export function formatErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      ...(process.env.NODE_ENV !== "production" ? { details: error.details } : {}),
    };
  }

  // Unknown error — don't leak details
  const message = process.env.NODE_ENV === "production"
    ? "Internal server error"
    : (error instanceof Error ? error.message : "Unknown error");

  return { success: false, error: message, code: "INTERNAL_ERROR" };
}
