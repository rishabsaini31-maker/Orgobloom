# Orgobloom 2.0 - Admin Panel

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Charts**: Chart.js + React-Chartjs-2

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.local` and configure:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Run Development Server

```bash
npm run dev
```

App will run on `http://localhost:3001`

### 4. Build for Production

```bash
npm run build
npm start
```

## Features

- 📊 Dashboard with analytics
- 📦 Product management (CRUD)
- 📋 Order management
- 👥 Customer management
- 📈 Sales analytics and charts
- ⚙️ Settings configuration

## Default Admin Credentials

```
Email: admin@orgobloom.com
Password: Admin@123456
```

## Project Structure

```
src/
├── app/
│   ├── dashboard/     # Admin dashboard pages
│   ├── login/         # Login page
│   ├── layout.tsx     # Root layout
│   └── globals.css    # Global styles
├── components/        # React components
├── lib/              # Utilities and API client
└── store/            # Zustand stores
```

## Development

```bash
# Run development server (port 3001)
npm run dev

# Lint code
npm run lint

# Build for production
npm run build
```

## Security

- Protected routes with authentication middleware
- Role-based access control (Admin only)
- JWT token validation
- Secure API calls
