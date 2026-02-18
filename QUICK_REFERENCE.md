# Email System Quick Reference Card

## 🚀 One-Minute Setup

```bash
# 1. Make sure backend is running
cd Backend && npm run dev

# 2. Test it
curl -X POST http://localhost:8000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@gmail.com","subject":"Test","message":"Works!"}'

# 3. Get Gmail app password from https://myaccount.google.com
# Security → 2-Step Verification → App passwords → Generate

# 4. Add to Backend/.env
echo "SMTP_PASSWORD=xxxx xxxx xxxx xxxx" >> .env
```

---

## 📧 Send Email via API

### Test Email

```bash
curl -X POST http://localhost:8000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Subject Line",
    "message": "Email body"
  }'
```

### Welcome Email

```bash
curl -X POST http://localhost:8000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "templateType": "welcome",
    "data": {"userName": "John"}
  }'
```

### Order Confirmation

```bash
curl -X POST http://localhost:8000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "customer@example.com",
    "templateType": "order-confirmation",
    "data": {
      "userName": "John",
      "orderId": "ORD-001",
      "items": [{"name": "Plant", "quantity": 1, "price": 999}],
      "total": 999,
      "estimatedDelivery": "2026-02-20"
    }
  }'
```

### Password Reset

```bash
curl -X POST http://localhost:8000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "templateType": "password-reset",
    "data": {
      "userName": "John",
      "resetLink": "https://orgobloom.com/reset?token=abc123"
    }
  }'
```

### Shipping Notification

```bash
curl -X POST http://localhost:8000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "customer@example.com",
    "templateType": "shipping-notification",
    "data": {
      "userName": "John",
      "orderId": "ORD-001",
      "trackingNumber": "1234567890",
      "carrier": "FedEx"
    }
  }'
```

### Contact Form Reply

```bash
curl -X POST http://localhost:8000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "visitor@example.com",
    "templateType": "contact-reply",
    "data": {
      "visitorName": "John",
      "message": "When will plants arrive?"
    }
  }'
```

### Admin Notification

```bash
curl -X POST http://localhost:8000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "admin@orgobloom.com",
    "templateType": "admin-notification",
    "data": {
      "adminName": "Admin",
      "subject": "New Order",
      "content": "Order #ORD-001 has been placed"
    }
  }'
```

---

## 💻 Use in Code

### Import

```typescript
import { sendEmail } from "@/utils/emailService";
import { emailTemplates } from "@/templates/emailTemplates";
```

### Send Email

```typescript
const template = emailTemplates.welcomeEmail("John Doe");
await sendEmail({
  to: "john@example.com",
  subject: template.subject,
  html: template.html,
  text: template.text,
});
```

### Send in Route (Auth)

```typescript
router.post("/register", async (req, res) => {
  // Create user...

  // Send welcome email
  const welcomeTemplate = emailTemplates.welcomeEmail(newUser.name);
  await sendEmail({
    to: newUser.email,
    subject: welcomeTemplate.subject,
    html: welcomeTemplate.html,
  });

  res.json({ success: true, message: "Check your email!" });
});
```

### Send in Route (Orders)

```typescript
router.post("/create", async (req, res) => {
  // Create order...

  // Send confirmation
  const orderTemplate = emailTemplates.orderConfirmationEmail(
    user.name,
    order.id,
    items,
    total,
    deliveryDate,
  );
  await sendEmail({
    to: user.email,
    subject: orderTemplate.subject,
    html: orderTemplate.html,
  });

  res.json({ success: true, orderId: order.id });
});
```

---

## 🎯 Template List

| ID                      | Name                  | Required Data                                          |
| ----------------------- | --------------------- | ------------------------------------------------------ |
| `welcome`               | Welcome Email         | `userName`                                             |
| `password-reset`        | Password Reset        | `userName, resetLink`                                  |
| `order-confirmation`    | Order Confirmation    | `userName, orderId, items[], total, estimatedDelivery` |
| `shipping-notification` | Shipping Notification | `userName, orderId, trackingNumber, carrier`           |
| `contact-reply`         | Contact Form Reply    | `visitorName, message`                                 |
| `admin-notification`    | Admin Notification    | `adminName, content, subject`                          |

---

## 🔧 Configuration

### Production (.env)

```env
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
SMTP_FROM=Orgobloom <info@orgobloom.com>
```

### Development (.env)

```env
NODE_ENV=development
# Don't set SMTP_PASSWORD - uses Ethereal for testing
```

---

## 🧪 Test Endpoints

```bash
# List all templates
curl http://localhost:8000/api/email/templates

# Test email
curl -X POST http://localhost:8000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","message":"Test"}'

# Send welcome
curl -X POST http://localhost:8000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","templateType":"welcome","data":{"userName":"John"}}'
```

---

## 📁 File Locations

```
Backend/
├── src/
│   ├── utils/
│   │   ├── emailService.ts          ← Email sending logic
│   │   └── emailExamples.ts         ← Code examples
│   ├── templates/
│   │   └── emailTemplates.ts        ← Email templates
│   ├── routes/
│   │   └── email.ts                 ← Email API routes
│   └── server.ts                    ← Email routes registered
├── .env                              ← Add SMTP_PASSWORD here
└── EMAIL_SYSTEM.md                   ← Full documentation
```

---

## 🚨 Troubleshooting

### Email not sending

```bash
# Check server is running
npm run dev

# Check .env file
cat Backend/.env | grep SMTP

# Test endpoint
curl -X POST http://localhost:8000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","message":"Test"}'

# Check server logs for errors
```

### In development

- Emails don't really send
- Check console for Ethereal preview URLs
- Click to see how email looks

### In production

- Verify Gmail app password (remove spaces)
- Check 2-Step Verification enabled
- Ensure `SMTP_SECURE=false` and `SMTP_PORT=587`

---

## ✨ Features

- ✅ 6 pre-built templates
- ✅ Development testing (Ethereal)
- ✅ Production Gmail SMTP
- ✅ HTML + Text versions
- ✅ Error handling
- ✅ Type-safe TypeScript

---

## 📞 Need Help?

- **Complete Docs:** `Backend/EMAIL_SYSTEM.md`
- **Integration Guide:** `INTEGRATION_GUIDE.md`
- **Code Examples:** `Backend/src/utils/emailExamples.ts`
- **API Reference:** `Backend/src/routes/email.ts`
- **Templates:** `Backend/src/templates/emailTemplates.ts`

---

**Quick Test:**

```bash
curl -X POST http://localhost:8000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@gmail.com","subject":"Test","message":"Email works!"}'
```

Check your email! 🎉
