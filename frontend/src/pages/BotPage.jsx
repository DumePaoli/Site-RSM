import { useEffect, useState } from 'react'
import {
  adminLogin, adminBotStats, adminBotChannels, adminBotTickets,
  adminBotCloseTicket, adminBotSendEmbed, adminBotAnnounceRelease, adminBotDebug,
  adminBotSendTicketEmbed, adminBotGetWelcomeConfig, adminBotSetWelcomeConfig
} from '../api/client'
import { Bot, Users, Hash, Shield, Ticket, Send, Megaphone, LogIn, X, RefreshCw, CheckCircle2 } from 'lucide-react'

const TABS = ['Stats', 'Embed', 'Ticket Embed', 'Tickets', 'Bienvenue', 'Release']

const PRESET_COLORS = [
  { label: 'Rouge RSM', value: '#c12814' },
  { label: 'Vert', value: '#22c55e' },
  { label: 'Bleu', value: '#3b82f6' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Violet', value: '#8b5cf6' },
]

export default function BotPage() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('rsm_admin'))
  const [pass, setPass] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [tab, setTab] = useState('Stats')

  const [stats, setStats] = useState(null)
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

  const [embedSending, setEmbedSending] = useState(false)
  const [embedOk, setEmbedOk] = useState(false)
  const [embedErr, setEmbedErr] = useState('')

  const [announceLoading, setAnnounceLoading] = useState(false)
  const [announceOk, setAnnounceOk] = useState(false)
  const [announceErr, setAnnounceErr] = useState('')
  const [announceVersion, setAnnounceVersion] = useState('')
  const [announceBody, setAnnounceBody] = useState('')
  const [debugInfo, setDebugInfo] = useState(null)

  const [wc, setWc] = useState({ enabled: true, title: '', description: '', color: '#c12814', footer: '', thumbnail: true })
  const [gc, setGc] = useState({ enabled: false, channelId: '', title: '', description: '', color: '#6b7280', footer: '' })
  const [wcSaving, setWcSaving] = useState(false)
  const [wcOk, setWcOk] = useState(false)
  const [wcErr, setWcErr] = useState('')

  async function handleLogin(e) {
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

  useEffect(() => {
    if (!authed) return
    adminBotStats().then(setStats).catch(e => {
      if (e.response?.status === 401 || e.response?.status === 403) {
        localStorage.removeItem('rsm_admin')
        localStorage.removeItem('rsm_token')
        setAuthed(false)
      }
    })
    adminBotChannels().then(setChannels).catch(() => {})
  }, [authed])

  function loadTickets() {
    setLoadingTickets(true)
    adminBotTickets().then(t => { setTickets(t); setLoadingTickets(false) }).catch(() => setLoadingTickets(false))
  }

  useEffect(() => {
    if (authed && tab === 'Tickets') loadTickets()
    if (authed && tab === 'Bienvenue') {
      adminBotGetWelcomeConfig().then(d => {
        if (d.welcome) setWc(d.welcome)
        if (d.goodbye) setGc(d.goodbye)
      }).catch(() => {})
    }
  }, [authed, tab])

  async function handleCloseTicket(id) {
    if (!confirm('Fermer et supprimer ce ticket ?')) return
    try {
      await adminBotCloseTicket(id)
      setTickets(t => t.filter(x => x.id !== id))
    } catch(e) {
      alert(e.response?.data?.detail || 'Erreur')
    }
  }

  async function handleSaveWelcome(e) {
    e.preventDefault()
    setWcSaving(true); setWcOk(false); setWcErr('')
    try {
      await adminBotSetWelcomeConfig({ welcome: wc, goodbye: gc })
      setWcOk(true); setTimeout(() => setWcOk(false), 3000)
    } catch(e) { setWcErr(e.response?.data?.detail || 'Erreur') }
    setWcSaving(false)
  }

  async function handleSendTicketEmbed(e) {
    e.preventDefault()
    setTicketSending(true); setTicketOk(false); setTicketErr('')
    try {
      await adminBotSendTicketEmbed({ channelId: ticketChannel, title: ticketTitle, description: ticketDesc, color: ticketColor, footer: ticketFooter, image: ticketImage, thumbnail: ticketThumbnail })
      setTicketOk(true)
      setTimeout(() => setTicketOk(false), 3000)
    } catch(e) {
      setTicketErr(e.response?.data?.detail || 'Erreur')
    }
    setTicketSending(false)
  }

  async function handleSendEmbed(e) {
    e.preventDefault()
    setEmbedSending(true); setEmbedOk(false); setEmbedErr('')
    try {
      await adminBotSendEmbed({ channelId: embedChannel, title: embedTitle, description: embedDesc, color: embedColor, footer: embedFooter, image: embedImage, thumbnail: embedThumbnail })
      setEmbedOk(true)
      setTimeout(() => setEmbedOk(false), 3000)
    } catch(e) {
      setEmbedErr(e.response?.data?.detail || 'Erreur')
    }
    setEmbedSending(false)
  }

  async function handleAnnounce(e) {
    e.preventDefault()
    setAnnounceLoading(true); setAnnounceOk(false); setAnnounceErr('')
    try {
      await adminBotAnnounceRelease({ tag_name: announceVersion, body: announceBody })
      setAnnounceOk(true)
      setTimeout(() => setAnnounceOk(false), 4000)
    } catch(e) {
      setAnnounceErr(e.response?.data?.detail || 'Erreur')
    }
    setAnnounceLoading(false)
  }

  const previewColor = PRESET_COLORS.find(p => p.value === embedColor)?.value || embedColor

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Bot size={22} className="text-rust-500" />
          <h1 className="text-white font-bold text-lg">Bot Control — Admin</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label">Mot de passe admin</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} className="input w-full" placeholder="••••••••" />
            {loginErr && <p className="text-red-400 text-sm mt-1">{loginErr}</p>}
          </div>
          <button className="btn-primary w-full flex items-center justify-center gap-2">
            <LogIn size={15} /> Connexion
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center gap-3">
        <Bot size={24} className="text-rust-500" />
        <h1 className="text-white font-bold text-2xl">Bot Control</h1>
        {stats?.online && (
          <span className="badge-online ml-2 text-xs px-2 py-0.5 rounded-full">En ligne</span>
        )}
        {stats && !stats.online && (
          <span className="badge-offline ml-2 text-xs px-2 py-0.5 rounded-full">Hors ligne</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t ? 'border-rust-500 text-white' : 'border-transparent text-surface-500 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Stats */}
      {tab === 'Stats' && (
        <div className="space-y-4">
          {!stats ? (
            <p className="text-surface-500">Chargement...</p>
          ) : !stats.online ? (
            <div className="card p-6 text-surface-500">Bot hors ligne ou non connecté.</div>
          ) : (
            <>
              {stats.guildName && (
                <div className="card p-6 flex items-center gap-4">
                  {stats.guildIcon && <img src={stats.guildIcon} className="w-12 h-12 rounded-full" alt="" />}
                  <div>
                    <p className="text-white font-semibold text-lg">{stats.guildName}</p>
                    <p className="text-surface-500 text-sm">Connecté en tant que <span className="text-rust-400">{stats.tag}</span></p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Membres', value: stats.memberCount, icon: <Users size={18} /> },
                  { label: 'Channels', value: stats.channelCount, icon: <Hash size={18} /> },
                  { label: 'Rôles', value: stats.roleCount, icon: <Shield size={18} /> },
                  { label: 'Uptime', value: stats.uptime ? `${Math.floor(stats.uptime / 3600)}h ${Math.floor((stats.uptime % 3600) / 60)}m` : '—', icon: <Bot size={18} /> },
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
      {tab === 'Embed' && (
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
                  <button key={p.value} type="button"
                    onClick={() => setEmbedColor(p.value)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${embedColor === p.value ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ background: p.value }} title={p.label} />
                ))}
                <input type="color" value={embedColor} onChange={e => setEmbedColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent" title="Couleur personnalisée" />
              </div>
            </div>
            <div>
              <label className="label">Footer (optionnel)</label>
              <input value={embedFooter} onChange={e => setEmbedFooter(e.target.value)} className="input w-full" placeholder="Texte du footer" />
            </div>
            <div>
              <label className="label">Image principale — URL (optionnel)</label>
              <input value={embedImage} onChange={e => setEmbedImage(e.target.value)} className="input w-full" placeholder="https://..." />
            </div>
            <div>
              <label className="label">Miniature (thumbnail) — URL (optionnel)</label>
              <input value={embedThumbnail} onChange={e => setEmbedThumbnail(e.target.value)} className="input w-full" placeholder="https://..." />
            </div>
            {embedErr && <p className="text-red-400 text-sm">{embedErr}</p>}
            {embedOk && <p className="text-green-400 text-sm flex items-center gap-1"><CheckCircle2 size={14} /> Embed envoyé !</p>}
            <button className="btn-primary w-full flex items-center justify-center gap-2" disabled={embedSending}>
              <Send size={14} /> {embedSending ? 'Envoi...' : 'Envoyer'}
            </button>
          </form>

          {/* Preview */}
          <div className="space-y-3">
            <p className="text-surface-500 text-xs uppercase tracking-wide">Aperçu</p>
            <div className="bg-[#1e1f22] rounded-lg p-4">
              <div className="flex gap-3">
                <div className="w-1 rounded-full flex-shrink-0" style={{ background: previewColor }} />
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      {embedTitle && <p className="text-white font-semibold text-sm">{embedTitle}</p>}
                      <p className="text-[#dbdee1] text-sm whitespace-pre-wrap break-words">{embedDesc || <span className="text-surface-600 italic">Description...</span>}</p>
                    </div>
                    {embedThumbnail && (
                      <img src={embedThumbnail} alt="" className="w-16 h-16 rounded object-cover flex-shrink-0" onError={e => e.target.style.display='none'} />
                    )}
                  </div>
                  {embedImage && (
                    <img src={embedImage} alt="" className="w-full rounded mt-2 max-h-48 object-cover" onError={e => e.target.style.display='none'} />
                  )}
                  {embedFooter && <p className="text-[#949ba4] text-xs mt-2 pt-2 border-t border-white/5">{embedFooter}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bienvenue */}
      {tab === 'Bienvenue' && (
        <form onSubmit={handleSaveWelcome} className="space-y-8 max-w-2xl">
          {/* Welcome */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold flex items-center gap-2"><Users size={16} /> Message de bienvenue</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-surface-400">Activé</span>
                <div onClick={() => setWc(w => ({ ...w, enabled: !w.enabled }))}
                  className={`w-10 h-5 rounded-full transition-colors relative ${wc.enabled ? 'bg-rust-500' : 'bg-surface-700'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${wc.enabled ? 'left-5' : 'left-0.5'}`} />
                </div>
              </label>
            </div>
            <div>
              <label className="label">Titre</label>
              <input value={wc.title} onChange={e => setWc(w => ({ ...w, title: e.target.value }))} className="input w-full" placeholder="Bienvenue ! 👋" />
            </div>
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
            <div>
              <label className="label">Footer (optionnel)</label>
              <input value={wc.footer} onChange={e => setWc(w => ({ ...w, footer: e.target.value }))} className="input w-full" />
            </div>
            {/* Preview */}
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

          {/* Goodbye */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold flex items-center gap-2"><X size={16} /> Message de départ</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-surface-400">Activé</span>
                <div onClick={() => setGc(g => ({ ...g, enabled: !g.enabled }))}
                  className={`w-10 h-5 rounded-full transition-colors relative ${gc.enabled ? 'bg-rust-500' : 'bg-surface-700'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${gc.enabled ? 'left-5' : 'left-0.5'}`} />
                </div>
              </label>
            </div>
            <div>
              <label className="label">Channel (laisser vide = même que bienvenue)</label>
              <select value={gc.channelId} onChange={e => setGc(g => ({ ...g, channelId: e.target.value }))} className="input w-full">
                <option value="">Même channel que bienvenue</option>
                {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Titre</label>
              <input value={gc.title} onChange={e => setGc(g => ({ ...g, title: e.target.value }))} className="input w-full" placeholder="Au revoir 👋" />
            </div>
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
            <div>
              <label className="label">Footer (optionnel)</label>
              <input value={gc.footer} onChange={e => setGc(g => ({ ...g, footer: e.target.value }))} className="input w-full" />
            </div>
            {/* Preview */}
            <div className="bg-[#1e1f22] rounded-lg p-4">
              <div className="flex gap-3">
                <div className="w-1 rounded-full flex-shrink-0" style={{ background: gc.color }} />
                <div className="flex-1 space-y-1">
                  {gc.title && <p className="text-white font-semibold text-sm">{gc.title}</p>}
                  <p className="text-[#dbdee1] text-sm whitespace-pre-wrap">{gc.description.replace(/{user}/g, '@Joueur').replace(/{username}/g, 'Joueur').replace(/{server}/g, 'RSM Pro').replace(/{memberCount}/g, '41')}</p>
                  {gc.footer && <p className="text-[#949ba4] text-xs mt-2 pt-2 border-t border-white/5">{gc.footer}</p>}
                </div>
              </div>
            </div>
          </div>

          {wcErr && <p className="text-red-400 text-sm">{wcErr}</p>}
          {wcOk && <p className="text-green-400 text-sm flex items-center gap-1"><CheckCircle2 size={14} /> Sauvegardé !</p>}
          <button type="submit" disabled={wcSaving} className="btn-primary flex items-center gap-2">
            <CheckCircle2 size={15} /> {wcSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </form>
      )}

      {/* Ticket Embed */}
      {tab === 'Ticket Embed' && (
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
            <div>
              <label className="label">Titre</label>
              <input value={ticketTitle} onChange={e => setTicketTitle(e.target.value)} className="input w-full" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea value={ticketDesc} onChange={e => setTicketDesc(e.target.value)} className="input w-full h-24 resize-none" />
            </div>
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
            <div>
              <label className="label">Footer (optionnel)</label>
              <input value={ticketFooter} onChange={e => setTicketFooter(e.target.value)} className="input w-full" />
            </div>
            <div>
              <label className="label">Image principale — URL (optionnel)</label>
              <input value={ticketImage} onChange={e => setTicketImage(e.target.value)} className="input w-full" placeholder="https://..." />
            </div>
            <div>
              <label className="label">Miniature — URL (optionnel)</label>
              <input value={ticketThumbnail} onChange={e => setTicketThumbnail(e.target.value)} className="input w-full" placeholder="https://..." />
            </div>
            {ticketErr && <p className="text-red-400 text-sm">{ticketErr}</p>}
            {ticketOk && <p className="text-green-400 text-sm flex items-center gap-1"><CheckCircle2 size={14} /> Embed envoyé !</p>}
            <button className="btn-primary w-full flex items-center justify-center gap-2" disabled={ticketSending}>
              <Send size={14} /> {ticketSending ? 'Envoi...' : 'Envoyer'}
            </button>
          </form>

          {/* Preview */}
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
              <div>
                <span className="inline-flex items-center gap-1.5 bg-[#5865f2] text-white text-xs font-medium px-3 py-1.5 rounded">
                  🎫 Ouvrir un ticket
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tickets */}
      {tab === 'Tickets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold flex items-center gap-2"><Ticket size={16} /> Tickets ouverts ({tickets.length})</h2>
            <button onClick={loadTickets} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3">
              <RefreshCw size={13} /> Actualiser
            </button>
          </div>
          {loadingTickets ? (
            <p className="text-surface-500">Chargement...</p>
          ) : tickets.length === 0 ? (
            <div className="card p-8 text-center text-surface-500">Aucun ticket ouvert.</div>
          ) : (
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

      {/* Release */}
      {tab === 'Release' && (
        <div className="card p-8 space-y-5 max-w-lg">
          <h2 className="text-white font-semibold flex items-center gap-2"><Megaphone size={16} /> Annoncer une release</h2>
          <p className="text-surface-500 text-sm">
            Poste une annonce de release dans le channel changelog du Discord.
          </p>
          <form onSubmit={handleAnnounce} className="space-y-4">
            <div>
              <label className="label">Version <span className="text-rust-500">*</span></label>
              <input value={announceVersion} onChange={e => setAnnounceVersion(e.target.value)} className="input w-full" placeholder="v1.1.39" required />
            </div>
            <div>
              <label className="label">Contenu / Changelog (optionnel)</label>
              <textarea value={announceBody} onChange={e => setAnnounceBody(e.target.value)} className="input w-full h-32 resize-none" placeholder={"### Nouveautés\n- Ajout de la fonctionnalité X\n\n### Corrections\n- Fix du bug Y"} />
            </div>
            {announceErr && <p className="text-red-400 text-sm">{announceErr}</p>}
            {announceOk && <p className="text-green-400 text-sm flex items-center gap-1"><CheckCircle2 size={14} /> Annonce envoyée !</p>}
            <button type="submit" disabled={announceLoading} className="btn-primary flex items-center gap-2">
              <Megaphone size={15} /> {announceLoading ? 'Envoi...' : "Lancer l'annonce"}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
