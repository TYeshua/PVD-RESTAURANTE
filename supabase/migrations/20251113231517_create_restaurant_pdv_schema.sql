/*
  # Restaurant PDV Schema

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, category name)
      - `created_at` (timestamp)
    
    - `products`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key to categories)
      - `name` (text, product name)
      - `price` (decimal, product price)
      - `active` (boolean, is product available)
      - `created_at` (timestamp)
    
    - `tables`
      - `id` (uuid, primary key)
      - `number` (text, table/command number)
      - `status` (text, open/closed)
      - `created_at` (timestamp)
    
    - `orders`
      - `id` (uuid, primary key)
      - `table_id` (uuid, foreign key to tables)
      - `status` (text, pending/preparing/ready/delivered/paid)
      - `total` (decimal, order total)
      - `created_at` (timestamp)
      - `closed_at` (timestamp, nullable)
    
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `product_id` (uuid, foreign key to products)
      - `quantity` (integer, item quantity)
      - `unit_price` (decimal, price at time of order)
      - `notes` (text, special instructions)
      - `status` (text, pending/preparing/ready/delivered)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (lite version without auth)
    
  3. Important Notes
    - This is a lite version for small businesses
    - No authentication required for simplicity
    - All users have full access to manage the system
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE,
  status text DEFAULT 'closed' CHECK (status IN ('open', 'closed')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid REFERENCES tables(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'paid')),
  total decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity integer NOT NULL DEFAULT 1,
  unit_price decimal(10,2) NOT NULL,
  notes text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to categories"
  ON categories FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public access to products"
  ON products FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public access to tables"
  ON tables FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public access to orders"
  ON orders FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public access to order_items"
  ON order_items FOR ALL
  USING (true)
  WITH CHECK (true);

INSERT INTO categories (name) VALUES
  ('Lanches'),
  ('Bebidas'),
  ('Porções'),
  ('Sobremesas');

INSERT INTO products (category_id, name, price) VALUES
  ((SELECT id FROM categories WHERE name = 'Lanches'), 'X-Burger', 15.00),
  ((SELECT id FROM categories WHERE name = 'Lanches'), 'X-Salada', 18.00),
  ((SELECT id FROM categories WHERE name = 'Lanches'), 'X-Bacon', 20.00),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'Refrigerante Lata', 5.00),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'Suco Natural', 8.00),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'Cerveja', 7.00),
  ((SELECT id FROM categories WHERE name = 'Porções'), 'Batata Frita', 12.00),
  ((SELECT id FROM categories WHERE name = 'Porções'), 'Frango a Passarinho', 25.00),
  ((SELECT id FROM categories WHERE name = 'Sobremesas'), 'Pudim', 8.00),
  ((SELECT id FROM categories WHERE name = 'Sobremesas'), 'Sorvete', 10.00);

INSERT INTO tables (number) VALUES
  ('01'), ('02'), ('03'), ('04'), ('05'),
  ('06'), ('07'), ('08'), ('09'), ('10');