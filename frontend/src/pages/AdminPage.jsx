import { useEffect, useState } from 'react'
import {
  adminLogin, adminStats, adminOrders, adminRefund,
  adminCustomers, adminBan, adminUnban,
  adminCoupons, adminCreateCoupon, adminDeleteCoupon,
  adminBlacklist, adminAddBlacklist, adminRemoveBlacklist
} from '../api/client'
import { ShoppingBag, Users, Tag, Ban, BarChart2, RefreshCw, Trash2, UserX, UserCheck, LogIn } from 'lucide-react'

const TABS = ['Commandes', 'Clients', 'Coupons', 'Blacklist']

function StatusBadge({ status }) {
  const cls = { paid: 'badge-paid', pending: 'badge-pending', failed: 'badge-failed', refunded: 'badge-refunded' }
  const labels = { paid: 'Payé', pending: 'En attente', failed: 'Échoué', refunded: 'Remboursé' }
  return <span className={cls[status] || 'badge'}>{labels[status] || status}</span>
}

export default function AdminPage() {
  const [authed, setAuthed]   = useState(!!localStorage.getItem('rsm_admin'))
  const [pass, setPass]       = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [tab, setTab]         = useState('Commandes')
  const [stats, setStats]     = useState(null)
  const [orders, setOrders]   = useState([])
  const [customers, setCustomers] = useState([])
  const [coupons, setCoupons] = useState([])
  const [blacklist, setBlacklist] = useState([])
  const [couponForm, setCouponForm] = useState({ code: '', discount_pct: 10, max_uses: 0, expires_in_days: 0 })
  const [couponErr, setCouponErr]   = useState('')
  const [couponOk, setCouponOk]     = useState(false)
  const [blEmail, setBlEmail]       = useState('')
  const [blReason, setBlReason]     = useState('')

  useEffect(() => {
    if (!authed) return
    adminStats().then(setStats).catch(() => {})
    adminOrders().then(setOrders).catch(() => {})
    adminCustomers().then(setCustomers).catch(() => {})
    adminCoupons().then(setCoupons).catch(() => {})
    adminBlacklist().then(setBlacklist).catch(() => {})
  }, [authed])

  const doLogin = async (e) => {
    e.preventDefault()
    try {
      const r = await adminLogin(pass)
      localStorage.setItem('rsm_token', r.token)
      localStorage.setItem('rsm_admin', '1')
      setAuthed(true)
    } catch {
      setLoginErr('Mot de passe incorrect')
    }
  }

  const refund = async (id) => {
    if (!confirm('Rembourser et révoquer la licence ?')) return
    await adminRefund(id)
    setOrders(orders.map(o => o.id === id ? { ...o, status: 'refunded' } : o))
  }

  const createCoupon = async (e) => {
    e.preventDefault()
    setCouponErr('')
    setCouponOk(false)
    try {
      await adminCreateCoupon({ ...couponForm, code: couponForm.code.toUpperCase() })
      setCoupons(await adminCoupons())
      setCouponForm({ code: '', discount_pct: 10, max_uses: 0, expires_in_days: 0 })
      setCouponOk(true)
      setTimeout(() => setCouponOk(false), 3000)
    } catch (err) {
      setCouponErr(err.response?.data?.detail || 'Erreur lors de la création')
    }
  }

  const deleteCoupon = async (id) => {
    await adminDeleteCoupon(id)
    setCoupons(coupons.filter(c => c.id !== id))
  }

  const addBl = async (e) => {
    e.preventDefault()
    await adminAddBlacklist({ email: blEmail, reason: blReason })
    setBlacklist(await adminBlacklist())
    setBlEmail(''); setBlReason('')
  }

  const removeBl = async (id) => {
    await adminRemoveBlacklist(id)
    setBlacklist(blacklist.filter(b => b.id !== id))
  }

  if (!authed) return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-rust-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <LogIn size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin</h1>
        </div>
        <form onSubmit={doLogin} className="card space-y-4">
          <input type="password" className="input" placeholder="Mot de passe admin" value={pass} onChange={e => setPass(e.target.value)} />
          {loginErr && <p className="text-red-400 text-sm">{loginErr}</p>}
          <button type="submit" className="btn-primary w-full justify-center">Connexion</button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-white">Panneau Admin</h1>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: <BarChart2 size={18} />, label: 'Revenus', value: `${stats.revenue.toFixed(2)} €` },
              { icon: <ShoppingBag size={18} />, label: 'Commandes', value: stats.paid_orders },
              { icon: <Users size={18} />, label: 'Clients', value: stats.customers },
              { icon: <RefreshCw size={18} />, label: 'En attente', value: stats.pending_orders },
            ].map(s => (
              <div key={s.label} className="card flex items-center gap-4">
                <div className="text-rust-500">{s.icon}</div>
                <div>
                  <div className="text-2xl font-black text-white">{s.value}</div>
                  <div className="text-surface-400 text-xs">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-surface-800 p-1 rounded-xl w-fit">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === t ? 'bg-rust-500 text-white' : 'text-surface-400 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Commandes */}
        {tab === 'Commandes' && (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-surface-400 border-b border-surface-700">
                  {['#', 'Email', 'Produit', 'Montant', 'Méthode', 'Statut', 'Clé', 'Date', 'Actions'].map(h => (
                    <th key={h} className="pb-3 pr-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800">
                {orders.map(o => (
                  <tr key={o.id} className="text-sm">
                    <td className="py-3 pr-4 text-surface-400">#{o.id}</td>
                    <td className="py-3 pr-4 text-white">{o.email}</td>
                    <td className="py-3 pr-4 text-surface-300">{o.product}</td>
                    <td className="py-3 pr-4 text-rust-400 font-bold">{o.amount.toFixed(2)} €</td>
                    <td className="py-3 pr-4 text-surface-400">{o.payment_method}</td>
                    <td className="py-3 pr-4"><StatusBadge status={o.status} /></td>
                    <td className="py-3 pr-4 font-mono text-xs text-surface-400">{o.license_key || '—'}</td>
                    <td className="py-3 pr-4 text-surface-400">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="py-3">
                      {o.status === 'paid' && (
                        <button onClick={() => refund(o.id)} className="btn-danger">
                          <RefreshCw size={12} /> Remboursement
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && <p className="text-center text-surface-400 py-8">Aucune commande</p>}
          </div>
        )}

        {/* Clients */}
        {tab === 'Clients' && (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-surface-400 border-b border-surface-700">
                  {['#', 'Email', 'Pseudo', 'Statut', 'Inscrit le', 'Actions'].map(h => (
                    <th key={h} className="pb-3 pr-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800">
                {customers.map(c => (
                  <tr key={c.id}>
                    <td className="py-3 pr-4 text-surface-400">#{c.id}</td>
                    <td className="py-3 pr-4 text-white">{c.email}</td>
                    <td className="py-3 pr-4 text-surface-300">{c.name || '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={c.banned ? 'badge badge-failed' : 'badge badge-paid'}>
                        {c.banned ? 'Banni' : 'Actif'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-surface-400">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="py-3">
                      {c.banned ? (
                        <button onClick={() => adminUnban(c.id).then(() => setCustomers(customers.map(x => x.id === c.id ? { ...x, banned: false } : x)))} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                          <UserCheck size={12} /> Débannir
                        </button>
                      ) : (
                        <button onClick={() => adminBan(c.id).then(() => setCustomers(customers.map(x => x.id === c.id ? { ...x, banned: true } : x)))} className="btn-danger">
                          <UserX size={12} /> Bannir
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Coupons */}
        {tab === 'Coupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-surface-400 border-b border-surface-700">
                    {['Code', 'Réduction', 'Utilisations', 'Statut', 'Actions'].map(h => (
                      <th key={h} className="pb-3 pr-4 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800">
                  {coupons.map(c => (
                    <tr key={c.id}>
                      <td className="py-3 pr-4 font-mono text-rust-400">{c.code}</td>
                      <td className="py-3 pr-4 text-white">{c.discount_pct}%</td>
                      <td className="py-3 pr-4 text-surface-400">{c.uses} / {c.max_uses || '∞'}</td>
                      <td className="py-3 pr-4">
                        <span className={c.active ? 'badge badge-paid' : 'badge badge-failed'}>
                          {c.active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="py-3">
                        <button onClick={() => deleteCoupon(c.id)} className="btn-danger">
                          <Trash2 size={12} /> Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {coupons.length === 0 && <p className="text-center text-surface-400 py-6">Aucun coupon</p>}
            </div>
            <form onSubmit={createCoupon} className="card space-y-4 h-fit">
              <h3 className="font-semibold text-white">Créer un coupon</h3>
              <div>
                <label className="label">Code</label>
                <input className="input font-mono uppercase" placeholder="PROMO20" value={couponForm.code}
                  onChange={e => setCouponForm({ ...couponForm, code: e.target.value })} required />
              </div>
              <div>
                <label className="label">Réduction (%)</label>
                <input type="number" className="input" min={1} max={100} value={couponForm.discount_pct}
                  onChange={e => setCouponForm({ ...couponForm, discount_pct: +e.target.value })} />
              </div>
              <div>
                <label className="label">Max utilisations (0 = illimité)</label>
                <input type="number" className="input" min={0} value={couponForm.max_uses}
                  onChange={e => setCouponForm({ ...couponForm, max_uses: +e.target.value })} />
              </div>
              <div>
                <label className="label">Expire dans (jours, 0 = jamais)</label>
                <input type="number" className="input" min={0} value={couponForm.expires_in_days}
                  onChange={e => setCouponForm({ ...couponForm, expires_in_days: +e.target.value })} />
              </div>
              {couponErr && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">{couponErr}</p>}
              {couponOk  && <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg p-3">Coupon créé !</p>}
              <button type="submit" className="btn-primary w-full justify-center"><Tag size={14} /> Créer</button>
            </form>
          </div>
        )}

        {/* Blacklist */}
        {tab === 'Blacklist' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-surface-400 border-b border-surface-700">
                    {['Email', 'Raison', 'Actions'].map(h => <th key={h} className="pb-3 pr-4 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800">
                  {blacklist.map(b => (
                    <tr key={b.id}>
                      <td className="py-3 pr-4 text-white">{b.email}</td>
                      <td className="py-3 pr-4 text-surface-400">{b.reason || '—'}</td>
                      <td className="py-3">
                        <button onClick={() => removeBl(b.id)} className="btn-danger">
                          <Trash2 size={12} /> Retirer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {blacklist.length === 0 && <p className="text-center text-surface-400 py-6">Aucune entrée</p>}
            </div>
            <form onSubmit={addBl} className="card space-y-4 h-fit">
              <h3 className="font-semibold text-white flex items-center gap-2"><Ban size={16} className="text-red-400" /> Ajouter à la blacklist</h3>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="spam@exemple.com" value={blEmail} onChange={e => setBlEmail(e.target.value)} required />
              </div>
              <div>
                <label className="label">Raison</label>
                <input className="input" placeholder="Chargeback, fraude…" value={blReason} onChange={e => setBlReason(e.target.value)} />
              </div>
              <button type="submit" className="btn-danger w-full justify-center py-3">
                <Ban size={14} /> Blacklister
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
