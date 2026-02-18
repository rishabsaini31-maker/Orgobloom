# Email System Integration Guide

## Quick Start - 5 Minutes

### Step 1: Add Email to Auth Registration

Update your `src/routes/auth.ts` registration endpoint:

```typescript
import { sendEmail } from "@/utils/emailService";
import { emailTemplates } from "@/templates/emailTemplates";

// In the register route, after creating the user:
router.post(
  "/register",
  registerLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const validatedData = registerSchema.parse(req.body);

      // ... existing code ...

      const [newUser] = await db
        .insert(users)
        .values({
          email: validatedData.email,
          name: validatedData.name,
          password: hashedPassword,
          phone: validatedData.phone,
        })
        .returning();

      // ✨ ADD THIS: Send welcome email
      const welcomeTemplate = emailTemplates.welcomeEmail(newUser.name);
      await sendEmail({
        to: newUser.email,
        subject: welcomeTemplate.subject,
        html: welcomeTemplate.html,
        text: welcomeTemplate.text,
      }).catch((err) => console.error("Email failed (non-blocking):", err));

      // Generate token
      const token = generateToken(newUser);
      const { password, ...userWithoutPassword } = newUser;

      res.status(201).json({
        message: "Registration successful. Welcome email sent!",
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      next(error);
    }
  },
);
```

### Step 2: Test Email System

```bash
# Start your backend server
cd Backend
npm run dev

# In another terminal, test the email endpoint
curl -X POST http://localhost:8000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test",
    "message": "Testing email system"
  }'
```

### Step 3: Get Your Gmail App Password

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click Security → Enable 2-Step Verification (if not done)
3. Go to Security → App passwords
4. Select Mail and device → Generate
5. Copy the 16-character password
6. Add to `.env`:
   ```env
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx
   ```

### Step 4: Restart Server

```bash
npm run dev
```

✅ Done! Emails will now be sent.

---

## Routes Integration Map

### 1. Auth Routes (`src/routes/auth.ts`)

```typescript
// After registration
await sendEmail({
  to: newUser.email,
  subject: "Welcome to Orgobloom!",
  html: emailTemplates.welcomeEmail(newUser.name).html,
  text: emailTemplates.welcomeEmail(newUser.name).text,
});

// After password reset request
await sendEmail({
  to: user.email,
  subject: "Reset Your Password",
  html: emailTemplates.passwordResetEmail(user.name, resetLink).html,
});
```

### 2. Orders Routes (`src/routes/orders.ts`)

```typescript
import { sendEmail } from "@/utils/emailService";
import { emailTemplates } from "@/templates/emailTemplates";

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
});

// After order shipped
const shippingTemplate = emailTemplates.shippingNotificationEmail(
  user.name,
  order.id,
  trackingNumber,
  carrier,
);

await sendEmail({
  to: user.email,
  subject: shippingTemplate.subject,
  html: shippingTemplate.html,
});

// Notify admin
const adminTemplate = emailTemplates.adminNotificationEmail(
  "Admin",
  "New Order",
  `Order #${order.id} placed for ₹${total}`,
);

await sendEmail({
  to: process.env.ADMIN_EMAIL,
  subject: adminTemplate.subject,
  html: adminTemplate.html,
});
```

### 3. Customers Routes (`src/routes/customers.ts`)

```typescript
// When customer submits contact form
const contactTemplate = emailTemplates.contactFormReplyEmail(
  customerName,
  customerMessage,
);

await sendEmail({
  to: customerEmail,
  subject: contactTemplate.subject,
  html: contactTemplate.html,
});
```

---

## API Reference

### Available Endpoints

| Endpoint               | Method | Purpose                  |
| ---------------------- | ------ | ------------------------ |
| `/api/email/send`      | POST   | Send email with template |
| `/api/email/test`      | POST   | Send test email          |
| `/api/email/templates` | GET    | List available templates |

### Request/Response Examples

#### Send Email with Template

**Request:**

```json
POST /api/email/send
{
  "to": "user@example.com",
  "templateType": "welcome",
  "data": {
    "userName": "John Doe"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Email sent successfully",
  "recipient": "user@example.com",
  "template": "welcome"
}
```

---

## Template Reference

### Welcome (`welcome`)

- **When:** User signs up
- **Data:** `{ userName }`
- **Example:**
  ```typescript
  const template = emailTemplates.welcomeEmail("John Doe");
  ```

### Password Reset (`password-reset`)

- **When:** Password reset requested
- **Data:** `{ userName, resetLink }`
- **Example:**
  ```typescript
  const template = emailTemplates.passwordResetEmail(
    "John Doe",
    "https://orgobloom.com/reset?token=xyz",
  );
  ```

### Order Confirmation (`order-confirmation`)

- **When:** Order placed
- **Data:** `{ userName, orderId, items[], total, estimatedDelivery }`
- **Example:**
  ```typescript
  const template = emailTemplates.orderConfirmationEmail(
    "John Doe",
    "ORD-001",
    [{ name: "Plant", quantity: 2, price: 999 }],
    1998,
    "2026-02-20",
  );
  ```

### Shipping Notification (`shipping-notification`)

- **When:** Order shipped
- **Data:** `{ userName, orderId, trackingNumber, carrier }`
- **Example:**
  ```typescript
  const template = emailTemplates.shippingNotificationEmail(
    "John Doe",
    "ORD-001",
    "1234567890",
    "FedEx",
  );
  ```

### Contact Reply (`contact-reply`)

- **When:** Contact form submitted
- **Data:** `{ visitorName, message }`
- **Example:**
  ```typescript
  const template = emailTemplates.contactFormReplyEmail(
    "John Doe",
    "When will plants arrive?",
  );
  ```

### Admin Notification (`admin-notification`)

- **When:** Important events
- **Data:** `{ adminName, content, subject }`
- **Example:**
  ```typescript
  const template = emailTemplates.adminNotificationEmail(
    "Admin",
    "New Order Alert",
    "Order #ORD-001 placed",
  );
  ```

---

## Advanced Usage

### Sending Bulk Emails

```typescript
import { sendBulkEmails } from "@/utils/emailService";

const recipients = [
  "user1@example.com",
  "user2@example.com",
  "user3@example.com",
];

const result = await sendBulkEmails(
  recipients,
  "Newsletter - February 2026",
  htmlContent,
);

console.log(`Sent: ${result.success}, Failed: ${result.failed}`);
```

### Custom HTML Email

```typescript
import { sendEmail } from "@/utils/emailService";

await sendEmail({
  to: "user@example.com",
  subject: "Custom Email",
  html: `<h1>Hello!</h1><p>This is custom HTML</p>`,
  text: "Hello! This is text version",
});
```

### Using with CC/BCC

```typescript
await sendEmail({
  to: "customer@example.com",
  subject: "Order Confirmation",
  html: orderTemplate.html,
  cc: ["manager@orgobloom.com"],
  bcc: ["records@orgobloom.com"],
});
```

---

## Development Mode Testing

When running in development (no `SMTP_PASSWORD`), the system uses Ethereal Email Service.

**Check console output for preview URLs:**

```
✅ Email sent:
  recipient: user@example.com
  subject: Welcome to Orgobloom
  Preview URL: https://ethereal.email/message/...
```

Click the preview URL to see how email renders in browser.

---

## Production Deployment

### Environment Variables

```env
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=Orgobloom <noreply@orgobloom.com>
FRONTEND_URL=https://orgobloom.com
ADMIN_EMAIL=admin@orgobloom.com
```

### Important Notes

1. **Never commit `.env` file** to Git
2. **Use app password** not regular password
3. **Test in staging first** before production
4. **Monitor email logs** for failures
5. **Set up retry logic** for failed emails

---

## Troubleshooting

### Email not sending

**Check:**

```bash
# 1. Verify SMTP credentials
node -e "console.log('User:', process.env.SMTP_USER, 'Pass:', process.env.SMTP_PASSWORD?.slice(0,4) + '****')"

# 2. Test endpoint
curl -X POST http://localhost:8000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","message":"Test"}'

# 3. Check server logs
npm run dev
```

### Wrong email format in production

**Solution:**

```env
SMTP_SECURE=false  # Important for Gmail TLS
SMTP_PORT=587      # Correct port for TLS
```

### Ethereal not working in development

**Solution:**

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## Complete Example: Order Flow with Emails

```typescript
// In src/routes/orders.ts
router.post("/create", authenticate, async (req, res, next) => {
  try {
    const { items } = req.body;
    const user = req.user;

    // Validate and create order
    const order = await db
      .insert(orders)
      .values({
        userId: user.id,
        total: calculateTotal(items),
        items: JSON.stringify(items),
        status: "pending",
      })
      .returning();

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    // ✨ Send order confirmation email
    const confirmTemplate = emailTemplates.orderConfirmationEmail(
      user.name,
      order[0].id,
      items,
      order[0].total,
      estimatedDelivery.toLocaleDateString(),
    );

    await sendEmail({
      to: user.email,
      subject: confirmTemplate.subject,
      html: confirmTemplate.html,
      text: confirmTemplate.text,
    });

    // ✨ Notify admin
    const adminTemplate = emailTemplates.adminNotificationEmail(
      "Orgobloom Admin",
      "New Order",
      `Order #${order[0].id} from ${user.name} (${user.email}) for ₹${order[0].total}`,
    );

    await sendEmail({
      to: process.env.ADMIN_EMAIL || "",
      subject: adminTemplate.subject,
      html: adminTemplate.html,
      cc: ["manager@orgobloom.com"],
    });

    res.status(201).json({
      success: true,
      orderId: order[0].id,
      message: "Order created and confirmation emails sent",
    });
  } catch (error) {
    next(error);
  }
});
```

---

## Next Steps

1. ✅ Install and test email system
2. 📧 Get Gmail app password
3. 🔧 Integrate with auth routes
4. 📦 Integrate with order routes
5. 📞 Integrate with customer routes
6. 🚀 Deploy to production

For issues, check server logs and email configuration!
