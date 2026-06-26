process.on('uncaughtException', e => { require('fs').appendFileSync(__dirname + '/crash.log', new Date().toISOString() + ' ' + e.stack + '\n') })
require('dotenv').config()
const express    = require('express')
const path       = require('path')
const cors       = require('cors')
const bcrypt     = require('bcryptjs')
const jwt        = require('jsonwebtoken')
let _stripe = null
const getStripe = () => { if (!_stripe && process.env.STRIPE_SECRET_KEY) _stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); return _stripe }
const nodemailer = require('nodemailer')
const axios      = require('axios')
const { db, init } = require('./db')
const { startBot, getBotStats, getTextChannels, getOpenTickets, closeTicket, sendEmbed, sendTicketEmbed, triggerReleaseAnnounce, getWelcomeConfig, setWelcomeConfig } = require('./bot')

const app  = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

app.use(cors())
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }))
app.use(express.json())

const signToken = (payload, expiresIn = '7d') => jwt.sign(payload, JWT_SECRET, { expiresIn })

const authMiddleware = (req, res, next) => {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ detail: 'Non authentifié' })
  try { req.user = jwt.verify(h.slice(7), JWT_SECRET); next() }
  catch { res.status(401).json({ detail: 'Token invalide' }) }
}

const adminMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user?.role !== 'admin') return res.status(403).json({ detail: 'Admin requis' })
    next()
  })
}

const SLUG_MAX_MACHINES = { '1m': 1, '3m': 2, 'lifetime': 4 }

async function generateLicenseKey(notes = '', maxMachines = 2, tier = 'pro') {
  const r = await axios.post(
    `${process.env.LICENSE_SERVER_URL}/admin/keys`,
    { count: 1, tier, notes, max_machines: maxMachines },
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
  const html = `<!DOCTYPE html><html><body style="background:#0d0d0f;color:#f1f1f3;font-family:Inter,sans-serif;padding:40px 20px">
  <div style="max-width:520px;margin:0 auto">
    <h1 style="color:#f97316;text-align:center">Rust Server Manager Pro</h1>
    <p style="text-align:center;color:#8b8b96">Merci pour votre achat !</p>
    <div style="background:rgba(249,115,22,0.06);border:1px solid rgba(249,115,22,0.2);border-radius:12px;padding:24px;margin-top:24px">
      <p style="color:#8b8b96;font-size:0.85rem;margin:0 0 8px">Produit</p>
      <p style="margin:0 0 20px;font-weight:600">${productName}</p>
      <p style="color:#8b8b96;font-size:0.85rem;margin:0 0 8px">Clé de licence</p>
      <div style="background:#1a1a1f;border:1px solid rgba(249,115,22,0.3);border-radius:8px;padding:14px;text-align:center;font-family:monospace;font-size:1.1rem;color:#f97316;letter-spacing:0.1em;margin-bottom:20px">${licenseKey}</div>
      <a href="${process.env.DOWNLOAD_URL}" style="display:block;background:#f97316;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-weight:700">Télécharger RSM Pro</a>
    </div>
  </div></body></html>`
  mailer.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`,
    to, subject: `${productName} — Votre clé de licence`, html,
  }).catch(e => console.error('[email]', e.message))
}

async function notifyDiscord(msg) {
  if (!process.env.DISCORD_WEBHOOK_URL) return
  axios.post(process.env.DISCORD_WEBHOOK_URL, { content: msg }).catch(() => {})
}

async function fulfillOrder(orderId) {
  const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderId])
  if (!order || order.status === 'paid') return
  const product = await db.get('SELECT * FROM products WHERE id = ?', [order.product_id])
  const maxMachines = SLUG_MAX_MACHINES[product?.slug] || 2
  let key = ''
  try { key = await generateLicenseKey(`order#${orderId}`, maxMachines, product?.slug || 'pro') } catch (e) { console.error('[license]', e.message) }
  await db.run(`UPDATE orders SET status='paid', license_key=?, paid_at=NOW() WHERE id=?`, [key, orderId])
  if (order.coupon_code) await db.run('UPDATE coupons SET uses = uses + 1 WHERE code = ?', [order.coupon_code])
  const customer = await db.get('SELECT id FROM customers WHERE email = ?', [order.email])
  if (customer) await db.run('UPDATE orders SET customer_id = ? WHERE id = ?', [customer.id, orderId])
  sendDeliveryEmail(order.email, key, product?.name || 'RSM Pro')
  await notifyDiscord(`💰 **Nouvelle vente !** #${orderId}\nProduit: ${product?.name} — ${order.amount.toFixed(2)} €\nClient: ${order.email}\nClé: \`${key}\``)
}

// ── Auth
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name = '' } = req.body
    if (!email || !password) return res.status(400).json({ detail: 'Email et mot de passe requis' })
    const bl = await db.get('SELECT id FROM blacklist WHERE email = ?', [email.toLowerCase()])
    if (bl) return res.status(400).json({ detail: 'Email non autorisé' })
    const exists = await db.get('SELECT id FROM customers WHERE email = ?', [email.toLowerCase()])
    if (exists) return res.status(400).json({ detail: 'Email déjà utilisé' })
    const hashed = await bcrypt.hash(password, 10)
    const info = await db.run('INSERT INTO customers (email, password, name) VALUES (?,?,?)', [email.toLowerCase(), hashed, name])
    const token = signToken({ sub: info.insertId, role: 'customer' })
    res.json({ token, customer: { id: info.insertId, email: email.toLowerCase(), name } })
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const c = await db.get('SELECT * FROM customers WHERE email = ?', [email?.toLowerCase()])
    if (!c || !await bcrypt.compare(password, c.password)) return res.status(401).json({ detail: 'Email ou mot de passe incorrect' })
    if (c.banned) return res.status(403).json({ detail: 'Compte banni' })
    const token = signToken({ sub: c.id, role: 'customer' })
    res.json({ token, customer: { id: c.id, email: c.email, name: c.name } })
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.post('/api/admin/login', (req, res) => {
  if (req.body.password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ detail: 'Mot de passe incorrect' })
  const token = signToken({ sub: 0, role: 'admin' }, '12h')
  res.json({ token })
})

// ── Products
let _versionCache = { value: process.env.APP_VERSION || 'v1.1.30', at: 0 }
app.get('/api/version', async (req, res) => {
  const TTL = 3600_000
  if (Date.now() - _versionCache.at < TTL) return res.json({ version: _versionCache.value })
  try {
    const r = await axios.get('https://api.github.com/repos/DumePaoli/Rust-Server-Manger2/releases/latest', { headers: { 'User-Agent': 'RSM-Site' } })
    if (r.data.tag_name) _versionCache = { value: r.data.tag_name, at: Date.now() }
  } catch {}
  res.json({ version: _versionCache.value })
})

app.get('/api/products', async (req, res) => {
  try { res.json(await db.all('SELECT * FROM products WHERE active = 1')) }
  catch(e) { res.status(500).json({ detail: e.message }) }
})

// ── Coupons
app.post('/api/coupons/check', async (req, res) => {
  try {
    const { code } = req.body
    const c = await db.get('SELECT * FROM coupons WHERE code = ? AND active = 1', [code?.toUpperCase()])
    if (!c) return res.status(404).json({ detail: 'Code invalide' })
    if (c.expires_at && new Date(c.expires_at) < new Date()) return res.status(400).json({ detail: 'Code expiré' })
    if (c.max_uses > 0 && c.uses >= c.max_uses) return res.status(400).json({ detail: 'Code épuisé' })
    res.json({ discount_pct: c.discount_pct })
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

// ── Checkout
app.post('/api/checkout/create', authMiddleware, async (req, res) => {
  try {
    const { product_slug, coupon_code = '', payment_method = 'stripe' } = req.body
    const customer = await db.get('SELECT * FROM customers WHERE id = ?', [req.user.sub])
    if (!customer) return res.status(401).json({ detail: 'Compte introuvable' })
    const email = customer.email
    const bl = await db.get('SELECT id FROM blacklist WHERE email = ?', [email.toLowerCase()])
    if (bl) return res.status(403).json({ detail: 'Accès refusé' })
    const product = await db.get('SELECT * FROM products WHERE slug = ? AND active = 1', [product_slug])
    if (!product) return res.status(404).json({ detail: 'Produit introuvable' })
    let discount = 0, usedCoupon = ''
    if (coupon_code) {
      const c = await db.get('SELECT * FROM coupons WHERE code = ? AND active = 1', [coupon_code.toUpperCase()])
      if (c && (!c.expires_at || new Date(c.expires_at) > new Date()) && (c.max_uses === 0 || c.uses < c.max_uses)) {
        discount = Math.round(product.price * c.discount_pct) / 100
        usedCoupon = c.code
      }
    }
    const amount = Math.max(0, Math.round((product.price - discount) * 100) / 100)
    const info = await db.run(
      'INSERT INTO orders (product_id, email, amount, currency, payment_method, coupon_code, discount, customer_id) VALUES (?,?,?,?,?,?,?,?)',
      [product.id, email.toLowerCase(), amount, product.currency, payment_method, usedCoupon, discount, customer.id]
    )
    const orderId = info.insertId
    if (amount === 0) {
      await fulfillOrder(orderId)
      return res.json({ order_id: orderId, free: true })
    }
    if (payment_method === 'stripe') {
      if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ detail: 'Stripe non configuré' })
      const session = await getStripe().checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price_data: { currency: product.currency, product_data: { name: product.name }, unit_amount: Math.round(amount * 100) }, quantity: 1 }],
        mode: 'payment', customer_email: email,
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
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.post('/api/checkout/paypal-capture', async (req, res) => {
  try {
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
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.post('/api/webhooks/stripe', async (req, res) => {
  let event
  try { event = getStripe().webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET) }
  catch { return res.status(400).send('Invalid signature') }
  if (event.type === 'checkout.session.completed') {
    const orderId = parseInt(event.data.object.metadata?.order_id)
    if (orderId) await fulfillOrder(orderId)
  }
  res.json({ ok: true })
})

app.get('/api/orders/:id', async (req, res) => {
  try {
    const o = await db.get('SELECT o.*, p.name as product_name FROM orders o JOIN products p ON p.id = o.product_id WHERE o.id = ?', [req.params.id])
    if (!o) return res.status(404).json({ detail: 'Commande introuvable' })
    res.json({ id: o.id, status: o.status, email: o.email, amount: o.amount, license_key: o.status === 'paid' ? o.license_key : null, product_name: o.product_name, paid_at: o.paid_at })
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const c = await db.get('SELECT id, email, name FROM customers WHERE id = ?', [req.user.sub])
    if (!c) return res.status(404).json({ detail: 'Introuvable' })
    res.json(c)
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.get('/api/me/orders', authMiddleware, async (req, res) => {
  try {
    const rows = await db.all('SELECT o.*, p.name as product_name FROM orders o JOIN products p ON p.id = o.product_id WHERE o.customer_id = ? ORDER BY o.created_at DESC', [req.user.sub])
    res.json(rows.map(o => ({ id: o.id, product_name: o.product_name, amount: o.amount, status: o.status, license_key: o.status === 'paid' ? o.license_key : null, paid_at: o.paid_at })))
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.post('/api/me/resend-key/:id', authMiddleware, async (req, res) => {
  try {
    const o = await db.get('SELECT o.*, p.name as product_name FROM orders o JOIN products p ON p.id = o.product_id WHERE o.id = ? AND o.customer_id = ?', [req.params.id, req.user.sub])
    if (!o || o.status !== 'paid') return res.status(404).json({ detail: 'Introuvable' })
    sendDeliveryEmail(o.email, o.license_key, o.product_name)
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

// ── Admin
app.get('/api/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const revenue   = await db.get("SELECT COALESCE(SUM(amount),0) as v FROM orders WHERE status='paid'")
    const paid      = await db.get("SELECT COUNT(*) as v FROM orders WHERE status='paid'")
    const customers = await db.get("SELECT COUNT(*) as v FROM customers")
    const pending   = await db.get("SELECT COUNT(*) as v FROM orders WHERE status='pending'")
    res.json({ revenue: revenue.v, paid_orders: paid.v, customers: customers.v, pending_orders: pending.v })
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.get('/api/admin/orders', adminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1')
    res.json(await db.all('SELECT o.*, p.name as product FROM orders o JOIN products p ON p.id = o.product_id ORDER BY o.created_at DESC LIMIT 50 OFFSET ?', [(page - 1) * 50]))
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.post('/api/admin/orders/:id/refund', adminMiddleware, async (req, res) => {
  try {
    const o = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id])
    if (!o) return res.status(404).json({ detail: 'Introuvable' })
    if (o.license_key) axios.delete(`${process.env.LICENSE_SERVER_URL}/admin/keys/${o.license_key}`, { headers: { 'x-admin-secret': process.env.LICENSE_ADMIN_SECRET } }).catch(() => {})
    await db.run("UPDATE orders SET status='refunded' WHERE id=?", [o.id])
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.get('/api/admin/customers', adminMiddleware, async (req, res) => {
  try { res.json(await db.all('SELECT id, email, name, banned, created_at FROM customers ORDER BY created_at DESC')) }
  catch(e) { res.status(500).json({ detail: e.message }) }
})

app.post('/api/admin/customers/:id/ban', adminMiddleware, async (req, res) => {
  try { await db.run('UPDATE customers SET banned=1 WHERE id=?', [req.params.id]); res.json({ ok: true }) }
  catch(e) { res.status(500).json({ detail: e.message }) }
})

app.post('/api/admin/customers/:id/unban', adminMiddleware, async (req, res) => {
  try { await db.run('UPDATE customers SET banned=0 WHERE id=?', [req.params.id]); res.json({ ok: true }) }
  catch(e) { res.status(500).json({ detail: e.message }) }
})

app.get('/api/admin/coupons', adminMiddleware, async (req, res) => {
  try { res.json(await db.all('SELECT * FROM coupons ORDER BY id DESC')) }
  catch(e) { res.status(500).json({ detail: e.message }) }
})

app.post('/api/admin/coupons', adminMiddleware, async (req, res) => {
  try {
    const { code, discount_pct, max_uses = 0, expires_in_days = 0 } = req.body
    const expires_at = expires_in_days > 0 ? new Date(Date.now() + expires_in_days * 86400000).toISOString().slice(0, 19).replace('T', ' ') : null
    await db.run('INSERT INTO coupons (code, discount_pct, max_uses, expires_at) VALUES (?,?,?,?)', [code.toUpperCase(), discount_pct, max_uses, expires_at])
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.delete('/api/admin/coupons/:id', adminMiddleware, async (req, res) => {
  try { await db.run('UPDATE coupons SET active=0 WHERE id=?', [req.params.id]); res.json({ ok: true }) }
  catch(e) { res.status(500).json({ detail: e.message }) }
})

app.get('/api/admin/blacklist', adminMiddleware, async (req, res) => {
  try { res.json(await db.all('SELECT * FROM blacklist')) }
  catch(e) { res.status(500).json({ detail: e.message }) }
})

app.post('/api/admin/blacklist', adminMiddleware, async (req, res) => {
  try {
    const { email, reason = '' } = req.body
    await db.run('INSERT IGNORE INTO blacklist (email, reason) VALUES (?,?)', [email.toLowerCase(), reason])
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.delete('/api/admin/blacklist/:id', adminMiddleware, async (req, res) => {
  try { await db.run('DELETE FROM blacklist WHERE id=?', [req.params.id]); res.json({ ok: true }) }
  catch(e) { res.status(500).json({ detail: e.message }) }
})

app.post('/api/admin/generate-license', adminMiddleware, async (req, res) => {
  try {
    const { notes = '' } = req.body
    const key = await generateLicenseKey(notes || 'admin-manual')
    await db.run('INSERT INTO manual_licenses (license_key, notes) VALUES (?,?)', [key, notes])
    res.json({ key })
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.get('/api/admin/manual-licenses', adminMiddleware, async (req, res) => {
  try { res.json(await db.all('SELECT * FROM manual_licenses ORDER BY created_at DESC')) }
  catch(e) { res.status(500).json({ detail: e.message }) }
})

// ── Bot control routes ──────────────────────────────────────────────────────
app.get('/api/admin/bot/stats', adminMiddleware, (req, res) => {
  try { res.json(getBotStats()) }
  catch(e) { res.status(500).json({ detail: e.message }) }
})

app.get('/api/admin/bot/channels', adminMiddleware, async (req, res) => {
  try { res.json(await getTextChannels()) }
  catch(e) { res.status(500).json({ detail: e.message }) }
})

app.get('/api/admin/bot/tickets', adminMiddleware, (req, res) => {
  try { res.json(getOpenTickets()) }
  catch(e) { res.status(500).json({ detail: e.message }) }
})

app.delete('/api/admin/bot/tickets/:id', adminMiddleware, async (req, res) => {
  try { await closeTicket(req.params.id); res.json({ ok: true }) }
  catch(e) { res.status(500).json({ detail: e.message }) }
})

app.post('/api/admin/bot/send-embed', adminMiddleware, async (req, res) => {
  try {
    const { channelId, title, description, color, footer, image, thumbnail } = req.body
    if (!channelId || !description) return res.status(400).json({ detail: 'channelId et description requis' })
    await sendEmbed(channelId, { title, description, color, footer, image, thumbnail })
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.post('/api/admin/bot/send-ticket-embed', adminMiddleware, async (req, res) => {
  try {
    const { channelId, title, description, color, footer, image, thumbnail } = req.body
    if (!channelId) return res.status(400).json({ detail: 'channelId requis' })
    await sendTicketEmbed(channelId, { title, description, color, footer, image, thumbnail })
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.post('/api/admin/bot/announce-release', adminMiddleware, async (req, res) => {
  try {
    const { tag_name, body, html_url, published_at } = req.body
    if (!tag_name) return res.status(400).json({ detail: 'tag_name requis' })
    await triggerReleaseAnnounce({
      tag_name,
      body: body || '',
      html_url: html_url || `https://github.com/DumePaoli/Rust-Server-Manger2/releases/tag/${tag_name}`,
      published_at: published_at || new Date().toISOString()
    })
    res.json({ ok: true })
  } catch(e) {
    res.status(500).json({ detail: e.message })
  }
})

app.get('/api/admin/hwids', adminMiddleware, async (req, res) => {
  try {
    const headers = { 'x-admin-secret': process.env.LICENSE_ADMIN_SECRET }
    const r = await axios.get(`${process.env.LICENSE_SERVER_URL}/admin/keys`, { headers, timeout: 15000 })
    const keys = Array.isArray(r.data) ? r.data : (r.data.keys || [])
    const detailed = await Promise.all(keys.map(async k => {
      let activations = []
      try {
        const ar = await axios.get(`${process.env.LICENSE_SERVER_URL}/admin/keys/${k.key}/activations`, { headers, timeout: 10000 })
        activations = ar.data || []
      } catch {}
      return {
        key: k.key,
        activations,
        activation_count: k.activation_count ?? activations.length,
        active: k.active ?? true,
        notes: k.notes || '',
        tier: k.tier || null,
        created_at: k.created_at || null,
      }
    }))
    res.json(detailed)
  } catch(e) {
    res.status(500).json({ detail: e.response?.data?.message || e.message })
  }
})

app.post('/api/admin/hwids/:key/reset', adminMiddleware, async (req, res) => {
  try {
    await axios.delete(
      `${process.env.LICENSE_SERVER_URL}/admin/keys/${req.params.key}/activations`,
      { headers: { 'x-admin-secret': process.env.LICENSE_ADMIN_SECRET }, timeout: 15000 }
    )
    res.json({ ok: true })
  } catch(e) {
    res.status(e.response?.status || 500).json({ detail: e.response?.data?.message || e.response?.data?.detail || e.message })
  }
})

app.delete('/api/admin/keys/:key/activations', adminMiddleware, async (req, res) => {
  try {
    await axios.delete(
      `${process.env.LICENSE_SERVER_URL}/admin/keys/${req.params.key}/activations`,
      { headers: { 'x-admin-secret': process.env.LICENSE_ADMIN_SECRET }, timeout: 15000 }
    )
    res.json({ ok: true })
  } catch(e) {
    res.status(e.response?.status || 500).json({ detail: e.response?.data?.message || e.response?.data?.detail || e.message })
  }
})

app.delete('/api/admin/keys/:key', adminMiddleware, async (req, res) => {
  try {
    const key = req.params.key
    await axios.delete(
      `${process.env.LICENSE_SERVER_URL}/admin/keys/${key}`,
      { headers: { 'x-admin-secret': process.env.LICENSE_ADMIN_SECRET }, timeout: 15000 }
    )
    await db.run("UPDATE orders SET status='revoked' WHERE license_key = ?", [key])
    res.json({ ok: true })
  } catch(e) {
    res.status(e.response?.status || 500).json({ detail: e.response?.data?.message || e.response?.data?.detail || e.message })
  }
})

app.get('/api/admin/bot/welcome-config', adminMiddleware, (req, res) => {
  res.json(getWelcomeConfig())
})
app.post('/api/admin/bot/welcome-config', adminMiddleware, (req, res) => {
  try { setWelcomeConfig(req.body); res.json({ ok: true }) }
  catch(e) { res.status(500).json({ detail: e.message }) }
})

// Public status endpoint
app.get('/api/status', async (req, res) => {
  const botStats = getBotStats()
  let licenseOk = false
  try {
    await axios.get(`${process.env.LICENSE_SERVER_URL || 'https://rsm-license-server.fly.dev'}/health`, { timeout: 5000 })
    licenseOk = true
  } catch {}
  res.json({
    site: true,
    bot: botStats.online || false,
    botTag: botStats.tag || null,
    memberCount: botStats.memberCount || null,
    licenseServer: licenseOk,
  })
})

app.get('/api/admin/bot/debug', adminMiddleware, (req, res) => {
  const { getBotDebug } = require('./bot')
  res.json(getBotDebug())
})

app.get('/health', (req, res) => res.json({ status: 'ok' }))
app.get("/download", (req, res) => {
  const url = process.env.DOWNLOAD_URL || "https://github.com/DumePaoli/Rust-Server-Manger2/releases/latest/download/RustServerManager.exe"
  res.redirect(302, url)
})


app.use(express.static(path.join(__dirname, 'frontend', 'dist')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html')))

init().then(() => {
  app.listen(PORT, () => console.log(`RSM Shop running on port ${PORT}`))
  startBot()
}).catch(e => {
  console.error('DB init failed:', e.message)
  require('fs').appendFileSync(__dirname + '/crash.log', new Date().toISOString() + ' DB INIT: ' + e.stack + '\n')
  process.exit(1)
})
