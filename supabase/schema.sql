-- ====================================================================
-- KATSU CLUB: ตารางจัดการวัตถุดิบและบรรจุภัณฑ์ (ฉบับเรียบง่ายและใช้งานจริง)
-- คัดลอกโค้ดนี้ไปวางใน Supabase Dashboard > SQL Editor แล้วกด "Run"
-- ====================================================================

-- 1. ลบตารางเดิมเพื่อสร้างใหม่
drop table if exists public.stock_transactions cascade;
drop table if exists public.ingredients cascade;
drop table if exists public.suppliers cascade;
drop table if exists public.ingredient_categories cascade;
drop table if exists public.units cascade;

-- 2. สร้างตาราง ingredients ใหม่
create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null, -- ชื่อวัตถุดิบ เช่น ข้าวญี่ปุ่น, ซอสทงคัตสึ, ไข่ไก่
  category text not null default 'ทั่วไป', -- หมวดหมู่ เช่น เนื้อสัตว์, ข้าวและแป้ง, เครื่องปรุงและซอส, ผักและของสด
  image_url text, -- ลิงก์ URL รูปภาพ
  package_type text not null default 'ถุง', -- ถุง, ขวด, แกลลอน, ปี๊บ, แผง, แพ็ค, ลัง
  package_size numeric(12, 2) not null default 1, -- ปริมาณต่อชิ้น เช่น 15 (กก.), 1.8 (ลิตร), 30 (ฟอง)
  unit text not null default 'กก.', -- กก., ลิตร, มิลลิลิตร, ฟอง, กรัม
  stock_qty numeric(12, 2) not null default 0, -- จำนวนชิ้น/บรรจุภัณฑ์คงเหลือ เช่น 1 ถุง
  total_volume numeric(12, 2) not null default 0, -- ปริมาณรวมทั้งหมด เช่น 15 กก.
  price_per_package numeric(12, 2) not null default 0, -- ราคาต่อชิ้น/บรรจุภัณฑ์ เช่น 371 บ.
  cost_per_unit numeric(12, 2) not null default 0, -- ต้นทุนเฉลี่ยต่อหน่วยย่อย เช่น 24.73 บ./กก.
  supplier text, -- แหล่งซื้อ เช่น Makro, Betagro, ตลาดสด
  expiry_date date, -- วันหมดอายุ
  note text, -- หมายเหตุ
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. ตารางบันทึกประวัติการรับเข้า (Stock Transactions)
create table public.stock_transactions (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid references public.ingredients(id) on delete cascade,
  transaction_type text not null default 'RECEIVE', -- RECEIVE, USE, ADJUST
  category text, -- หมวดหมู่
  package_qty numeric(12, 2) not null default 1, -- จำนวนชิ้นที่รับเข้า เช่น 1 ถุง
  package_type text,
  package_size numeric(12, 2),
  unit text,
  total_volume numeric(12, 2), -- ปริมาณรวมที่ได้
  price_per_package numeric(12, 2) not null default 0,
  total_price numeric(12, 2) not null default 0,
  cost_per_unit numeric(12, 2) not null default 0,
  supplier text,
  expiry_date date,
  note text,
  created_at timestamptz default now()
);

-- 4. เปิดความปลอดภัย RLS
alter table public.ingredients enable row level security;
alter table public.stock_transactions enable row level security;

create policy "Allow all access to ingredients" on public.ingredients for all using (true) with check (true);
create policy "Allow all access to stock_transactions" on public.stock_transactions for all using (true) with check (true);

-- ====================================================================
-- คำสั่งอัปเกรดตารางเดิมที่มีอยู่แล้ว (โดยไม่ต้องลบข้อมูลเดิม)
-- ====================================================================
-- alter table public.ingredients add column if not exists category text default 'ทั่วไป';
-- alter table public.ingredients add column if not exists image_url text;
-- alter table public.stock_transactions add column if not exists category text;
