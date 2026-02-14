# Orgobloom 2.0 - Microservices E-Commerce Platform

## 🚀 Project Overview

Orgobloom 2.0 is a complete rewrite of the original organic fertilizer e-commerce platform using a modern microservices architecture. The application is split into three independent services:

- **Backend**: Express.js REST API with Supabase & Drizzle ORM
- **Frontend**: Next.js customer-facing application
- **Admin**: Separate Next.js admin panel

## 🏗️ Architecture

```
Orgobloom 2.0/
│
├── Backend/           # Express.js API Server
│   ├── src/
│   │   ├── db/       # Drizzle schema & database
│   │   ├── routes/   # API endpoints
│   │   ├── middleware/ # Auth, validation, etc.
│   │   └── utils/    # Helper functions
│   └── package.json
│
├── Frontend/         # Next.js Customer App
│   ├── src/
│   │   ├── app/      # Pages & layouts
│   │   ├── components/ # React components
│   │   ├── lib/      # API client
│   │   └── store/    # Zustand stores
│   └── package.json
│
└── Admin/            # Next.js Admin Panel
    ├── src/
    │   ├── app/      # Admin pages
    │   ├── components/ # Admin components
    │   ├── lib/      # API client
    │   └── store/    # Admin state
    └── package.json
```

## 🛠️ Tech Stack

### Backend
- **Framework**: Express.js + TypeScript
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM
- **Authentication**: JWT
- **Payment**: Razorpay
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Rate Limiting

### Frontend (Customer)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Data Fetching**: TanStack Query
- **HTTP**: Axios

### Admin Panel
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Chart.js
- **State**: Zustand
- **Data Fetching**: TanStack Query

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 20+ installed
- **npm** or **yarn** package manager
- **Supabase** account (free tier works)
- **PostgreSQL** database (via Supabase)
- **Razorpay** account (for payments)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
cd "/Users/rishab/Desktop/SCS Project /Orgobloom 2.0"
```

### 2. Setup Backend

```bash
cd Backend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run db:push
npm run dev
```

Backend runs on **http://localhost:5000**

### 3. Setup Frontend

```bash
cd ../Frontend
npm install
# .env.local already configured
npm run dev
```

Frontend runs on **http://localhost:3000**

### 4. Setup Admin

```bash
cd ../Admin
npm install
# .env.local already configured
npm run dev
```

Admin runs on **http://localhost:3001**

## 🔐 Environment Variables

### Backend (.env)

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
DATABASE_URL=your_postgres_connection_string

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Razorpay
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret

# Email (Gmail)
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
```

### Admin (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 📊 Database Setup

### Using Drizzle with Supabase

```bash
cd Backend

# Generate migration files
npm run db:generate

# Apply migrations
npm run db:push

# Open Drizzle Studio (Database GUI)
npm run db:studio
```

## 🎯 Key Features

### Customer Features
- ✅ Product browsing with search & filters
- ✅ Shopping cart management
- ✅ User authentication (JWT)
- ✅ Order placement & tracking
- ✅ Razorpay payment integration
- ✅ Address management
- ✅ Order history
- ✅ Responsive design

### Admin Features
- ✅ Dashboard with analytics
- ✅ Product management (CRUD)
- ✅ Order management
- ✅ Customer management
- ✅ Order status updates
- ✅ Sales reports
- ✅ Inventory tracking

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product
- `POST /api/products` - Create (Admin)
- `PUT /api/products/:id` - Update (Admin)
- `DELETE /api/products/:id` - Delete (Admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - User orders
- `GET /api/admin/orders` - All orders (Admin)
- `PATCH /api/admin/orders/:id/status` - Update status (Admin)

### Analytics
- `GET /api/admin/analytics` - Get dashboard stats (Admin)

## 🚀 Deployment

### Backend (Railway / Render / AWS)

```bash
cd Backend
npm run build
npm start
```

### Frontend & Admin (Vercel)

```bash
# Deploy Frontend
cd Frontend
npm run build
# Deploy to Vercel

# Deploy Admin
cd ../Admin
npm run build
# Deploy to Vercel
```

## 📦 Production Checklist

- [ ] Update all environment variables
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure CDN for static assets
- [ ] Enable rate limiting
- [ ] Set up automated backups
- [ ] Configure email service
- [ ] Test payment gateway
- [ ] Set up SSL certificates

## 🔧 Development Scripts

### Backend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run db:generate  # Generate migrations
npm run db:push      # Push schema to DB
npm run db:studio    # Open Drizzle Studio
```

### Frontend / Admin
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Lint code
```

## 🤝 Migration from v1.0

Key differences from the original project:

1. **Architecture**: Monolithic → Microservices
2. **Database**: Prisma → Drizzle ORM
3. **Backend**: Next.js API Routes → Express.js
4. **Admin**: Integrated → Separate Next.js App
5. **Auth**: NextAuth → Custom JWT
6. **Deployment**: Single app → Three independent services

## 📝 Notes

- Backend uses **Drizzle ORM** instead of Prisma for better performance
- **Supabase** provides PostgreSQL + Auth + Storage + Realtime
- Frontend and Admin can be deployed separately
- All three services communicate via REST API
- JWT tokens are used for authentication
- Rate limiting is enabled on all API endpoints

## 🐛 Troubleshooting

### Backend not connecting to database
- Verify Supabase connection string
- Check if database migrations ran successfully
- Ensure Supabase project is active

### CORS errors
- Update CORS settings in `Backend/src/server.ts`
- Add frontend/admin URLs to allowed origins

### Authentication issues
- Check JWT_SECRET is set correctly
- Verify token is being sent in Authorization header
- Check token expiration time

## 📄 License

This project is proprietary and confidential.

## 👥 Support

For issues or questions, contact the development team.

---

**Built with ❤️ for sustainable farming**
