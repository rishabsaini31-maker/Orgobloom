# F Ship Integration - Quick Start for Admin

## What's Implemented

✅ **Shipment Management**
- Create shipments directly with F Ship carrier
- Track real-time delivery status
- Cancel shipments if needed
- Get shipping rates by location

✅ **Order Workflow**
- Order → Confirmed → Create Shipment → F Ship → Tracked → Delivered
- Automatic status updates
- Email notifications to customer

✅ **Customer Tracking**
- Public tracking page: `/track-order`
- Email tracking link in shipment notification
- Real-time updates from carrier

✅ **Admin Features**
- Admin panel shipment management (APIs ready)
- Filter shipments by status/carrier
- View tracking timeline
- Update tracking status manually

## Quick Setup

### 1. Get F Ship API Key
```
1. Go to https://fship.in
2. Sign up → Complete KYC
3. Dashboard → Settings → API Keys
4. Copy API Key
```

### 2. Add to Environment
**Backend/.env.local:**
```env
FSHIP_API_KEY=your_api_key_here
FSHIP_BASE_URL=https://api.fship.in/api/v1
```

**Restart Backend:** `npm run dev`

### 3. Test It
```bash
# Get shipping rates
curl "http://localhost:8000/api/shipments/rates?pincode=560001&state=Karnataka&weight=2"

# Should return carrier options and prices
```

## Admin Workflow

### Step 1: Receive Order
- Customer places order → Payment processed
- Order status: CONFIRMED

### Step 2: Create Shipment (Admin)
```
POST /api/shipments/fship/create
Authorization: Admin Token
Body: {
  "orderId": "order_123",
  "preferredCarrier": "delhivery" // optional
}
```

**What happens:**
- Order sent to F Ship carrier
- Tracking number generated
- Customer receives email with tracking link
- Order status → SHIPPED
- Order tracking number updated

### Step 3: Customer Tracks
- Customer clicks link in email
- OR goes to yoursite.com/track-order
- Enters tracking number
- Sees real-time delivery status

### Step 4: Order Delivered
- F Ship updates carrier status
- Shipment status → DELIVERED
- Order status → DELIVERED automatically

## API Endpoints (Admin Only)

### 1. Create Shipment with F Ship
```bash
POST /api/shipments/fship/create
Authorization: Bearer admin_token

Request:
{
  "orderId": "order_123",
  "preferredCarrier": "delhivery" // optional
}

Response:
{
  "success": true,
  "data": {
    "shipmentId": "ship_456",
    "trackingNumber": "DL123456789",
    "trackingUrl": "https://fship.in/track/DL123456789",
    "carrier": "Delhivery",
    "estimatedDelivery": "2026-03-05"
  }
}
```

### 2. Get Shipping Rates
```bash
GET /api/shipments/rates?pincode=560001&state=Karnataka&weight=2

Response:
[
  {
    "carrier": "Delhivery",
    "rate": 50,
    "estimatedDeliveryDays": 2
  },
  {
    "carrier": "BlueDart",
    "rate": 60,
    "estimatedDeliveryDays": 1
  }
]
```

### 3. Cancel Shipment (if order not delivered)
```bash
DELETE /api/shipments/tracking_number/cancel
Authorization: Bearer admin_token

Response:
{
  "success": true,
  "message": "Shipment cancelled successfully"
}
```

## Public API Endpoints (No Auth Required)

### Get Tracking Details
```bash
GET /api/shipments/track/details/DL123456789

Response:
{
  "success": true,
  "data": {
    "trackingNumber": "DL123456789",
    "carrier": "Delhivery",
    "status": "IN_TRANSIT",
    "currentLocation": "Mumbai Hub",
    "estimatedDelivery": "2026-03-05",
    "trackingEvents": [
      {
        "timestamp": "2026-03-02T10:30:00Z",
        "status": "PICKED_UP",
        "location": "Warehouse",
        "message": "Package picked up"
      }
    ]
  }
}
```

## Admin Dashboard Integration (Next Step)

To add to admin dashboard, you would:

```jsx
// Create Shipment Button
<button onClick={() => createShipment(orderId)}>
  Create Shipment
</button>

// View Tracking
<div>
  Tracking: {order.trackingNumber}
  <a href={tracking.trackingUrl}>View on Carrier</a>
</div>

// Track Status
<p>Status: {shipment.status}</p>
<p>Location: {shipment.currentLocation}</p>
<p>ETA: {shipment.estimatedDelivery}</p>
```

## Supported Carriers

- ✅ Delhivery
- ✅ Shiprocket
- ✅ BlueDart
- ✅ DTDC
- ✅ India Post
- ✅ FedEx  
- ✅ UPS
- ✅ DPL

## Order Statuses

```
PENDING        → New order
↓
PROCESSING     → Processing payment
↓
CONFIRMED      → Ready to ship (CREATE SHIPMENT HERE)
↓
SHIPPED        → In carrier system
  ├→ IN_TRANSIT
  ├→ OUT_FOR_DELIVERY
  ↓
DELIVERED      → Order complete ✓
```

## Email Notifications

Customer receives:
1. **Order Confirmation** - When order placed
2. **Shipment Notification**
   - Tracking number
   - Tracking link
   - Carrier name
   - Estimated delivery date
   - Order number

## Fallback Behavior

If F Ship API is unavailable:
- Shipment creation fails with error message
- Customer doesn't get tracking
- Manual shipment entry still works
- System returns default shipping rates

## Troubleshooting

### "F Ship is not configured"
- Check FSHIP_API_KEY environment variable
- Verify it's set in Backend/.env.local
- Restart backend: `npm run dev`

### "Order not found"
- Verify order ID is correct
- Order must be in CONFIRMED status
- Check database for order

### Tracking number not working
- Wait 5-10 minutes for F Ship sync
- Verify number is correct (case sensitive)
- Check F Ship dashboard

## Next: Admin Dashboard UI

Would you like me to add:
1. Admin shipment management page
2. Bulk shipment creation
3. Shipping report/analytics
4. Shipment status history
5. Refund/return handling

Let me know! 📦
