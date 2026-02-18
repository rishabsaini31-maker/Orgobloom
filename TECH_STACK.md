# Orgobloom 2.0 - Complete Tech Stack Documentation

A comprehensive overview of all technologies, frameworks, and tools used in building the Orgobloom e-commerce platform.

---

## 📱 Frontend (Customer Facing)

### Core Framework
| Technology | Purpose | Description |
|------------|---------|-------------|
| **Next.js 14.2** | React Framework | Server-side rendering framework enabling fast page loads, SEO optimization, and automatic code splitting for better performance. |
| **React 18** | UI Library | Component-based library for building interactive user interfaces with hooks, context, and concurrent rendering features. |
| **TypeScript** | Type Safety | Statically typed superset of JavaScript that catches errors at compile-time and improves developer experience with IntelliSense. |

### Styling & UI
| Technology | Purpose | Description |
|------------|---------|-------------|
| **Tailwind CSS 3.4** | Utility-First CSS | Highly customizable CSS framework using utility classes for rapid UI development without leaving HTML. |
| **PostCSS** | CSS Processing | Transforms CSS with plugins for autoprefixing, nesting, and optimizing styles for production. |
| **Lucide React** | Icon Library | Beautiful, consistent icon set built specifically for React applications with tree-shaking support. |

### State Management & Data
| Technology | Purpose | Description |
|------------|---------|-------------|
| **Zustand** | State Management | Lightweight state management solution with minimal boilerplate, supporting persistence and middleware. |
| **TanStack Query v5** | Server State | Powerful data synchronization library for caching, refetching, and managing async server state. |
| **Axios** | HTTP Client | Promise-based HTTP client with interceptors, automatic transforms, and request/response handling. |

### Authentication & Integrations
| Technology | Purpose | Description |
|------------|---------|-------------|
| **@react-oauth/google** | Google OAuth | Official Google OAuth2 library for seamless one-click authentication with Google accounts. |
| **React Hot Toast** | Notifications | Lightweight toast notification system with customizable positions, styles, and animations. |

---

## 🛡️ Admin Dashboard

### Core Framework
| Technology | Purpose | Description |
|------------|---------|-------------|
| **Next.js 14.2** | React Framework | Separate admin portal with protected routes, server-side rendering, and optimized bundle size. |
| **React 18** | UI Library | Component architecture for dashboard widgets, data tables, and interactive admin features. |
| **TypeScript** | Type Safety | Strong typing for admin-specific data models, API responses, and component props. |

### Data Visualization
| Technology | Purpose | Description |
|------------|---------|-------------|
| **Chart.js 4** | Charting Library | Versatile charting library for rendering responsive bar, line, pie, and doughnut charts. |
| **react-chartjs-2** | React Wrapper | React components for Chart.js with full TypeScript support and reactive data updates. |
| **Date-fns** | Date Utility | Modern date utility library for formatting, parsing, and manipulating dates in reports. |

### State & Authentication
| Technology | Purpose | Description |
|------------|---------|-------------|
| **Zustand** | State Management | Manages admin authentication state with localStorage persistence across sessions. |
| **TanStack Query** | Data Fetching | Handles admin API calls with caching, background refetching, and optimistic updates. |

---

## ⚙️ Backend API

### Core Framework
| Technology | Purpose | Description |
|------------|---------|-------------|
| **Express.js 4.18** | Web Framework | Minimal, flexible Node.js framework for building RESTful APIs with middleware support. |
| **TypeScript** | Type Safety | Ensures type-safe API routes, request handlers, and database operations throughout the backend. |
| **Node.js** | Runtime Environment | JavaScript runtime built on V8 engine for scalable server-side applications. |

### Database & ORM
| Technology | Purpose | Description |
|------------|---------|-------------|
| **Drizzle ORM** | Database ORM | TypeScript-first ORM with SQL-like syntax, automatic migrations, and zero runtime overhead. |
| **PostgreSQL (Neon)** | Primary Database | Serverless PostgreSQL database with auto-scaling, branching, and instant provisioning. |
| **Better-SQLite3** | Local Database | Synchronous SQLite driver for local development and testing with full TypeScript support. |

### Authentication & Security
| Technology | Purpose | Description |
|------------|---------|-------------|
| **JWT (jsonwebtoken)** | Token Auth | Stateless authentication using signed tokens with configurable expiration and refresh flows. |
| **bcryptjs** | Password Hashing | Secure password hashing with salt generation using the bcrypt algorithm for credential storage. |
| **Helmet** | Security Headers | Middleware that sets various HTTP headers to protect against common web vulnerabilities. |
| **CORS** | Cross-Origin | Configurable middleware for enabling secure cross-origin requests from frontend applications. |
| **express-rate-limit** | Rate Limiting | DDoS protection by limiting repeated requests from same IP within a time window. |

### File Handling & Media
| Technology | Purpose | Description |
|------------|---------|-------------|
| **Multer** | File Uploads | Middleware for handling multipart/form-data for product images and video uploads. |
| **Supabase Storage** | Cloud Storage | Scalable object storage for product images, videos, and user-uploaded content. |

---

## 🔐 Security Features

### Authentication & Authorization
| Technology | Purpose | Description |
|------------|---------|-------------|
| **Google OAuth 2.0** | Social Login | Secure third-party authentication allowing users to sign in with Google accounts. |
| **JWT Tokens** | Session Management | Stateless authentication with access and refresh tokens for secure API access. |
| **Role-Based Access** | Authorization | Admin-only routes protected by role checking middleware on both frontend and backend. |

### Protection Mechanisms
| Technology | Purpose | Description |
|------------|---------|-------------|
| **CSRF Protection** | Request Forgery | Custom middleware generating and validating tokens to prevent cross-site request forgery attacks. |
| **Rate Limiting** | Brute Force Protection | Configurable request limits per IP to prevent brute force and DDoS attacks. |
| **Input Validation (Zod)** | Data Validation | Schema-based validation library ensuring all input data matches expected types and formats. |
| **Helmet.js** | HTTP Headers | Sets security headers including CSP, XSS protection, and content-type sniffing prevention. |

### Fraud Detection
| Technology | Purpose | Description |
|------------|---------|-------------|
| **Custom Fraud Module** | Order Screening | Rule-based fraud detection system analyzing order patterns, velocity, and risk scoring. |
| **Risk Scoring Engine** | Threat Assessment | Calculates risk scores based on multiple factors including order value, frequency, and user behavior. |

---

## 📧 Email System

### Email Service
| Technology | Purpose | Description |
|------------|---------|-------------|
| **Nodemailer** | Email Transport | Feature-rich email sending library with SMTP transport, attachments, and HTML templates. |
| **Gmail SMTP** | Email Provider | Google's SMTP server for reliable email delivery with app-specific authentication. |

### Email Templates
| Technology | Purpose | Description |
|------------|---------|-------------|
| **Custom HTML Templates** | Email Design | Responsive email templates for order confirmations, password resets, and notifications. |
| **Dynamic Content** | Personalization | Template engine for injecting user-specific data, order details, and verification links. |

### Email Types
| Type | Purpose | Description |
|------|---------|-------------|
| **Order Confirmation** | Transactional | Sent after successful order placement with order details and tracking information. |
| **Password Reset** | Security | Time-limited reset links for users who forgot their passwords with secure tokens. |
| **Email Verification** | Account Security | Verifies user email addresses during registration with expiring verification codes. |
| **Welcome Email** | Onboarding | Sent to new users with account information and getting started guidance. |

---

## 💳 Payment Integration

### Payment Gateway
| Technology | Purpose | Description |
|------------|---------|-------------|
| **Razorpay** | Payment Gateway | Indian payment gateway supporting UPI, cards, netbanking, and wallets with webhook support. |
| **Razorpay Webhooks** | Payment Events | Real-time notifications for payment success, failure, and refund events. |

### Invoice Generation
| Technology | Purpose | Description |
|------------|---------|-------------|
| **PDFKit** | PDF Generation | Server-side PDF generation library for creating professional invoices and receipts. |
| **Invoice Templates** | Document Design | Customizable invoice layouts with company branding, item details, and tax calculations. |

---

## 📊 Additional Features

### Caching & Performance
| Technology | Purpose | Description |
|------------|---------|-------------|
| **Redis** | Caching Layer | In-memory data store for session caching, rate limiting counters, and password reset tokens. |
| **PM2** | Process Manager | Production process manager with clustering, auto-restart, and zero-downtime reloads. |

### Real-Time Features
| Technology | Purpose | Description |
|------------|---------|-------------|
| **Live Chat Widget** | Customer Support | Embedded chat interface for real-time customer communication and support. |
| **Real-time Notifications** | User Alerts | Toast notifications for order updates, cart changes, and system announcements. |

### User Experience
| Technology | Purpose | Description |
|------------|---------|-------------|
| **Dark Mode** | Theme Support | Toggle between light and dark themes with system preference detection and persistence. |
| **i18n Support** | Internationalization | Multi-language support infrastructure for future localization expansion. |
| **Loyalty Points** | Rewards System | Points-based reward system for customer retention and repeat purchases. |
| **Product Reviews** | Social Proof | Customer review and rating system with moderation capabilities. |

---

## 🚀 Deployment & DevOps

### Hosting Platforms
| Technology | Purpose | Description |
|------------|---------|-------------|
| **Vercel** | Frontend Hosting | Edge-optimized hosting for Next.js applications with automatic deployments and SSL. |
| **Render** | Backend Hosting | Cloud platform for Node.js APIs with auto-scaling, logging, and environment management. |

### Development Tools
| Technology | Purpose | Description |
|------------|---------|-------------|
| **ESLint** | Code Linting | Static analysis tool for identifying and fixing JavaScript/TypeScript code issues. |
| **Prettier** | Code Formatting | Opinionated code formatter ensuring consistent style across the codebase. |
| **tsx** | TypeScript Runner | TypeScript execution engine for running TS files directly during development. |

---

## 📁 Project Structure

```
Orgobloom 2.0/
├── Frontend/          # Customer-facing Next.js application (Port 3000)
├── Admin/             # Admin dashboard Next.js application (Port 3002)
├── Backend/           # Express.js API server (Port 8000)
│   ├── src/
│   │   ├── routes/    # API route handlers
│   │   ├── db/        # Database schemas and migrations
│   │   ├── middleware/# Authentication, validation, security
│   │   ├── utils/     # Helper functions and services
│   │   └── templates/ # Email templates
│   └── uploads/       # Product images and videos
└── Documentation/     # Various MD files for guides
```

---

## 🔗 API Endpoints Overview

| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Auth** | `/api/auth/*` | Login, register, Google OAuth, password reset |
| **Products** | `/api/products/*` | CRUD operations, search, filtering |
| **Orders** | `/api/orders/*` | Order creation, tracking, history |
| **Payments** | `/api/payments/*` | Razorpay integration, webhooks |
| **Users** | `/api/profile/*` | User profile, addresses, settings |
| **Admin** | `/api/admin/*` | Dashboard stats, customer management |
| **Media** | `/api/media/*` | File uploads, video streaming |

---

## 📈 Database Schema Overview

| Table | Purpose | Description |
|-------|---------|-------------|
| **users** | User accounts | Customer and admin profiles with authentication data |
| **products** | Product catalog | Product details, pricing, inventory, and images |
| **orders** | Order records | Order items, status, shipping, and payment info |
| **payments** | Payment records | Transaction details, status, and Razorpay data |
| **addresses** | Shipping addresses | User-saved addresses for checkout |
| **reviews** | Product reviews | Customer ratings and feedback |
| **loyalty_points** | Rewards | Points earned and redeemed by users |
| **fraud_logs** | Security logs | Fraud detection records and risk scores |

---

*Last Updated: February 2026*
*Version: 2.0.0*