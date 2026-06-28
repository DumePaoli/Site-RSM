process.on('uncaughtException', e => { require('fs').appendFileSync(__dirname + '/crash.log', new Date().toISOString() + ' ' + e.stack + '\n') })
require('dotenv').config()
const express    = require('express')
const path       = require('path')
const cors       = require('cors')
const bcrypt     = require('bcryptjs')
const jwt        = require('jsonwebtoken')
const rateLimit  = require('express-rate-limit')
let _stripe = null
const getStripe = () => { if (!_stripe && process.env.STRIPE_SECRET_KEY) _stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); return _stripe }
const nodemailer = require('nodemailer')
const axios      = require('axios')
const { db, init } = require('./db')
const { startBot, getBotStats, getTextChannels, getOpenTickets, closeTicket, sendEmbed, sendTicketEmbed, sendVerifyEmbed, triggerReleaseAnnounce, getWelcomeConfig, setWelcomeConfig } = require('./bot')

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

async function generateLicenseKey(notes = '', maxMachines = 2, tier = 'pro', expiresInSeconds = 0) {
  const body = { count: 1, tier, notes, max_machines: maxMachines }
  if (expiresInSeconds > 0) body.expires_at = Math.floor(Date.now() / 1000) + expiresInSeconds
  const r = await axios.post(
    `${process.env.LICENSE_SERVER_URL}/admin/keys`,
    body,
    { headers: { 'x-admin-secret': process.env.LICENSE_ADMIN_SECRET }, timeout: 15000 }
  )
  return r.data.keys[0]
}

const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465')
const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
})

function sendDeliveryEmail(to, licenseKey, productName) {
  if (!process.env.SMTP_HOST) return
  const SITE = process.env.SITE_URL || 'https://rustservermanagerpro.com'
  const html = `<!DOCTYPE html><html><body style="background:#0d0d0f;color:#f1f1f3;font-family:Inter,sans-serif;padding:40px 20px;margin:0">
  <div style="max-width:520px;margin:0 auto">
    <div style="text-align:center;margin-bottom:24px">
      <img src="${SITE}/logo.png" alt="RSM Pro" style="height:64px;width:auto" />
    </div>
    <h1 style="color:#c12814;text-align:center;margin:0 0 6px;font-size:1.5rem">Rust Server Manager Pro</h1>
    <p style="text-align:center;color:#8b8b96;margin:0 0 24px">Merci pour votre achat !</p>
    <div style="background:rgba(193,40,20,0.06);border:1px solid rgba(193,40,20,0.25);border-radius:12px;padding:24px">
      <p style="color:#8b8b96;font-size:0.85rem;margin:0 0 4px">Produit</p>
      <p style="margin:0 0 20px;font-weight:600;color:#fff">${productName}</p>
      <p style="color:#8b8b96;font-size:0.85rem;margin:0 0 8px">Clé de licence</p>
      <div style="background:#161a1c;border:1px solid rgba(193,40,20,0.35);border-radius:8px;padding:14px;text-align:center;font-family:monospace;font-size:1.1rem;color:#c12814;letter-spacing:0.1em;margin-bottom:20px">${licenseKey}</div>
      <a href="${process.env.DOWNLOAD_URL || SITE + '/download'}" style="display:block;background:#c12814;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-weight:700;font-size:1rem;margin-bottom:12px">Télécharger RSM Pro</a>
      <a href="https://discord.gg/XxTRZwB3ta" style="display:block;background:#5865F2;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-weight:700;font-size:1rem">Rejoindre le Discord</a>
    </div>
    <p style="text-align:center;color:#4c4c4d;font-size:0.75rem;margin-top:24px">© ${new Date().getFullYear()} Rust Server Manager Pro</p>
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

async function logAdminAction(action, details = '') {
  await db.run('INSERT INTO admin_logs (action, details) VALUES (?,?)', [action, details]).catch(() => {})
}

function sendAdminOrderEmail(orderId, email, productName, amount) {
  if (!process.env.SMTP_HOST || !process.env.ADMIN_EMAIL) return
  const html = `<!DOCTYPE html><html><body style="background:#0d0d0f;color:#f1f1f3;font-family:Inter,sans-serif;padding:40px 20px;margin:0"><div style="max-width:520px;margin:0 auto"><h2 style="color:#c12814">💰 Nouvelle commande #${orderId}</h2><p style="color:#8b8b96">Un nouveau paiement a été reçu.</p><table style="width:100%;border-collapse:collapse;margin-top:16px"><tr><td style="color:#8b8b96;padding:6px 0">Produit</td><td style="color:#fff;font-weight:600">${productName}</td></tr><tr><td style="color:#8b8b96;padding:6px 0">Montant</td><td style="color:#c12814;font-weight:700">${Number(amount).toFixed(2)} €</td></tr><tr><td style="color:#8b8b96;padding:6px 0">Client</td><td style="color:#fff">${email}</td></tr></table></div></body></html>`
  mailer.sendMail({ from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`, to: process.env.ADMIN_EMAIL, subject: `[RSM Pro] Nouvelle commande #${orderId} — ${Number(amount).toFixed(2)} €`, html }).catch(() => {})
}

function sendPasswordResetEmail(to, token) {
  if (!process.env.SMTP_HOST) return
  const SITE = process.env.SITE_URL || 'https://rustservermanagerpro.com'
  const link = `${SITE}/reset-password?token=${token}`
  const html = `<!DOCTYPE html><html><body style="background:#0d0d0f;color:#f1f1f3;font-family:Inter,sans-serif;padding:40px 20px;margin:0"><div style="max-width:520px;margin:0 auto"><div style="text-align:center;margin-bottom:24px"><img src="${SITE}/logo.png" alt="RSM Pro" style="height:64px;width:auto"/></div><h1 style="color:#c12814;text-align:center;margin:0 0 6px">Réinitialisation du mot de passe</h1><p style="text-align:center;color:#8b8b96;margin:0 0 24px">Clique sur le bouton ci-dessous pour définir un nouveau mot de passe. Ce lien expire dans 1 heure.</p><div style="background:rgba(193,40,20,0.06);border:1px solid rgba(193,40,20,0.25);border-radius:12px;padding:24px;text-align:center"><a href="${link}" style="display:inline-block;background:#c12814;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:1rem">Réinitialiser le mot de passe</a><p style="color:#4c4c4d;font-size:0.75rem;margin-top:16px">Si tu n'as pas demandé cette réinitialisation, ignore cet email.</p></div><p style="text-align:center;color:#4c4c4d;font-size:0.75rem;margin-top:24px">© ${new Date().getFullYear()} Rust Server Manager Pro</p></div></body></html>`
  mailer.sendMail({ from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`, to, subject: 'Réinitialisation de ton mot de passe RSM Pro', html }).catch(e => console.error('[reset-email]', e.message))
}

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  handler: (req, res) => {
    notifyDiscord(`🚨 **Brute force détecté** sur /api/auth/login\nIP: \`${req.ip}\`\nEmail tenté: \`${req.body?.email || '?'}\``)
    res.status(429).json({ detail: 'Trop de tentatives, réessaie dans 15 minutes.' })
  }
})
const checkoutLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, message: { detail: 'Trop de requêtes, réessaie dans une minute.' } })
const passwordResetLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { detail: 'Trop de tentatives, réessaie dans une heure.' } })

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
  sendAdminOrderEmail(orderId, order.email, product?.name || 'RSM Pro', order.amount)
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

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body
    const c = await db.get('SELECT * FROM customers WHERE email = ?', [email?.toLowerCase()])
    if (!c || !await bcrypt.compare(password, c.password)) return res.status(401).json({ detail: 'Email ou mot de passe incorrect' })
    if (c.banned) return res.status(403).json({ detail: 'Compte banni' })
    const token = signToken({ sub: c.id, role: 'customer' })
    res.json({ token, customer: { id: c.id, email: c.email, name: c.name } })
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.post('/api/auth/forgot-password', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.body
    const customer = await db.get('SELECT id FROM customers WHERE email = ?', [email?.toLowerCase()])
    if (customer) {
      const token = require('crypto').randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + 3600000).toISOString().slice(0, 19).replace('T', ' ')
      await db.run('DELETE FROM password_reset_tokens WHERE customer_id = ?', [customer.id])
      await db.run('INSERT INTO password_reset_tokens (customer_id, token, expires_at) VALUES (?,?,?)', [customer.id, token, expires])
      sendPasswordResetEmail(email.toLowerCase(), token)
    }
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.post('/api/auth/reset-password', passwordResetLimiter, async (req, res) => {
  try {
    const { token, password } = req.body
    if (!token || !password || password.length < 6) return res.status(400).json({ detail: 'Données invalides (6 caractères minimum)' })
    const record = await db.get('SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()', [token])
    if (!record) return res.status(400).json({ detail: 'Lien invalide ou expiré' })
    const hashed = await bcrypt.hash(password, 10)
    await db.run('UPDATE customers SET password = ? WHERE id = ?', [hashed, record.customer_id])
    await db.run('DELETE FROM password_reset_tokens WHERE id = ?', [record.id])
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.post('/api/admin/login', (req, res) => {
  if (req.body.password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ detail: 'Mot de passe incorrect' })
  const token = signToken({ sub: 0, role: 'admin' }, '12h')
  res.json({ token })
})

// ── Products
const RSM_RELEASES_REPO = process.env.RSM_RELEASES_REPO || 'DumePaoli/RSM-Releases'
let _versionCache = { value: process.env.APP_VERSION || 'v1.1.52', at: 0 }
async function fetchLatestVersion() {
  const r = await axios.get(`https://api.github.com/repos/${RSM_RELEASES_REPO}/releases/latest`, { headers: { 'User-Agent': 'RSM-Site' }, timeout: 10000 })
  if (r.data.tag_name) _versionCache = { value: r.data.tag_name, at: Date.now() }
}

app.get('/api/version', async (req, res) => {
  const TTL = 300_000
  if (Date.now() - _versionCache.at < TTL) return res.json({ version: _versionCache.value })
  try { await fetchLatestVersion() } catch (e) { console.error('[version]', e.message) }
  res.json({ version: _versionCache.value })
})

app.post('/api/admin/refresh-version', adminMiddleware, async (req, res) => {
  try {
    await fetchLatestVersion()
    res.json({ version: _versionCache.value })
  } catch(e) { res.status(500).json({ detail: e.message }) }
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
app.post('/api/checkout/create', checkoutLimiter, authMiddleware, async (req, res) => {
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
    const c = await db.get('SELECT id, email, name, discord_id FROM customers WHERE id = ?', [req.user.sub])
    if (!c) return res.status(404).json({ detail: 'Introuvable' })
    res.json(c)
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

const DISCORD_CLIENT_ID     = process.env.DISCORD_OAUTH_CLIENT_ID || '1512458990070534254'
const DISCORD_CLIENT_SECRET = process.env.DISCORD_OAUTH_CLIENT_SECRET || 'mPB_0wD_2iP9Ud_z9nLmvzoEJD1jLgox'
const DISCORD_REDIRECT_URI  = process.env.DISCORD_OAUTH_REDIRECT || 'https://rustservermanagerpro.com/api/auth/discord/callback'

const oauthStates = new Map()

app.get('/api/auth/discord', (req, res) => {
  const token = req.query.token
  if (!token) return res.status(401).json({ detail: 'Token manquant' })
  let customerId
  try { customerId = jwt.verify(token, JWT_SECRET).sub } catch { return res.status(401).json({ detail: 'Token invalide' }) }
  const state = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  oauthStates.set(state, customerId)
  setTimeout(() => oauthStates.delete(state), 10 * 60 * 1000)
  const url = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify&state=${state}`
  res.redirect(url)
})

app.get('/api/auth/discord/callback', async (req, res) => {
  const SITE = process.env.SITE_URL || 'https://rustservermanagerpro.com'
  try {
    const { code, state } = req.query
    const customerId = oauthStates.get(state)
    if (!customerId) return res.redirect(`${SITE}/dashboard?discord=error&msg=Session+expirée`)
    oauthStates.delete(state)

    const tokenRes = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: DISCORD_REDIRECT_URI,
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })

    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
    })

    const discordId = userRes.data.id
    const hasPaid = await db.get("SELECT id FROM orders WHERE customer_id = ? AND status = 'paid' LIMIT 1", [customerId])
    if (!hasPaid) return res.redirect(`${SITE}/dashboard?discord=error&msg=Aucune+commande+active`)

    await db.run('UPDATE customers SET discord_id = ? WHERE id = ?', [discordId, customerId])
    const { assignCustomerRole } = require('./bot')
    await assignCustomerRole(discordId)
    res.redirect(`${SITE}/dashboard?discord=success`)
  } catch(e) {
    console.error('[discord oauth]', e.message)
    const SITE = process.env.SITE_URL || 'https://rustservermanagerpro.com'
    res.redirect(`${SITE}/dashboard?discord=error&msg=${encodeURIComponent(e.message)}`)
  }
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

// ── License HWID registration (no auth — called by RSM app)
app.post('/api/license/register-hwid', async (req, res) => {
  try {
    const { license_key, hwid } = req.body
    if (!license_key || !hwid) return res.status(400).json({ detail: 'license_key et hwid requis' })
    await db.run('UPDATE orders SET hwid = ? WHERE license_key = ?', [hwid, license_key])
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
    const monthly   = await db.all("SELECT DATE_FORMAT(paid_at,'%Y-%m') as month, COALESCE(SUM(amount),0) as revenue, COUNT(*) as orders FROM orders WHERE status='paid' AND paid_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH) GROUP BY month ORDER BY month ASC")
    res.json({ revenue: revenue.v, paid_orders: paid.v, customers: customers.v, pending_orders: pending.v, monthly })
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.get('/api/admin/orders', adminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1')
    const search = req.query.search || ''
    const status = req.query.status || ''
    let where = ''; const params = []
    if (search) { where += ' AND (o.email LIKE ? OR o.license_key LIKE ?)'; params.push(`%${search}%`, `%${search}%`) }
    if (status) { where += ' AND o.status = ?'; params.push(status) }
    params.push((page - 1) * 50)
    res.json(await db.all(`SELECT o.*, p.name as product FROM orders o JOIN products p ON p.id = o.product_id WHERE 1=1${where} ORDER BY o.created_at DESC LIMIT 50 OFFSET ?`, params))
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.get('/api/admin/orders/export-csv', adminMiddleware, async (req, res) => {
  try {
    const rows = await db.all("SELECT o.id, o.email, p.name as product, o.amount, o.payment_method, o.status, o.license_key, o.coupon_code, o.discount, o.created_at, o.paid_at FROM orders o JOIN products p ON p.id = o.product_id ORDER BY o.created_at DESC")
    const header = 'ID,Email,Produit,Montant,Méthode,Statut,Licence,Coupon,Remise,Créé le,Payé le'
    const lines = rows.map(r => [r.id, r.email, r.product, r.amount, r.payment_method, r.status, r.license_key, r.coupon_code, r.discount, r.created_at, r.paid_at || ''].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="commandes-${new Date().toISOString().slice(0,10)}.csv"`)
    res.send('﻿' + [header, ...lines].join('\n'))
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.patch('/api/admin/orders/:id/notes', adminMiddleware, async (req, res) => {
  try {
    await db.run('UPDATE orders SET notes = ? WHERE id = ?', [req.body.notes || '', req.params.id])
    await logAdminAction('order_note', `#${req.params.id}: ${req.body.notes}`)
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.post('/api/admin/orders/:id/refund', adminMiddleware, async (req, res) => {
  try {
    const o = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id])
    if (!o) return res.status(404).json({ detail: 'Introuvable' })
    if (o.license_key) axios.delete(`${process.env.LICENSE_SERVER_URL}/admin/keys/${o.license_key}`, { headers: { 'x-admin-secret': process.env.LICENSE_ADMIN_SECRET } }).catch(() => {})
    await db.run("UPDATE orders SET status='refunded' WHERE id=?", [o.id])
    await logAdminAction('refund', `Commande #${o.id} remboursée — ${o.email}`)
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.delete('/api/admin/orders/:id', adminMiddleware, async (req, res) => {
  try {
    const o = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id])
    if (!o) return res.status(404).json({ detail: 'Introuvable' })
    if (o.license_key) await axios.delete(`${process.env.LICENSE_SERVER_URL}/admin/keys/${o.license_key}`, { headers: { 'x-admin-secret': process.env.LICENSE_ADMIN_SECRET } }).catch(() => {})
    await db.run('DELETE FROM orders WHERE id = ?', [o.id])
    await logAdminAction('delete_order', `Commande #${o.id} supprimée — ${o.email}`)
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.get('/api/admin/customers', adminMiddleware, async (req, res) => {
  try { res.json(await db.all('SELECT id, email, name, banned, created_at FROM customers ORDER BY created_at DESC')) }
  catch(e) { res.status(500).json({ detail: e.message }) }
})

app.post('/api/admin/customers/:id/ban', adminMiddleware, async (req, res) => {
  try {
    const c = await db.get('SELECT email FROM customers WHERE id=?', [req.params.id])
    await db.run('UPDATE customers SET banned=1 WHERE id=?', [req.params.id])
    const orders = await db.all("SELECT license_key FROM orders WHERE customer_id=? AND status='paid' AND license_key != ''", [req.params.id])
    for (const o of orders) {
      axios.delete(`${process.env.LICENSE_SERVER_URL}/admin/keys/${o.license_key}`, { headers: { 'x-admin-secret': process.env.LICENSE_ADMIN_SECRET } }).catch(() => {})
    }
    await db.run("UPDATE orders SET status='revoked' WHERE customer_id=? AND status='paid'", [req.params.id])
    await logAdminAction('ban', `Client #${req.params.id} ${c?.email || ''} banni — ${orders.length} licence(s) révoquée(s)`)
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.post('/api/admin/customers/:id/unban', adminMiddleware, async (req, res) => {
  try {
    const c = await db.get('SELECT email FROM customers WHERE id=?', [req.params.id])
    await db.run('UPDATE customers SET banned=0 WHERE id=?', [req.params.id])
    await logAdminAction('unban', `Client #${req.params.id} ${c?.email || ''} débanni`)
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ detail: e.message }) }
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
    const { notes = '', expires_in_seconds = 0 } = req.body
    const key = await generateLicenseKey(notes || 'admin-manual', 2, 'pro', expires_in_seconds)
    await db.run('INSERT INTO manual_licenses (license_key, notes) VALUES (?,?)', [key, notes])
    await logAdminAction('generate_license', `Clé générée: ${key} | Notes: ${notes} | Durée: ${expires_in_seconds}s`)
    res.json({ key })
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.get('/api/admin/manual-licenses', adminMiddleware, async (req, res) => {
  try { res.json(await db.all('SELECT * FROM manual_licenses ORDER BY created_at DESC')) }
  catch(e) { res.status(500).json({ detail: e.message }) }
})

app.get('/api/admin/logs', adminMiddleware, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 200, 500)
    const offset = parseInt(req.query.offset) || 0
    res.json(await db.all('SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]))
  }
  catch(e) { res.status(500).json({ detail: e.message }) }
})

app.get('/api/releases', async (req, res) => {
  try {
    const r = await axios.get(`https://api.github.com/repos/${RSM_RELEASES_REPO}/releases`, { headers: { 'User-Agent': 'RSM-Site' }, timeout: 8000 })
    res.json(r.data.slice(0, 10).map(rel => ({ tag: rel.tag_name, name: rel.name || rel.tag_name, body: rel.body || '', published_at: rel.published_at, url: rel.html_url })))
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

app.delete('/api/admin/manual-licenses/:key', adminMiddleware, async (req, res) => {
  try {
    const key = req.params.key
    await axios.delete(
      `${process.env.LICENSE_SERVER_URL}/admin/keys/${key}`,
      { headers: { 'x-admin-secret': process.env.LICENSE_ADMIN_SECRET }, timeout: 15000 }
    ).catch(() => {})
    await db.run('DELETE FROM manual_licenses WHERE license_key=?', [key])
    res.json({ ok: true })
  } catch(e) { res.status(500).json({ detail: e.message }) }
})

// ── Bot control routes
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

app.post('/api/admin/bot/send-verify-embed', adminMiddleware, async (req, res) => {
  try {
    const { channelId, title, description, color, footer, image, thumbnail } = req.body
    if (!channelId) return res.status(400).json({ detail: 'channelId requis' })
    await sendVerifyEmbed(channelId, { title, description, color, footer, image, thumbnail })
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
      html_url: html_url || `https://github.com/DumePaoli/RSM-Releases/releases/tag/${tag_name}`,
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
        expires_at: k.expires_at || null,
      }
    }))
    res.json(detailed)
  } catch(e) {
    res.status(500).json({ detail: e.response?.data?.message || e.message })
  }
})

async function deleteAllActivations(key) {
  const headers = { 'x-admin-secret': process.env.LICENSE_ADMIN_SECRET }
  const r = await axios.get(`${process.env.LICENSE_SERVER_URL}/admin/keys/${key}/activations`, { headers, timeout: 10000 })
  const list = r.data || []
  await Promise.all(list.map(a =>
    axios.delete(`${process.env.LICENSE_SERVER_URL}/admin/keys/${key}/activations/${encodeURIComponent(a.hwid)}`, { headers, timeout: 10000 })
  ))
}

app.post('/api/admin/hwids/:key/reset', adminMiddleware, async (req, res) => {
  try {
    await deleteAllActivations(req.params.key)
    res.json({ ok: true })
  } catch(e) {
    res.status(e.response?.status || 500).json({ detail: e.response?.data?.message || e.response?.data?.detail || e.message })
  }
})

app.delete('/api/admin/keys/:key/activations', adminMiddleware, async (req, res) => {
  try {
    await deleteAllActivations(req.params.key)
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
  const url = process.env.DOWNLOAD_URL || "https://github.com/DumePaoli/RSM-Releases/releases/latest/download/Rust.Server.Manager.Pro.exe"
  res.redirect(302, url)
})

app.use(express.static(path.join(__dirname, 'frontend', 'dist')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html')))

async function checkExpiringLicenses() {
  try {
    const headers = { 'x-admin-secret': process.env.LICENSE_ADMIN_SECRET }
    const r = await axios.get(`${process.env.LICENSE_SERVER_URL}/admin/keys`, { headers, timeout: 15000 })
    const keys = Array.isArray(r.data) ? r.data : (r.data.keys || [])
    const now = Math.floor(Date.now() / 1000)
    const in3days = now + 3 * 86400
    for (const k of keys) {
      if (!k.expires_at || k.expires_at > in3days || k.expires_at <= now) continue
      const order = await db.get("SELECT o.email, p.name as product_name FROM orders o JOIN products p ON p.id = o.product_id WHERE o.license_key = ? AND o.status = 'paid'", [k.key])
      if (!order) continue
      const daysLeft = Math.ceil((k.expires_at - now) / 86400)
      const SITE = process.env.SITE_URL || 'https://rustservermanagerpro.com'
      const html = `<!DOCTYPE html><html><body style="background:#0d0d0f;color:#f1f1f3;font-family:Inter,sans-serif;padding:40px 20px;margin:0"><div style="max-width:520px;margin:0 auto"><div style="text-align:center;margin-bottom:24px"><img src="${SITE}/logo.png" alt="RSM Pro" style="height:64px;width:auto"/></div><h1 style="color:#c12814;text-align:center;margin:0 0 6px">Votre licence expire bientôt</h1><p style="text-align:center;color:#8b8b96;margin:0 0 24px">Il vous reste <strong style="color:#f97316">${daysLeft} jour${daysLeft > 1 ? 's' : ''}</strong> sur votre licence.</p><div style="background:rgba(193,40,20,0.06);border:1px solid rgba(193,40,20,0.25);border-radius:12px;padding:24px"><p style="color:#8b8b96;font-size:0.85rem;margin:0 0 4px">Produit</p><p style="margin:0 0 20px;font-weight:600;color:#fff">${order.product_name}</p><p style="color:#8b8b96;font-size:0.85rem;margin:0 0 8px">Clé</p><div style="background:#161a1c;border:1px solid rgba(193,40,20,0.35);border-radius:8px;padding:14px;text-align:center;font-family:monospace;font-size:1rem;color:#c12814;letter-spacing:0.1em;margin-bottom:20px">${k.key}</div><a href="${SITE}/checkout" style="display:block;background:#c12814;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-weight:700">Renouveler maintenant</a></div><p style="text-align:center;color:#4c4c4d;font-size:0.75rem;margin-top:24px">© ${new Date().getFullYear()} Rust Server Manager Pro</p></div></body></html>`
      mailer.sendMail({ from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`, to: order.email, subject: `Votre licence RSM Pro expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`, html }).catch(() => {})
    }
  } catch(e) { console.error('[expiry-check]', e.message) }
}

init().then(() => {
  app.listen(PORT, () => console.log(`RSM Shop running on port ${PORT}`))
  startBot(db)
  setInterval(checkExpiringLicenses, 24 * 60 * 60 * 1000)
  setTimeout(checkExpiringLicenses, 5000)
}).catch(e => {
  console.error('DB init failed:', e.message)
  require('fs').appendFileSync(__dirname + '/crash.log', new Date().toISOString() + ' DB INIT: ' + e.stack + '\n')
  process.exit(1)
})
