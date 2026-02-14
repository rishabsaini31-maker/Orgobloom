# Orgobloom 2.0 - Frontend

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.local` and configure:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 3. Run Development Server

```bash
npm run dev
```

App will run on `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
npm start
```

## Features

- 🛍️ Product browsing and search
- 🛒 Shopping cart management
- 👤 User authentication
- 📦 Order tracking
- 💳 Razorpay payment integration
- 📱 Fully responsive design

## Project Structure

```
src/
├── app/                # Next.js App Router pages
│   ├── page.tsx       # Homepage
│   ├── layout.tsx     # Root layout
│   └── globals.css    # Global styles
├── components/         # React components
├── lib/               # Utilities and API client
└── store/             # Zustand stores
```

## Development

```bash
# Run development server
npm run dev

# Lint code
npm run lint

# Build for production
npm run build
```
