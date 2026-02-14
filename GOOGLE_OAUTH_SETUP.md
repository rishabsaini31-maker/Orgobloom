# Google OAuth Setup Guide

## Frontend Configuration

### 1. Install Dependencies

Already installed: `@react-oauth/google`

### 2. Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Get Google Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Go to Credentials → OAuth 2.0 Client IDs
4. Select "Web application"
5. Add authorized redirect URIs:
   - `http://localhost:3000`
   - `http://localhost:9090` (Frontend dev)
   - Your production domain

6. Copy the Client ID and add to `.env.local`

---

## Backend Configuration

### 1. Install Dependencies

Already installed: `google-auth-library`

### 2. Environment Variables

Add to `.env`:

```env
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
```

### 3. Get Google Client Secret

1. Same Google Cloud Console project
2. Go to Credentials
3. Select your OAuth 2.0 Client ID
4. Copy the Client Secret and add to `.env`

---

## How It Works

### Frontend Flow

1. User clicks "Sign in with Google"
2. Google Credential Response is sent to `/auth/google` endpoint
3. Backend verifies the token
4. If user exists → login
5. If user doesn't exist → auto-register
6. User is redirected to home page

### Backend Flow

1. Receives Google token from frontend
2. Verifies with Google OAuth Client
3. Checks if user exists by email
4. Creates user if needed
5. Returns JWT token and user info

---

## Login/Register Pages

- **Login**: `/login` - Email/Password + Google login
- **Register**: `/register` - Full signup form + Google signup

Both support immediate Google OAuth or traditional email registration.

---

## Features

✅ Google OAuth integration
✅ Auto-register on first Google login
✅ Link Google to existing email accounts
✅ Blocked market account checks
✅ JWT token generation
✅ Profile picture from Google
✅ Email verification via OAuth

---

## Troubleshooting

### "Google Client ID is not configured"

- Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to `.env.local`

### Token verification failed

- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Backend `.env`
- Check Client ID matches across Frontend and Backend

### CORS Issues

- Add Frontend URL to Google Cloud Console authorized URIs
- Verify `NEXT_PUBLIC_API_URL` points to correct Backend

### User auto-registration not working

- Check database migration for OAuth fields
- Verify `provider` and `providerAccountId` fields exist in users table
