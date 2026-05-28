---
name: api-error-shape
description: Validation error response format produced by validateBody middleware and errorHandler
metadata:
  type: project
---

`validateBody(schema, req.body)` throws a `ValidationError` when Zod parsing fails. The central `errorHandler` catches it and responds:

```json
HTTP 400
{ "errors": { "fieldName": ["message1", "message2"] } }
```

Shape: `{ errors: Record<string, string[]> }` — field names are the Zod schema keys, values are arrays of error message strings produced by `error.flatten().fieldErrors`.

**How to apply:** In API tests, assert `body.errors.fieldName` is a non-empty array — do not check for a specific message string (messages may change). Pattern:

```ts
expect(Array.isArray(body.errors.fieldName)).toBe(true);
expect(body.errors.fieldName.length).toBeGreaterThan(0);
```
