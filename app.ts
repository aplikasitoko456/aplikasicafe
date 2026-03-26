import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing! Please set it in the Secrets panel.");
}
const sql = neon(process.env.DATABASE_URL || "");

export const app = express();
app.use(express.json());

let dbInitialized = false;

async function initDb() {
  if (dbInitialized) return;
  try {
    await sql`CREATE TABLE IF NOT EXISTS items (id SERIAL PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, price_per_portion NUMERIC NOT NULL)`;
    // Migration: Ensure items table has price_per_portion
    try { await sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS price_per_portion NUMERIC`; } catch (e) {}

    await sql`CREATE TABLE IF NOT EXISTS accounts (id SERIAL PRIMARY KEY, category TEXT NOT NULL, sub_category TEXT NOT NULL, account_name TEXT NOT NULL UNIQUE)`;
    // Migration: Ensure accounts table has sub_category
    try { await sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS sub_category TEXT`; } catch (e) {}

    await sql`CREATE TABLE IF NOT EXISTS journal_entries (id SERIAL PRIMARY KEY, transaction_id TEXT NOT NULL, account_name TEXT NOT NULL, description TEXT, debit NUMERIC DEFAULT 0, credit NUMERIC DEFAULT 0, date TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    // Migration: Ensure journal_entries table has transaction_id
    try { await sql`ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS transaction_id TEXT`; } catch (e) {}
    await sql`CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY, queue_number TEXT NOT NULL, total_amount NUMERIC NOT NULL, items_json TEXT, customer_name TEXT, table_number TEXT, status TEXT DEFAULT 'processing', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    // Migration: Ensure all required columns exist (for existing tables from previous versions)
    try {
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS queue_number TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS items_json TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_number TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'processing'`;
    } catch (e) {
      console.log("Migration error for orders table:", e);
    }
    const count = await sql`SELECT count(*) FROM accounts`;
    if (parseInt(count[0].count) === 0) {
      await sql`INSERT INTO accounts (category, sub_category, account_name) VALUES ('Aset','Aset Lancar','Kas'),('Aset','Aset Lancar','Persediaan Barang'),('Ekuitas','Modal','Modal Pemilik'),('Pendapatan','Pendapatan Usaha','Penjualan'),('Beban','Harga Pokok Penjualan','Persediaan Awal'),('Beban','Harga Pokok Penjualan','Pembelian'),('Beban','Harga Pokok Penjualan','Persediaan Akhir'),('Beban','Beban Operasional','Beban Gaji'),('Beban','Beban Operasional','Beban Listrik & Air'),('Beban','Beban Operasional','Beban ATK')`;
    }
    const itemCount = await sql`SELECT count(*) FROM items`;
    if (parseInt(itemCount[0].count) === 0) {
      await sql`INSERT INTO items (name, category, price_per_portion) VALUES ('Kopi Susu Gula Aren', 'Minuman', 18000), ('Es Teh Manis', 'Minuman', 5000), ('Nasi Goreng Spesial', 'Makanan', 25000), ('Mie Goreng Jawa', 'Makanan', 22000), ('Cireng Rujak', 'Makanan', 15000)`;
    }
    console.log("Database initialized");
    dbInitialized = true;
  } catch (err) { console.error("Database initialization failed:", err); }
}

export async function setupApp() {
  await initDb();
  app.get("/api/items", async (req, res) => res.json(await sql`SELECT * FROM items ORDER BY name ASC`));
  app.patch("/api/items/:id", async (req, res) => {
    const { name, category, price_per_portion } = req.body;
    const { id } = req.params;
    const r = await sql`UPDATE items SET name = ${name}, category = ${category}, price_per_portion = ${price_per_portion} WHERE id = ${id} RETURNING *`;
    res.json(r[0]);
  });
  
  app.post("/api/items", async (req, res) => {
    const { name, category, price_per_portion } = req.body;
    const r = await sql`INSERT INTO items (name, category, price_per_portion) VALUES (${name}, ${category}, ${price_per_portion}) RETURNING *`;
    res.json(r[0]);
  });

  app.get("/api/accounts", async (req, res) => res.json(await sql`SELECT * FROM accounts ORDER BY category, account_name`));
  app.post("/api/accounts", async (req, res) => {
    const { category, sub_category, account_name } = req.body;
    try { res.json((await sql`INSERT INTO accounts (category, sub_category, account_name) VALUES (${category}, ${sub_category}, ${account_name}) RETURNING *`)[0]); }
    catch (err) { res.status(400).json({ error: "Akun sudah ada" }); }
  });

  app.get("/api/journal", async (req, res) => res.json(await sql`SELECT * FROM journal_entries ORDER BY date DESC`));

  app.post("/api/sale", async (req, res) => {
    const { cart, date, customer_name, table_number } = req.body; // cart: [{ item_id, quantity, note, price }]
    if (!cart || cart.length === 0) return res.status(400).json({ error: "Cart is empty" });

    const today = new Date().toISOString().split('T')[0];
    const countToday = await sql`SELECT count(*) FROM orders WHERE created_at::date = ${today}::date`;
    const queueNum = (parseInt(countToday[0].count) + 1).toString().padStart(3, '0');
    
    let totalSale = 0;
    const itemDescriptions = cart.map((c: any) => `${c.name} x${c.quantity}${c.note ? ` (${c.note})` : ''}`).join(', ');
    cart.forEach((c: any) => { totalSale += c.quantity * c.price; });

    const tid = `T-SALE-${Date.now()}`;

    const order = await sql`INSERT INTO orders (queue_number, total_amount, items_json, customer_name, table_number, status) VALUES (${queueNum}, ${totalSale}, ${JSON.stringify(cart)}, ${customer_name || null}, ${table_number || null}, 'processing') RETURNING *`;
    await sql`INSERT INTO journal_entries (transaction_id, account_name, description, debit, credit, date) VALUES (${tid}, 'Kas', ${`Penjualan: ${itemDescriptions}`}, ${totalSale}, 0, ${date || new Date()})`;
    await sql`INSERT INTO journal_entries (transaction_id, account_name, description, debit, credit, date) VALUES (${tid}, 'Penjualan', ${`Penjualan: ${itemDescriptions}`}, 0, ${totalSale}, ${date || new Date()})`;

    res.json({ success: true, queue_number: queueNum, total: totalSale, order: order[0] });
  });

  app.get("/api/orders", async (req, res) => {
    res.json(await sql`SELECT * FROM orders ORDER BY created_at DESC`);
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    const r = await sql`UPDATE orders SET status = ${status} WHERE id = ${id} RETURNING *`;
    res.json(r[0]);
  });

  app.get("/api/turnover", async (req, res) => {
    const { month, year } = req.query;
    const m = parseInt(month as string);
    const y = parseInt(year as string);
    
    const turnover = await sql`
      SELECT 
        created_at::date as date,
        SUM(total_amount) as total
      FROM orders
      WHERE EXTRACT(MONTH FROM created_at) = ${m}
      AND EXTRACT(YEAR FROM created_at) = ${y}
      GROUP BY created_at::date
      ORDER BY created_at::date ASC
    `;
    res.json(turnover);
  });

  app.post("/api/expense", async (req, res) => {
    const { debit_account, credit_account, amount, description, date } = req.body;
    const tid = `T-EXP-${Date.now()}`;
    await sql`INSERT INTO journal_entries (transaction_id, account_name, description, debit, credit, date) VALUES (${tid}, ${debit_account}, ${description}, ${amount}, 0, ${date || new Date()})`;
    await sql`INSERT INTO journal_entries (transaction_id, account_name, description, debit, credit, date) VALUES (${tid}, ${credit_account}, ${description}, 0, ${amount}, ${date || new Date()})`;
    res.json({ success: true });
  });

  app.get("/api/reports/profit-loss", async (req, res) => {
    const entries = await sql`SELECT * FROM journal_entries`, accountsList = await sql`SELECT * FROM accounts`;
    const getBal = (n: string) => entries.filter(j => j.account_name === n).reduce((s, j) => s + (parseFloat(j.debit) - parseFloat(j.credit)), 0);
    const penjualan = Math.abs(getBal("Penjualan"));
    const persediaanAwal = getBal("Persediaan Awal");
    const pembelian = getBal("Pembelian");
    const persediaanAkhir = getBal("Persediaan Akhir");
    const hpp = persediaanAwal + pembelian - persediaanAkhir;
    const labaKotor = penjualan - hpp;
    const bebanOperasional = accountsList.filter(a => a.sub_category === "Beban Operasional").map(a => ({ name: a.account_name, amount: getBal(a.account_name) }));
    const totalBeban = bebanOperasional.reduce((s, b) => s + b.amount, 0), labaBersih = labaKotor - totalBeban;
    res.json({ penjualan, persediaanAwal, pembelian, persediaanAkhir, hpp, labaKotor, bebanOperasional, totalBeban, labaBersih });
  });

  app.get("/api/reports/balance-sheet", async (req, res) => {
    const entries = await sql`SELECT * FROM journal_entries`, accountsList = await sql`SELECT * FROM accounts`;
    const getBal = (n: string) => entries.filter(j => j.account_name === n).reduce((s, j) => s + (parseFloat(j.debit) - parseFloat(j.credit)), 0);
    const penjualan = Math.abs(getBal("Penjualan"));
    const persediaanAwal = getBal("Persediaan Awal");
    const pembelian = getBal("Pembelian");
    const persediaanAkhir = getBal("Persediaan Akhir");
    const hpp = persediaanAwal + pembelian - persediaanAkhir;
    const labaKotor = penjualan - hpp;
    const totalBeban = accountsList.filter(a => a.sub_category === "Beban Operasional").reduce((s, a) => s + getBal(a.account_name), 0);
    const labaTahunBerjalan = labaKotor - totalBeban;
    
    const asetRaw = accountsList.filter(a => a.category === "Aset").map(a => ({ name: a.account_name, sub: a.sub_category, amount: getBal(a.account_name) }));
    const asetGrouped: { [key: string]: any[] } = {};
    asetRaw.forEach(a => {
      if (!asetGrouped[a.sub]) asetGrouped[a.sub] = [];
      asetGrouped[a.sub].push(a);
    });

    const kewajibanRaw = accountsList.filter(a => ["Kewajiban", "Hutang", "Utang"].includes(a.category)).map(a => ({ name: a.account_name, sub: a.sub_category, amount: Math.abs(getBal(a.account_name)) }));
    const kewajibanGrouped: { [key: string]: any[] } = {};
    kewajibanRaw.forEach(k => {
      if (!kewajibanGrouped[k.sub]) kewajibanGrouped[k.sub] = [];
      kewajibanGrouped[k.sub].push(k);
    });

    const ekuitas = accountsList.filter(a => a.category === "Ekuitas").map(a => ({ name: a.account_name, amount: Math.abs(getBal(a.account_name)) }));
    ekuitas.push({ name: "Laba Tahun Berjalan", amount: labaTahunBerjalan });
    
    const totalAset = asetRaw.reduce((s, a) => s + a.amount, 0);
    const totalPasiva = kewajibanRaw.reduce((s, k) => s + k.amount, 0) + ekuitas.reduce((s, e) => s + e.amount, 0);
    res.json({ asetGrouped, kewajibanGrouped, ekuitas, totalAset, totalPasiva, isBalanced: Math.abs(totalAset - totalPasiva) < 0.01 });
  });

  app.post("/api/journal/multi", async (req, res) => {
    const { entries, description } = req.body;
    const transactionId = `T-JRN-${Date.now()}`;
    const date = new Date().toISOString();
    
    for (const entry of entries) {
      await sql`INSERT INTO journal_entries (transaction_id, account_name, description, debit, credit, date) VALUES (${transactionId}, ${entry.account_name}, ${description}, ${entry.debit}, ${entry.credit}, ${date})`;
    }
    res.json({ success: true });
  });

  app.delete("/api/journal/:id", async (req, res) => {
    if (req.body.password !== "admin123") return res.status(403).json({ error: "Password salah" });
    await sql`DELETE FROM journal_entries WHERE id = ${req.params.id}`;
    res.json({ success: true });
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
}

export default app;

