/*
  # Seed Initial Data

  ## Summary
  Inserts all default data required to run the billiard club manager:

  1. **Settings** - Business config including day/night rates, business name, etc.
  2. **Billiard Tables** - 3 tables (Table 1, Table 2, Table 3)
  3. **Products** - 10 bar/snack items with initial stock

  ## Notes
  - Day rate: 40,000 UZS/hour (06:00 - 18:00)
  - Night rate: 50,000 UZS/hour (18:00 - 06:00)
  - All amounts in UZS (Uzbek Sum)
*/

-- Settings
INSERT INTO settings (key, value, label, description) VALUES
  ('business_name', 'Billiard Club', 'Business Name', 'Displayed on receipts and dashboard'),
  ('day_rate', '40000', 'Day Rate (UZS/hour)', 'Rate from 06:00 to 18:00'),
  ('night_rate', '50000', 'Night Rate (UZS/hour)', 'Rate from 18:00 to 06:00'),
  ('currency', 'UZS', 'Currency', 'Currency label for display'),
  ('receipt_footer', 'Thank you for visiting! Come again.', 'Receipt Footer', 'Text at the bottom of receipts'),
  ('low_stock_threshold', '5', 'Low Stock Threshold', 'Alert when product stock falls below this number'),
  ('tax_rate', '0', 'Tax Rate (%)', 'Tax percentage applied to bills (0 = no tax)')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Billiard Tables
INSERT INTO billiard_tables (number, name, status) VALUES
  (1, 'Table 1', 'available'),
  (2, 'Table 2', 'available'),
  (3, 'Table 3', 'available')
ON CONFLICT (number) DO NOTHING;

-- Products
INSERT INTO products (name, category, price, stock, is_active) VALUES
  ('Coca-Cola 1L', 'drinks', 12000, 50, true),
  ('Pepsi 1.5L', 'drinks', 10000, 50, true),
  ('Water 0.5L', 'drinks', 5000, 100, true),
  ('Water 1.5L', 'drinks', 8000, 80, true),
  ('Coffee', 'hot_drinks', 15000, 30, true),
  ('Tea', 'hot_drinks', 10000, 40, true),
  ('Chips (large)', 'snacks', 18000, 25, true),
  ('Chips (small)', 'snacks', 10000, 30, true),
  ('Sandwich', 'food', 25000, 15, true),
  ('Energy Drink', 'drinks', 20000, 20, true)
ON CONFLICT DO NOTHING;
