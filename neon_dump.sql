--
-- PostgreSQL database dump
--

\restrict UV8L88ngbRYLHxNtkG1fp9nR6G05zqrBv5TeddIlLPkvHepa3ERZo27PItkiA1X

-- Dumped from database version 16.12 (6d3029c)
-- Dumped by pg_dump version 16.12 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: fraud_event_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.fraud_event_type AS ENUM (
    'LOGIN',
    'ORDER_PLACED',
    'PAYMENT_FAILED',
    'RETURN_REQUESTED',
    'COD_REJECTED',
    'HIGH_VELOCITY_LOGIN',
    'HIGH_VELOCITY_ORDER'
);


--
-- Name: fraud_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.fraud_status AS ENUM (
    'SAFE',
    'MEDIUM_RISK',
    'HIGH_RISK'
);


--
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'CONFIRMED',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED'
);


--
-- Name: role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.role AS ENUM (
    'CUSTOMER',
    'ADMIN'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.addresses (
    id text NOT NULL,
    user_id text NOT NULL,
    full_name text NOT NULL,
    phone text NOT NULL,
    address_line1 text NOT NULL,
    address_line2 text,
    city text NOT NULL,
    state text NOT NULL,
    pincode text NOT NULL,
    country text DEFAULT 'India'::text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    id text NOT NULL,
    app_name text DEFAULT 'Orgobloom'::text,
    app_description text DEFAULT 'Premium organic products marketplace'::text,
    logo text,
    primary_color text DEFAULT '#3b82f6'::text,
    secondary_color text DEFAULT '#10b981'::text,
    accent_color text DEFAULT '#f59e0b'::text,
    email_from text DEFAULT 'noreply@orgobloom.com'::text,
    support_email text DEFAULT 'support@orgobloom.com'::text,
    currency text DEFAULT 'INR'::text,
    timezone text DEFAULT 'Asia/Kolkata'::text,
    maintenance_mode boolean DEFAULT false,
    enable_registration boolean DEFAULT true,
    enable_guest_checkout boolean DEFAULT true,
    max_order_quantity integer DEFAULT 999,
    min_order_amount integer DEFAULT 0,
    free_shipping_threshold integer DEFAULT 500,
    shipping_cost integer DEFAULT 50,
    tax_rate integer DEFAULT 18,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    user_email character varying(255) NOT NULL,
    action character varying(50) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid,
    entity_name character varying(255),
    description text NOT NULL,
    old_values jsonb,
    new_values jsonb,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: blogs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blogs (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    excerpt text,
    content text NOT NULL,
    featured_image text,
    category text DEFAULT 'General'::text,
    tags text[],
    author text,
    author_id text,
    meta_title text,
    meta_description text,
    published boolean DEFAULT false,
    featured boolean DEFAULT false,
    read_time integer DEFAULT 5,
    view_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    featured_image_alt text
);


--
-- Name: fraud_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fraud_logs (
    id text NOT NULL,
    user_id text NOT NULL,
    event_type public.fraud_event_type NOT NULL,
    risk_points integer NOT NULL,
    reason text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integrations (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'active'::text,
    api_key text,
    api_secret text,
    api_endpoint text,
    config jsonb,
    webhook_url text,
    webhook_secret text,
    last_sync_at timestamp without time zone,
    created_by text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    user_id text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text NOT NULL,
    is_read text DEFAULT 'false'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    order_id text NOT NULL,
    product_id text NOT NULL,
    quantity integer NOT NULL,
    price real NOT NULL,
    weight text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: order_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_status_history (
    id text NOT NULL,
    order_id text NOT NULL,
    status public.order_status NOT NULL,
    notes text,
    created_by text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id text NOT NULL,
    order_number text NOT NULL,
    user_id text NOT NULL,
    subtotal real NOT NULL,
    shipping_cost real DEFAULT 0 NOT NULL,
    tax real DEFAULT 0 NOT NULL,
    total real NOT NULL,
    status public.order_status DEFAULT 'PENDING'::public.order_status NOT NULL,
    payment_status public.payment_status DEFAULT 'PENDING'::public.payment_status NOT NULL,
    shipping_address text NOT NULL,
    tracking_number text,
    notes text,
    cancelled_at timestamp without time zone,
    cancel_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id text NOT NULL,
    order_id text NOT NULL,
    razorpay_order_id text NOT NULL,
    razorpay_payment_id text,
    razorpay_signature text,
    amount real NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    status public.payment_status DEFAULT 'PENDING'::public.payment_status NOT NULL,
    method text,
    email text,
    contact text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: playing_with_neon; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.playing_with_neon (
    id integer NOT NULL,
    name text NOT NULL,
    value real
);


--
-- Name: playing_with_neon_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.playing_with_neon_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: playing_with_neon_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.playing_with_neon_id_seq OWNED BY public.playing_with_neon.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL,
    price real NOT NULL,
    weight text NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    image_url text,
    images text[],
    category text DEFAULT 'cow'::text NOT NULL,
    benefits text[],
    usage text,
    composition text,
    is_active boolean DEFAULT true NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    compare_price real,
    image_alt_text text,
    meta_title text,
    meta_description text
);


--
-- Name: recently_viewed; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recently_viewed (
    id text NOT NULL,
    user_id text NOT NULL,
    product_id text NOT NULL,
    viewed_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: site_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_media (
    id text NOT NULL,
    intro_video_url text,
    intro_video_urls text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    intro_video_poster text,
    image_settings text,
    content_settings text,
    seo_settings text
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    password text,
    phone text,
    image text,
    provider text DEFAULT 'email'::text,
    provider_account_id text,
    email_verified timestamp without time zone,
    role public.role DEFAULT 'CUSTOMER'::public.role NOT NULL,
    is_blocked boolean DEFAULT false NOT NULL,
    blocked_at timestamp without time zone,
    blocked_reason text,
    risk_score integer DEFAULT 0 NOT NULL,
    fraud_status public.fraud_status DEFAULT 'SAFE'::public.fraud_status NOT NULL,
    cod_enabled boolean DEFAULT true NOT NULL,
    last_ip_address text,
    device_fingerprint text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: webhook_deliveries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook_deliveries (
    id text NOT NULL,
    webhook_id text NOT NULL,
    event text NOT NULL,
    status text DEFAULT 'pending'::text,
    payload jsonb NOT NULL,
    request_headers jsonb,
    response_status_code text,
    response_body text,
    response_headers jsonb,
    error_message text,
    attempt_number text DEFAULT '1'::text,
    duration text,
    created_at timestamp without time zone DEFAULT now(),
    delivered_at timestamp without time zone
);


--
-- Name: webhooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhooks (
    id text NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    secret text NOT NULL,
    events jsonb DEFAULT '[]'::jsonb NOT NULL,
    status text DEFAULT 'active'::text,
    description text,
    headers jsonb,
    retry_count text DEFAULT '3'::text,
    retry_delay text DEFAULT '1000'::text,
    timeout text DEFAULT '30000'::text,
    last_delivery_at timestamp without time zone,
    last_delivery_status text,
    failure_count text DEFAULT '0'::text,
    created_by text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: playing_with_neon id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playing_with_neon ALTER COLUMN id SET DEFAULT nextval('public.playing_with_neon_id_seq'::regclass);


--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.addresses (id, user_id, full_name, phone, address_line1, address_line2, city, state, pincode, country, is_default, created_at, updated_at) FROM stdin;
mjdt052t0tywh5zcmvy5n685	pfngh0sjfhaiqxb6niaxelqz	Rishab Saini 	7276193438	Datta Washaat , near BBC cafe 	\N	Ashta	Maharashtra 	416301	India	t	2026-02-15 06:39:30.929	2026-02-15 06:39:30.929
\.


--
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_settings (id, app_name, app_description, logo, primary_color, secondary_color, accent_color, email_from, support_email, currency, timezone, maintenance_mode, enable_registration, enable_guest_checkout, max_order_quantity, min_order_amount, free_shipping_threshold, shipping_cost, tax_rate, created_at, updated_at) FROM stdin;
fefehdflhfqoji5b4a7tvtw5	Orgobloom	Premium organic products marketplace	\N	#3b82f6	#10b981	#f59e0b	noreply@orgobloom.com	support@orgobloom.com	INR	Asia/Kolkata	f	t	t	999	0	500	50	18	2026-02-22 07:11:20.656	2026-02-26 08:17:38.419
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, user_id, user_email, action, entity_type, entity_id, entity_name, description, old_values, new_values, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: blogs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.blogs (id, title, slug, excerpt, content, featured_image, category, tags, author, author_id, meta_title, meta_description, published, featured, read_time, view_count, created_at, updated_at, featured_image_alt) FROM stdin;
\.


--
-- Data for Name: fraud_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fraud_logs (id, user_id, event_type, risk_points, reason, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: integrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.integrations (id, name, type, status, api_key, api_secret, api_endpoint, config, webhook_url, webhook_secret, last_sync_at, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, title, message, type, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_items (id, order_id, product_id, quantity, price, weight, created_at) FROM stdin;
rzt0id20rapfid0of0dg3j8x	zo575kevon576vbde6y54ncl	cow-manure-1	1	6250	25	2026-02-15 06:40:36.604
ubyeexftawn6ixlmluc6s85n	zo575kevon576vbde6y54ncl	chicken-manure-1	1	7250	25	2026-02-15 06:40:36.604
fgjdksrzxqj9nk5jfodcf84e	j16wun6ke7l08js9t8305kqc	eaooa6i4sby92pgo69q6esog	1	7000	25	2026-02-21 12:42:30.00207
kbwh5pkp47siq3mx1h5639tz	fmtex0qtnmmf2e3lhe75h51r	eaooa6i4sby92pgo69q6esog	1	7000	25	2026-02-21 12:42:32.913466
nrlcar4mqcftpbuk992hmp88	usyst5dihmhgs8mio9xc1zmq	eaooa6i4sby92pgo69q6esog	1	7000	25	2026-02-21 12:42:33.279311
iacxgfqbaco3aph2yf81xlkz	xc8uvqqp0ddkfcohp3iy97t1	eaooa6i4sby92pgo69q6esog	1	7000	25	2026-02-21 12:42:33.450187
mtqrnewnhzp77ltgzisigfeb	fd5f200ax7hui1tvhpxtwq7m	eaooa6i4sby92pgo69q6esog	1	7000	25	2026-02-21 12:42:33.623866
\.


--
-- Data for Name: order_status_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_status_history (id, order_id, status, notes, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, order_number, user_id, subtotal, shipping_cost, tax, total, status, payment_status, shipping_address, tracking_number, notes, cancelled_at, cancel_reason, created_at, updated_at) FROM stdin;
zo575kevon576vbde6y54ncl	ORG-1771157436457-TCA7XWX	pfngh0sjfhaiqxb6niaxelqz	13500	50	675	14225	DELIVERED	PENDING	{"id":"mjdt052t0tywh5zcmvy5n685","name":"Rishab Saini ","phone":"7276193438","address":"Datta Washaat , near BBC cafe ","city":"Ashta","state":"Maharashtra ","pincode":"416301","isDefault":true}	\N	\N	\N	\N	2026-02-15 06:40:36.504	2026-02-18 12:53:00.186
j16wun6ke7l08js9t8305kqc	ORG-1771677749989-B2V4UP	pfngh0sjfhaiqxb6niaxelqz	7000	50	350	7400	SHIPPED	PENDING	{"id":"mjdt052t0tywh5zcmvy5n685","name":"Rishab Saini ","phone":"7276193438","address":"Datta Washaat , near BBC cafe ","city":"Ashta","state":"Maharashtra ","pincode":"416301","isDefault":true}	\N	\N	\N	\N	2026-02-21 12:42:29.991607	2026-02-21 12:50:38.971
fmtex0qtnmmf2e3lhe75h51r	ORG-1771677752906-1739JM	pfngh0sjfhaiqxb6niaxelqz	7000	50	350	7400	CANCELLED	PENDING	{"id":"mjdt052t0tywh5zcmvy5n685","name":"Rishab Saini ","phone":"7276193438","address":"Datta Washaat , near BBC cafe ","city":"Ashta","state":"Maharashtra ","pincode":"416301","isDefault":true}	\N	\N	\N	\N	2026-02-21 12:42:32.908006	2026-02-21 12:50:43.955
usyst5dihmhgs8mio9xc1zmq	ORG-1771677753271-J4RBPP	pfngh0sjfhaiqxb6niaxelqz	7000	50	350	7400	PROCESSING	PENDING	{"id":"mjdt052t0tywh5zcmvy5n685","name":"Rishab Saini ","phone":"7276193438","address":"Datta Washaat , near BBC cafe ","city":"Ashta","state":"Maharashtra ","pincode":"416301","isDefault":true}	\N	\N	\N	\N	2026-02-21 12:42:33.273873	2026-02-21 12:50:47.069
xc8uvqqp0ddkfcohp3iy97t1	ORG-1771677753442-4CSXT9	pfngh0sjfhaiqxb6niaxelqz	7000	50	350	7400	DELIVERED	PENDING	{"id":"mjdt052t0tywh5zcmvy5n685","name":"Rishab Saini ","phone":"7276193438","address":"Datta Washaat , near BBC cafe ","city":"Ashta","state":"Maharashtra ","pincode":"416301","isDefault":true}	\N	\N	\N	\N	2026-02-21 12:42:33.444451	2026-02-21 12:50:49.254
fd5f200ax7hui1tvhpxtwq7m	ORG-1771677753616-IITOB3	pfngh0sjfhaiqxb6niaxelqz	7000	50	350	7400	PENDING	PENDING	{"id":"mjdt052t0tywh5zcmvy5n685","name":"Rishab Saini ","phone":"7276193438","address":"Datta Washaat , near BBC cafe ","city":"Ashta","state":"Maharashtra ","pincode":"416301","isDefault":true}	\N	\N	\N	\N	2026-02-21 12:42:33.618495	2026-02-21 12:51:03.422
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, currency, status, method, email, contact, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: playing_with_neon; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.playing_with_neon (id, name, value) FROM stdin;
1	c4ca4238a0	0.48177963
2	c81e728d9d	0.14076233
3	eccbc87e4b	0.19847465
4	a87ff679a2	0.91753316
5	e4da3b7fbb	0.8141681
6	1679091c5a	0.89174277
7	8f14e45fce	0.5824365
8	c9f0f895fb	0.7771359
9	45c48cce2e	0.84224707
10	d3d9446802	0.68219006
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, name, slug, description, price, weight, stock, image_url, images, category, benefits, usage, composition, is_active, is_featured, created_at, updated_at, compare_price, image_alt_text, meta_title, meta_description) FROM stdin;
kl0zh6syy14owxgkg4ku6bws	Premium Chicken Manure	chicken-manure	High-nitrogen chicken manure boosts plant growth rapidly. Ideal for leafy greens, cereals, and heavy-feeding plants.	320	1	150	https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&h=400&fit=crop	\N	chicken	{"✓ High nitrogen content (3.2%)","✓ Fast nutrient release","✓ Enhances foliage growth","✓ Kills weed seeds"}	Use 1-2 kg per sq.meter, mix well with soil before planting	N: 3.2% | P: 2.1% | K: 1.5%	t	t	2026-02-16 13:27:48.629	2026-02-16 13:27:48.629	\N	\N	\N	\N
vfzpmjp9d8uybffewf6vopo0	Cow Manure 	cow-manure-2	Rich in nutrients and microorganisms, our cow manure is sourced from certified organic farms. Perfect for vegetable gardens and flowering plants.\n	350	1	1000	https://orgobloom.onrender.com/uploads/products/qilklot766ckka9fhd6rpev2.png	{https://orgobloom.onrender.com/uploads/products/qilklot766ckka9fhd6rpev2.png,https://orgobloom.onrender.com/uploads/products/tmagpbv3u3va1za3ou7yf74i.png,https://orgobloom.onrender.com/uploads/products/rn3pnys89a3lnme1377r013o.png,https://orgobloom.onrender.com/uploads/products/unn5jkw9y2rb7dvdmjmwtrjx.png,https://orgobloom.onrender.com/uploads/products/csgjkgn3qn9hgssij66thnfv.png}	cow	{"✓\nImproves soil structure Rich in nitrogen content Enhances water retention Promotes beneficial microbes"}	2-3 kg/sq.meter\n	N: 2.5% | P: 1.2% | K: 1.8%\n	t	f	2026-02-26 06:34:55.384	2026-02-26 06:34:55.384	450	Cow Manure 	Cow Manure 	Rich in nutrients and microorganisms, our cow manure is sourced from certified organic farms. Perfect for vegetable gardens and flowering plants.\n
rs039zponrrf0l37f6brx6zy	Premium Chicken Manure	premium-chicken-manure	High-nitrogen chicken manure boosts plant growth rapidly. Ideal for leafy greens, cereals, and heavy-feeding plants.	320	1	150	https://orgobloom.onrender.com/uploads/products/e85evpk7znp9s7lf1045lgl1.png	{https://orgobloom.onrender.com/uploads/products/e85evpk7znp9s7lf1045lgl1.png,https://orgobloom.onrender.com/uploads/products/dhd54cl4xwv8fkxny3sujfad.png,https://orgobloom.onrender.com/uploads/products/e58q59ea3zuhpwm55gqs7v1u.png,https://orgobloom.onrender.com/uploads/products/afijigk4ayj1i1cjocxg8w32.png,https://orgobloom.onrender.com/uploads/products/y6er2rcd4pvg0g23h3ofh9q9.png}	chicken	{{"✓ High nitrogen content (3.2%)","✓ Fast nutrient release","✓ Enhances foliage growth","✓ Kills weed seeds"}}			t	f	2026-02-26 08:16:03.788	2026-02-26 08:16:03.788	500	Premium Chicken Manure	Premium Chicken Manure	High-nitrogen chicken manure boosts plant growth rapidly. Ideal for leafy greens, cereals, and heavy-feeding plants.
y9qb6lagvynjmha3r8ooqmyc	Cow Manure 	cow-manure	Rich in nutrients and microorganisms, our cow manure is sourced from certified organic farms. Perfect for vegetable gardens and flowering plants.\n	350	1	1000	https://orgobloom.onrender.com/uploads/products/t1f4iyj865mhzj7z1mlnurae.png	{https://orgobloom.onrender.com/uploads/products/t1f4iyj865mhzj7z1mlnurae.png,https://orgobloom.onrender.com/uploads/products/v1duzkxjtt28oxemp0ls86y4.png,https://orgobloom.onrender.com/uploads/products/mq6lxc5dhlmsphx1uk6durqi.png,https://orgobloom.onrender.com/uploads/products/c3f2h7tbp6vt751pkkqs8ld9.png,https://orgobloom.onrender.com/uploads/products/i7ln0fzet69ek7y5eyb8vizj.png}	cow	{{"✓\nImproves soil structure Rich in nitrogen content Enhances water retention Promotes beneficial microbes"}}			t	f	2026-02-26 08:16:58.368	2026-02-26 08:16:58.368	450	Cow Manure 	Cow Manure 	Rich in nutrients and microorganisms, our cow manure is sourced from certified organic farms. Perfect for vegetable gardens and flowering plants.\n
\.


--
-- Data for Name: recently_viewed; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recently_viewed (id, user_id, product_id, viewed_at) FROM stdin;
\.


--
-- Data for Name: site_media; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.site_media (id, intro_video_url, intro_video_urls, created_at, updated_at, intro_video_poster, image_settings, content_settings, seo_settings) FROM stdin;
iezf7ir7vcjfd39uxwjh5fnl	\N	\N	2026-02-21 16:19:14.277	2026-02-26 08:17:39.019	\N	{"heroImage":"https://orgobloom.onrender.com/uploads/products/pvul03c53zken99cjh1j6iev.jpg","heroImageAlt":"Why Choose Orgobloom","whyChooseUsImage":"https://orgobloom.onrender.com/uploads/products/rp2inwly00r1anwnicv7735a.jpg","whyChooseUsImageAlt":"The Orgobloom Difference","advertisingImage":"https://orgobloom.onrender.com/uploads/products/itbyna4gvwol3ubv1sljs088.jpeg","advertisingImageAlt":"Orgobloom Advertising","aboutImage":"/images/plant.jpg","aboutImageAlt":"About Orgobloom","testimonialBackground":"","ctaBackground":""}	{"heroTitle":"Premium Organic Fertilizers","heroSubtitle":"Handcrafted with care, our organic fertilizers are designed to nourish your soil and boost crop yields naturally.","benefitsTitle":"Benefits of Organic Fertilizers","whyChooseUsTitle":"The Orgobloom Difference","whyChooseUsFeature1Title":"Premium Organic Inputs","whyChooseUsFeature1Description":"We offer only the highest quality organic fertilizers and soil enhancers, carefully sourced and tested.","whyChooseUsFeature2Title":"Complete Soil Solutions","whyChooseUsFeature2Description":"From compost to eco-friendly pest solutions, your one-stop shop for soil health.","whyChooseUsFeature3Title":"Expert Guidance","whyChooseUsFeature3Description":"Get personalized advice for your crops with tips for sustainable  practices.","advertisingTitle":"Now available on major E-Commerce Platforms","advertisingSubtitle":"Fast delivery, secure payments, and trusted service","ctaTitle":"Ready to Grow Naturally?","ctaSubtitle":"Join thousands of farmers who trust Orgobloom for their organic farming needs.","footerAbout":"Premium organic fertilizers for sustainable farming. Nourish your soil, naturally."}	{"homePageTitle":"Orgobloom - Premium Organic Fertilizers for Sustainable Farming","homePageDescription":"Shop premium organic fertilizers at Orgobloom. 100% natural cow and chicken manure for healthier crops. Free shipping on orders above ₹500. Nourish your soil naturally.","homePageKeywords":"organic fertilizer, cow manure, chicken manure, organic farming, sustainable agriculture, natural fertilizer, India","productsPageTitle":"Shop Organic Fertilizers - Premium Cow & Chicken Manure | Orgobloom","productsPageDescription":"Browse our collection of premium organic fertilizers. Cow manure and chicken manure for healthy plant growth. Competitive prices, fast delivery across India.","aboutPageTitle":"About Orgobloom - Our Story & Mission | Organic Farming","aboutPageDescription":"Learn about Orgobloom's mission to promote sustainable farming with premium organic fertilizers. Our commitment to quality and environmental responsibility.","contactPageTitle":"Contact Us - Get in Touch | Orgobloom Support","contactPageDescription":"Contact Orgobloom for inquiries about organic fertilizers, orders, or support. We're here to help with your sustainable farming needs.","ogImage":"/images/logo.jpg","twitterCard":"summary_large_image","siteName":"Orgobloom","siteUrl":"https://orgobloom.com","businessType":"Store","allowRobots":true,"sitemapEnabled":true}
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, name, password, phone, image, provider, provider_account_id, email_verified, role, is_blocked, blocked_at, blocked_reason, risk_score, fraud_status, cod_enabled, last_ip_address, device_fingerprint, created_at, updated_at) FROM stdin;
znv8z4df10oe1a3g5ad648ih	vijaysaini4338@gmail.com	vijay saini	\N	\N	https://lh3.googleusercontent.com/a/ACg8ocK43vJ8R7Yz9C6G5bwtVqLGw9U6SWwHOOIcZUPyxtr6gSGwqA=s96-c	google	106131146796514974529	2026-02-20 11:02:43.637	CUSTOMER	f	\N	\N	0	SAFE	t	\N	\N	2026-02-20 11:02:43.734409	2026-02-20 11:02:43.734409
fiftaiao4e39bu07urtf5oas	orgobloom5033@gmail.com	Admin	$2a$12$QgExsZBbm3jWv1sPkE4OzOkjdJQ7ssxn3tahU5Z3wLdWX9CJQ1iGu	\N	https://lh3.googleusercontent.com/a/ACg8ocI9_gzPVsKeOZ-W9Aru2kq1Mestg73vPOKjjdlTE-_ot5pkwu0=s96-c	google	105740192464079162229	2026-02-18 19:57:32	ADMIN	f	\N	\N	0	SAFE	t	\N	\N	2026-02-18 19:57:32	2026-02-21 06:26:41.163
pfngh0sjfhaiqxb6niaxelqz	rishabsainiupw165@gmail.com	Rishab Saini	$2a$12$/j2RqTjG/gnxJTte62THCulog4wbU.7ZMQgFsmNY8Gw7edpCoZYW2	\N	https://lh3.googleusercontent.com/a/ACg8ocLGEy7ADj-RS9F--8gYhteLudkwKGQ52_LBjkdZw-5q9rhW5nc=s96-c	google	113762645351910879822	2026-02-16 08:36:31.333	CUSTOMER	f	\N	\N	0	SAFE	t	\N	\N	2026-02-14 04:44:55.744	2026-02-21 12:42:51.613
mdgck3yrukzhp5fsdkosshru	tanish.mk.tiwari@gmail.com	Tanish	\N	\N	https://lh3.googleusercontent.com/a/ACg8ocL4n-4CwhWzNTGdaHIvBOLLld6C94cKk8L5cSJ4knwFk3ks4hQ=s96-c	google	115474345826875766685	2026-02-23 05:21:46.488	CUSTOMER	f	\N	\N	0	SAFE	t	\N	\N	2026-02-23 05:21:46.528282	2026-02-23 05:21:46.528282
dhekoso59qox3dl82bhj4xql	digaurav0406@gmail.com	Mr. Samurai	\N	\N	https://lh3.googleusercontent.com/a/ACg8ocJHqHtcHMU00m44n9Qko0-dKEmnirhrjDppuT3BIRGusCEHiBay=s96-c	google	105207631471362833822	2026-02-26 08:47:05.761	CUSTOMER	f	\N	\N	0	SAFE	t	\N	\N	2026-02-26 08:47:05.845149	2026-02-26 08:47:05.845149
\.


--
-- Data for Name: webhook_deliveries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.webhook_deliveries (id, webhook_id, event, status, payload, request_headers, response_status_code, response_body, response_headers, error_message, attempt_number, duration, created_at, delivered_at) FROM stdin;
\.


--
-- Data for Name: webhooks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.webhooks (id, name, url, secret, events, status, description, headers, retry_count, retry_delay, timeout, last_delivery_at, last_delivery_status, failure_count, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Name: playing_with_neon_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.playing_with_neon_id_seq', 10, true);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: blogs blogs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_pkey PRIMARY KEY (id);


--
-- Name: blogs blogs_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_slug_key UNIQUE (slug);


--
-- Name: fraud_logs fraud_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fraud_logs
    ADD CONSTRAINT fraud_logs_pkey PRIMARY KEY (id);


--
-- Name: integrations integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_status_history order_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payments payments_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_key UNIQUE (order_id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payments payments_razorpay_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_razorpay_order_id_key UNIQUE (razorpay_order_id);


--
-- Name: payments payments_razorpay_payment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_razorpay_payment_id_key UNIQUE (razorpay_payment_id);


--
-- Name: playing_with_neon playing_with_neon_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playing_with_neon
    ADD CONSTRAINT playing_with_neon_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_key UNIQUE (slug);


--
-- Name: recently_viewed recently_viewed_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recently_viewed
    ADD CONSTRAINT recently_viewed_pkey PRIMARY KEY (id);


--
-- Name: site_media site_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_media
    ADD CONSTRAINT site_media_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webhook_deliveries webhook_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_pkey PRIMARY KEY (id);


--
-- Name: webhooks webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_pkey PRIMARY KEY (id);


--
-- Name: idx_addresses_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_addresses_user_id ON public.addresses USING btree (user_id);


--
-- Name: idx_fraud_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fraud_logs_created_at ON public.fraud_logs USING btree (created_at);


--
-- Name: idx_fraud_logs_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fraud_logs_event_type ON public.fraud_logs USING btree (event_type);


--
-- Name: idx_fraud_logs_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fraud_logs_user_created ON public.fraud_logs USING btree (user_id, created_at);


--
-- Name: idx_fraud_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fraud_logs_user_id ON public.fraud_logs USING btree (user_id);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_order_items_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);


--
-- Name: idx_order_status_history_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_status_history_order_id ON public.order_status_history USING btree (order_id);


--
-- Name: idx_orders_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);


--
-- Name: idx_payments_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_order_id ON public.payments USING btree (order_id);


--
-- Name: idx_recently_viewed_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recently_viewed_user_id ON public.recently_viewed USING btree (user_id);


--
-- Name: idx_users_device_fingerprint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_device_fingerprint ON public.users USING btree (device_fingerprint);


--
-- Name: idx_users_fraud_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_fraud_status ON public.users USING btree (fraud_status);


--
-- Name: idx_users_last_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_last_ip ON public.users USING btree (last_ip_address);


--
-- Name: idx_users_risk_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_risk_score ON public.users USING btree (risk_score);


--
-- Name: addresses addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: fraud_logs fraud_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fraud_logs
    ADD CONSTRAINT fraud_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_status_history order_status_history_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: recently_viewed recently_viewed_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recently_viewed
    ADD CONSTRAINT recently_viewed_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict UV8L88ngbRYLHxNtkG1fp9nR6G05zqrBv5TeddIlLPkvHepa3ERZo27PItkiA1X

