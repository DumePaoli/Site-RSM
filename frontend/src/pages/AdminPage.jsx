import { useEffect, useState } from 'react'
import {
  adminLogin, adminStats, adminOrders, adminRefund,
  adminCustomers, adminBan, adminUnban,
  adminCoupons, adminCreateCoupon, adminDeleteCoupon,
  adminBlacklist, adminAddBlacklist, adminRemoveBlacklist,
  adminGenerateLicense, adminManualLicenses, adminDeleteManualLicense, adminDeleteOrder,
  adminHwids, adminResetHwid, adminRevokeKey, adminClearActivations, adminRefreshVersion,
  adminBotStats, adminBotChannels, adminBotTickets,
  adminBotCloseTicket, adminBotSendEmbed, adminBotAnnounceRelease,
  adminBotSendTicketEmbed, adminBotGetWelcomeConfig, adminBotSetWelcomeConfig,
  adminBotSendVerifyEmbed,
  adminExportCSV, adminLogs, adminUpdateOrderNotes
} from '../api/client'
import { ShoppingBag, Users, Tag, Ban, BarChart2, RefreshCw, Trash2, UserX, UserCheck, LogIn, Key, Copy, CheckCircle2, Monitor, RotateCcw, Bot, Hash, Shield, Ticket, Send, Megaphone, X, Download, Search, TrendingUp, ClipboardList, Edit2, Check } from 'lucide-react'

const TABS = ['Commandes', 'Clients', 'Coupons', 'Blacklist', 'Licences', 'HWIDs', 'Bot', 'Logs']
const LIC_DURATIONS = [
  { value: '0',       label: 'Lifetime (pas d\'expiration)' },
  { value: '300',     label: '5 minutes' },
  { value: '600',     label: '10 minutes' },
  { value: '1800',    label: '30 minutes' },
  { value: '3600',    label: '1 heure' },
  { value: '21600',   label: '6 heures' },
  { value: '86400',   label: '1 jour' },
  { value: '259200',  label: '3 jours' },
  { value: '604800',  label: '7 jours' },
  { value: '1209600', label: '14 jours' },
  { value: '2592000', label: '30 jours' },
  { value: '7776000', label: '90 jours' },
]
const BOT_TABS = ['Stats', 'Embed', 'Ticket Embed', 'Verify Embed', 'Tickets', 'Bienvenue', 'Release']
const PRESET_COLORS = [
  { label: 'Rouge RSM', value: '#c12814' },
  { label: 'Vert', value: '#22c55e' },
  { label: 'Bleu', value: '#3b82f6' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Violet', value: '#8b5cf6' },
]

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
  const [botTab, setBotTab]   = useState('Stats')
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
  const [licNotes, setLicNotes]     = useState('')
  const [licDuration, setLicDuration] = useState('0')
  const [licKeys, setLicKeys]       = useState([])
  const [licLoading, setLicLoading] = useState(false)
  const [licErr, setLicErr]         = useState('')
  const [copied, setCopied]         = useState(null)
  const [licDbLoading, setLicDbLoading] = useState(false)
  const [hwids, setHwids] = useState([])
  const [hwidsLoading, setHwidsLoading] = useState(false)
  const [hwidsErr, setHwidsErr] = useState('')
  const [hwidSearch, setHwidSearch] = useState('')
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatus, setOrderStatus] = useState('')
  const [logs, setLogs] = useState([])
  const [editingNote, setEditingNote] = useState(null)
  const [noteValue, setNoteValue] = useState('')

  // Bot state
  const [botStats, setBotStats] = useState(null)
  const [channels, setChannels] = useState([])
  const [tickets, setTickets] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [embedChannel, setEmbedChannel] = useState('')
  const [embedTitle, setEmbedTitle] = useState('')
  const [embedDesc, setEmbedDesc] = useState('')
  const [embedColor, setEmbedColor] = useState('#c12814')
  const [embedFooter, setEmbedFooter] = useState('')
  const [embedImage, setEmbedImage] = useState('')
  const [embedThumbnail, setEmbedThumbnail] = useState('')
  const [embedSending, setEmbedSending] = useState(false)
  const [embedOk, setEmbedOk] = useState(false)
  const [embedErr, setEmbedErr] = useState('')
  const [ticketChannel, setTicketChannel] = useState('')
  const [ticketTitle, setTicketTitle] = useState('Support RSM Pro')
  const [ticketDesc, setTicketDesc] = useState('Tu as une question ou un problème ? Clique sur le bouton ci-dessous pour ouvrir un ticket, notre équipe te répondra dès que possible.')
  const [ticketColor, setTicketColor] = useState('#c12814')
  const [ticketFooter, setTicketFooter] = useState('RSM Pro — Support')
  const [ticketImage, setTicketImage] = useState('')
  const [ticketThumbnail, setTicketThumbnail] = useState('')
  const [ticketSending, setTicketSending] = useState(false)
  const [ticketOk, setTicketOk] = useState(false)
  const [ticketErr, setTicketErr] = useState('')
  // Verify Embed state
  const [verifyChannel, setVerifyChannel] = useState('')
  const [verifyTitle, setVerifyTitle] = useState('Vérifier ma licence RSM Pro')
  const [verifyDesc, setVerifyDesc] = useState('Tu as une clé de licence RSM Pro ? Clique sur le bouton ci-dessous pour la vérifier et obtenir ton rôle Client vérifié.')
  const [verifyColor, setVerifyColor] = useState('#22c55e')
  const [verifyFooter, setVerifyFooter] = useState('RSM Pro — Vérification')
  const [verifyImage, setVerifyImage] = useState('')
  const [verifyThumbnail, setVerifyThumbnail] = useState('')
  const [verifySending, setVerifySending] = useState(false)
  const [verifyOk, setVerifyOk] = useState(false)
  const [verifyErr, setVerifyErr] = useState('')
  const [announceLoading, setAnnounceLoading] = useState(false)
  const [announceOk, setAnnounceOk] = useState(false)
  const [announceErr, setAnnounceErr] = useState('')
  const [announceVersion, setAnnounceVersion] = useState('')
  const [announceBody, setAnnounceBody] = useState('')
  const [wc, setWc] = useState({ enabled: true, title: '', description: '', color: '#c12814', footer: '', thumbnail: true })
  const [gc, setGc] = useState({ enabled: false, channelId: '', title: '', description: '', color: '#6b7280', footer: '' })
  const [wcSaving, setWcSaving] = useState(false)
  const [wcOk, setWcOk] = useState(false)
  const [wcErr, setWcErr] = useState('')

  const logout = () => {
    localStorage.removeItem('rsm_admin')
    localStorage.removeItem('rsm_token')
    setAuthed(false)
  }

  const handleApiError = (e) => {
    if (e?.response?.status === 401) logout()
  }

  useEffect(() => {
    if (!authed) return
    adminStats().then(setStats).catch(handleApiError)
    adminOrders(1, orderSearch, orderStatus).then(setOrders).catch(handleApiError)
    adminCustomers().then(setCustomers).catch(handleApiError)
    adminCoupons().then(setCoupons).catch(handleApiError)
    adminBlacklist().then(setBlacklist).catch(handleApiError)
    adminManualLicenses().then(rows => setLicKeys(rows.map(r => ({ key: r.license_key, notes: r.notes, at: new Date(r.created_at).toLocaleString('fr-FR') })))).catch(handleApiError)
  }, [authed])

  useEffect(() => {
    if (!authed || tab !== 'Logs') return
    adminLogs().then(setLogs).catch(() => {})
  }, [authed, tab])

  useEffect(() => {
    if (!authed || tab !== 'Bot') return
    adminBotStats().then(setBotStats).catch(() => {})
    adminBotChannels().then(setChannels).catch(() => {})
  }, [authed, tab])

  useEffect(() => {
    if (!authed || tab !== 'Bot') return
    if (botTab === 'Tickets') {
      setLoadingTickets(true)
      adminBotTickets().then(t => { setTickets(t); setLoadingTickets(false) }).catch(() => setLoadingTickets(false))
    }
    if (botTab === 'Bienvenue') {
      adminBotChannels().then(setChannels).catch(() => {})
      adminBotGetWelcomeConfig().then(d => {
        if (d.welcome) setWc(d.welcome)
        if (d.goodbye) setGc(d.goodbye)
      }).catch(() => {})
    }
  }, [authed, tab, botTab])

  const loadHwids = () => {
    setHwidsLoading(true); setHwidsErr('')
    adminHwids().then(setHwids).catch(e => setHwidsErr(e.response?.data?.detail || 'Erreur')).finally(() => setHwidsLoading(false))
  }

  const resetHwid = async (key) => {
    if (!confirm(`Réinitialiser le HWID de ${key} ?\nL'utilisateur pourra réactiver sur une nouvelle machine.`)) return
    try {
      await adminResetHwid(key)
      setHwids(h => h.map(x => x.key === key ? { ...x, hwid: null, activations: [], activation_count: 0 } : x))
    } catch(e) {
      alert(e.response?.data?.detail || 'Erreur')
    }
  }

  const revokeKey = async (key) => {
    if (!confirm(`⚠️ Révoquer définitivement la licence ${key} ?\nL'accès sera coupé immédiatement et ne pourra pas être restauré.`)) return
    try {
      await adminRevokeKey(key)
      setHwids(h => h.map(x => x.key === key ? { ...x, active: false } : x))
    } catch(e) {
      alert(e.response?.data?.detail || 'Erreur lors de la révocation')
    }
  }

  const clearActivations = async (key) => {
    if (!confirm(`Effacer toutes les activations de ${key} ?\nL'utilisateur devra réactiver sur ses machines.`)) return
    try {
      await adminClearActivations(key)
      setHwids(h => h.map(x => x.key === key ? { ...x, hwid: null, activations: [] } : x))
    } catch(e) {
      alert(e.response?.data?.detail || 'Erreur lors de la suppression des activations')
    }
  }

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

  const generateLic = async (e) => {
    e.preventDefault()
    setLicErr('')
    setLicLoading(true)
    try {
      const selected = LIC_DURATIONS.find(d => d.value === licDuration)
      const r = await adminGenerateLicense(licNotes, parseInt(licDuration))
      setLicKeys(keys => [{ key: r.key, notes: licNotes, duration: selected?.label, at: new Date().toLocaleString('fr-FR') }, ...keys])
      setLicNotes(''); setLicDuration('0')
    } catch (err) {
      setLicErr(err.response?.data?.detail || 'Erreur génération')
    } finally { setLicLoading(false) }
  }

  const copyKey = (key) => {
    navigator.clipboard.writeText(key)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  // Bot handlers
  const handleSendEmbed = async (e) => {
    e.preventDefault()
    setEmbedSending(true); setEmbedOk(false); setEmbedErr('')
    try {
      await adminBotSendEmbed({ channelId: embedChannel, title: embedTitle, description: embedDesc, color: embedColor, footer: embedFooter, image: embedImage, thumbnail: embedThumbnail })
      setEmbedOk(true); setTimeout(() => setEmbedOk(false), 3000)
    } catch(e) { setEmbedErr(e.response?.data?.detail || 'Erreur') }
    setEmbedSending(false)
  }

  const handleSendTicketEmbed = async (e) => {
    e.preventDefault()
    setTicketSending(true); setTicketOk(false); setTicketErr('')
    try {
      await adminBotSendTicketEmbed({ channelId: ticketChannel, title: ticketTitle, description: ticketDesc, color: ticketColor, footer: ticketFooter, image: ticketImage, thumbnail: ticketThumbnail })
      setTicketOk(true); setTimeout(() => setTicketOk(false), 3000)
    } catch(e) { setTicketErr(e.response?.data?.detail || 'Erreur') }
    setTicketSending(false)
  }

  const handleSendVerifyEmbed = async (e) => {
    e.preventDefault()
    setVerifySending(true); setVerifyOk(false); setVerifyErr('')
    try {
      await adminBotSendVerifyEmbed({ channelId: verifyChannel, title: verifyTitle, description: verifyDesc, color: verifyColor, footer: verifyFooter, image: verifyImage, thumbnail: verifyThumbnail })
      setVerifyOk(true); setTimeout(() => setVerifyOk(false), 3000)
    } catch(e) { setVerifyErr(e.response?.data?.detail || 'Erreur') }
    setVerifySending(false)
  }

  const handleCloseTicket = async (id) => {
    if (!confirm('Fermer et supprimer ce ticket ?')) return
    try {
      await adminBotCloseTicket(id)
      setTickets(t => t.filter(x => x.id !== id))
    } catch(e) { alert(e.response?.data?.detail || 'Erreur') }
  }

  const handleAnnounce = async (e) => {
    e.preventDefault()
    setAnnounceLoading(true); setAnnounceOk(false); setAnnounceErr('')
    try {
      await adminBotAnnounceRelease({ tag_name: announceVersion, body: announceBody })
      setAnnounceOk(true); setTimeout(() => setAnnounceOk(false), 4000)
    } catch(e) { setAnnounceErr(e.response?.data?.detail || 'Erreur') }
    setAnnounceLoading(false)
  }

  const handleSaveWelcome = async (e) => {
    e.preventDefault()
    setWcSaving(true); setWcOk(false); setWcErr('')
    try {
      await adminBotSetWelcomeConfig({ welcome: wc, goodbye: gc })
      setWcOk(true); setTimeout(() => setWcOk(false), 3000)
    } catch(e) { setWcErr(e.response?.data?.detail || 'Erreur') }
    setWcSaving(false)
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
        <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
          <h1 className="text-2xl font-black text-white">Panneau Admin</h1>
          <div className="flex items-center gap-2">
            <button onClick={async () => { const r = await adminRefreshVersion(); alert(`Version mise à jour : ${r.version}`) }} className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"><RefreshCw size={13} /> Sync version</button>
            <button onClick={logout} className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors">Déconnexion</button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mb-8 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <BarChart2 size={18} />, label: 'Revenus total', value: `${Number(stats.revenue).toFixed(2)} €` },
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
            {stats.monthly && stats.monthly.length > 0 && (() => {
              const max = Math.max(...stats.monthly.map(m => m.revenue), 1)
              return (
                <div className="card">
                  <h3 className="font-semibold text-white flex items-center gap-2 mb-4"><TrendingUp size={16} className="text-rust-500" /> Revenus mensuels</h3>
                  <div className="flex items-end gap-2 h-32">
                    {stats.monthly.map(m => (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-rust-400 text-xs font-bold">{Number(m.revenue).toFixed(0)}€</span>
                        <div className="w-full bg-rust-500/80 rounded-t" style={{ height: `${Math.max((m.revenue / max) * 100, 4)}%` }} />
                        <span className="text-surface-500 text-xs">{m.month.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-surface-800 p-1 rounded-xl w-fit flex-wrap">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === t ? 'bg-rust-500 text-white' : 'text-surface-400 hover:text-white'}`}>
              {t === 'Bot' ? <span className="flex items-center gap-1.5"><Bot size={13} />{t}</span> : t}
            </button>
          ))}
        </div>

        {/* Commandes */}
        {tab === 'Commandes' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 bg-surface-800 border border-surface-700 rounded-xl px-3 py-2 flex-1 min-w-48">
                <Search size={14} className="text-surface-500" />
                <input className="bg-transparent text-sm text-white placeholder-surface-500 outline-none flex-1" placeholder="Rechercher email ou clé..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && adminOrders(1, orderSearch, orderStatus).then(setOrders)} />
              </div>
              <select className="input text-sm py-2 w-40" value={orderStatus} onChange={e => { setOrderStatus(e.target.value); adminOrders(1, orderSearch, e.target.value).then(setOrders) }}>
                <option value="">Tous les statuts</option>
                <option value="paid">Payé</option>
                <option value="pending">En attente</option>
                <option value="refunded">Remboursé</option>
                <option value="failed">Échoué</option>
              </select>
              <button onClick={() => adminOrders(1, orderSearch, orderStatus).then(setOrders)} className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"><Search size={12} /> Rechercher</button>
              <button onClick={adminExportCSV} className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"><Download size={12} /> Export CSV</button>
            </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-surface-400 border-b border-surface-700">
                  {['#', 'Email', 'Produit', 'Montant', 'Méthode', 'Statut', 'Clé', 'Date', 'Notes', 'Actions'].map(h => (
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
                    <td className="py-3 pr-4 max-w-[160px]">
                      {editingNote === o.id ? (
                        <div className="flex items-center gap-1">
                          <input autoFocus className="input text-xs py-1 px-2 flex-1" value={noteValue} onChange={e => setNoteValue(e.target.value)} onKeyDown={async e => { if (e.key === 'Enter') { try { await adminUpdateOrderNotes(o.id, noteValue); setOrders(prev => prev.map(x => x.id === o.id ? { ...x, notes: noteValue } : x)); setEditingNote(null) } catch { alert('Erreur lors de la sauvegarde') } } if (e.key === 'Escape') setEditingNote(null) }} />
                          <button onClick={async () => { try { await adminUpdateOrderNotes(o.id, noteValue); setOrders(prev => prev.map(x => x.id === o.id ? { ...x, notes: noteValue } : x)); setEditingNote(null) } catch { alert('Erreur lors de la sauvegarde') } }} className="text-green-400 hover:text-green-300"><Check size={12} /></button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingNote(o.id); setNoteValue(o.notes || '') }} className="flex items-center gap-1 text-surface-500 hover:text-white transition-colors text-xs group">
                          <span className={o.notes ? 'text-surface-300' : 'italic'}>{o.notes || 'Ajouter...'}</span>
                          <Edit2 size={10} className="opacity-0 group-hover:opacity-100" />
                        </button>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {o.status === 'paid' && (
                          <button onClick={() => refund(o.id)} className="btn-danger">
                            <RefreshCw size={12} /> Remboursement
                          </button>
                        )}
                        <button onClick={async () => { if (!confirm(`Supprimer la commande #${o.id} ?`)) return; await adminDeleteOrder(o.id); setOrders(prev => prev.filter(x => x.id !== o.id)) }} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 text-red-400 hover:text-red-300 border-red-500/20 hover:border-red-500/40">
                          <Trash2 size={12} /> Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && <p className="text-center text-surface-400 py-8">Aucune commande</p>}
          </div>
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

        {/* HWIDs */}
        {tab === 'HWIDs' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold text-white flex items-center gap-2"><Monitor size={16} className="text-rust-500" /> Licences activées</h3>
              <button onClick={loadHwids} disabled={hwidsLoading} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
                <RefreshCw size={12} className={hwidsLoading ? 'animate-spin' : ''} /> {hwidsLoading ? 'Chargement...' : 'Charger'}
              </button>
              {hwids.length > 0 && (
                <input value={hwidSearch} onChange={e => setHwidSearch(e.target.value)} className="input text-xs py-1.5 px-3 w-64" placeholder="Rechercher clé ou HWID..." />
              )}
              {hwids.length > 0 && <span className="text-surface-500 text-xs">{hwids.length} clés</span>}
            </div>
            {hwidsErr && <p className="text-red-400 text-sm">{hwidsErr}</p>}
            {hwids.length === 0 && !hwidsLoading && !hwidsErr && (
              <p className="text-surface-500 text-sm">Clique sur Charger pour récupérer les données.</p>
            )}
            {hwids.filter(h => !hwidSearch || h.key.includes(hwidSearch.toUpperCase()) || (h.activations || []).some(a => a.hwid?.includes(hwidSearch))).map(h => (
              <div key={h.key} className="card px-5 py-4 flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-rust-400 text-sm">{h.key}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${h.active ? 'bg-green-500/15 text-green-400' : 'bg-surface-700 text-surface-400'}`}>
                      {h.active ? 'Active' : 'Inactive'}
                    </span>
                    {h.tier && <span className="text-xs px-2 py-0.5 rounded-full bg-rust-500/10 text-rust-400">{h.tier}</span>}
                    {h.notes && <span className="text-xs text-surface-500">{h.notes}</span>}
                  </div>
                  {h.activations && h.activations.length > 0 ? (
                    <div className="space-y-0.5 mt-1">
                      {h.activations.map((a, i) => (
                        <p key={i} className="font-mono text-xs text-surface-400 break-all">Machine {i + 1}: {a.hwid}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-surface-600 italic">Pas encore activée</p>
                  )}
                  {h.created_at && <p className="text-xs text-surface-600">{new Date(h.created_at * 1000).toLocaleString('fr-FR')}</p>}
                  {h.expires_at && (() => {
                    const remaining = h.expires_at - Math.floor(Date.now() / 1000)
                    if (remaining <= 0) return <p className="text-xs text-red-400 font-medium">⏱ Expirée</p>
                    const d = Math.floor(remaining / 86400)
                    const h2 = Math.floor((remaining % 86400) / 3600)
                    const m = Math.floor((remaining % 3600) / 60)
                    const label = d > 0 ? `${d}j ${h2}h` : h2 > 0 ? `${h2}h ${m}min` : `${m}min`
                    return <p className="text-xs text-yellow-400 font-medium">⏱ Expire dans {label}</p>
                  })()}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {h.activation_count > 0 && (
                    <button onClick={() => resetHwid(h.key)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
                      <RotateCcw size={12} /> Reset HWID
                    </button>
                  )}
                  {h.active && (
                    <button onClick={() => revokeKey(h.key)} className="text-xs py-1.5 px-3 flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors">
                      <Trash2 size={12} /> Révoquer
                    </button>
                  )}
                  {!h.active && (
                    <button onClick={async () => { await adminRevokeKey(h.key).catch(() => {}); setHwids(prev => prev.filter(x => x.key !== h.key)) }} className="text-xs py-1.5 px-3 flex items-center gap-1.5 bg-surface-700 hover:bg-surface-600 text-surface-400 border border-surface-600 rounded-lg transition-colors">
                      <Trash2 size={12} /> Supprimer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Licences */}
        {tab === 'Licences' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card space-y-3">
              <h3 className="font-semibold text-white flex items-center gap-2"><Key size={16} className="text-rust-500" /> Clés générées cette session</h3>
              {licKeys.length === 0 && <p className="text-surface-400 text-sm py-4 text-center">Aucune clé générée</p>}
              {licKeys.map((l, i) => (
                <div key={i} className="flex items-center justify-between bg-surface-800 rounded-xl px-4 py-3 gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-rust-400 text-sm truncate">{l.key}</div>
                    {l.notes && <div className="text-surface-400 text-xs mt-0.5">{l.notes}</div>}
                    {l.duration && <div className="text-rust-400/70 text-xs mt-0.5">⏱ {l.duration}</div>}
                    <div className="text-surface-500 text-xs">{l.at}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => copyKey(l.key)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                      {copied === l.key ? <><CheckCircle2 size={12} className="text-green-400" /> Copié</> : <><Copy size={12} /> Copier</>}
                    </button>
                    <button onClick={async () => { await adminDeleteManualLicense(l.key); setLicKeys(keys => keys.filter(k => k.key !== l.key)) }} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 text-red-400 hover:text-red-300 border-red-500/20 hover:border-red-500/40">
                      <Trash2 size={12} /> Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={generateLic} className="card space-y-4 h-fit">
              <h3 className="font-semibold text-white flex items-center gap-2"><Key size={16} className="text-rust-500" /> Générer une licence</h3>
              <div>
                <label className="label">Notes (optionnel)</label>
                <input className="input" placeholder="cadeau, test, influenceur…" value={licNotes} onChange={e => setLicNotes(e.target.value)} />
              </div>
              <div>
                <label className="label">Durée</label>
                <select className="input" value={licDuration} onChange={e => setLicDuration(e.target.value)}>
                  {LIC_DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              {licErr && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">{licErr}</p>}
              <button type="submit" disabled={licLoading} className="btn-primary w-full justify-center disabled:opacity-50">
                <Key size={14} /> {licLoading ? 'Génération…' : 'Générer'}
              </button>
            </form>
          </div>
        )}

        {/* Bot */}
        {tab === 'Bot' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Bot size={20} className="text-rust-500" />
              <h2 className="text-white font-bold text-lg">Bot Control</h2>
              {botStats?.online
                ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">En ligne</span>
                : botStats && <span className="text-xs px-2 py-0.5 rounded-full bg-surface-700 text-surface-400">Hors ligne</span>
              }
            </div>

            {/* Bot sub-tabs */}
            <div className="flex gap-1 border-b border-white/5 flex-wrap">
              {BOT_TABS.map(t => (
                <button key={t} onClick={() => setBotTab(t)}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${botTab === t ? 'border-rust-500 text-white' : 'border-transparent text-surface-500 hover:text-white'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Stats */}
            {botTab === 'Stats' && (
              <div className="space-y-4">
                {!botStats ? (
                  <p className="text-surface-500">Chargement...</p>
                ) : !botStats.online ? (
                  <div className="card p-6 text-surface-500">Bot hors ligne ou non connecté.</div>
                ) : (
                  <>
                    {botStats.guildName && (
                      <div className="card p-6 flex items-center gap-4">
                        {botStats.guildIcon && <img src={botStats.guildIcon} className="w-12 h-12 rounded-full" alt="" />}
                        <div>
                          <p className="text-white font-semibold text-lg">{botStats.guildName}</p>
                          <p className="text-surface-500 text-sm">Connecté en tant que <span className="text-rust-400">{botStats.tag}</span></p>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Membres', value: botStats.memberCount, icon: <Users size={18} /> },
                        { label: 'Channels', value: botStats.channelCount, icon: <Hash size={18} /> },
                        { label: 'Rôles', value: botStats.roleCount, icon: <Shield size={18} /> },
                        { label: 'Uptime', value: botStats.uptime ? `${Math.floor(botStats.uptime / 3600)}h ${Math.floor((botStats.uptime % 3600) / 60)}m` : '—', icon: <Bot size={18} /> },
                      ].map(({ label, value, icon }) => (
                        <div key={label} className="card p-5 flex flex-col gap-2">
                          <div className="text-surface-500">{icon}</div>
                          <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
                          <p className="text-xs text-surface-500 uppercase tracking-wide">{label}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Embed */}
            {botTab === 'Embed' && (
              <div className="grid md:grid-cols-2 gap-6">
                <form onSubmit={handleSendEmbed} className="card p-6 space-y-4">
                  <h2 className="text-white font-semibold flex items-center gap-2"><Send size={16} /> Envoyer un embed</h2>
                  <div>
                    <label className="label">Channel</label>
                    <select value={embedChannel} onChange={e => setEmbedChannel(e.target.value)} className="input w-full" required>
                      <option value="">Sélectionner un channel</option>
                      {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Titre (optionnel)</label>
                    <input value={embedTitle} onChange={e => setEmbedTitle(e.target.value)} className="input w-full" placeholder="Titre de l'embed" />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea value={embedDesc} onChange={e => setEmbedDesc(e.target.value)} className="input w-full h-28 resize-none" placeholder="Contenu du message..." required />
                  </div>
                  <div>
                    <label className="label">Couleur</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {PRESET_COLORS.map(p => (
                        <button key={p.value} type="button" onClick={() => setEmbedColor(p.value)}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${embedColor === p.value ? 'border-white scale-110' : 'border-transparent'}`}
                          style={{ background: p.value }} title={p.label} />
                      ))}
                      <input type="color" value={embedColor} onChange={e => setEmbedColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Footer (optionnel)</label>
                    <input value={embedFooter} onChange={e => setEmbedFooter(e.target.value)} className="input w-full" placeholder="Texte du footer" />
                  </div>
                  <div>
                    <label className="label">Image — URL (optionnel)</label>
                    <input value={embedImage} onChange={e => setEmbedImage(e.target.value)} className="input w-full" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="label">Miniature — URL (optionnel)</label>
                    <input value={embedThumbnail} onChange={e => setEmbedThumbnail(e.target.value)} className="input w-full" placeholder="https://..." />
                  </div>
                  {embedErr && <p className="text-red-400 text-sm">{embedErr}</p>}
                  {embedOk && <p className="text-green-400 text-sm flex items-center gap-1"><CheckCircle2 size={14} /> Embed envoyé !</p>}
                  <button className="btn-primary w-full flex items-center justify-center gap-2" disabled={embedSending}>
                    <Send size={14} /> {embedSending ? 'Envoi...' : 'Envoyer'}
                  </button>
                </form>
                <div className="space-y-3">
                  <p className="text-surface-500 text-xs uppercase tracking-wide">Aperçu</p>
                  <div className="bg-[#1e1f22] rounded-lg p-4">
                    <div className="flex gap-3">
                      <div className="w-1 rounded-full flex-shrink-0" style={{ background: embedColor }} />
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            {embedTitle && <p className="text-white font-semibold text-sm">{embedTitle}</p>}
                            <p className="text-[#dbdee1] text-sm whitespace-pre-wrap break-words">{embedDesc || <span className="text-surface-600 italic">Description...</span>}</p>
                          </div>
                          {embedThumbnail && <img src={embedThumbnail} alt="" className="w-16 h-16 rounded object-cover flex-shrink-0" onError={e => e.target.style.display='none'} />}
                        </div>
                        {embedImage && <img src={embedImage} alt="" className="w-full rounded mt-2 max-h-48 object-cover" onError={e => e.target.style.display='none'} />}
                        {embedFooter && <p className="text-[#949ba4] text-xs mt-2 pt-2 border-t border-white/5">{embedFooter}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ticket Embed */}
            {botTab === 'Ticket Embed' && (
              <div className="grid md:grid-cols-2 gap-6">
                <form onSubmit={handleSendTicketEmbed} className="card p-6 space-y-4">
                  <h2 className="text-white font-semibold flex items-center gap-2"><Ticket size={16} /> Embed avec bouton ticket</h2>
                  <div>
                    <label className="label">Channel</label>
                    <select value={ticketChannel} onChange={e => setTicketChannel(e.target.value)} className="input w-full" required>
                      <option value="">Sélectionner un channel</option>
                      {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                    </select>
                  </div>
                  <div><label className="label">Titre</label><input value={ticketTitle} onChange={e => setTicketTitle(e.target.value)} className="input w-full" /></div>
                  <div><label className="label">Description</label><textarea value={ticketDesc} onChange={e => setTicketDesc(e.target.value)} className="input w-full h-24 resize-none" /></div>
                  <div>
                    <label className="label">Couleur</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {PRESET_COLORS.map(p => (
                        <button key={p.value} type="button" onClick={() => setTicketColor(p.value)}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${ticketColor === p.value ? 'border-white scale-110' : 'border-transparent'}`}
                          style={{ background: p.value }} />
                      ))}
                      <input type="color" value={ticketColor} onChange={e => setTicketColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent" />
                    </div>
                  </div>
                  <div><label className="label">Footer (optionnel)</label><input value={ticketFooter} onChange={e => setTicketFooter(e.target.value)} className="input w-full" /></div>
                  <div><label className="label">Image — URL (optionnel)</label><input value={ticketImage} onChange={e => setTicketImage(e.target.value)} className="input w-full" placeholder="https://..." /></div>
                  <div><label className="label">Miniature — URL (optionnel)</label><input value={ticketThumbnail} onChange={e => setTicketThumbnail(e.target.value)} className="input w-full" placeholder="https://..." /></div>
                  {ticketErr && <p className="text-red-400 text-sm">{ticketErr}</p>}
                  {ticketOk && <p className="text-green-400 text-sm flex items-center gap-1"><CheckCircle2 size={14} /> Embed envoyé !</p>}
                  <button className="btn-primary w-full flex items-center justify-center gap-2" disabled={ticketSending}>
                    <Send size={14} /> {ticketSending ? 'Envoi...' : 'Envoyer'}
                  </button>
                </form>
                <div className="space-y-3">
                  <p className="text-surface-500 text-xs uppercase tracking-wide">Aperçu</p>
                  <div className="bg-[#1e1f22] rounded-lg p-4 space-y-3">
                    <div className="flex gap-3">
                      <div className="w-1 rounded-full flex-shrink-0" style={{ background: ticketColor }} />
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between gap-3">
                          <div className="flex-1">
                            {ticketTitle && <p className="text-white font-semibold text-sm">{ticketTitle}</p>}
                            <p className="text-[#dbdee1] text-sm whitespace-pre-wrap">{ticketDesc}</p>
                          </div>
                          {ticketThumbnail && <img src={ticketThumbnail} alt="" className="w-16 h-16 rounded object-cover flex-shrink-0" onError={e => e.target.style.display='none'} />}
                        </div>
                        {ticketImage && <img src={ticketImage} alt="" className="w-full rounded max-h-48 object-cover" onError={e => e.target.style.display='none'} />}
                        {ticketFooter && <p className="text-[#949ba4] text-xs mt-2 pt-2 border-t border-white/5">{ticketFooter}</p>}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 bg-[#5865f2] text-white text-xs font-medium px-3 py-1.5 rounded">🎫 Ouvrir un ticket</span>
                  </div>
                </div>
              </div>
            )}

            {/* Verify Embed */}
            {botTab === 'Verify Embed' && (
              <div className="grid md:grid-cols-2 gap-6">
                <form onSubmit={handleSendVerifyEmbed} className="card p-6 space-y-4">
                  <h2 className="text-white font-semibold flex items-center gap-2"><Key size={16} /> Embed vérification de licence</h2>
                  <div>
                    <label className="label">Channel</label>
                    <select value={verifyChannel} onChange={e => setVerifyChannel(e.target.value)} className="input w-full" required>
                      <option value="">Sélectionner un channel</option>
                      {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                    </select>
                  </div>
                  <div><label className="label">Titre</label><input value={verifyTitle} onChange={e => setVerifyTitle(e.target.value)} className="input w-full" /></div>
                  <div><label className="label">Description</label><textarea value={verifyDesc} onChange={e => setVerifyDesc(e.target.value)} className="input w-full h-24 resize-none" /></div>
                  <div>
                    <label className="label">Couleur</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {PRESET_COLORS.map(p => (
                        <button key={p.value} type="button" onClick={() => setVerifyColor(p.value)}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${verifyColor === p.value ? 'border-white scale-110' : 'border-transparent'}`}
                          style={{ background: p.value }} />
                      ))}
                      <input type="color" value={verifyColor} onChange={e => setVerifyColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent" />
                    </div>
                  </div>
                  <div><label className="label">Footer (optionnel)</label><input value={verifyFooter} onChange={e => setVerifyFooter(e.target.value)} className="input w-full" /></div>
                  <div><label className="label">Image — URL (optionnel)</label><input value={verifyImage} onChange={e => setVerifyImage(e.target.value)} className="input w-full" placeholder="https://..." /></div>
                  <div><label className="label">Miniature — URL (optionnel)</label><input value={verifyThumbnail} onChange={e => setVerifyThumbnail(e.target.value)} className="input w-full" placeholder="https://..." /></div>
                  {verifyErr && <p className="text-red-400 text-sm">{verifyErr}</p>}
                  {verifyOk && <p className="text-green-400 text-sm flex items-center gap-1"><CheckCircle2 size={14} /> Embed envoyé !</p>}
                  <button className="btn-primary w-full flex items-center justify-center gap-2" disabled={verifySending}>
                    <Send size={14} /> {verifySending ? 'Envoi...' : 'Envoyer'}
                  </button>
                </form>
                <div className="space-y-3">
                  <p className="text-surface-500 text-xs uppercase tracking-wide">Aperçu</p>
                  <div className="bg-[#1e1f22] rounded-lg p-4 space-y-3">
                    <div className="flex gap-3">
                      <div className="w-1 rounded-full flex-shrink-0" style={{ background: verifyColor }} />
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between gap-3">
                          <div className="flex-1">
                            {verifyTitle && <p className="text-white font-semibold text-sm">{verifyTitle}</p>}
                            <p className="text-[#dbdee1] text-sm whitespace-pre-wrap">{verifyDesc}</p>
                          </div>
                          {verifyThumbnail && <img src={verifyThumbnail} alt="" className="w-16 h-16 rounded object-cover flex-shrink-0" onError={e => e.target.style.display='none'} />}
                        </div>
                        {verifyImage && <img src={verifyImage} alt="" className="w-full rounded max-h-48 object-cover" onError={e => e.target.style.display='none'} />}
                        {verifyFooter && <p className="text-[#949ba4] text-xs mt-2 pt-2 border-t border-white/5">{verifyFooter}</p>}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 bg-[#57f287] text-black text-xs font-medium px-3 py-1.5 rounded">🔑 Vérifier ma licence</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tickets */}
            {botTab === 'Tickets' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-semibold flex items-center gap-2"><Ticket size={16} /> Tickets ouverts ({tickets.length})</h2>
                  <button onClick={() => { setLoadingTickets(true); adminBotTickets().then(t => { setTickets(t); setLoadingTickets(false) }).catch(() => setLoadingTickets(false)) }} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3">
                    <RefreshCw size={13} /> Actualiser
                  </button>
                </div>
                {loadingTickets ? <p className="text-surface-500">Chargement...</p>
                  : tickets.length === 0 ? <div className="card p-8 text-center text-surface-500">Aucun ticket ouvert.</div>
                  : (
                    <div className="space-y-2">
                      {tickets.map(t => (
                        <div key={t.id} className="card p-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-white font-medium">#{t.name}</p>
                            <p className="text-surface-500 text-xs">{new Date(t.createdAt).toLocaleString('fr-FR')}</p>
                          </div>
                          <button onClick={() => handleCloseTicket(t.id)} className="btn-danger flex items-center gap-1.5 text-sm py-1.5 px-3">
                            <X size={13} /> Fermer
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}

            {/* Bienvenue */}
            {botTab === 'Bienvenue' && (
              <form onSubmit={handleSaveWelcome} className="space-y-8 max-w-2xl">
                <div className="card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-white font-semibold flex items-center gap-2"><Users size={16} /> Message de bienvenue</h2>
                    <div onClick={() => setWc(w => ({ ...w, enabled: !w.enabled }))}
                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${wc.enabled ? 'bg-rust-500' : 'bg-surface-700'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${wc.enabled ? 'left-5' : 'left-0.5'}`} />
                    </div>
                  </div>
                  <div><label className="label">Titre</label><input value={wc.title} onChange={e => setWc(w => ({ ...w, title: e.target.value }))} className="input w-full" placeholder="Bienvenue ! 👋" /></div>
                  <div>
                    <label className="label">Description <span className="text-surface-500 text-xs">— variables: {'{user}'} {'{username}'} {'{server}'} {'{memberCount}'}</span></label>
                    <textarea value={wc.description} onChange={e => setWc(w => ({ ...w, description: e.target.value }))} className="input w-full h-32 resize-none" />
                  </div>
                  <div className="flex gap-6 flex-wrap">
                    <div>
                      <label className="label">Couleur</label>
                      <div className="flex items-center gap-2">
                        {PRESET_COLORS.map(p => (
                          <button key={p.value} type="button" onClick={() => setWc(w => ({ ...w, color: p.value }))}
                            className={`w-7 h-7 rounded-full border-2 transition-all ${wc.color === p.value ? 'border-white scale-110' : 'border-transparent'}`}
                            style={{ background: p.value }} />
                        ))}
                        <input type="color" value={wc.color} onChange={e => setWc(w => ({ ...w, color: e.target.value }))} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer self-end pb-1">
                      <input type="checkbox" checked={wc.thumbnail} onChange={e => setWc(w => ({ ...w, thumbnail: e.target.checked }))} className="accent-rust-500" />
                      <span className="text-sm text-surface-400">Avatar en miniature</span>
                    </label>
                  </div>
                  <div><label className="label">Footer (optionnel)</label><input value={wc.footer} onChange={e => setWc(w => ({ ...w, footer: e.target.value }))} className="input w-full" /></div>
                  <div className="bg-[#1e1f22] rounded-lg p-4">
                    <div className="flex gap-3">
                      <div className="w-1 rounded-full flex-shrink-0" style={{ background: wc.color }} />
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between gap-3">
                          <div>
                            {wc.title && <p className="text-white font-semibold text-sm">{wc.title}</p>}
                            <p className="text-[#dbdee1] text-sm whitespace-pre-wrap">{wc.description.replace(/{user}/g, '@Joueur').replace(/{username}/g, 'Joueur').replace(/{server}/g, 'RSM Pro').replace(/{memberCount}/g, '42')}</p>
                          </div>
                          {wc.thumbnail && <div className="w-12 h-12 rounded-full bg-surface-700 flex-shrink-0 flex items-center justify-center text-surface-500 text-xs">Avatar</div>}
                        </div>
                        {wc.footer && <p className="text-[#949ba4] text-xs mt-2 pt-2 border-t border-white/5">{wc.footer}</p>}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-white font-semibold flex items-center gap-2"><X size={16} /> Message de départ</h2>
                    <div onClick={() => setGc(g => ({ ...g, enabled: !g.enabled }))}
                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${gc.enabled ? 'bg-rust-500' : 'bg-surface-700'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${gc.enabled ? 'left-5' : 'left-0.5'}`} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Channel (laisser vide = même que bienvenue)</label>
                    <select value={gc.channelId} onChange={e => setGc(g => ({ ...g, channelId: e.target.value }))} className="input w-full">
                      <option value="">Même channel que bienvenue</option>
                      {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                    </select>
                  </div>
                  <div><label className="label">Titre</label><input value={gc.title} onChange={e => setGc(g => ({ ...g, title: e.target.value }))} className="input w-full" placeholder="Au revoir 👋" /></div>
                  <div>
                    <label className="label">Description <span className="text-surface-500 text-xs">— variables: {'{user}'} {'{username}'} {'{server}'} {'{memberCount}'}</span></label>
                    <textarea value={gc.description} onChange={e => setGc(g => ({ ...g, description: e.target.value }))} className="input w-full h-20 resize-none" />
                  </div>
                  <div>
                    <label className="label">Couleur</label>
                    <div className="flex items-center gap-2">
                      {PRESET_COLORS.map(p => (
                        <button key={p.value} type="button" onClick={() => setGc(g => ({ ...g, color: p.value }))}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${gc.color === p.value ? 'border-white scale-110' : 'border-transparent'}`}
                          style={{ background: p.value }} />
                      ))}
                      <input type="color" value={gc.color} onChange={e => setGc(g => ({ ...g, color: e.target.value }))} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent" />
                    </div>
                  </div>
                  <div><label className="label">Footer (optionnel)</label><input value={gc.footer} onChange={e => setGc(g => ({ ...g, footer: e.target.value }))} className="input w-full" /></div>
                </div>
                {wcErr && <p className="text-red-400 text-sm">{wcErr}</p>}
                {wcOk && <p className="text-green-400 text-sm flex items-center gap-1"><CheckCircle2 size={14} /> Sauvegardé !</p>}
                <button type="submit" disabled={wcSaving} className="btn-primary flex items-center gap-2">
                  <CheckCircle2 size={15} /> {wcSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </form>
            )}

            {/* Release */}
            {botTab === 'Release' && (
              <div className="card p-8 space-y-5 max-w-lg">
                <h2 className="text-white font-semibold flex items-center gap-2"><Megaphone size={16} /> Annoncer une release</h2>
                <p className="text-surface-500 text-sm">Poste une annonce de release dans le channel changelog du Discord.</p>
                <form onSubmit={handleAnnounce} className="space-y-4">
                  <div><label className="label">Version <span className="text-rust-500">*</span></label><input value={announceVersion} onChange={e => setAnnounceVersion(e.target.value)} className="input w-full" placeholder="v1.1.52" required /></div>
                  <div><label className="label">Changelog (optionnel)</label><textarea value={announceBody} onChange={e => setAnnounceBody(e.target.value)} className="input w-full h-32 resize-none" placeholder={"### Nouveautés\n- Ajout de X\n\n### Corrections\n- Fix du bug Y"} /></div>
                  {announceErr && <p className="text-red-400 text-sm">{announceErr}</p>}
                  {announceOk && <p className="text-green-400 text-sm flex items-center gap-1"><CheckCircle2 size={14} /> Annonce envoyée !</p>}
                  <button type="submit" disabled={announceLoading} className="btn-primary flex items-center gap-2">
                    <Megaphone size={15} /> {announceLoading ? 'Envoi...' : "Lancer l'annonce"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Logs */}
        {tab === 'Logs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2"><ClipboardList size={16} className="text-rust-500" /> Journal des actions admin</h3>
              <button onClick={() => adminLogs().then(setLogs)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"><RefreshCw size={12} /> Actualiser</button>
            </div>
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-surface-400 border-b border-surface-700">
                    {['Date', 'Action', 'Détails'].map(h => <th key={h} className="pb-3 pr-4 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800">
                  {logs.map(l => (
                    <tr key={l.id}>
                      <td className="py-3 pr-4 text-surface-500 text-xs whitespace-nowrap">{new Date(l.created_at).toLocaleString('fr-FR')}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                          l.action.includes('ban') ? 'bg-red-500/15 text-red-400' :
                          l.action.includes('refund') || l.action.includes('delete') ? 'bg-orange-500/15 text-orange-400' :
                          l.action.includes('generate') ? 'bg-blue-500/15 text-blue-400' :
                          'bg-surface-700 text-surface-400'
                        }`}>{l.action}</span>
                      </td>
                      <td className="py-3 text-surface-400 text-xs">{l.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {logs.length === 0 && <p className="text-center text-surface-500 py-8">Aucune action enregistrée</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
