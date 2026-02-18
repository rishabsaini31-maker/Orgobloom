# Orgobloom Email System Documentation

## Overview

The Orgobloom email system provides a complete solution for sending transactional emails. It supports multiple email templates and can work in both development and production environments.

## Features

- ✅ Multiple pre-built email templates
- ✅ Development testing with Ethereal Email Service
- ✅ Production Gmail SMTP support
- ✅ Template-based email generation
- ✅ Bulk email sending
- ✅ HTML and plain text email support
- ✅ TypeScript support

## Setup

### 1. Gmail SMTP Configuration (Production)

To enable production email sending via Gmail:

1. **Enable 2-Step Verification:**
   - Go to [myaccount.google.com](https://myaccount.google.com)
   - Click **Security** in the left menu
   - Enable 2-Step Verification

2. **Generate App Password:**
   - After enabling 2-Step Verification, you'll see "App passwords" option
   - Select **Mail** and **Windows Computer**
   - Google generates a 16-character password (format: `xxxx xxxx xxxx xxxx`)

3. **Update `.env` file:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   SMTP_FROM=Orgobloom <noreply@orgobloom.com>
   ```

### 2. Development Mode (Ethereal)

If `SMTP_PASSWORD` is not set, the system automatically uses **Ethereal Email Service** for testing:

```env
NODE_ENV=development
# Don't set SMTP_PASSWORD - system will use Ethereal
```

**Ethereal Features:**

- Free test email service
- No credentials needed
- Email previews available in console
- Perfect for development and staging

## API Endpoints

### 1. Send Email with Template

**POST** `/api/email/send`

Send an email using a predefined template.

**Request Body:**

```json
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

### 2. Test Email

**POST** `/api/email/test`

Send a simple test email to verify email configuration.

**Request Body:**

```json
{
  "to": "test@example.com",
  "subject": "Test Email",
  "message": "This is a test email"
}
```

### 3. Get Available Templates

**GET** `/api/email/templates`

Get a list of all available email templates.

**Response:**

```json
{
  "success": true,
  "templates": [
    {
      "id": "welcome",
      "name": "Welcome Email",
      "description": "Sent when a new user signs up",
      "requiredData": ["userName"]
    },
    ...
  ],
  "totalTemplates": 6
}
```

## Email Templates

### 1. Welcome Email

**Template ID:** `welcome`

Sent when a new user signs up.

**Required Data:**

- `userName` (string)

**Example:**

```javascript
{
  "to": "newuser@example.com",
  "templateType": "welcome",
  "data": {
    "userName": "Alice Smith"
  }
}
```

### 2. Password Reset

**Template ID:** `password-reset`

Sent when user requests password reset.

**Required Data:**

- `userName` (string)
- `resetLink` (string) - URL to reset password

**Example:**

```javascript
{
  "to": "user@example.com",
  "templateType": "password-reset",
  "data": {
    "userName": "Bob Johnson",
    "resetLink": "https://orgobloom.com/reset-password?token=xyz123"
  }
}
```

### 3. Order Confirmation

**Template ID:** `order-confirmation`

Sent after successful order placement.

**Required Data:**

- `userName` (string)
- `orderId` (string)
- `items` (array) - `[{ name, quantity, price }]`
- `total` (number)
- `estimatedDelivery` (string) - optional

**Example:**

```javascript
{
  "to": "customer@example.com",
  "templateType": "order-confirmation",
  "data": {
    "userName": "Charlie Davis",
    "orderId": "ORD-2026-001",
    "items": [
      { "name": "Monstera Deliciosa", "quantity": 1, "price": 999 },
      { "name": "Pot with Stand", "quantity": 1, "price": 499 }
    ],
    "total": 1498,
    "estimatedDelivery": "2026-02-20"
  }
}
```

### 4. Shipping Notification

**Template ID:** `shipping-notification`

Sent when order is shipped.

**Required Data:**

- `userName` (string)
- `orderId` (string)
- `trackingNumber` (string)
- `carrier` (string) - e.g., "FedEx", "DHL"

**Example:**

```javascript
{
  "to": "customer@example.com",
  "templateType": "shipping-notification",
  "data": {
    "userName": "Diana Evans",
    "orderId": "ORD-2026-001",
    "trackingNumber": "1234567890",
    "carrier": "FedEx"
  }
}
```

### 5. Contact Form Reply

**Template ID:** `contact-reply`

Sent as acknowledgment for contact form submission.

**Required Data:**

- `visitorName` (string)
- `message` (string) - The visitor's original message

**Example:**

```javascript
{
  "to": "visitor@example.com",
  "templateType": "contact-reply",
  "data": {
    "visitorName": "Frank Wilson",
    "message": "When can I get bulk orders for my store?"
  }
}
```

### 6. Admin Notification

**Template ID:** `admin-notification`

Sent to admin for system events.

**Required Data:**

- `adminName` (string)
- `content` (string) - Notification message
- `subject` (string) - optional, default: "System Notification"

**Example:**

```javascript
{
  "to": "admin@orgobloom.com",
  "templateType": "admin-notification",
  "data": {
    "adminName": "Admin Panel",
    "subject": "New Order Alert",
    "content": "A new order has been placed. Order ID: ORD-2026-001"
  }
}
```

## Usage Examples

### Using with Node.js/Express

```typescript
import axios from "axios";

// Send welcome email
async function sendWelcomeEmail(email: string, userName: string) {
  try {
    const response = await axios.post("http://localhost:8000/api/email/send", {
      to: email,
      templateType: "welcome",
      data: { userName },
    });
    console.log("Email sent:", response.data);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

// Send order confirmation
async function sendOrderConfirmation(email: string, orderData: any) {
  try {
    const response = await axios.post("http://localhost:8000/api/email/send", {
      to: email,
      templateType: "order-confirmation",
      data: orderData,
    });
    console.log("Order confirmation sent:", response.data);
  } catch (error) {
    console.error("Failed to send order confirmation:", error);
  }
}
```

### Using with cURL

```bash
# Send test email
curl -X POST http://localhost:8000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test",
    "message": "This is a test"
  }'

# Send welcome email
curl -X POST http://localhost:8000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "templateType": "welcome",
    "data": {
      "userName": "John Doe"
    }
  }'

# Get available templates
curl http://localhost:8000/api/email/templates
```

## Environment Variables

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com              # SMTP server host
SMTP_PORT=587                         # SMTP server port
SMTP_SECURE=false                     # Use SSL (false for TLS)
SMTP_USER=your-email@gmail.com        # Email address
SMTP_PASSWORD=your-app-password       # Gmail app password
SMTP_FROM=Orgobloom <noreply@gmail.com>  # From address

# URLs (used in email templates)
FRONTEND_URL=http://localhost:3000    # Customer frontend
ADMIN_URL=http://localhost:3002       # Admin dashboard
```

## Development vs Production

### Development Mode

- Uses **Ethereal Email Service**
- No credentials needed
- Email preview URLs logged to console
- Perfect for testing templates

### Production Mode

- Uses **Gmail SMTP**
- Requires `SMTP_PASSWORD`
- Real emails sent to recipients
- Set `NODE_ENV=production` in `.env`

## Integrating with Auth Routes

To send welcome emails on user signup, update your auth route:

```typescript
// In routes/auth.ts
import { sendEmail } from "../utils/emailService";
import { emailTemplates } from "../templates/emailTemplates";

// After user registration
const welcomeTemplate = emailTemplates.welcomeEmail(user.name);
await sendEmail({
  to: user.email,
  subject: welcomeTemplate.subject,
  html: welcomeTemplate.html,
  text: welcomeTemplate.text,
});
```

## Troubleshooting

### Emails not sending in production

1. **Check Gmail app password:**
   - Verify 2-Step Verification is enabled
   - Generate a new app password
   - Remove spaces from password in `.env`

2. **Check SMTP settings:**

   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false  # Important: false for TLS
   ```

3. **Check environment variables:**
   ```bash
   node -e "console.log(process.env.SMTP_USER, process.env.SMTP_PASSWORD)"
   ```

### Getting Ethereal preview URLs

In development, check your server logs for:

```
Preview URL: https://ethereal.email/message/...
```

### Common Errors

| Error                     | Solution                                  |
| ------------------------- | ----------------------------------------- |
| "Invalid login"           | Check SMTP_PASSWORD is correct            |
| "Connection timeout"      | Verify SMTP host and port are correct     |
| "Missing required fields" | Check template data in request body       |
| No email received         | Check spam folder, verify recipient email |

## Best Practices

1. ✅ Always test email templates during development
2. ✅ Use Ethereal for testing before going to production
3. ✅ Store sensitive credentials in `.env` file
4. ✅ Never commit `.env` file to git
5. ✅ Implement email rate limiting to prevent abuse
6. ✅ Log all email activities for debugging
7. ✅ Use CC/BCC for admin notifications
8. ✅ Verify email formatting in multiple email clients

## Support

For issues or questions about the email system, check:

- Server logs for error messages
- Email template in `src/templates/emailTemplates.ts`
- Email service configuration in `src/utils/emailService.ts`
- API routes in `src/routes/email.ts`
