# Orgobloom Email System - Setup Summary

## ✅ What's Installed

### New Files Created

| File                                      | Purpose                                    |
| ----------------------------------------- | ------------------------------------------ |
| `Backend/src/utils/emailService.ts`       | Core email sending service with Nodemailer |
| `Backend/src/templates/emailTemplates.ts` | 6 pre-built email templates                |
| `Backend/src/routes/email.ts`             | Email API endpoints                        |
| `Backend/src/utils/emailExamples.ts`      | Code examples for integration              |
| `Backend/EMAIL_SYSTEM.md`                 | Comprehensive email system documentation   |
| `INTEGRATION_GUIDE.md`                    | Integration guide for your routes          |

### Files Modified

| File                    | Changes                                    |
| ----------------------- | ------------------------------------------ |
| `Backend/src/server.ts` | Added email routes import and registration |

### Dependencies

- ✅ `nodemailer` (already installed)
- ✅ Types via TypeScript

---

## 🚀 Quick Start

### 1. Start Backend

```bash
cd Backend
npm run dev
```

### 2. Test Email System

```bash
curl -X POST http://localhost:8000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@gmail.com",
    "subject": "Test",
    "message": "Email system working!"
  }'
```

### 3. Get Gmail App Password

- Go to [myaccount.google.com](https://myaccount.google.com)
- Security → 2-Step Verification → App passwords
- Generate password for Mail app
- Copy 16-character password

### 4. Add to `.env`

```env
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
```

### 5. Restart Server

Email system is now ready!

---

## 📧 Available Email Templates

### 1. Welcome Email

- Sent on user registration
- Required: `userName`
- Example in: `src/utils/emailExamples.ts`

### 2. Password Reset

- Sent on password reset request
- Required: `userName`, `resetLink`
- Example in: `src/utils/emailExamples.ts`

### 3. Order Confirmation

- Sent after order placement
- Required: `userName`, `orderId`, `items[]`, `total`, `estimatedDelivery`
- Example in: `src/utils/emailExamples.ts`

### 4. Shipping Notification

- Sent when order ships
- Required: `userName`, `orderId`, `trackingNumber`, `carrier`
- Example in: `src/utils/emailExamples.ts`

### 5. Contact Form Reply

- Sent as contact form acknowledgment
- Required: `visitorName`, `message`
- Example in: `src/utils/emailExamples.ts`

### 6. Admin Notification

- Sent for admin alerts
- Required: `adminName`, `content`, `subject`
- Example in: `src/utils/emailExamples.ts`

---

## 🔌 API Endpoints

### Send Email

**POST** `/api/email/send`

```bash
curl -X POST http://localhost:8000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "templateType": "welcome",
    "data": {
      "userName": "John Doe"
    }
  }'
```

### Test Email

**POST** `/api/email/test`

```bash
curl -X POST http://localhost:8000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test",
    "message": "Testing email"
  }'
```

### List Templates

**GET** `/api/email/templates`

```bash
curl http://localhost:8000/api/email/templates
```

---

## 🔧 Integration Examples

### In Auth Routes (Registration)

```typescript
// After user creation
const welcomeTemplate = emailTemplates.welcomeEmail(newUser.name);
await sendEmail({
  to: newUser.email,
  subject: welcomeTemplate.subject,
  html: welcomeTemplate.html,
  text: welcomeTemplate.text,
});
```

### In Order Routes (Order Created)

```typescript
// After order creation
const orderTemplate = emailTemplates.orderConfirmationEmail(
  user.name,
  order.id,
  items,
  total,
  estimatedDelivery,
);
await sendEmail({
  to: user.email,
  subject: orderTemplate.subject,
  html: orderTemplate.html,
  text: orderTemplate.text,
});
```

### In Admin Routes (Items Updated)

```typescript
// When items are updated
const adminTemplate = emailTemplates.adminNotificationEmail(
  "Orgobloom Admin",
  "Inventory Updated",
  `Product ${product.name} inventory updated`,
);
await sendEmail({
  to: process.env.ADMIN_EMAIL || "",
  subject: adminTemplate.subject,
  html: adminTemplate.html,
});
```

---

## 🛠️ Configuration

### Environment Variables (`.env`)

```env
# Production Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=Orgobloom <noreply@orgobloom.com>

# Frontend URLs (used in email templates)
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3002

# Admin Email (for notifications)
ADMIN_EMAIL=admin@orgobloom.com
```

### Development Mode

- If `SMTP_PASSWORD` is not set → Uses **Ethereal** (test service)
- No credentials needed in development
- Email preview URLs appear in console logs

### Production Mode

- Set `NODE_ENV=production`
- Use valid `SMTP_PASSWORD` (Gmail app password)
- Real emails sent to recipients

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────┐
│         Backend Routes (auth, orders, etc)      │
└────────────────────┬────────────────────────────┘
                     │ calls
                     ↓
    ┌────────────────────────────────────┐
    │   Email Service (emailService.ts)  │
    │  - Initializes transporter         │
    │  - Sends emails                    │
    │  - Handles errors                  │
    └────────────┬─────────────────────┬─┘
                 │                     │
        Dev: Ethereal        Prod: Gmail SMTP
```

---

## ✨ Features

- ✅ 6 pre-built email templates
- ✅ HTML and plain text versions
- ✅ Development testing (Ethereal)
- ✅ Production Gmail SMTP
- ✅ Bulk email support
- ✅ CC/BCC support
- ✅ Error handling and logging
- ✅ Type-safe TypeScript
- ✅ Easy integration

---

## 🧪 Testing Checklist

- [ ] Backend builds without errors (`npm run build`)
- [ ] Server starts successfully (`npm run dev`)
- [ ] Test email endpoint works (POST `/api/email/test`)
- [ ] Get email templates endpoint works (GET `/api/email/templates`)
- [ ] Integration works in auth route
- [ ] Integration works in order route
- [ ] Gmail app password generated and added
- [ ] Production emails sending successfully

---

## 📚 Documentation

| Document               | Contents                             |
| ---------------------- | ------------------------------------ |
| `EMAIL_SYSTEM.md`      | Complete email system documentation  |
| `INTEGRATION_GUIDE.md` | Integration guide with code examples |
| `emailExamples.ts`     | Code examples for all templates      |
| This file              | Setup summary and quick reference    |

---

## 🚀 Next Steps

1. **Start testing:**

   ```bash
   npm run dev
   curl -X POST http://localhost:8000/api/email/test ...
   ```

2. **Generate Gmail app password:**
   - Visit [myaccount.google.com](https://myaccount.google.com)
   - Security → App passwords → Generate

3. **Add password to `.env`:**

   ```env
   SMTP_PASSWORD=your-16-char-password
   ```

4. **Integrate with your routes:**
   - Follow examples in `INTEGRATION_GUIDE.md`
   - Copy code snippets from `emailExamples.ts`

5. **Test each integration:**
   - Sign up → Should get welcome email
   - Create order → Should get confirmation email
   - Submit contact → Should get reply email

---

## 🐛 Troubleshooting

### Email not sending?

1. Check server logs: `npm run dev`
2. Test endpoint: `curl -X POST http://localhost:8000/api/email/test ...`
3. Verify `.env` variables are set
4. Check console for error messages

### Using Ethereal in development?

- Preview URLs will appear in console
- Click to view how email renders
- No real email sent in development

### Production emails failing?

1. Verify Gmail app password (16 characters)
2. Check 2-Step Verification is enabled on Gmail
3. Ensure `SMTP_SECURE=false` and `SMTP_PORT=587`
4. Check firewall/network settings

---

## 📞 Support

Check the following files for help:

- **Setup questions:** `EMAIL_SYSTEM.md`
- **Integration help:** `INTEGRATION_GUIDE.md`
- **Code examples:** `src/utils/emailExamples.ts`
- **API reference:** `src/routes/email.ts`

---

## ✅ Summary

Your Orgobloom email system is ready to use! The system supports:

- ✅ 6 pre-built templates
- ✅ Easy API integration
- ✅ Development & production modes
- ✅ Complete documentation
- ✅ Code examples
- ✅ Error handling

**Start with:** `POST /api/email/test` to verify it's working!

**Then:** Add your Gmail app password to `.env` for production emails!

**Finally:** Follow the integration guide to add emails to your routes!

🎉 Happy emailing!
