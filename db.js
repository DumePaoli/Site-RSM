const Database = require('better-sqlite3')
const path = require('path')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'shop.db')
const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    name       TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    banned     INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    slug        TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    price       REAL NOT NULL,
    currency    TEXT DEFAULT 'eur',
    duration    TEXT DEFAULT 'lifetime',
    active      INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS orders (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id    INTEGER REFERENCES customers(id),
    product_id     INTEGER NOT NULL REFERENCES products(id),
    email          TEXT NOT NULL,
    amount         REAL NOT NULL,
    currency       TEXT DEFAULT 'eur',
    status         TEXT DEFAULT 'pending',
    payment_method TEXT DEFAULT 'stripe',
    payment_intent TEXT DEFAULT '',
    license_key    TEXT DEFAULT '',
    coupon_code    TEXT DEFAULT '',
    discount       REAL DEFAULT 0,
    created_at     TEXT DEFAULT (datetime('now')),
    paid_at        TEXT
  );

  CREATE TABLE IF NOT EXISTS coupons (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    code         TEXT UNIQUE NOT NULL,
    discount_pct REAL DEFAULT 0,
    max_uses     INTEGER DEFAULT 0,
    uses         INTEGER DEFAULT 0,
    active       INTEGER DEFAULT 1,
    expires_at   TEXT
  );

  CREATE TABLE IF NOT EXISTS blacklist (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    email  TEXT UNIQUE NOT NULL,
    reason TEXT DEFAULT ''
  );
`)

// Seed products
const count = db.prepare('SELECT COUNT(*) as c FROM products').get()
if (count.c === 0) {
  db.prepare(`INSERT INTO products (name, slug, price, duration, description) VALUES (?,?,?,?,?)`).run('RSM Pro — 1 Mois',  '1m',       9.99,  '1m',       'Accès complet 1 mois')
  db.prepare(`INSERT INTO products (name, slug, price, duration, description) VALUES (?,?,?,?,?)`).run('RSM Pro — 3 Mois',  '3m',       19.99, '3m',       'Accès complet 3 mois — Meilleure offre')
  db.prepare(`INSERT INTO products (name, slug, price, duration, description) VALUES (?,?,?,?,?)`).run('RSM Pro — À Vie',   'lifetime', 29.99, 'lifetime', 'Accès à vie + toutes mises à jour futures')
}

module.exports = db
