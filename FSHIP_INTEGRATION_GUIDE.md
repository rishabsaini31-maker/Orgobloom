# F Ship Integration Guide

## Overview
Complete shipment management system integrated with F Ship for real-time tracking, order fulfillment, and shipping automation.

## Setup & Configuration

### 1. Environment Variables
Add these to your `.env.local`:

```env
# F Ship Configuration
FSHIP_API_KEY=your_fship_api_key
FSHIP_BASE_URL=https://api.fship.in/api/v1
```

Get your API key from F Ship dashboard: https://panel.fship.in/

### 2. API Endpoints

#### Create Shipment (with F Ship)
```bash
POST /api/shipments/fship/create
Authorization: Bearer <admin_token>

{
  "orderId": "order_id_here",
  "preferredCarrier": "delhivery" // optional
}

Response:
{
  "success": true,
  "message": "Shipment created and sent to F Ship successfully",
  "data": {
    "shipmentId": "ship_123",
    "trackingNumber": "DLV123456",
    "trackingUrl": "https://fship.in/track/DLV123456",
    "estimatedDelivery": "2026-03-05",
    "carrier": "Delhivery"
  }
}
```

#### Get Tracking Details
```bash
GET /api/shipments/track/details/:trackingNumber

Response:
{
  "success": true,
  "data": {
    "trackingNumber": "DLV123456",
    "carrier": "Delhivery",
    "status": "IN_TRANSIT",
    "currentLocation": "Mumbai Distribution Center",
    "estimatedDelivery": "2026-03-05",
    "trackingUrl": "https://...",
    "trackingEvents": [
      {
        "timestamp": "2026-03-02T10:30:00Z",
        "status": "PICKED_UP",
        "location": "Warehouse",
        "message": "Order picked up"
      },
      {
        "timestamp": "2026-03-02T14:15:00Z",
        "status": "IN_TRANSIT",
        "location": "Mumbai Hub",
        "message": "In transit to destination"
      }
    ],
    "shippedAt": "2026-03-02T10:30:00Z"
  }
}
```

#### Get Shipping Rates
```bash
GET /api/shipments/rates?pincode=560001&state=Karnataka&weight=2

Response:
{
  "success": true,
  "data": [
    {
      "carrier": "Delhivery",
      "rate": 50,
      "estimatedDeliveryDays": 2
    },
    {
      "carrier": "Shiprocket",
      "rate": 60,
      "estimatedDeliveryDays": 1
    }
  ]
}
```

#### Cancel Shipment
```bash
DELETE /api/shipments/:trackingNumber/cancel
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "message": "Shipment cancelled successfully"
}
```

## Features

### ✅ Implemented

1. **Shipment Creation**
   - Automatically sends to F Ship when admin marks order as shipped
   - Detects COD orders and sets flag in F Ship
   - Calculates estimated delivery from carrier

2. **Real-time Tracking**
   - Public tracking endpoint (no auth required)
   - Fetches live updates from F Ship API
   - Stores tracking events in database
   - Timeline view of shipment journey

3. **Order Status Sync**
   - PENDING → PROCESSED → SHIPPED → DELIVERED
   - Automatically updates when carrier updates
   - Syncs with F Ship in real-time

4. **Email Notifications**
   - Customer receives email when order shipped with tracking number
   - Includes tracking link for easy access
   - Shows estimated delivery date

5. **Shipping Rates**
   - Integrates with F Ship rates API
   - Dynamic calculation based on pincode, weight, and state
   - Fallback to default rates if F Ship unavailable

6. **Carrier Support**
   - Delhivery
   - BlueDart
   - DTDC
   - India Post
   - And others supported by F Ship

### 🔄 Database schema

**Orders table:**
```sql
-- New columns
tracking_number TEXT
status ENUM('PENDING', 'PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED')
```

**Shipments table:**
```sql
CREATE TABLE shipments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  carrier TEXT NOT NULL,
  carrier_code TEXT,
  tracking_number TEXT NOT NULL,
  tracking_url TEXT,
  status TEXT DEFAULT 'PENDING',
  shipping_address JSONB NOT NULL,
  tracking_events JSONB DEFAULT '[]',
  estimated_delivery TIMESTAMP,
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Admin Usage

### In Admin Dashboard

1. **Create Shipment**
   - Go to Orders Management
   - Click "Create Shipment" on an order
   - System automatically:
     - Sends to F Ship
     - Gets tracking number
     - Sends customer notification email
     - Updates order status to SHIPPED

2. **Track Shipment**
   - Click tracking number on order
   - View live tracking status
   - See delivery timeline
   - Option to cancel if needed

3. **Generate Reports**
   - View all shipments
   - Filter by status, carrier, date
   - Export shipment data

## Customer Usage

### Customer Tracking

**Via Email:**
- Customer receives shipment email with tracking link
- Link opens public tracking page

**Via /track-order page:**
- Enter tracking number
- View real-time status
- See delivery timeline
- View carrier details

## Status Flow

```
PENDING
  ↓
PROCESSING (Order confirmed, payment received)
  ↓
CONFIRMED (Ready to ship)
  ↓
SHIPPED (Sent to F Ship, in carrier system)
  ├→ IN_TRANSIT (Moving towards destination)
  ├→ OUT_FOR_DELIVERY (Last mile delivery)
  ↓
DELIVERED (Successfully delivered) ✓

Alternative paths:
  ├→ CANCELLED (Order cancelled before shipping)
  └→ FAILED (Delivery failed, return initiated)
```

## Configuration for Your System

### Step 1: Get F Ship Account
1. Go to https://fship.in
2. Sign up for merchant account
3. Complete kyc/verification
4. Add your warehouses
5. Get API key from dashboard

### Step 2: Add API Key to Backend
```env
# Backend/.env.local or Backend/.env.production
FSHIP_API_KEY=YOUR_API_KEY_HERE
FSHIP_BASE_URL=https://api.fship.in/api/v1
```

### Step 3: Test Integration
```bash
cd Backend
npm run dev

# In another terminal, test:
curl -X GET 'http://localhost:8000/api/shipments/rates?pincode=560001&state=Karnataka&weight=2'
```

### Step 4: Deploy to Production
- Update environment variables on Render
- Update environment variables on Vercel (if needed for Frontend)
- Restart services

## Troubleshooting

### Shipment Creation Fails
**Error:** "F Ship is not configured"
- Solution: Check FSHIP_API_KEY in environment variables
- Verify API key is valid on F Ship dashboard

**Error:** "Order not found or invalid status"
- Solution: Order must be in CONFIRMED status before shipping
- Check order status in database

### Tracking Number Not Found
- Wait 5-10 minutes for F Ship to sync
- Verify tracking number is correct
- Check F Ship dashboard for carrier status

### Email Not Sent
- Check email service configuration
- Verify customer email is valid in order
- Check logs for email service errors

## Webhook Support (Future)

For automatic shipment status updates, F Ship can send webhooks:

```javascript
POST /api/webhooks/fship
{
  "event": "shipment.updated",
  "trackingNumber": "DLV123456",
  "status": "DELIVERED",
  "location": "Final Destination",
  "timestamp": "2026-03-05T10:30:00Z"
}
```

Webhook processing already handled by shipmentService.

## Support

For F Ship API documentation:
- Docs: https://docs.fship.in
- Support: https://support.fship.in

For Orgobloom integration issues:
- Check Backend logs: `npm run dev`
- Check database: `SELECT * FROM shipments;`
- Contact development team
