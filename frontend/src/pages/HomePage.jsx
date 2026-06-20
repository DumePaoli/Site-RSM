import { Link } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import {
  Zap, Shield, RotateCcw, Archive, Calendar,
  Monitor, Plug, Users, Terminal, ChevronDown,
  ArrowRight, Download, Cpu, HardDrive, Activity, Wifi
} from 'lucide-react'
import { getProducts } from '../api/client'

/* ── Data ──────────────────────────────────────────────────────────────── */

const FEATURES = [
  { icon: Zap,        title: 'Démarrage 1 clic',     desc: 'Lancez, stoppez, redémarrez — sans terminal.' },
  { icon: Terminal,   title: 'Console RCON',          desc: 'Historique, auto-complétion, alias de commandes.' },
  { icon: Users,      title: 'Joueurs',               desc: 'Kick, ban, PM, historique de présence.' },
  { icon: Monitor,    title: 'Monitoring',            desc: 'CPU / RAM / joueurs — 1h de graphique en anneau.' },
  { icon: Archive,    title: 'Sauvegardes auto',      desc: 'ZIP planifiés, rotation automatique.' },
  { icon: Calendar,   title: 'Wipe planifié',         desc: 'Warnings in-game, recurrence configurable.' },
  { icon: Plug,       title: 'Plugins Carbon',        desc: 'Install, update, remove depuis l\'UI.' },
  { icon: RotateCcw,  title: 'Auto-redémarrage',      desc: 'Crash détecté → serveur relancé en secondes.' },
  { icon: Shield,     title: 'Whitelist & Bans',      desc: 'Gestion directe depuis l\'interface.' },
  { icon: Users,      title: 'Multi-serveurs',        desc: 'Plusieurs serveurs, une seule fenêtre.' },
  { icon: Zap,        title: 'Mises à jour auto',     desc: 'RSM Pro se met à jour en arrière-plan.' },
  { icon: Monitor,    title: 'Discord Bot',           desc: 'Notifs crash, relay chat, rapports journaliers.' },
]

const REVIEWS = [
  { author: 'NightWolf_FR',  stars: 5, text: 'Meilleur outil pour mon serveur Rust. Le Discord bot seul vaut l\'achat. Setup en 10 minutes.' },
  { author: 'Kryztalix',     stars: 5, text: 'Enfin une interface graphique propre. Plus besoin de taper des commandes à la main.' },
  { author: 'AdminPvP2024',  stars: 5, text: 'Les wipes planifiés sont parfaits. Warnings in-game auto, tout se fait sans moi.' },
  { author: 'SteelBackpack', stars: 5, text: 'Support très réactif sur Discord. Problème résolu en 20 min. Stable depuis 3 mois.' },
  { author: 'RustFR_Admin',  stars: 5, text: 'J\'ai essayé d\'autres outils. RSM Pro est de loin le plus complet. Sauvegarde m\'a sauvé 2x.' },
  { author: 'Toxicus_PVP',   stars: 4, text: 'Interface claire, plugins Carbon faciles. Petite courbe d\'apprentissage mais les docs sont bien.' },
]

const FAQS = [
  { q: 'Sur quel OS fonctionne RSM Pro ?',         a: 'Windows 10 et 11 64-bit. Exécutable autonome — aucune installation Python ou runtime.' },
  { q: 'Combien de serveurs puis-je gérer ?',       a: 'Autant que vous voulez. Multi-serveurs natif depuis une seule fenêtre.' },
  { q: 'Carbon ou Oxide — lequel est supporté ?',   a: 'Les deux. RSM Pro détecte automatiquement votre framework et adapte les chemins.' },
  { q: 'Ma licence est valable combien de temps ?', a: 'Plans 1m/3m : expiration à date. À Vie : accès permanent, toutes mises à jour incluses.' },
  { q: 'Comment activer ma licence ?',              a: 'Email avec clé RSM-XXXX-XXXX-XXXX après achat. Entrez-la dans l\'onglet Licence de l\'app.' },
  { q: 'Puis-je transférer ma licence ?',           a: 'Oui. Désactivez dans l\'app sur l\'ancienne machine, activez sur la nouvelle.' },
]

const TICKER_ITEMS = [
  'Démarrage 1 clic', 'Console RCON', 'Discord Bot', 'Wipe Manager',
  'Auto-backup', 'Crash Guard', 'Plugin Manager', 'Multi-serveurs',
  'Whitelist', 'Monitoring temps réel', 'Mises à jour auto', 'Support Discord',
]

/* ── Terminal log animation ─────────────────────────────────────────────── */

const LOG_LINES = [
  { t: 0,    color: 'text-surface-500', msg: '> RSM Pro v1.1.24 starting...' },
  { t: 400,  color: 'text-green-400',   msg: '[OK] Server process detected (PID 4821)' },
  { t: 900,  color: 'text-surface-400', msg: '[18:42:03] PlayerA joined the server' },
  { t: 1500, color: 'text-surface-400', msg: '[18:42:11] Auto-save completed (4.2s)' },
  { t: 2100, color: 'text-rust-400',    msg: '[18:43:00] ⚠ Wipe in 60 minutes' },
  { t: 2800, color: 'text-blue-400',    msg: '[18:43:05] Backup → save_20250620.zip' },
  { t: 3500, color: 'text-green-400',   msg: '[18:44:01] PlayerB joined the server' },
  { t: 4200, color: 'text-surface-400', msg: '[18:45:00] Discord notification sent' },
  { t: 5000, color: 'text-rust-400',    msg: '[18:58:00] ⚠ Wipe in 5 minutes' },
  { t: 5700, color: 'text-yellow-400',  msg: '[19:00:00] Wipe started — map cleared' },
  { t: 6300, color: 'text-green-400',   msg: '[19:00:04] Server restarted successfully' },
]

function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState([])

  useEffect(() => {
    const timers = LOG_LINES.map((line) =>
      setTimeout(() => {
        setVisibleLines((prev) => {
          const next = [...prev, line]
          return next.slice(-8)
        })
      }, line.t)
    )
    const restart = setTimeout(() => setVisibleLines([]), 7000)
    return () => { timers.forEach(clearTimeout); clearTimeout(restart) }
  }, [visibleLines.length === 0 ? 0 : -1])

  useEffect(() => {
    const interval = setInterval(() => setVisibleLines([]), 7500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative bg-surface-950 border border-surface-800 rounded-none overflow-hidden scanlines">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-2 bg-surface-900 border-b border-surface-800">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="ml-2 text-xs font-mono text-surface-500">RSM Pro — Console</span>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-mono text-green-500">LIVE</span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 border-b border-surface-800">
        {[
          { icon: Activity,  label: 'STATUS', value: 'ONLINE',  color: 'text-green-400' },
          { icon: Users,     label: 'PLAYERS', value: '18/50',  color: 'text-rust-400' },
          { icon: Cpu,       label: 'CPU',     value: '34%',    color: 'text-blue-400' },
          { icon: HardDrive, label: 'RAM',     value: '6.2 GB', color: 'text-purple-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex flex-col items-center py-3 border-r border-surface-800 last:border-r-0">
            <Icon size={12} className={`${color} mb-1`} />
            <span className={`font-mono text-sm font-bold ${color}`}>{value}</span>
            <span className="font-mono text-xs text-surface-600 uppercase tracking-widest">{label}</span>
          </div>
        ))}
      </div>

      {/* Log output */}
      <div className="p-4 h-44 overflow-hidden font-mono text-xs space-y-1.5">
        {visibleLines.map((line, i) => (
          <div key={i} className={`${line.color} fade-up`}>{line.msg}</div>
        ))}
        <span className="text-rust-500 cursor-blink">█</span>
      </div>
    </div>
  )
}

/* ── FAQ item ───────────────────────────────────────────────────────────── */

function FAQItem({ q, a, index }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-surface-800">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between py-5 text-left group"
      >
        <div className="flex items-start gap-4">
          <span className="font-mono text-xs text-rust-500 mt-0.5 w-5 flex-shrink-0">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="font-medium text-white text-sm group-hover:text-rust-400 transition-colors">{q}</span>
        </div>
        <ChevronDown size={14} className={`text-surface-500 flex-shrink-0 mt-0.5 ml-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="pb-5 pl-9 pr-6 text-surface-400 text-sm leading-relaxed">
          {a}
        </div>
      )}
    </div>
  )
}

/* ── Main ───────────────────────────────────────────────────────────────── */

export default function HomePage() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    getProducts().then(setProducts).catch(() => {
      setProducts([
        { id: 1, name: '1 Mois',  slug: '1m',       price: 9.99,  duration: '1m',       description: 'Accès complet 1 mois' },
        { id: 2, name: '3 Mois',  slug: '3m',       price: 19.99, duration: '3m',       description: 'Meilleure offre' },
        { id: 3, name: 'À Vie',   slug: 'lifetime', price: 29.99, duration: 'lifetime', description: 'Accès à vie + mises à jour' },
      ])
    })
  }, [])

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-surface-950 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(249,115,22,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}
        />
        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-rust-500/30 via-rust-500/5 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-24 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-rust-500 mb-6 border border-rust-500/30 px-3 py-1.5 bg-rust-500/5">
              <span className="w-1.5 h-1.5 rounded-full bg-rust-500 animate-pulse" />
              v1.1.24 · Windows 10/11 · Carbon &amp; Oxide
            </div>

            <h1 className="text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight mb-6">
              Votre serveur<br />
              <span className="text-rust-500">Rust</span>,<br />
              sous contrôle.
            </h1>

            <p className="text-surface-400 text-lg leading-relaxed mb-8 max-w-md">
              Interface Windows tout-en-un pour admins sérieux. Démarrage, RCON, sauvegardes, wipes planifiés, Discord bot — sans ligne de commande.
            </p>

            {/* Stats inline */}
            <div className="flex items-center gap-8 mb-10 text-sm">
              {[['500+', 'serveurs actifs'], ['< 24h', 'support'], ['3 ans', 'd\'uptime']].map(([v, l]) => (
                <div key={l}>
                  <div className="font-mono font-black text-2xl text-white">{v}</div>
                  <div className="text-surface-500 text-xs mt-0.5">{l}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/checkout" className="btn-primary text-sm px-7 py-3.5">
                Obtenir RSM Pro <ArrowRight size={15} />
              </Link>
              <a href="#features" className="btn-secondary text-sm px-7 py-3.5">
                Voir les fonctionnalités
              </a>
            </div>
          </div>

          {/* Right — terminal */}
          <div className="relative">
            <TerminalDemo />
            {/* Corner decorations */}
            <div className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-rust-500" />
            <div className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-rust-500" />
          </div>
        </div>
      </section>

      {/* ── TICKER ───────────────────────────────────────────────────────── */}
      <div className="border-y border-surface-800 bg-surface-900 overflow-hidden py-3 relative">
        <div className="ticker-inner flex gap-12 whitespace-nowrap select-none" style={{ width: 'max-content' }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-xs font-mono text-surface-500 uppercase tracking-widest">
              <span className="text-rust-500">◆</span> {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-28 bg-surface-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-[300px_1fr] gap-16 items-start">
            {/* Left sticky label */}
            <div className="lg:sticky lg:top-32">
              <p className="font-mono text-xs text-rust-500 tracking-widest mb-3 uppercase">Fonctionnalités</p>
              <h2 className="text-4xl font-black text-white leading-tight mb-6">
                Tout ce dont un admin a besoin.
              </h2>
              <p className="text-surface-400 text-sm leading-relaxed mb-8">
                RSM Pro remplace une douzaine d'outils séparés par une seule application native Windows.
              </p>
              <Link to="/checkout" className="btn-primary text-sm">
                Commencer <ArrowRight size={14} />
              </Link>
            </div>

            {/* Right grid */}
            <div className="grid sm:grid-cols-2 gap-px bg-surface-800">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-surface-950 p-6 group hover:bg-surface-900 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 border border-surface-700 group-hover:border-rust-500/40 flex items-center justify-center flex-shrink-0 transition-colors">
                      <Icon size={14} className="text-rust-500" />
                    </div>
                    <div>
                      <h3 className="text-white text-sm font-semibold mb-1">{title}</h3>
                      <p className="text-surface-500 text-xs leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-28 bg-surface-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-16">
            <p className="font-mono text-xs text-rust-500 tracking-widest mb-3 uppercase">Tarifs</p>
            <h2 className="text-4xl font-black text-white">Choisissez votre plan.</h2>
            <p className="text-surface-400 text-sm mt-3">Livraison instantanée. Paiement sécurisé. Licence sur votre compte.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-surface-800 border border-surface-800">
            {products.map((p, i) => {
              const isHighlight = i === 2
              const maxPc = ['1 PC', '2 PC', '4 PC'][i] || '—'
              const label = ['1 Mois', '3 Mois', 'À Vie'][i] || p.name
              const sublabel = ['Essai', 'Populaire', 'Meilleur rapport'][i] || ''
              return (
                <div key={p.id} className={`relative p-8 flex flex-col ${isHighlight ? 'bg-surface-950' : 'bg-surface-900'}`}>
                  {isHighlight && (
                    <div className="absolute top-0 left-0 right-0 h-px bg-rust-500" />
                  )}
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <p className="font-mono text-xs text-surface-500 uppercase tracking-widest mb-1">{sublabel}</p>
                      <h3 className="text-xl font-black text-white">{label}</h3>
                    </div>
                    {isHighlight && (
                      <span className="text-xs font-mono text-rust-500 border border-rust-500/40 px-2 py-1 bg-rust-500/10">
                        RECOMMANDÉ
                      </span>
                    )}
                  </div>

                  <div className="mb-8">
                    <span className="text-5xl font-black text-white">{p.price.toFixed(0)}</span>
                    <span className="text-surface-400 text-lg">,{p.price.toFixed(2).split('.')[1]} €</span>
                    {p.duration !== 'lifetime' && (
                      <span className="block text-xs font-mono text-surface-500 mt-1">
                        / {p.duration === '1m' ? 'mois' : '3 mois'}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-8 flex-1 text-sm">
                    {[
                      'Toutes les fonctionnalités',
                      'Mises à jour incluses',
                      'Support Discord',
                      `${maxPc} maximum`,
                      p.duration === 'lifetime' ? 'Accès à vie garanti' : null,
                    ].filter(Boolean).map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-surface-400">
                        <span className="text-rust-500 text-xs">◆</span> {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={`/checkout?plan=${p.slug}`}
                    className={isHighlight ? 'btn-primary justify-center text-center text-sm py-3' : 'btn-secondary justify-center text-center text-sm py-3'}
                  >
                    Acheter — {p.price.toFixed(2).replace('.', ',')} € <ArrowRight size={14} />
                  </Link>
                </div>
              )
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-6 text-xs font-mono text-surface-500">
            {['Paiement Stripe sécurisé', 'Livraison instantanée par email', 'Licence HWID protégée', 'Support Discord inclus'].map(s => (
              <span key={s} className="flex items-center gap-2"><span className="text-rust-500">✓</span> {s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ──────────────────────────────────────────────────────── */}
      <section id="reviews" className="py-28 bg-surface-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-16">
            <p className="font-mono text-xs text-rust-500 tracking-widest mb-3 uppercase">Avis</p>
            <h2 className="text-4xl font-black text-white">Ce que disent les admins.</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-surface-800 border border-surface-800">
            {REVIEWS.map((r) => (
              <div key={r.author} className="bg-surface-950 p-6 hover:bg-surface-900 transition-colors">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: r.stars }).map((_, i) => (
                    <span key={i} className="text-rust-500 text-xs">★</span>
                  ))}
                </div>
                <p className="text-surface-300 text-sm leading-relaxed mb-6">"{r.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-surface-800 border border-surface-700 flex items-center justify-center text-xs font-mono text-rust-500">
                    {r.author[0]}
                  </div>
                  <span className="font-mono text-xs text-surface-500">{r.author}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-28 bg-surface-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-[300px_1fr] gap-16">
          <div className="lg:sticky lg:top-32">
            <p className="font-mono text-xs text-rust-500 tracking-widest mb-3 uppercase">FAQ</p>
            <h2 className="text-4xl font-black text-white leading-tight">Questions fréquentes.</h2>
            <p className="text-surface-400 text-sm mt-4 leading-relaxed">
              Besoin d'autre chose ? Rejoignez le Discord pour une réponse rapide.
            </p>
          </div>
          <div className="divide-y divide-surface-800 border-t border-surface-800">
            {FAQS.map((f, i) => <FAQItem key={f.q} {...f} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-28 bg-surface-950 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}
        />
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-rust-500/30 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="font-mono text-xs text-rust-500 tracking-widest mb-4 uppercase">Téléchargement</p>
            <h2 className="text-5xl font-black text-white leading-tight mb-6">
              Votre serveur<br />mérite mieux.
            </h2>
            <p className="text-surface-400 text-sm leading-relaxed mb-8 max-w-sm">
              Rejoignez des centaines d'admins qui ont arrêté de taper des commandes à la main.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/checkout" className="btn-primary text-sm px-7 py-3.5">
                Obtenir RSM Pro <ArrowRight size={15} />
              </Link>
              <a href="/download" className="btn-secondary text-sm px-7 py-3.5">
                <Download size={14} /> Télécharger
              </a>
            </div>
          </div>

          {/* Mini terminal */}
          <div className="relative font-mono text-xs bg-surface-900 border border-surface-800 p-6">
            <div className="absolute -top-px left-8 right-8 h-px bg-rust-500" />
            <div className="space-y-2 text-surface-400">
              <div className="text-surface-600"># Installation</div>
              <div><span className="text-rust-500">$</span> Download RustServerManager.exe</div>
              <div><span className="text-rust-500">$</span> Run as Administrator</div>
              <div><span className="text-rust-500">$</span> Enter license key</div>
              <div className="pt-2 text-green-400">✓ Ready. Your server is under control.</div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
