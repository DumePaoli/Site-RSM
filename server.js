require('dotenv').config()
const express    = require('express')
const path       = require('path')
const cors       = require('cors')
const bcrypt     = require('bcryptjs')
const jwt        = require('jsonwebtoken')
const stripe     = require('stripe')(process.env.STRIPE_SECRET_KEY || '')
const nodemailer = require('nodemailer')
const axios      = require('axios')
const db         = require('./db')

const app  = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors())
// Raw body for Stripe webhook must come before json()
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }))
app.use(express.json())

// ── Helpers ───────────────────────────────────────────────────────────────────
const signToken = (payload, expiresIn = '7d') => jwt.sign(payload, JWT_SECRET, { expiresIn })

const authMiddleware = (req, res, next) => {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ detail: 'Non authentifié' })
  try {
    req.user = jwt.verify(h.slice(7), JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ detail: 'Token invalide' })
  }
}

const adminMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user?.role !== 'admin') return res.status(403).json({ detail: 'Admin requis' })
    next()
  })
}

async function generateLicenseKey(notes = '') {
  const r = await axios.post(
    `${process.env.LICENSE_SERVER_URL}/admin/keys`,
    { count: 1, tier: 'pro', notes },
    { headers: { 'x-admin-secret': process.env.LICENSE_ADMIN_SECRET }, timeout: 15000 }
  )
  return r.data.keys[0]
}

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
})

function sendDeliveryEmail(to, licenseKey, productName) {
  if (!process.env.SMTP_HOST) return
  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="background:#0d0d0f;color:#f1f1f3;font-family:Inter,sans-serif;padding:40px 20px;margin:0">
  <div style="max-width:520px;margin:0 auto">
    <h1 style="color:#f97316;font-size:1.5rem;text-align:center">Rust Server Manager Pro</h1>
    <p style="text-align:center;color:#8b8b96">Merci pour votre achat !</p>
    <div style="background:rgba(249,115,22,0.06);border:1px solid rgba(249,115,22,0.2);border-radius:12px;padding:24px;margin-top:24px">
      <p style="color:#8b8b96;font-size:0.85rem;margin:0 0 8px">Produit</p>
      <p style="margin:0 0 20px;font-weight:600">${productName}</p>
      <p style="color:#8b8b96;font-size:0.85rem;margin:0 0 8px">Clé de licence</p>
      <div style="background:#1a1a1f;border:1px solid rgba(249,115,22,0.3);border-radius:8px;padding:14px;text-align:center;font-family:monospace;font-size:1.1rem;color:#f97316;letter-spacing:0.1em;margin-bottom:20px">
        ${licenseKey}
      </div>
      <a href="${process.env.DOWNLOAD_URL}" style="display:block;background:#f97316;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-weight:700">
        Télécharger RSM Pro
      </a>
    </div>
    <div style="margin-top:24px;background:#111116;border-radius:8px;padding:16px">
      <p style="margin:0 0 8px;font-size:0.85rem;color:#8b8b96"><strong style="color:#f1f1f3">Installation :</strong></p>
      <ol style="margin:0;padding-left:20px;color:#d1d1d8;font-size:0.85rem;line-height:1.8">
        <li>Téléchargez et extrayez l'archive</li>
        <li>Lancez <code style="color:#f97316">RustServerManager.exe</code></li>
        <li>Entrez votre clé dans l'onglet Licence</li>
      </ol>
    </div>
  </div>
</body></html>`
  mailer.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`,
    to,
    subject: `${productName} — Votre clé de licence`,
    html,
  }).catch(e => console.error('[email]', e.message))
}

async function notifyDiscord(msg) {
  if (!process.env.DISCORD_WEBHOOK_URL) return
  axios.post(process.env.DISCORD_WEBHOOK_URL, { content: msg }).catch(() => {})
}

async function fulfillOrder(orderId) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
  if (!order || order.status === 'paid') return

  let key = ''
  try { key = await generateLicenseKey(`order#${orderId}`) } catch (e) { console.error('[license]', e.message) }

  db.prepare(`UPDATE orders SET status='paid', license_key=?, paid_at=datetime('now') WHERE id=?`).run(key, orderId)

  if (order.coupon_code) {
    db.prepare('UPDATE coupons SET uses = uses + 1 WHERE code = ?').run(order.coupon_code)
  }

  const customer = db.prepare('SELECT id FROM customers WHERE email = ?').get(order.email)
  if (customer) db.prepare('UPDATE orders SET customer_id = ? WHERE id = ?').run(customer.id, orderId)

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(order.product_id)
  sendDeliveryEmail(order.email, key, product?.name || 'RSM Pro')
  await notifyDiscord(`💰 **Nouvelle vente !** #${orderId}\nProduit: ${product?.name} — ${order.amount.toFixed(2)} €\nClient: ${order.email}\nClé: \`${key}\``)
}

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name = '' } = req.body
  if (!email || !password) return res.status(400).json({ detail: 'Email et mot de passe requis' })
  const bl = db.prepare('SELECT id FROM blacklist WHERE email = ?').get(email.toLowerCase())
  if (bl) return res.status(400).json({ detail: 'Email non autorisé' })
  const exists = db.prepare('SELECT id FROM customers WHERE email = ?').get(email.toLowerCase())
  if (exists) return res.status(400).json({ detail: 'Email déjà utilisé' })
  const hashed = await bcrypt.hash(password, 10)
  const info = db.prepare('INSERT INTO customers (email, password, name) VALUES (?,?,?)').run(email.toLowerCase(), hashed, name)
  const token = signToken({ sub: info.lastInsertRowid, role: 'customer' })
  res.json({ token, customer: { id: info.lastInsertRowid, email: email.toLowerCase(), name } })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  const c = db.prepare('SELECT * FROM customers WHERE email = ?').get(email?.toLowerCase())
  if (!c || !await bcrypt.compare(password, c.password)) return res.status(401).json({ detail: 'Email ou mot de passe incorrect' })
  if (c.banned) return res.status(403).json({ detail: 'Compte banni' })
  const token = signToken({ sub: c.id, role: 'customer' })
  res.json({ token, customer: { id: c.id, email: c.email, name: c.name } })
})

app.post('/api/admin/login', (req, res) => {
  if (req.body.password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ detail: 'Mot de passe incorrect' })
  const token = signToken({ sub: 0, role: 'admin' }, '12h')
  res.json({ token })
})

// ── Products ──────────────────────────────────────────────────────────────────
app.get('/api/products', (req, res) => {
  res.json(db.prepare('SELECT * FROM products WHERE active = 1').all())
})

// ── Coupons ───────────────────────────────────────────────────────────────────
app.post('/api/coupons/check', (req, res) => {
  const { code } = req.body
  const c = db.prepare('SELECT * FROM coupons WHERE code = ? AND active = 1').get(code?.toUpperCase())
  if (!c) return res.status(404).json({ detail: 'Code invalide' })
  if (c.expires_at && new Date(c.expires_at) < new Date()) return res.status(400).json({ detail: 'Code expiré' })
  if (c.max_uses > 0 && c.uses >= c.max_uses) return res.status(400).json({ detail: 'Code épuisé' })
  res.json({ discount_pct: c.discount_pct })
})

// ── Checkout ──────────────────────────────────────────────────────────────────
app.post('/api/checkout/create', async (req, res) => {
  const { product_slug, email, coupon_code = '', payment_method = 'stripe' } = req.body
  if (!email) return res.status(400).json({ detail: 'Email requis' })

  const bl = db.prepare('SELECT id FROM blacklist WHERE email = ?').get(email.toLowerCase())
  if (bl) return res.status(403).json({ detail: 'Accès refusé' })

  const product = db.prepare('SELECT * FROM products WHERE slug = ? AND active = 1').get(product_slug)
  if (!product) return res.status(404).json({ detail: 'Produit introuvable' })

  let discount = 0, usedCoupon = ''
  if (coupon_code) {
    const c = db.prepare('SELECT * FROM coupons WHERE code = ? AND active = 1').get(coupon_code.toUpperCase())
    if (c && (!c.expires_at || new Date(c.expires_at) > new Date()) && (c.max_uses === 0 || c.uses < c.max_uses)) {
      discount = Math.round(product.price * c.discount_pct) / 100
      usedCoupon = c.code
    }
  }

  const amount = Math.max(0, Math.round((product.price - discount) * 100) / 100)
  const info = db.prepare('INSERT INTO orders (product_id, email, amount, currency, payment_method, coupon_code, discount) VALUES (?,?,?,?,?,?,?)').run(product.id, email.toLowerCase(), amount, product.currency, payment_method, usedCoupon, discount)
  const orderId = info.lastInsertRowid

  if (payment_method === 'stripe') {
    if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ detail: 'Stripe non configuré' })
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: product.currency, product_data: { name: product.name }, unit_amount: Math.round(amount * 100) }, quantity: 1 }],
      mode: 'payment',
      customer_email: email,
      metadata: { order_id: String(orderId) },
      success_url: `${process.env.FRONTEND_URL}/success?order=${orderId}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout?cancelled=1`,
    })
    return res.json({ checkout_url: session.url, order_id: orderId })
  }

  if (payment_method === 'paypal') {
    return res.json({ order_id: orderId, amount, currency: product.currency.toUpperCase(), paypal_client_id: process.env.PAYPAL_CLIENT_ID })
  }

  res.status(400).json({ detail: 'Méthode de paiement inconnue' })
})

app.post('/api/checkout/paypal-capture', async (req, res) => {
  const { order_id, paypal_order_id } = req.body
  const base = process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'
  const tok = await axios.post(`${base}/v1/oauth2/token`, 'grant_type=client_credentials', {
    auth: { username: process.env.PAYPAL_CLIENT_ID, password: process.env.PAYPAL_CLIENT_SECRET }
  })
  const capture = await axios.post(`${base}/v2/checkout/orders/${paypal_order_id}/capture`, {}, {
    headers: { Authorization: `Bearer ${tok.data.access_token}` }
  })
  if (![200, 201].includes(capture.status)) return res.status(400).json({ detail: 'Capture PayPal échouée' })
  await fulfillOrder(order_id)
  res.json({ ok: true })
})

// ── Stripe webhook ─────────────────────────────────────────────────────────────
app.post('/api/webhooks/stripe', async (req, res) => {
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)
  } catch { return res.status(400).send('Invalid signature') }
  if (event.type === 'checkout.session.completed') {
    const orderId = parseInt(event.data.object.metadata?.order_id)
    if (orderId) await fulfillOrder(orderId)
  }
  res.json({ ok: true })
})

// ── Order lookup ───────────────────────────────────────────────────────────────
app.get('/api/orders/:id', (req, res) => {
  const o = db.prepare('SELECT o.*, p.name as product_name FROM orders o JOIN products p ON p.id = o.product_id WHERE o.id = ?').get(req.params.id)
  if (!o) return res.status(404).json({ detail: 'Commande introuvable' })
  res.json({ id: o.id, status: o.status, email: o.email, amount: o.amount, license_key: o.status === 'paid' ? o.license_key : null, product_name: o.product_name, paid_at: o.paid_at })
})

// ── Customer dashboard ─────────────────────────────────────────────────────────
app.get('/api/me', authMiddleware, (req, res) => {
  const c = db.prepare('SELECT id, email, name FROM customers WHERE id = ?').get(req.user.sub)
  if (!c) return res.status(404).json({ detail: 'Introuvable' })
  res.json(c)
})

app.get('/api/me/orders', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT o.*, p.name as product_name FROM orders o JOIN products p ON p.id = o.product_id WHERE o.customer_id = ? ORDER BY o.created_at DESC').all(req.user.sub)
  res.json(rows.map(o => ({ id: o.id, product_name: o.product_name, amount: o.amount, status: o.status, license_key: o.status === 'paid' ? o.license_key : null, paid_at: o.paid_at })))
})

app.post('/api/me/resend-key/:id', authMiddleware, (req, res) => {
  const o = db.prepare('SELECT o.*, p.name as product_name FROM orders o JOIN products p ON p.id = o.product_id WHERE o.id = ? AND o.customer_id = ?').get(req.params.id, req.user.sub)
  if (!o || o.status !== 'paid') return res.status(404).json({ detail: 'Introuvable' })
  sendDeliveryEmail(o.email, o.license_key, o.product_name)
  res.json({ ok: true })
})

// ── Admin ──────────────────────────────────────────────────────────────────────
app.get('/api/admin/stats', adminMiddleware, (req, res) => {
  const revenue  = db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM orders WHERE status='paid'").get().v
  const paid     = db.prepare("SELECT COUNT(*) as v FROM orders WHERE status='paid'").get().v
  const customers = db.prepare("SELECT COUNT(*) as v FROM customers").get().v
  const pending  = db.prepare("SELECT COUNT(*) as v FROM orders WHERE status='pending'").get().v
  res.json({ revenue, paid_orders: paid, customers, pending_orders: pending })
})

app.get('/api/admin/orders', adminMiddleware, (req, res) => {
  const page = parseInt(req.query.page || '1')
  const rows = db.prepare('SELECT o.*, p.name as product FROM orders o JOIN products p ON p.id = o.product_id ORDER BY o.created_at DESC LIMIT 50 OFFSET ?').all((page - 1) * 50)
  res.json(rows)
})

app.post('/api/admin/orders/:id/refund', adminMiddleware, async (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  if (!o) return res.status(404).json({ detail: 'Introuvable' })
  if (o.license_key) {
    axios.delete(`${process.env.LICENSE_SERVER_URL}/admin/keys/${o.license_key}`, { headers: { 'x-admin-secret': process.env.LICENSE_ADMIN_SECRET } }).catch(() => {})
  }
  db.prepare("UPDATE orders SET status='refunded' WHERE id=?").run(o.id)
  res.json({ ok: true })
})

app.get('/api/admin/customers', adminMiddleware, (req, res) => {
  res.json(db.prepare('SELECT id, email, name, banned, created_at FROM customers ORDER BY created_at DESC').all())
})

app.post('/api/admin/customers/:id/ban', adminMiddleware, (req, res) => {
  db.prepare('UPDATE customers SET banned=1 WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

app.post('/api/admin/customers/:id/unban', adminMiddleware, (req, res) => {
  db.prepare('UPDATE customers SET banned=0 WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

app.get('/api/admin/coupons', adminMiddleware, (req, res) => {
  res.json(db.prepare('SELECT * FROM coupons ORDER BY id DESC').all())
})

app.post('/api/admin/coupons', adminMiddleware, (req, res) => {
  const { code, discount_pct, max_uses = 0, expires_in_days = 0 } = req.body
  const expires_at = expires_in_days > 0 ? new Date(Date.now() + expires_in_days * 86400000).toISOString() : null
  db.prepare('INSERT INTO coupons (code, discount_pct, max_uses, expires_at) VALUES (?,?,?,?)').run(code.toUpperCase(), discount_pct, max_uses, expires_at)
  res.json({ ok: true })
})

app.delete('/api/admin/coupons/:id', adminMiddleware, (req, res) => {
  db.prepare('UPDATE coupons SET active=0 WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

app.get('/api/admin/blacklist', adminMiddleware, (req, res) => {
  res.json(db.prepare('SELECT * FROM blacklist').all())
})

app.post('/api/admin/blacklist', adminMiddleware, (req, res) => {
  const { email, reason = '' } = req.body
  db.prepare('INSERT OR IGNORE INTO blacklist (email, reason) VALUES (?,?)').run(email.toLowerCase(), reason)
  res.json({ ok: true })
})

app.delete('/api/admin/blacklist/:id', adminMiddleware, (req, res) => {
  db.prepare('DELETE FROM blacklist WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

app.get('/health', (req, res) => res.json({ status: 'ok' }))

// ── Serve React build ──────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'frontend', 'dist')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html')))

app.listen(PORT, () => console.log(`RSM Shop running on port ${PORT}`))
