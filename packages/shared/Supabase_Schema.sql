-- conversations table for text messages
create table conversations (
    id uuid primary key default uuid_generate_v4(),
    participants uuid[] not null,
    type text not null,
    created_at timestamptz default now(),
    last_activity timestamptz
);
-- messages table for text messages
create table messages (
    id uuid primary key default uuid_generate_v4(),
    conversation_id uuid references conversations(id) not null,
    sender_id uuid references users(id) not null,
    content text not null,
    timestamp timestamptz default now(),
    status text not null,
    type text not null,
    metadata jsonb
);
-- calls table for audio and video calls
create table calls (
    id uuid primary key default uuid_generate_v4(),
    caller_id uuid references users(id) not null,
    receiver_id uuid references users(id) not null,
    start_time timestamptz default now(),
    end_time timestamptz,
    status text not null,
    type text not null,
    call_duration integer
);
-- notifications table for push notifications
create table notifications (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) not null,
    type text not null,
    title text not null,
    body text not null,
    read boolean default false,
    created_at timestamptz default now(),
    metadata jsonb
);

-- 1a) A helper view that bundles menu items with vendor name & images
create or replace view public.random_menu_items as
select
  mi.id,
  mi.name,
  mi.price,
  mi.description,
  p.name   as vendor_name,
  (
    select array_agg(mii.image_url)
    from public.menu_item_image mii
    where mii.menu_item_id = mi.id
  ) as image_urls
from public.menu_item mi
join public.profiles p
  on p.id = mi.vendor_id
where mi.is_available = true;

-- 2a) A function to pull N random rows from that view
create or replace function public.get_random_menu_items(lim integer)
  returns table (
    id           uuid,
    name         text,
    price        numeric,
    description  text,
    vendor_name  text,
    image_urls   text[]
  )
language sql stable as $$
  select *
    from public.random_menu_items
   order by random()
   limit lim;
$$;


CREATE TABLE public.categories (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique ID for each category
    name text UNIQUE NOT NULL, -- e.g., 'Foodstuff', 'Clothes'
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Insert initial categories (Optional, you can do this via UI/API too)
INSERT INTO categories (name) VALUES
('Foodstuff'),
('Clothes'),
('Toiletries'),
('Electronics'),
('Books'),
('Home Goods'),
('Other');

-- Set up Row Level Security (RLS) for categories
-- Categories are usually publicly viewable
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are public."
  ON categories FOR SELECT USING (true);

-- Define policies for INSERT, UPDATE, DELETE based on admin/moderator roles if needed
-- For a simple setup, maybe only service role can modify categories




CREATE TABLE public.products (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique ID for each product
    vendor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Link to the vendor's profile
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT, -- Link to the product category
    name text NOT NULL,
    description text, -- Added description for product details
    unit_price decimal(10, 2) NOT NULL, -- Use DECIMAL for currency
    available_quantity integer NOT NULL CHECK (available_quantity >= 0), -- "Number in Stock"
    image_url text, -- URL to the image stored in Supabase Storage
    is_hidden boolean DEFAULT FALSE NOT NULL, -- To hide/show the product
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create an index on vendor_id for faster lookups
CREATE INDEX idx_products_vendor_id ON products (vendor_id);

-- Set up Row Level Security (RLS) for products
-- This is CRITICAL for multi-vendor applications
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy for vendors to view their own products
CREATE POLICY "Vendors can view their own products."
  ON products FOR SELECT USING (auth.uid() = vendor_id); -- auth.uid() gets the logged-in user's ID

-- Policy for vendors to create products (linking to their own ID)
CREATE POLICY "Vendors can create products for themselves."
  ON products FOR INSERT WITH CHECK (auth.uid() = vendor_id); -- Ensure the vendor_id matches the logged-in user

-- Policy for vendors to update their own products
CREATE POLICY "Vendors can update their own products."
  ON products FOR UPDATE USING (auth.uid() = vendor_id);

-- Policy for vendors to delete their own products
CREATE POLICY "Vendors can delete their own products."
  ON products FOR DELETE USING (auth.uid() = vendor_id);

-- Policy for customers (public) to view products that are NOT hidden
CREATE POLICY "Customers can view visible products."
  ON products FOR SELECT USING (is_hidden = FALSE); -- Allows anyone (auth or not) to see non-hidden products

