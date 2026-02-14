# Registration Troubleshooting Guide

## ✅ Registration Requirements Fixed

### Password Policy

The Frontend registration validation now matches Backend requirements exactly:

**Required:**

- ✓ Minimum 8 characters
- ✓ At least 1 uppercase letter (A-Z)
- ✓ At least 1 lowercase letter (a-z)
- ✓ At least 1 number (0-9)

**Visual Indicators:**

- Real-time checklist shown when typing password
- Green checkmarks (✓) for completed requirements
- Gray circles (○) for incomplete requirements
- Submit button disabled until all requirements met

### Example Valid Password

```
MyPassword123
- 8+ characters ✓
- Uppercase: M, P ✓
- Lowercase: y, a, s, s, w, o, r, d ✓
- Number: 1, 2, 3 ✓
```

---

## 🐛 Common Registration Errors & Fixes

### Error: "Password must be at least 8 characters..."

**Problem:** Password doesn't meet all requirements  
**Solution:**

- Check the password requirements checklist
- Ensure you have: uppercase, lowercase, number
- Minimum 8 characters total
- Example: `MyPass1` → `MyPassword123`

### Error: "Passwords do not match"

**Problem:** Password and confirm password fields don't match  
**Solution:**

- Carefully re-enter the same password in both fields
- Use copy-paste if needed
- Check caps lock is off

### Error: "Email already registered"

**Problem:** The email address is already in use  
**Solution:**

- Use a different email address
- OR login with that email if you have an account
- Go to [/login](/login) page

### Error: "Invalid email address"

**Problem:** Email format is incorrect  
**Solution:**

- Use valid format: `user@example.com`
- Ensure @ symbol and domain are present
- Example valid emails:
  - `john@gmail.com`
  - `user@company.co.in`
  - `name@domain.com`

### Error: "Name must be at least 2 characters"

**Problem:** Name field is too short  
**Solution:**

- Enter at least 2 characters
- Example: `Jo` is valid, `J` is not

### Error: "Registration failed"

**Problem:** Generic error (check browser console)  
**Solution:**

- Open browser DevTools (F12)
- Check Console tab for detailed error
- Common causes:
  - Backend server not running
  - Network connection issue
  - Database connection problem

---

## 🔍 Verification Checklist

Before registering, confirm:

- [ ] Backend is running (`npm run dev` in Backend folder)
- [ ] Frontend is running (`npm run dev` in Frontend folder)
- [ ] Name: At least 2 characters
- [ ] Email: Valid format (example@domain.com)
- [ ] Password: Meets all 4 requirements:
  - [ ] 8+ characters
  - [ ] Contains uppercase letter (A-Z)
  - [ ] Contains lowercase letter (a-z)
  - [ ] Contains number (0-9)
- [ ] Confirm Password: Matches password exactly
- [ ] Terms & Conditions: Checked

---

## 💾 Database Considerations

### Required Database Fields

```sql
- id (string, primary key)
- email (string, unique)
- name (string)
- password (string, hashed)
- phone (string, optional)
- role (enum: CUSTOMER/ADMIN)
- isBlocked (boolean, default: false)
- provider (string, default: 'email')
- image (string, optional)
- createdAt (timestamp)
- updatedAt (timestamp)
```

### Common Database Issues

1. **Email Constraint Violation**
   - Error: "Email already registered"
   - Fix: Clear test data or use different email

2. **Missing Columns**
   - Run: `npm run db:push` (in Backend)
   - Ensures database schema is up to date

3. **Connection Failed**
   - Check: `.env` file has `DATABASE_URL`
   - Verify: Supabase credentials are correct
   - Test: Can you connect to the database?

---

## 🧪 Testing Registration

### Simple Test Case

1. Go to http://localhost:9090/register
2. Enter:
   - Name: `Test User`
   - Email: `test@example.com` (unique email)
   - Password: `TestPass123`
   - Confirm: `TestPass123`
3. Check all requirements are marked ✓
4. Click "Create Account"
5. Should redirect to home page
6. Toast notification: "Account created successfully!"

### Advanced Test Cases

**Test 1: Email Already Registered**

- Register with `john@example.com`
- Try to register again with same email
- Expected: "Email already registered" error

**Test 2: Weak Password**

- Password: `weak` (no uppercase/number)
- Expected: Requirements checklist will show incomplete
- Submit button disabled

**Test 3: Password Mismatch**

- Password: `TestPass123`
- Confirm: `TestPass124`
- Expected: "Passwords do not match" error

**Test 4: Google OAuth Fallback**

- Click "Sign in with Google"
- Complete Google authentication
- Should auto-register if new user
- Expected: Auto-login and redirect to home

---

## 📝 API Endpoint Details

### POST /auth/register

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "TestPass123"
}
```

**Success Response (201):**

```json
{
  "message": "Registration successful",
  "user": {
    "id": "user-123",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "CUSTOMER"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (400/401):**

```json
{
  "message": "Email already registered"
}
```

---

## 🔐 Security Notes

✅ Passwords are hashed with bcryptjs before storage  
✅ JWT tokens valid for 7 days  
✅ Rate limiting on register endpoint  
✅ Email validation enforced  
✅ Password complexity requirements enforced

---

## 🚀 Next Steps After Registration

1. **Verify Email** (optional)
   - Currently auto-verified
   - Production: Should send verification email

2. **Complete Profile** (optional)
   - Go to /profile
   - Add phone number
   - Update profile picture

3. **Start Shopping**
   - Browse products
   - Add to cart
   - Checkout

4. **Social Login** (optional)
   - Link Google account
   - One-click login next time

---

## 📞 Support

If registration still fails:

1. Check browser console (F12) for detailed errors
2. Check Backend console for server errors
3. Verify database connection
4. Ensure all required fields are filled
5. Try a different email address

### Debug Logs to Check

- Frontend: Browser Console (F12)
- Backend: Terminal where `npm run dev` is running
- Database: Check Supabase logs

---

## Build Status

✅ Frontend: Build successful (register page updated)
✅ Backend: TypeScript compiled (no errors)
✅ Password validation: Real-time checklist
✅ Error handling: User-friendly messages
