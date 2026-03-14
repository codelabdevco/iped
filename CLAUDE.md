# Code Review Rules for iPED

> iPED - AI Receipt Management System
> Tech Stack: Next.js 16 + TypeScript, MongoDB + Mongoose, Tailwind CSS v4, LINE Messaging API

---

## Critical (Must Fix)

- Every function that calls external APIs (LINE, MongoDB, OCR) must have try-catch error handling
- Never commit API keys, LINE channel secrets, or MongoDB connection strings
- All MongoDB queries must use parameterized queries or Mongoose methods to prevent injection
- Every API route must validate input before writing to database
- All API endpoints must check authentication (session/token) before processing
- Never use `any` type in TypeScript - always define proper interfaces/types
- Never use `eval()` or `exec()`
- File uploads must validate file type and size before processing
- LINE webhook endpoints must verify signature before processing messages

## Warning (Should Fix)

- API routes should return proper HTTP status codes (400, 401, 404, 500)
- Use `next/image` instead of `<img>` for image optimization
- Database queries should have proper indexes for frequently queried fields
- Error messages should not expose internal system details to users
- Use environment variables for all configuration values
- Mongoose schemas should have proper validation rules
- LINE messages should have proper error handling for delivery failures
- Receipt OCR results should be validated before saving to database

## Suggestion (Nice to Have)

- Prefer Server Components over Client Components when possible
- Use `React.memo()` or `useMemo()` for expensive computations
- Consider using Mongoose `lean()` for read-only queries to improve performance
- Group related API routes using Next.js route groups
- Use Tailwind CSS classes consistently - avoid mixing with inline styles
- Consider adding JSDoc comments for complex business logic functions
- Use TypeScript utility types (Pick, Omit, Partial) for cleaner type definitions

## Naming Convention

- Variables and functions: camelCase (e.g., `getReceiptData`, `totalAmount`)
- Classes and Components: PascalCase (e.g., `ReceiptUploader`, `LineWebhook`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`, `API_TIMEOUT`)
- Database models: PascalCase singular (e.g., `Receipt`, `User`, `Expense`)
- API routes: kebab-case (e.g., `/api/receipts/upload-image`)
- File names: kebab-case for pages, PascalCase for components

## File Structure

- Components in `/components` with PascalCase naming
- API routes in `/app/api/` following Next.js App Router conventions
- Database models in `/models/` or `/lib/models/`
- Utility functions in `/lib/` or `/utils/`
- Type definitions in `/types/` or colocated with related files

## Security Checklist

- LINE webhook signature verification is implemented
- MongoDB connection uses authentication
- File upload size limits are enforced
- API rate limiting is considered for public endpoints
- Sensitive data is not logged or exposed in error responses
- CORS is properly configured for API routes
