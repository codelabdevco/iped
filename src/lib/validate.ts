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

// Schema-like validation
export interface ValidationSchema {
  [field: string]: {
    required?: boolean;
    type?: "string" | "number" | "boolean" | "email";
    min?: number;
    max?: number;
    maxLength?: number;
    enum?: string[];
    sanitize?: boolean;
  };
}

export function validateBody(body: Record<string, any>, schema: ValidationSchema): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const [field, rules] of Object.entries(schema)) {
    const value = body[field];
    if (rules.required && (value === undefined || value === null || value === "")) {
      errors.push(`${field} is required`);
      continue;
    }
    if (value === undefined || value === null) continue;
    if (rules.type === "number") {
      const num = Number(value);
      if (isNaN(num)) errors.push(`${field} must be a number`);
      if (rules.min !== undefined && num < rules.min) errors.push(`${field} must be >= ${rules.min}`);
      if (rules.max !== undefined && num > rules.max) errors.push(`${field} must be <= ${rules.max}`);
    }
    if (rules.type === "string" && typeof value !== "string") errors.push(`${field} must be a string`);
    if (rules.type === "email" && typeof value === "string") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.push(`${field} must be a valid email`);
    }
    if (rules.maxLength && typeof value === "string" && value.length > rules.maxLength) {
      errors.push(`${field} must be <= ${rules.maxLength} characters`);
    }
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${field} must be one of: ${rules.enum.join(", ")}`);
    }
    if (rules.sanitize && typeof value === "string") {
      body[field] = value.trim().slice(0, rules.maxLength || 500);
    }
  }
  return { valid: errors.length === 0, errors };
}
