# Orgobloom 2.0 - Backend API

## Tech Stack

- **Framework**: Express.js + TypeScript
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM
- **Authentication**: JWT
- **Payment**: Razorpay
- **Email**: Nodemailer

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### 3. Database Setup

Generate Drizzle schema:

```bash
npm run db:generate
```

Push schema to Supabase:

```bash
npm run db:push
```

Or run migrations:

```bash
npm run db:migrate
```

### 4. Run Development Server

```bash
npm run dev
```

Server will run on `http://localhost:5000`

### 5. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Products

- `GET /api/products` - Get all products (public)
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/slug/:slug` - Get product by slug
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Admin

- `GET /api/admin/orders` - Get all orders
- `PATCH /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/analytics` - Get analytics data

## Project Structure

```
src/
├── db/
│   ├── schema/        # Drizzle schema definitions
│   └── index.ts       # Database connection
├── middleware/        # Express middleware
├── routes/            # API routes
├── utils/             # Utility functions
└── server.ts          # Main server file
```

## Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- JWT authentication
- Password hashing with bcrypt
- Input validation with Zod

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Run Drizzle Studio (database GUI)
npm run db:studio

# Lint code
npm run lint

# Format code
npm run format
```
