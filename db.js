const path = require('path')
const fs   = require('fs')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'shop.db')

let initSql
try {
  initSql = require('sql.js')
} catch(e) {
  console.error('[db] sql.js not found, trying better-sqlite3', e.message)
  initSql = null
}

let db

if (initSql) {
  // sql.js — pure JS, synchronous wrapper via shared buffer
  const SQL = initSql({ locateFile: f => path.join(__dirname, 'node_modules/sql.js/dist/', f) })
  let buf = null
  if (fs.existsSync(DB_PATH)) buf = fs.readFileSync(DB_PATH)
  const sqldb = buf ? new SQL.Database(buf) : new SQL.Database()

  const save = () => { const d = sqldb.export(); fs.writeFileSync(DB_PATH, Buffer.from(d)) }

  db = {
    exec(sql) { sqldb.run(sql); save() },
    prepare(sql) {
      return {
        run(...params) { sqldb.run(sql, params); save() },
        get(...params) {
          const stmt = sqldb.prepare(sql)
          stmt.bind(params)
          if (stmt.step()) {
            const row = stmt.getAsObject()
            stmt.free()
            return row
          }
          stmt.free()
          return undefined
        },
        all(...params) {
          const rows = []
          const stmt = sqldb.prepare(sql)
          stmt.bind(params)
          while (stmt.step()) rows.push(stmt.getAsObject())
          stmt.free()
          return rows
        },
      }
    },
  }
} else {
  const Database = require('better-sqlite3')
  const bdb = new Database(DB_PATH)
  bdb.pragma('journal_mode = WAL')
  bdb.pragma('foreign_keys = ON')
  db = bdb
}

db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, name TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')), banned INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '', price REAL NOT NULL, currency TEXT DEFAULT 'eur', duration TEXT DEFAULT 'lifetime', active INTEGER DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER REFERENCES customers(id),
    product_id INTEGER NOT NULL REFERENCES products(id), email TEXT NOT NULL, amount REAL NOT NULL,
    currency TEXT DEFAULT 'eur', status TEXT DEFAULT 'pending', payment_method TEXT DEFAULT 'stripe',
    payment_intent TEXT DEFAULT '', license_key TEXT DEFAULT '', coupon_code TEXT DEFAULT '',
    discount REAL DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), paid_at TEXT
  );
  CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE NOT NULL, discount_pct REAL DEFAULT 0,
    max_uses INTEGER DEFAULT 0, uses INTEGER DEFAULT 0, active INTEGER DEFAULT 1, expires_at TEXT
  );
  CREATE TABLE IF NOT EXISTS blacklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, reason TEXT DEFAULT ''
  );
`)

const count = db.prepare('SELECT COUNT(*) as c FROM products').get()
if (!count || count.c === 0) {
  db.prepare(`INSERT INTO products (name, slug, price, duration, description) VALUES (?,?,?,?,?)`).run('RSM Pro — 1 Mois',  '1m',       9.99,  '1m',       'Accès complet 1 mois')
  db.prepare(`INSERT INTO products (name, slug, price, duration, description) VALUES (?,?,?,?,?)`).run('RSM Pro — 3 Mois',  '3m',       19.99, '3m',       'Accès complet 3 mois — Meilleure offre')
  db.prepare(`INSERT INTO products (name, slug, price, duration, description) VALUES (?,?,?,?,?)`).run('RSM Pro — À Vie',   'lifetime', 29.99, 'lifetime', 'Accès à vie + toutes mises à jour futures')
}

module.exports = db
