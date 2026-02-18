// Email Templates for Orgobloom

export const emailTemplates = {
  welcomeEmail: (userName: string) => ({
    subject: "Welcome to Orgobloom!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌿 Welcome to Orgobloom!</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              <p>Thank you for joining Orgobloom! We're excited to have you as part of our organic plant community.</p>
              
              <h2>What's Next?</h2>
              <ul>
                <li>Explore our collection of organic plants</li>
                <li>Read our care guides to help your plants thrive</li>
                <li>Join our community discussions</li>
                <li>Get exclusive member discounts</li>
              </ul>

              <a href="${process.env.FRONTEND_URL}" class="button">Start Shopping Now</a>

              <p>If you have any questions, feel free to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Orgobloom. All rights reserved.</p>
              <p>Keeping your plants healthy and happy! 🌱</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to Orgobloom!\n\nHi ${userName},\n\nThank you for joining Orgobloom! We're excited to have you as part of our organic plant community.\n\nVisit ${process.env.FRONTEND_URL} to start shopping.\n\nBest regards,\nOrgobloom Team`,
  }),

  passwordResetEmail: (userName: string, resetLink: string) => ({
    subject: "Reset Your Orgobloom Password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #999; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>

              <a href="${resetLink}" class="button">Reset Your Password</a>

              <div class="warning">
                <strong>⚠️ Security Note:</strong> This link will expire in 1 hour. If you didn't request this, please ignore this email.
              </div>

              <p>Or copy and paste this link in your browser:</p>
              <p><small>${resetLink}</small></p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Orgobloom. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Password Reset Request\n\nHi ${userName},\n\nClick this link to reset your password:\n${resetLink}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nOrgobloom Team`,
  }),

  orderConfirmationEmail: (
    userName: string,
    orderId: string,
    items: Array<{ name: string; quantity: number; price: number }>,
    total: number,
    estimatedDelivery: string,
  ) => ({
    subject: `Order Confirmed - #${orderId}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            table th { background: #667eea; color: white; padding: 10px; text-align: left; }
            table td { padding: 10px; border-bottom: 1px solid #ddd; }
            .total { font-size: 18px; font-weight: bold; color: #667eea; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 Order Confirmed!</h1>
              <p>Order ID: <strong>${orderId}</strong></p>
            </div>
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              <p>Thank you for your order! We've received it and will process it shortly.</p>

              <h3>Order Details:</h3>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${items
                    .map(
                      (item) => `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.quantity}</td>
                      <td>₹${item.price.toFixed(2)}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>

              <p><strong>Total: </strong><span class="total">₹${total.toFixed(2)}</span></p>
              <p><strong>Estimated Delivery: </strong>${estimatedDelivery}</p>

              <a href="${process.env.FRONTEND_URL}/orders/${orderId}" class="button">Track Your Order</a>

              <p>You'll receive a shipping notification once your order is dispatched.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Orgobloom. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Order Confirmed - #${orderId}\n\nHi ${userName},\n\nThank you for your order!\n\nOrder Details:\n${items.map((item) => `${item.name} x${item.quantity}: ₹${item.price.toFixed(2)}`).join("\n")}\n\nTotal: ₹${total.toFixed(2)}\n\nEstimated Delivery: ${estimatedDelivery}\n\nBest regards,\nOrgobloom Team`,
  }),

  shippingNotificationEmail: (
    userName: string,
    orderId: string,
    trackingNumber: string,
    carrier: string,
  ) => ({
    subject: `Your Order is On the Way - #${orderId}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .tracking-box { background: white; border: 2px solid #667eea; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚚 Your Order is On the Way!</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>

              <div class="tracking-box">
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Carrier:</strong> ${carrier}</p>
                <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
              </div>

              <a href="${process.env.FRONTEND_URL}/orders/${orderId}" class="button">Track Your Package</a>

              <p>You can use the tracking number to monitor your delivery status. Your plants will arrive fresh and healthy!</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Orgobloom. All rights reserved.</p>
              <p>Keeping your plants healthy and happy! 🌱</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Your Order is On the Way - #${orderId}\n\nHi ${userName},\n\nYour order has been shipped!\n\nTracking Number: ${trackingNumber}\nCarrier: ${carrier}\n\nTrack your delivery at: ${process.env.FRONTEND_URL}/orders/${orderId}\n\nBest regards,\nOrgobloom Team`,
  }),

  contactFormReplyEmail: (visitorName: string, message: string) => ({
    subject: "We Received Your Message - Orgobloom Support",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 Thank You for Contacting Us!</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${visitorName}</strong>,</p>
              <p>We received your message and will get back to you as soon as possible. Our support team typically responds within 24 hours.</p>

              <h3>Your Message:</h3>
              <p>${message}</p>

              <p>Thank you for your patience and interest in Orgobloom!</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Orgobloom. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Thank You for Contacting Us!\n\nHi ${visitorName},\n\nWe received your message:\n${message}\n\nOur team will respond within 24 hours.\n\nThank you,\nOrgobloom Team`,
  }),

  adminNotificationEmail: (
    adminName: string,
    subject: string,
    content: string,
  ) => ({
    subject: `[Admin Notification] ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #333; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚙️ Admin Notification</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${adminName}</strong>,</p>
              <p>${content}</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Orgobloom Admin Panel</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Admin Notification\n\nHi ${adminName},\n\n${content}\n\nBest regards,\nOrgobloom Admin`,
  }),
};
