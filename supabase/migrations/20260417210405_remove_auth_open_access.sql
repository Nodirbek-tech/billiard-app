/*
  # Remove Auth-Based Access Control

  ## Summary
  Drops all auth-dependent RLS policies and replaces them with
  open policies allowing public (anon) access to all tables.
  Also makes operator_id nullable in sessions so sessions can
  be created without a logged-in user.

  ## Changes
  1. Drop all existing restrictive policies on every table
  2. Add permissive open policies for anon + authenticated
  3. Make sessions.operator_id nullable
  4. Make stock_movements.created_by nullable (already is)
*/

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

-- Drop all existing policies on billiard_tables
DROP POLICY IF EXISTS "Authenticated users can read tables" ON billiard_tables;
DROP POLICY IF EXISTS "Admins can insert tables" ON billiard_tables;
DROP POLICY IF EXISTS "Authenticated users can update tables" ON billiard_tables;

-- Drop all existing policies on settings
DROP POLICY IF EXISTS "Authenticated users can read settings" ON settings;
DROP POLICY IF EXISTS "Admins can update settings" ON settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON settings;

-- Drop all existing policies on products
DROP POLICY IF EXISTS "Authenticated users can read products" ON products;
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;

-- Drop all existing policies on sessions
DROP POLICY IF EXISTS "Authenticated users can read sessions" ON sessions;
DROP POLICY IF EXISTS "Authenticated users can insert sessions" ON sessions;
DROP POLICY IF EXISTS "Authenticated users can update sessions" ON sessions;

-- Drop all existing policies on session_orders
DROP POLICY IF EXISTS "Authenticated users can read session orders" ON session_orders;
DROP POLICY IF EXISTS "Authenticated users can insert session orders" ON session_orders;
DROP POLICY IF EXISTS "Authenticated users can delete session orders" ON session_orders;

-- Drop all existing policies on stock_movements
DROP POLICY IF EXISTS "Authenticated users can read stock movements" ON stock_movements;
DROP POLICY IF EXISTS "Authenticated users can insert stock movements" ON stock_movements;

-- Open policies for all tables (anon + authenticated)
CREATE POLICY "Open read profiles" ON profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Open insert profiles" ON profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Open update profiles" ON profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Open read tables" ON billiard_tables FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Open insert tables" ON billiard_tables FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Open update tables" ON billiard_tables FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Open read settings" ON settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Open insert settings" ON settings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Open update settings" ON settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Open read products" ON products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Open insert products" ON products FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Open update products" ON products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Open delete products" ON products FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Open read sessions" ON sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Open insert sessions" ON sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Open update sessions" ON sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Open read session orders" ON session_orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Open insert session orders" ON session_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Open delete session orders" ON session_orders FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Open read stock movements" ON stock_movements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Open insert stock movements" ON stock_movements FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Make operator_id nullable so sessions work without a logged-in user
ALTER TABLE sessions ALTER COLUMN operator_id DROP NOT NULL;
