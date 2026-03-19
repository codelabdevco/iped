// Simple validation helpers (lightweight alternative to Zod)

export function validateRequired(obj: Record<string, any>, fields: string[]): string | null {
  for (const field of fields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === "") {
      return `${field} is required`;
    }
  }
  return null;
}

export function validateEnum(value: string, allowed: string[], fieldName: string): string | null {
  if (!allowed.includes(value)) {
    return `${fieldName} must be one of: ${allowed.join(", ")}`;
  }
  return null;
}

export function validateNumber(value: any, fieldName: string, opts?: { min?: number; max?: number }): string | null {
  const num = Number(value);
  if (isNaN(num)) return `${fieldName} must be a number`;
  if (opts?.min !== undefined && num < opts.min) return `${fieldName} must be >= ${opts.min}`;
  if (opts?.max !== undefined && num > opts.max) return `${fieldName} must be <= ${opts.max}`;
  return null;
}

export function validateEmail(value: string): string | null {
  if (!value) return null; // optional
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(value)) return "Invalid email format";
  return null;
}

export function sanitizeString(value: string, maxLength: number = 500): string {
  if (!value) return "";
  return String(value).trim().slice(0, maxLength);
}
