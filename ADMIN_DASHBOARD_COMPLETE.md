# Admin Dashboard - Complete Feature Overview

## ✅ Admin Dashboard Structure

### Main Pages & Features

#### 1. **Dashboard Overview** (`/dashboard`)

- **Total Orders** - Count of all orders in system
- **Total Revenue** - Sum of all completed order amounts (₹)
- **Pending Orders** - Orders awaiting processing
- **Completed Orders** - Successfully delivered orders
- **Recent Orders** - List of latest orders with quick actions
- **Visual Charts** - Order trends and statistics

#### 2. **Analytics** (`/dashboard/analytics`)

- **Advanced Analytics** with time range filters (7d, 30d, 90d)
- **Revenue Charts** - Line charts showing revenue trends
- **Order Distribution** - Bar charts of orders by category
- **Customer Metrics** - Pie charts of customer segments
- **Top Products** - Best-selling products ranking
- **Order Status breakdown** - Distribution across status types
- **Performance Metrics** - Average order value, conversion rates

#### 3. **Payment Management** (`/dashboard/payments`)

- **Payment Summary Cards**:
  - Total Transactions
  - Completed Payments
  - Pending Payments
  - Failed Payments
- **Payment Filtering** - Filter by status (all, completed, pending, failed)
- **Search Functionality** - Search by Order ID or Email
- **Payment Table** with:
  - Order ID
  - Email
  - Amount
  - Payment Method
  - Status
  - Timestamp
- **Retry Payment** - Action button to retry failed payments
- **Real-time Updates** - Auto-refresh after actions

#### 4. **Customer Management** (`/dashboard/customers`) - ✅ NEWLY CREATED

- **Customer Statistics**:
  - Total Customers
  - Active Customers
  - Blocked Customers
- **Filter Options**:
  - All Customers
  - Active Customers
  - Blocked Customers
  - Problematic Customers (high fraud risk)
- **Search Bar** - Filter by email or name
- **Customer Table** with:
  - Email Address
  - Full Name
  - Phone Number
  - Orders Count
  - Risk Score (0-5 scale)
  - Fraud Status (SAFE/MEDIUM_RISK/HIGH_RISK)
  - Current Status (Active/Blocked)
- **Actions**:
  - **View** - See customer details
  - **Block** - Block customer from platform (for problematic customers)
  - **Unblock** - Restore customer access
- **Color-coded Status** - Green for active, Red for blocked

#### 5. **Admin Profile** (`/dashboard/profile`)

- **Profile Tab**:
  - Edit Name
  - Edit Email
  - Edit Phone
  - Save Profile Changes
- **Security Tab**:
  - Change Password functionality
  - Current Password validation
  - Password confirmation
  - Security best practices info
- **Preference Tab**:
  - Theme preferences
  - Notification settings
  - Email preferences

#### 6. **Customize App Settings** (`/dashboard/customize-app`)

- **App Configuration**:
  - App Name
  - App Description
  - Logo Upload
  - Primary Color (Hex)
  - Secondary Color (Hex)
  - Accent Color (Hex)
- **Email Settings**:
  - Email From Address
  - Support Email
- **Localization**:
  - Currency Selection (INR/USD/etc)
  - Timezone Settings
- **Business Rules**:
  - Maintenance Mode Toggle
  - Enable/Disable Registration
  - Guest Checkout Option
  - Max Order Quantity
  - Min Order Amount
  - Free Shipping Threshold
  - Shipping Cost
  - Tax Rate
- **Save Settings** - Persist all configuration

#### 7. **Login Page** (`/login`)

- Email/Password Authentication
- Admin Credentials:
  - Email: `orgobloom5033@gmail.com`
  - Password: `orgobloom5033@@$`
- JWT Token Generation
- Session Management
- Error Handling & Display

### Core Components

#### Header Component (`Header.tsx`)

- Admin branding
- Navigation breadcrumbs
- User notification area
- Quick help access

#### Sidebar Component (`Sidebar.tsx`)

- Main Navigation Menu:
  - 🏠 Dashboard
  - 📊 Analytics
  - 💳 Payments
  - 👥 Customers
  - ⚙️ Customize App
  - 👤 Profile
- Logout Button
- Collapsible Navigation
- Active Page Indicator

#### Profile Dropdown (`ProfileDropdown.tsx`)

- User Profile Display
- Quick Links
- Logout Functionality

#### Charts Component (`Charts.tsx`)

- BarChart - For comparing values
- LineChart - For trends over time
- PieChart - For distributions
- Reusable chart components

### API Integration

#### Available API Endpoints

```typescript
// Admin APIs
adminApi.getOrders(params); // Get all orders
adminApi.updateOrderStatus(); // Change order status
adminApi.getAnalytics(); // Dashboard analytics
adminApi.getAdvancedAnalytics(); // Detailed analytics
adminApi.getPayments(status); // Get payments by status
adminApi.retryPayment(paymentId); // Retry failed payment
adminApi.getAppSettings(); // Get app configuration
adminApi.updateAppSettings(data); // Update app settings

// Customer APIs ✅ NOW INTEGRATED
customersApi.getAll(params); // Get all customers
customersApi.getProblematic(); // Get high-risk customers
customersApi.getById(customerId); // Get customer details
customersApi.blockCustomer(); // Block a customer
customersApi.unblockCustomer(); // Unblock a customer

// Authentication
authApi.login(data); // Admin login
userApi.getProfile(); // Get admin profile
userApi.updateProfile(data); // Update profile
userApi.changePassword(data); // Change password
```

### State Management

#### Zustand Store (`authStore.ts`)

- User authentication state
- Token management
- Login/Logout logic
- Persist state to localStorage
- Session persistence

### UI Features

#### Responsive Design

- Mobile-optimized
- Tablet-friendly layouts
- Full desktop support
- Grid-based layouts with Tailwind CSS

#### Interactive Elements

- Loading spinners
- Toast notifications (success/error)
- Modal dialogs
- Filter tabs
- Search bars
- Data tables with hover effects
- Action buttons
- Status badges

#### Authentication Flow

1. User visits `/admin` → redirects to `/login`
2. User enters credentials
3. Backend validates and returns JWT token
4. Token stored in localStorage
5. User navigated to Dashboard
6. Token auto-attached to all API requests
7. Protected pages check for valid token

---

## 🎯 Summary

The Admin Dashboard is now **fully functional** with:

✅ **7 Main Sections:**

- Dashboard Overview
- Advanced Analytics
- Payment Management
- **Customer Management** (newly created)
- Admin Profile & Settings
- App Customization
- Secure Login

✅ **Customer Management Features:**

- View all customers with detailed information
- Filter problematic/risky customers
- Block/Unblock customer accounts
- Track customer risk scores
- Search and filter capabilities
- Real-time status updates

✅ **Technical Stack:**

- Next.js 14 (React Server Components)
- TypeScript for type safety
- Tailwind CSS for styling
- TanStack React Query for data fetching
- Axios for API calls
- Zustand for state management
- React Toast for notifications

✅ **Security:**

- JWT token-based authentication
- Protected routes
- Auto-logout on 401 errors
- Secure token storage
- Role-based access (ADMIN)

✅ **All Fraud Detection Integration:**

- Risk Scores displayed in Customer table
- Fraud Status visualization
- Block/unblock based on fraud assessment
- Integration with backend fraud service

---

## 🔗 Database Schema Connection

Users Table includes:

- `riskScore` - Fraud risk assessment (0-100)
- `fraudStatus` - Status badge (SAFE/MEDIUM_RISK/HIGH_RISK)
- `codEnabled` - Cash on Delivery eligibility
- `isBlocked` - Account block status
- `deviceFingerprint` - Device tracking
- `lastIPAddress` - Recent login IP

---

## ✨ Ready for Production

The Admin Dashboard is production-ready with:

- Error handling
- Loading states
- Input validation
- Real-time updates
- User-friendly UI
- Complete feature set
