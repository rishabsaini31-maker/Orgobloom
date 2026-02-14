# Orgobloom 2.0 - API Documentation

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-backend.railway.app/api
```

## Authentication

Most endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

---

## Authentication Endpoints

### Register User

**POST** `/auth/register`

Register a new customer account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "phone": "+91 9876543210"
}
```

**Response:** `201 Created`
```json
{
  "message": "Registration successful",
  "user": {
    "id": "clxxx...",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "CUSTOMER"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Login

**POST** `/auth/login`

Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "user": {
    "id": "clxxx...",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "CUSTOMER"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## Products Endpoints

### Get All Products

**GET** `/products`

Get paginated list of active products.

**Query Parameters:**
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 12)
- `search` (string, optional) - Search term
- `featured` (boolean, optional) - Filter featured products

**Response:** `200 OK`
```json
{
  "products": [
    {
      "id": "prod_123",
      "name": "Organic Cow Manure - 5kg",
      "slug": "organic-cow-manure-5kg",
      "description": "Premium quality cow manure...",
      "price": 299,
      "weight": "5 kg",
      "stock": 100,
      "imageUrl": "https://...",
      "category": "cow",
      "isActive": true,
      "isFeatured": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 45,
    "totalPages": 4
  }
}
```

---

### Get Product by ID

**GET** `/products/:id`

Get single product details.

**Response:** `200 OK`
```json
{
  "product": {
    "id": "prod_123",
    "name": "Organic Cow Manure - 5kg",
    "description": "...",
    "price": 299,
    "benefits": ["Improves soil health", "Rich in nutrients"],
    "usage": "Apply 1kg per square meter...",
    "composition": "Nitrogen: 2%, Phosphorus: 1%..."
  }
}
```

---

### Get Product by Slug

**GET** `/products/slug/:slug`

Get product by URL slug.

**Response:** Same as Get by ID

---

### Create Product (Admin)

**POST** `/products`

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "name": "Organic Cow Manure - 5kg",
  "slug": "organic-cow-manure-5kg",
  "description": "Premium quality...",
  "price": 299,
  "weight": "5 kg",
  "stock": 100,
  "imageUrl": "https://...",
  "category": "cow",
  "benefits": ["Benefit 1", "Benefit 2"],
  "usage": "Usage instructions...",
  "composition": "Nutrient composition...",
  "isActive": true,
  "isFeatured": false
}
```

**Response:** `201 Created`
```json
{
  "product": { /* created product */ }
}
```

---

### Update Product (Admin)

**PUT** `/products/:id`

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:** Same as Create (all fields optional)

**Response:** `200 OK`
```json
{
  "product": { /* updated product */ }
}
```

---

### Delete Product (Admin)

**DELETE** `/products/:id`

**Headers:** `Authorization: Bearer <admin-token>`

**Response:** `200 OK`
```json
{
  "message": "Product deleted successfully"
}
```

---

## Admin Endpoints

### Get All Orders

**GET** `/admin/orders`

**Headers:** `Authorization: Bearer <admin-token>`

**Query Parameters:**
- `page` (number) - Page number
- `limit` (number) - Items per page

**Response:** `200 OK`
```json
{
  "orders": [
    {
      "id": "order_123",
      "orderNumber": "ORG-ABC123",
      "userId": "user_456",
      "total": 599,
      "status": "PENDING",
      "paymentStatus": "PENDING",
      "createdAt": "2026-02-13T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### Update Order Status

**PATCH** `/admin/orders/:id/status`

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "status": "SHIPPED",
  "trackingNumber": "TRK123456",
  "notes": "Shipped via Blue Dart"
}
```

**Response:** `200 OK`
```json
{
  "order": { /* updated order */ }
}
```

---

### Get Analytics

**GET** `/admin/analytics`

**Headers:** `Authorization: Bearer <admin-token>`

**Response:** `200 OK`
```json
{
  "totalOrders": 150,
  "totalRevenue": 45000,
  "ordersByStatus": {
    "PENDING": 10,
    "PROCESSING": 15,
    "SHIPPED": 20,
    "DELIVERED": 100,
    "CANCELLED": 5
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message here"
}
```

### Common Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Rate Limiting

- **Login/Register**: 5 requests per 15 minutes
- **General API**: 100 requests per 15 minutes
- **Admin API**: 200 requests per 15 minutes

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1676284800
```

---

## Examples

### Register and Login Flow

```javascript
// 1. Register
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Password123!',
    phone: '+91 9876543210'
  })
});

const { token } = await registerResponse.json();

// 2. Use token for authenticated requests
const productsResponse = await fetch('/api/products', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

### Create Product (Admin)

```javascript
const response = await fetch('/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    name: 'Organic Cow Manure - 5kg',
    slug: 'organic-cow-manure-5kg',
    description: 'Premium quality organic fertilizer',
    price: 299,
    weight: '5 kg',
    stock: 100,
    category: 'cow',
    isActive: true
  })
});

const { product } = await response.json();
```

---

## Testing with cURL

```bash
# Health check
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Password123!"}'

# Get products
curl http://localhost:5000/api/products

# Get product with auth
curl http://localhost:5000/api/products/prod_123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

For more details, see the source code in `Backend/src/routes/`
