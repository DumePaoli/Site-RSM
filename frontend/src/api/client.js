import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000')

const api = axios.create({ baseURL: BASE })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rsm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('rsm_token')
      localStorage.removeItem('rsm_user')
    }
    return Promise.reject(err)
  }
)

export default api

export const getProducts = () => api.get('/api/products').then(r => r.data)
export const checkCoupon = (code, slug) => api.post('/api/coupons/check', { code, product_slug: slug }).then(r => r.data)
export const createCheckout = (data) => api.post('/api/checkout/create', data).then(r => r.data)
export const capturePayPal = (data) => api.post('/api/checkout/paypal-capture', data).then(r => r.data)
export const getOrder = (id) => api.get(`/api/orders/${id}`).then(r => r.data)
export const register = (data) => api.post('/api/auth/register', data).then(r => r.data)
export const login = (data) => api.post('/api/auth/login', data).then(r => r.data)
export const getMe = () => api.get('/api/me').then(r => r.data)
export const getMyOrders = () => api.get('/api/me/orders').then(r => r.data)
export const resendKey = (orderId) => api.post(`/api/me/resend-key/${orderId}`).then(r => r.data)
export const adminLogin = (p) => api.post('/api/admin/login', { password: p }).then(r => r.data)
export const adminStats = () => api.get('/api/admin/stats').then(r => r.data)
export const adminOrders = (page = 1) => api.get(`/api/admin/orders?page=${page}`).then(r => r.data)
export const adminRefund = (id) => api.post(`/api/admin/orders/${id}/refund`).then(r => r.data)
export const adminCustomers = () => api.get('/api/admin/customers').then(r => r.data)
export const adminBan = (id) => api.post(`/api/admin/customers/${id}/ban`).then(r => r.data)
export const adminUnban = (id) => api.post(`/api/admin/customers/${id}/unban`).then(r => r.data)
export const adminCoupons = () => api.get('/api/admin/coupons').then(r => r.data)
export const adminCreateCoupon = (d) => api.post('/api/admin/coupons', d).then(r => r.data)
export const adminDeleteCoupon = (id) => api.delete(`/api/admin/coupons/${id}`).then(r => r.data)
export const adminBlacklist = () => api.get('/api/admin/blacklist').then(r => r.data)
export const adminAddBlacklist = (d) => api.post('/api/admin/blacklist', d).then(r => r.data)
export const adminRemoveBlacklist = (id) => api.delete(`/api/admin/blacklist/${id}`).then(r => r.data)
export const adminGenerateLicense = (notes) => api.post('/api/admin/generate-license', { notes }).then(r => r.data)
export const adminManualLicenses = () => api.get('/api/admin/manual-licenses').then(r => r.data)
export const adminBotStats = () => api.get('/api/admin/bot/stats').then(r => r.data)
export const adminBotChannels = () => api.get('/api/admin/bot/channels').then(r => r.data)
export const adminBotTickets = () => api.get('/api/admin/bot/tickets').then(r => r.data)
export const adminBotCloseTicket = (id) => api.delete(`/api/admin/bot/tickets/${id}`).then(r => r.data)
export const adminBotSendEmbed = (d) => api.post('/api/admin/bot/send-embed', d).then(r => r.data)
export const adminBotAnnounceRelease = (d) => api.post('/api/admin/bot/announce-release', d).then(r => r.data)
export const adminBotDebug = () => api.get('/api/admin/bot/debug').then(r => r.data)
export const adminHwids = () => api.get('/api/admin/hwids').then(r => r.data)
export const adminResetHwid = (key) => api.post(`/api/admin/hwids/${key}/reset`).then(r => r.data)
export const adminRevokeKey = (key) => api.delete(`/api/admin/keys/${key}`).then(r => r.data)
export const adminBotGetWelcomeConfig = () => api.get('/api/admin/bot/welcome-config').then(r => r.data)
export const adminBotSetWelcomeConfig = (d) => api.post('/api/admin/bot/welcome-config', d).then(r => r.data)
export const adminBotSendTicketEmbed = (d) => api.post('/api/admin/bot/send-ticket-embed', d).then(r => r.data)
