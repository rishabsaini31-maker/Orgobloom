# Rate Limiting Implementation Guide

## Overview

Your application implements rate limiting at multiple levels to prevent abuse, protect against brute-force attacks, and ensure fair resource usage.

## Rate Limiters Summary

| Limiter                  | Time Window | Max Requests    | Applied On                  | Purpose                      |
| ------------------------ | ----------- | --------------- | --------------------------- | ---------------------------- |
| **apiLimiter**           | 15 minutes  | 100 requests    | `/api/*`                    | General API protection       |
| **loginLimiter**         | 15 minutes  | 5 attempts      | `/api/auth/login`           | Prevent brute-force login    |
| **registerLimiter**      | 1 hour      | 3 registrations | `/api/auth/register`        | Prevent spam registrations   |
| **passwordResetLimiter** | 1 hour      | 3 attempts      | `/api/auth/forgot-password` | Prevent password reset abuse |
| **orderLimiter**         | 1 hour      | 10 orders       | `/api/orders` (POST)        | Prevent order spam           |
| **uploadRateLimiter**    | Custom      | By size/count   | Media upload endpoints      | Prevent storage abuse        |

---

## Detailed Implementation

### 1. **Global API Rate Limiter**

**File**: `Backend/src/middleware/rateLimiter.ts` → Applied in `Backend/src/server.ts`

```typescript
// In server.ts (line 152)
app.use("/api/", apiLimiter);
```

**Configuration**:

- **100 requests per 15 minutes** per IP address
- Applies to ALL `/api/*` routes
- Excludes `/api/healthz` (placed before rate limiting at line 136)

**Response on Limit Exceeded**:

```json
{
  "error": "Too many requests",
  "message": "Please try again after 15 minutes",
  "retryAfter": "15 minutes"
}
```

---

### 2. **Authentication Rate Limiters**

**File**: `Backend/src/routes/auth.ts`

#### a) Login Rate Limiter (lines 16-34)

```typescript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
});
```

**Applied To**:

- `POST /api/auth/login`
- `POST /api/auth/google` (OAuth login)

**Purpose**: Prevents credential stuffing and brute-force attacks

---

#### b) Registration Rate Limiter (lines 36-54)

```typescript
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per IP
});
```

**Applied To**:

- `POST /api/auth/register`
- `POST /api/auth/quick-register`

**Purpose**: Prevents bot-driven spam account creation

---

#### c) Password Reset Rate Limiter (lines 58-76)

```typescript
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per IP
});
```

**Applied To**:

- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/verify-reset-code`

**Purpose**: Prevents email flooding and reset code enumeration

---

### 3. **Order Rate Limiter**

**File**: `Backend/src/routes/orders.ts` (lines 13-32)

```typescript
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 orders per IP
});
```

**Applied To**:

- `POST /api/orders` (Create order endpoint, line 36)

**Purpose**: Prevents order spam and fraudulent bulk ordering

---

### 4. **Upload Rate Limiter**

**File**: `Backend/src/routes/siteMedia.ts`

**Custom Implementation**: Uses `checkUploadRateLimit()` function

- Tracks by **IP address** + **user ID** + **file size**
- Applied on:
  - `POST /api/site-media/upload` (line 190)
  - `POST /api/site-media/multiple` (line 388)
  - `PUT /api/site-media/:id` (line 627)

**Purpose**: Prevents storage abuse on free tier (1GB Supabase limit)

---

## Rate Limit Headers

All rate limiters return these headers:

```
RateLimit-Limit: 100          # Max requests allowed
RateLimit-Remaining: 95       # Requests remaining
RateLimit-Reset: 1234567890   # Unix timestamp when limit resets
```

---

## Monitoring Rate Limits

### Check Logs

All rate limit violations are logged:

```bash
[RATE LIMIT] Login rate limit exceeded for IP: 192.168.1.1
```

### Health Check (Exempt from Rate Limiting)

```bash
curl https://orgobloom.onrender.com/api/healthz
```

This endpoint is placed **before** rate limiting middleware (line 136 in server.ts) to ensure monitoring tools don't get throttled.

---

## Testing Rate Limits

### Test Login Rate Limiter

```bash
# Make 6 login attempts in 15 minutes - 6th should fail
for i in {1..6}; do
  curl -X POST https://orgobloom.onrender.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo "\nAttempt $i"
done
```

### Test API Rate Limiter

```bash
# Make 101 requests in 15 minutes - 101st should fail
for i in {1..101}; do
  curl https://orgobloom.onrender.com/api/products
done
```

---

## Bypassing Rate Limits (for Testing)

### Option 1: Whitelist Your IP

**File**: `Backend/src/middleware/rateLimiter.ts`

```typescript
const apiLimiter = rateLimit({
  skip: (req) => {
    const whitelist = ["127.0.0.1", "YOUR_IP_HERE"];
    return whitelist.includes(req.ip);
  },
  // ... rest of config
});
```

### Option 2: Increase Limits in Development

```typescript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 100 : 1000,
});
```

---

## Best Practices

1. **Health checks exempt**: Always place monitoring endpoints BEFORE rate limiting
2. **Different limits per endpoint**: Authentication gets stricter limits than general API
3. **User-friendly messages**: Include `retryAfter` and `message` in responses
4. **Log violations**: All rate limit hits are logged for security monitoring
5. **Standard headers**: Use `standardHeaders: true` for proper HTTP compliance
6. **Per-IP tracking**: All limiters track by IP address to prevent single-source abuse

---

## Current Configuration Summary

✅ **Protection Areas**:

- Login: Max 5 attempts per 15 minutes
- Registration: Max 3 per hour
- Password Reset: Max 3 per hour
- API Calls: Max 100 per 15 minutes
- Order Creation: Max 10 per hour
- File Uploads: Custom size-based limits

✅ **Monitoring**:

- All violations logged to console
- Health check endpoint exempt from throttling
- Rate limit headers sent in every response

---

## Files to Check

- **Main Config**: `Backend/src/middleware/rateLimiter.ts`
- **Server Setup**: `Backend/src/server.ts` (line 152)
- **Auth Limits**: `Backend/src/routes/auth.ts` (lines 16-76)
- **Order Limits**: `Backend/src/routes/orders.ts` (lines 13-32)
- **Upload Limits**: `Backend/src/routes/siteMedia.ts` (lines 188, 385, 625)

---

**Last Updated**: January 2025
