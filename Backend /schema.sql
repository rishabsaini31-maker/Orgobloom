-- Create ENUMs
DO $$ BEGIN
    CREATE TYPE role AS ENUM('CUSTOMER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM('PENDING', 'PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE fraud_status AS ENUM('SAFE', 'MEDIUM_RISK', 'HIGH_RISK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE fraud_event_type AS ENUM('LOGIN', 'ORDER_PLACED', 'PAYMENT_FAILED', 'RETURN_REQUESTED', 'COD_REJECTED', 'HIGH_VELOCITY_LOGIN', 'HIGH_VELOCITY_ORDER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id text PRIMARY KEY,
    email text NOT NULL UNIQUE,
    name text,
    password text,
    phone text,
    image text,
    provider text DEFAULT 'email',
    provider_account_id text,
    email_verified timestamp,
    role role DEFAULT 'CUSTOMER' NOT NULL,
    is_blocked boolean DEFAULT false NOT NULL,
    blocked_at timestamp,
    blocked_reason text,
    risk_score integer DEFAULT 0 NOT NULL,
    fraud_status fraud_status DEFAULT 'SAFE' NOT NULL,
    cod_enabled boolean DEFAULT true NOT NULL,
    last_ip_address text,
    device_fingerprint text,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id text PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text NOT NULL,
    price real NOT NULL,
    weight text NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    image_url text,
    images text[],
    category text DEFAULT 'cow' NOT NULL,
    benefits text[],
    usage text,
    composition text,
    is_active boolean DEFAULT true NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Create addresses table
CREATE TABLE IF NOT EXISTS addresses (
    id text PRIMARY KEY,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    phone text NOT NULL,
    address_line1 text NOT NULL,
    address_line2 text,
    city text NOT NULL,
    state text NOT NULL,
    pincode text NOT NULL,
    country text DEFAULT 'India' NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id text PRIMARY KEY,
    order_number text NOT NULL UNIQUE,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subtotal real NOT NULL,
    shipping_cost real DEFAULT 0 NOT NULL,
    tax real DEFAULT 0 NOT NULL,
    total real NOT NULL,
    status order_status DEFAULT 'PENDING' NOT NULL,
    payment_status payment_status DEFAULT 'PENDING' NOT NULL,
    shipping_address text NOT NULL,
    tracking_number text,
    notes text,
    cancelled_at timestamp,
    cancel_reason text,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id text PRIMARY KEY,
    order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id text NOT NULL,
    quantity integer NOT NULL,
    price real NOT NULL,
    weight text NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id text PRIMARY KEY,
    order_id text NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    razorpay_order_id text NOT NULL UNIQUE,
    razorpay_payment_id text UNIQUE,
    razorpay_signature text,
    amount real NOT NULL,
    currency text DEFAULT 'INR' NOT NULL,
    status payment_status DEFAULT 'PENDING' NOT NULL,
    method text,
    email text,
    contact text,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id text PRIMARY KEY,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info' NOT NULL,
    is_read text DEFAULT 'false' NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Create order_status_history table
CREATE TABLE IF NOT EXISTS order_status_history (
    id text PRIMARY KEY,
    order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status order_status NOT NULL,
    notes text,
    created_by text,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Create recently_viewed table
CREATE TABLE IF NOT EXISTS recently_viewed (
    id text PRIMARY KEY,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id text NOT NULL,
    viewed_at timestamp DEFAULT now() NOT NULL
);

-- Create fraud_logs table for audit trail and risk scoring
CREATE TABLE IF NOT EXISTS fraud_logs (
    id text PRIMARY KEY,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type fraud_event_type NOT NULL,
    risk_points integer NOT NULL,
    reason text NOT NULL,
    metadata jsonb DEFAULT '{}',
    created_at timestamp DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_id ON recently_viewed(user_id);

-- Fraud detection indexes for scalability
CREATE INDEX IF NOT EXISTS idx_fraud_logs_user_id ON fraud_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_event_type ON fraud_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_created_at ON fraud_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_user_created ON fraud_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_users_fraud_status ON users(fraud_status);
CREATE INDEX IF NOT EXISTS idx_users_risk_score ON users(risk_score);
CREATE INDEX IF NOT EXISTS idx_users_device_fingerprint ON users(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_users_last_ip ON users(last_ip_address);
