const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
})

const db = {
  async exec(sql) {
    const stmts = sql.split(';').map(s => s.trim()).filter(Boolean)
    for (const s of stmts) await pool.query(s)
  },
  async get(sql, params = []) {
    const [rows] = await pool.execute(sql, params)
    return rows[0] || null
  },
  async all(sql, params = []) {
    const [rows] = await pool.execute(sql, params)
    return rows
  },
  async run(sql, params = []) {
    const [result] = await pool.execute(sql, params)
    return { insertId: result.insertId, affectedRows: result.affectedRows }
  },
}

async function init() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      email      VARCHAR(255) UNIQUE NOT NULL,
      password   VARCHAR(255) NOT NULL,
      name       VARCHAR(255) DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      banned     TINYINT DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS products (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(255) NOT NULL,
      slug        VARCHAR(100) UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      price       DOUBLE NOT NULL,
      currency    VARCHAR(10) DEFAULT 'eur',
      duration    VARCHAR(50) DEFAULT 'lifetime',
      active      TINYINT DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS orders (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      customer_id    INT,
      product_id     INT NOT NULL,
      email          VARCHAR(255) NOT NULL,
      amount         DOUBLE NOT NULL,
      currency       VARCHAR(10) DEFAULT 'eur',
      status         VARCHAR(50) DEFAULT 'pending',
      payment_method VARCHAR(50) DEFAULT 'stripe',
      payment_intent VARCHAR(255) DEFAULT '',
      license_key    VARCHAR(255) DEFAULT '',
      coupon_code    VARCHAR(100) DEFAULT '',
      discount       DOUBLE DEFAULT 0,
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
      paid_at        DATETIME
    );
    CREATE TABLE IF NOT EXISTS coupons (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      code         VARCHAR(100) UNIQUE NOT NULL,
      discount_pct DOUBLE DEFAULT 0,
      max_uses     INT DEFAULT 0,
      uses         INT DEFAULT 0,
      active       TINYINT DEFAULT 1,
      expires_at   DATETIME
    );
    CREATE TABLE IF NOT EXISTS blacklist (
      id     INT AUTO_INCREMENT PRIMARY KEY,
      email  VARCHAR(255) UNIQUE NOT NULL,
      reason TEXT DEFAULT ''
    )
  `)

  const count = await db.get('SELECT COUNT(*) as c FROM products')
  if (!count || count.c === 0) {
    await db.run('INSERT INTO products (name, slug, price, duration, description) VALUES (?,?,?,?,?)', ['RSM Pro — 1 Mois',  '1m',       9.99,  '1m',       'Accès complet 1 mois'])
    await db.run('INSERT INTO products (name, slug, price, duration, description) VALUES (?,?,?,?,?)', ['RSM Pro — 3 Mois',  '3m',       19.99, '3m',       'Accès complet 3 mois — Meilleure offre'])
    await db.run('INSERT INTO products (name, slug, price, duration, description) VALUES (?,?,?,?,?)', ['RSM Pro — À Vie',   'lifetime', 29.99, 'lifetime', 'Accès à vie + toutes mises à jour futures'])
  }
}

module.exports = { db, init }
