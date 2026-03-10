# Debugging Orders Issues

## Issue 1: Can't See "Create Shipment" Button

### Why It Might Not Show:

1. **Order Status** - Button only shows for orders with `status === "CONFIRMED"`
2. **User Role** - Check if you're logged in as ADMIN or SUPER_ADMIN
3. **Deployment** - Changes need to be deployed to Vercel

### How to Check:

```javascript
// Open browser console on admin orders page
console.log("Orders:", orders);
console.log("User role:", localStorage.getItem("user"));

// Check order status
orders.forEach((o) => console.log(o.id.slice(0, 8), o.status));
```

### Fix:

- Make sure at least ONE order has status = "CONFIRMED"
- Change order status to CONFIRMED using the dropdown
- Then the "Create Shipment" button will appear

---

## Issue 2: View Button Not Working

### Possible Causes:

1. API endpoint `/admin/orders/:id/detail` returning error
2. Modal not showing due to CSS/z-index
3. Invalid order ID

### How to Check:

```javascript
// Open browser console and check for errors
// Click View button and look for error messages
```

### Fix:

- Check browser console (F12 → Console tab)
- Look for API errors
- Verify backend is running

---

## Issue 3: CSV Export Issue

### Possible Causes:

1. Orders data missing required fields
2. Browser blocking download
3. Empty orders array

### How to Check:

```javascript
// On orders page, open console and run:
console.log("Filtered Orders:", filteredOrders);
console.log("Order count:", filteredOrders.length);
```

### Fix:

- Make sure you have orders in the system
- Check browser's download permissions
- Try exporting with at least 1 order

---

## Quick Test Steps:

### Step 1: Check Deployment

Go to: https://vercel.com/your-username/admin-orgobloom

- Check if latest commit (85dbe2a) is deployed
- If not, trigger manual redeploy

### Step 2: Test Locally First

```bash
cd Admin
npm run dev
# Open http://localhost:3002/dashboard/orders
```

### Step 3: Create a Test Order

1. Create order with status CONFIRMED
2. Refresh orders page
3. "Create Shipment" button should appear in Actions column

### Step 4: Check Backend Connection

```bash
curl https://orgobloom.onrender.com/api/admin/orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Expected Behavior:

✅ Orders with status "CONFIRMED" show "Create Shipment" button  
✅ View button opens modal with order details  
✅ CSV export downloads orders-YYYY-MM-DD.csv file
