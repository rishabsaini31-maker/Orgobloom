# 🧪 Testing Guide - New Frontend Features

## Quick Start Testing

All features are live and ready for testing on:

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8000
- **Admin:** http://localhost:3002

---

## 🧪 Feature Testing Guide

### 1. Order Details Page

**URL:** `http://localhost:3000/orders/[id]`

**How to Test:**

1. Go to "My Orders" page (`http://localhost:3000/orders`)
2. Click "View Details" on any order
3. You should see:
   - Order number and date ✅
   - Status timeline (Pending → Processing → Shipped → Delivered) ✅
   - Tracking number and estimated delivery ✅
   - Order items with images and pricing ✅
   - Shipping address ✅
   - Order summary breakdown ✅

**Expected Behaviors:**

- Page loads quickly
- Back button works
- Data displays correctly
- Responsive on mobile
- No console errors

**Sample Order ID:** Get from orders list

---

### 2. Track Order Page

**URL:** `http://localhost:3000/track-order`

**How to Test:**

1. Visit http://localhost:3000/track-order
2. Enter any order number (e.g., from the orders list)
3. Click "Track" button
4. You should see:
   - Order status ✅
   - Tracking number ✅
   - Progress bar ✅
   - Order items ✅
   - Shipping address ✅

**Test Scenarios:**

```
✅ Valid order number: Shows tracking info
✅ Invalid order number: Shows "Order Not Found" message
✅ Empty input: Shows validation error
✅ No login required: Works without authentication
```

**Expected Behaviors:**

- Form validation works
- Toast notifications appear
- Results display correctly
- "Not found" state shows properly
- Initial state helpful

---

### 3. Live Chat Widget

**Location:** Bottom-right corner on ALL pages

**How to Test:**

1. Visit any page (homepage, products, etc.)
2. Look for floating chat button (bottom-right)
3. Click the button
4. You should see:
   - Chat window opens ✅
   - "Coming Soon" message ✅
   - Support email displayed ✅
   - Business hours shown ✅
   - Minimize button available ✅
   - Close button available ✅

**Test Scenarios:**

```
✅ Click button: Window opens
✅ Click minimize: Window minimizes
✅ Click maximize: Window expands
✅ Click close: Window closes
✅ Works on all pages: Check multiple pages
✅ Responsive: Test on mobile
```

**Expected Behaviors:**

- Smooth animations
- No overlap with content
- Button always visible
- Proper z-index (appears on top)
- Works on mobile

---

### 4. Amazon-Style Product Cards

**Location:** Homepage, Products page, All products sections

**How to Test:**

1. Go to homepage (`http://localhost:3000/`)
2. Scroll to "All Products" section
3. OR visit `/products` page
4. You should see product cards with:
   - Product image ✅
   - Star rating (1-5 stars) ✅
   - Review count ✅
   - Product name ✅
   - Price ✅
   - Original price (strikethrough) ✅
   - Weight/size info ✅
   - "Add to Cart" button ✅
   - "Quick View" button ✅
   - Discount badge (if applicable) ✅

**Test Scenarios:**

```
✅ Hover over card: Image zooms
✅ Click product name: Goes to detail page
✅ Click image: Goes to detail page
✅ Click "Add to Cart": Adds to cart
✅ Click "Quick View": Shows product details
✅ Out of stock: Shows "Out of Stock" overlay
✅ Responsive: Test on mobile/tablet/desktop
```

**Expected Behaviors:**

- Smooth hover animations
- Images load properly
- Buttons responsive
- Grid adjusts for screen size
- No layout shifts

---

### 5. Product Detail Page

**URL:** `http://localhost:3000/products/[slug]`

**How to Test:**

1. Click on any product (from homepage or products page)
2. You should see:
   - Main product image ✅
   - Thumbnail gallery (4 images) ✅
   - Product title ✅
   - Breadcrumb navigation ✅
   - Star rating with reviews ✅
   - Price display ✅
   - Original price comparison ✅
   - Product weight/specs ✅
   - Full description ✅
   - Key features list ✅
   - Stock status ✅
   - Quantity selector ✅
   - "Add to Cart" button ✅
   - "Save for Later" button ✅
   - Shipping info box ✅
   - Return policy ✅
   - Related products section ✅

**Test Scenarios:**

```
✅ Click thumbnail: Main image changes
✅ Hover main image: Image zooms
✅ Change quantity: Count updates
✅ Click Add to Cart: Product added to cart
✅ Click Save for Later: Shows availability
✅ Out of stock: Buttons disabled
✅ Responsive: Test on all screen sizes
✅ Navigation: Back button works
```

**Advanced Testing:**

- Test on mobile landscape
- Test on tablet
- Test on desktop
- Test image loading
- Test form submission

---

### 6. Homepage - All Products Section

**URL:** `http://localhost:3000/`

**How to Test:**

1. Visit homepage
2. Scroll down to "All Products" section
3. You should see:
   - Section title ✅
   - "View All" link ✅
   - Amazon-style product cards ✅
   - Responsive grid layout ✅
   - Products display correctly ✅

**Test Scenarios:**

```
✅ Click "View All": Goes to /products
✅ Click product: Goes to detail page
✅ Responsive: Grid adjusts for screen size
✅ Performance: Page loads quickly
✅ No "Featured Products" section: Removed correctly
```

---

## 🔍 Backend API Testing

### Track Order Endpoint

**Endpoint:** `GET /api/orders/track/:orderNumber`

**How to Test with curl:**

```bash
# Replace ORDER_NUMBER with actual order number
curl "http://localhost:8000/api/orders/track/ORG-123456"

# Expected response:
{
  "order": {
    "id": "order-id",
    "orderNumber": "ORG-123456",
    "status": "SHIPPED",
    "paymentStatus": "COMPLETED",
    "trackingNumber": "ORGxxxxx",
    "estimatedDelivery": "2024-02-22",
    "items": [
      {
        "productName": "Product Name",
        "quantity": 1,
        "price": 299
      }
    ],
    "shippingAddress": {
      "name": "Customer Name",
      "address": "Address",
      "city": "City",
      "state": "State",
      "pincode": "12345"
    }
  }
}
```

**Test Cases:**

```
✅ Valid order number: Returns order details
✅ Invalid order number: Returns 404 error
❌ Missing order number: Returns 404 error
```

---

## 📱 Responsive Design Testing

### Mobile Testing (< 768px)

- [ ] Order details page
- [ ] Track order page
- [ ] Product card layout (single column)
- [ ] Product detail page
- [ ] Live chat button visible and usable
- [ ] All text readable
- [ ] Buttons touch-friendly

### Tablet Testing (768px - 1024px)

- [ ] Two column product grid
- [ ] Proper spacing
- [ ] Images responsive
- [ ] Forms functional
- [ ] Navigation works

### Desktop Testing (> 1024px)

- [ ] Three column product grid
- [ ] Full features visible
- [ ] Hover effects work
- [ ] Layout optimized

---

## ⚡ Performance Testing

### Page Load Times (Benchmark)

- Order Details: < 2 seconds
- Track Order: < 1 second
- Product Detail: < 2 seconds
- Homepage: < 2 seconds

### Browser DevTools:

1. Open DevTools (F12)
2. Go to Network tab
3. Visit each page
4. Check load times
5. Look for slow resources

---

## 🔧 Console Testing

### Expected Console Status:

✅ No Critical Errors  
✅ No Unhandled Rejections  
⚠️ Minor Warnings OK

### Check Console:

1. Open DevTools (F12)
2. Go to Console tab
3. Visit each page
4. Verify no red error messages

---

## 📋 Quick Testing Checklist

### Functionality Tests:

- [ ] Order details page loads and displays data
- [ ] Track order form accepts input
- [ ] Track order finds valid orders
- [ ] Live chat button appears on all pages
- [ ] Live chat opens and closes
- [ ] Product cards display correctly
- [ ] Product detail page loads
- [ ] Image gallery switches images
- [ ] Add to cart works
- [ ] Quantity selector works

### Responsive Tests:

- [ ] Mobile: All elements visible and clickable
- [ ] Tablet: Layout adjusts properly
- [ ] Desktop: Full features displayed

### Performance Tests:

- [ ] Pages load quickly (< 3 seconds)
- [ ] Images load properly
- [ ] No broken images
- [ ] No layout shifts

### Accessibility Tests:

- [ ] Can navigate with keyboard
- [ ] Images have alt text
- [ ] Colors have good contrast
- [ ] Text is readable

### Error Handling Tests:

- [ ] 404 pages show properly
- [ ] Network errors handled
- [ ] Validation errors shown
- [ ] Error messages clear

---

## 🚀 Browser Compatibility

Test on:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari
- [ ] Chrome Mobile

---

## 🐛 Bug Reporting Template

If you find an issue:

```
**Feature:** [Feature Name]
**URL:** [Page URL]
**Browser:** [Chrome/Firefox/Safari/etc]
**Device:** [Desktop/Mobile/Tablet]
**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happens]

**Screenshot/Video:**
[If applicable]

**Console Errors:**
[Any error messages]
```

---

## ✅ Final Verification

Before considering testing complete:

- [ ] All 6 features working
- [ ] No console errors
- [ ] Responsive on all devices
- [ ] Fast page loads
- [ ] No broken links
- [ ] No missing images
- [ ] Forms functional
- [ ] Buttons responsive
- [ ] Mobile friendly
- [ ] Accessibility good

---

## 📞 Support

If you encounter any issues:

1. Check console for errors
2. Clear cache and reload
3. Test on different browser
4. Check backend is running
5. Verify environment variables

---

**Testing Date:** [Your Date]  
**Tester:** [Your Name]  
**Status:** ✅ Ready for Testing
