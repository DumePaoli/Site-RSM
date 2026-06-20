import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Zap, Shield, RotateCcw, Archive, Calendar,
  Plug, Users, Terminal, ChevronDown, ChevronRight,
  ArrowRight, Download, Check, Star, Activity, Cpu, HardDrive
} from 'lucide-react'
import { getProducts } from '../api/client'
import { useLang } from '../contexts/LangContext'
import { t } from '../i18n'

/* ─────────────────────────────────── DATA ────────────────────────────────── */

const FEATURES = [
  {
    slug: 'dashboard',
    title: 'Dashboard',
    desc: 'Vue complète de votre serveur — statut, joueurs connectés, CPU, RAM et logs en temps réel depuis un seul écran.',
    color: 'from-blue-500/20 to-transparent',
    preview: (
      <div className="font-mono text-[10px] space-y-1.5">
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          {[['STATUS','🟢 ONLINE','text-green-400'],['PLAYERS','18 / 50','text-rust-400'],['CPU','34%','text-blue-400'],['RAM','6.2 GB','text-purple-400']].map(([l,v,c])=>(
            <div key={l} className="bg-black/40 rounded p-1.5">
              <div className="text-surface-500 text-[9px] mb-0.5">{l}</div>
              <div className={`font-bold ${c}`}>{v}</div>
            </div>
          ))}
        </div>
        <div className="bg-black/40 rounded p-2 space-y-1">
          <div className="text-green-400">[18:42] PlayerA joined</div>
          <div className="text-surface-400">[18:43] Auto-save done</div>
          <div className="text-rust-400">[18:44] Wipe in 60 min ⚠</div>
        </div>
      </div>
    ),
  },
  {
    slug: 'console',
    title: 'Console RCON',
    desc: 'Terminal RCON intégré avec historique de commandes, auto-complétion et alias personnalisés.',
    color: 'from-green-500/20 to-transparent',
    preview: (
      <div className="font-mono text-[10px] space-y-1">
        <div className="text-surface-500">$ oxide.reload *</div>
        <div className="text-green-400">Reloading 12 plugins...</div>
        <div className="text-surface-400">$ say "Wipe dans 5 min"</div>
        <div className="text-green-400">Message broadcast sent</div>
        <div className="text-surface-400">$ playerlist</div>
        <div className="text-white">NightWolf_FR | 76561...</div>
        <div className="text-white">Kryztalix | 76561...</div>
        <div className="flex items-center gap-1 mt-1"><span className="text-rust-500">$</span><span className="cursor-blink">█</span></div>
      </div>
    ),
  },
  {
    slug: 'players',
    title: 'Gestion joueurs',
    desc: 'Kick, ban, message privé, historique de présence — tout accessible depuis une interface claire.',
    color: 'from-purple-500/20 to-transparent',
    preview: (
      <div className="font-mono text-[10px] space-y-1.5">
        {[['NightWolf_FR','2h 14m','🟢'],['Kryztalix','45m','🟢'],['AdminPvP','5h 02m','🟢']].map(([n,t,s])=>(
          <div key={n} className="flex items-center justify-between bg-black/40 rounded px-2 py-1.5">
            <span className="text-white">{s} {n}</span>
            <div className="flex items-center gap-2">
              <span className="text-surface-500">{t}</span>
              <span className="text-red-400 cursor-pointer hover:text-red-300">⊘</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    slug: 'wipe',
    title: 'Wipe Manager',
    desc: 'Planifiez vos wipes avec avertissements in-game automatiques à intervalles configurables.',
    color: 'from-rust-500/20 to-transparent',
    preview: (
      <div className="font-mono text-[10px] space-y-2">
        <div className="bg-rust-500/10 border border-rust-500/30 rounded p-2">
          <div className="text-rust-400 font-bold mb-1">WIPE PLANIFIÉ</div>
          <div className="text-white">Jeudi 19:00 · Hebdo</div>
        </div>
        <div className="space-y-1 text-surface-400">
          <div>⚠ Warning à 60 min</div>
          <div>⚠ Warning à 30 min</div>
          <div>⚠ Warning à 5 min</div>
          <div className="text-green-400">✓ Auto-restart activé</div>
        </div>
      </div>
    ),
  },
  {
    slug: 'backup',
    title: 'Sauvegardes auto',
    desc: 'ZIP planifiés de votre carte et données oxide, avec rotation automatique et dossier configurable.',
    color: 'from-yellow-500/20 to-transparent',
    preview: (
      <div className="font-mono text-[10px] space-y-1.5">
        {[
          ['save_20250620_1900.zip','142 MB','✓'],
          ['save_20250619_1900.zip','139 MB','✓'],
          ['save_20250618_1900.zip','136 MB','✓'],
        ].map(([f,s,st])=>(
          <div key={f} className="flex items-center justify-between bg-black/40 rounded px-2 py-1.5">
            <span className="text-surface-300 truncate">{f}</span>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <span className="text-surface-500">{s}</span>
              <span className="text-green-400">{st}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    slug: 'discord',
    title: 'Discord Bot',
    desc: 'Notifications crash, relay chat Rust↔Discord, alertes de wipe et rapports journaliers automatiques.',
    color: 'from-indigo-500/20 to-transparent',
    preview: (
      <div className="font-mono text-[10px] space-y-1.5">
        <div className="bg-[#5865f2]/10 border border-[#5865f2]/30 rounded p-2">
          <div className="text-[#5865f2] font-bold mb-1.5">RSM Bot</div>
          <div className="space-y-1 text-surface-300">
            <div>🟢 Server is <span className="text-green-400">online</span></div>
            <div>👥 Players: <span className="text-white">18/50</span></div>
            <div>⚠️ Wipe in <span className="text-rust-400">60 min</span></div>
          </div>
        </div>
      </div>
    ),
  },
  {
    slug: 'plugins',
    title: 'Plugin Manager',
    desc: 'Installez, mettez à jour et gérez vos plugins Carbon directement depuis l\'interface — plus de FTP.',
    color: 'from-emerald-500/20 to-transparent',
    preview: (
      <div className="font-mono text-[10px] space-y-1.5">
        {[['BetterChat','2.3.1','✓ À jour'],['Kits','1.2.0','⬆ Update'],['ZoneManager','3.1.4','✓ À jour']].map(([n,v,st])=>(
          <div key={n} className="flex items-center justify-between bg-black/40 rounded px-2 py-1.5">
            <div>
              <div className="text-white">{n}</div>
              <div className="text-surface-500">v{v}</div>
            </div>
            <span className={st.includes('À') ? 'text-green-400' : 'text-yellow-400'}>{st}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    slug: 'monitoring',
    title: 'Monitoring',
    desc: 'Graphiques CPU, RAM et joueurs sur la dernière heure. Détectez les pics avant qu\'ils causent des crashs.',
    color: 'from-cyan-500/20 to-transparent',
    preview: (
      <div className="font-mono text-[10px]">
        <div className="space-y-2">
          {[['CPU','34%',34,'text-blue-400','bg-blue-400'],['RAM','62%',62,'text-purple-400','bg-purple-400'],['Players','36%',36,'text-rust-400','bg-rust-400']].map(([l,v,pct,tc,bc])=>(
            <div key={l}>
              <div className="flex justify-between mb-1">
                <span className="text-surface-400">{l}</span>
                <span className={tc}>{v}</span>
              </div>
              <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
                <div className={`h-full ${bc} rounded-full`} style={{width:`${pct}%`}} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    slug: 'autostart',
    title: 'Auto-redémarrage',
    desc: 'Détection de crash en temps réel et redémarrage automatique — votre serveur ne reste jamais offline.',
    color: 'from-red-500/20 to-transparent',
    preview: (
      <div className="font-mono text-[10px] space-y-2">
        <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
          <div className="text-red-400 font-bold mb-1">CRASH DÉTECTÉ</div>
          <div className="text-surface-400">19:03:42 — Process exited</div>
        </div>
        <div className="space-y-1 text-surface-400">
          <div className="text-yellow-400">⟳ Redémarrage en cours...</div>
          <div className="text-green-400">✓ Serveur en ligne (4s)</div>
          <div>Discord notified ✓</div>
        </div>
      </div>
    ),
  },
]

const REVIEWS = [
  { author: 'NightWolf_FR',  stars: 5, text: 'Meilleur outil que j\'aie utilisé pour mon serveur Rust. Le Discord bot seul vaut l\'achat. Setup en 10 minutes.' },
  { author: 'Kryztalix',     stars: 5, text: 'Enfin une interface graphique propre pour Rust. Plus besoin de taper des commandes à la main. Je recommande 100%.' },
  { author: 'AdminPvP2024',  stars: 5, text: 'La gestion des wipes planifiés est parfaite. Warnings in-game automatiques, tout se fait sans moi.' },
  { author: 'SteelBackpack', stars: 5, text: 'Support très réactif sur Discord. Problème résolu en 20 min. Logiciel stable depuis 3 mois sans crash.' },
  { author: 'RustFR_Admin',  stars: 5, text: 'J\'ai essayé d\'autres outils, RSM Pro est de loin le plus complet. Les sauvegardes auto m\'ont sauvé 2 fois.' },
  { author: 'Toxicus_PVP',   stars: 4, text: 'Interface claire, plugins Carbon gérés facilement. Petite courbe d\'apprentissage mais les docs sont bien faites.' },
]

const FAQS = [
  { q: 'Sur quel OS fonctionne RSM Pro ?',         a: 'Windows 10 et 11 64-bit uniquement. Exécutable autonome — aucune installation Python ou runtime requise.' },
  { q: 'Combien de serveurs puis-je gérer ?',       a: 'Autant que vous voulez. RSM Pro supporte la gestion multi-serveurs depuis une seule interface.' },
  { q: 'Carbon ou Oxide — lequel est supporté ?',   a: 'Les deux. RSM Pro détecte automatiquement votre framework et adapte les chemins en conséquence.' },
  { q: 'Ma licence est valable combien de temps ?', a: 'Les plans 1m/3m expirent à la date indiquée. Le plan À Vie vous donne accès pour toujours, mises à jour incluses.' },
  { q: 'Comment activer ma licence ?',              a: 'Après achat vous recevez un email avec votre clé RSM-XXXX-XXXX-XXXX. Entrez-la dans l\'onglet Licence de l\'app.' },
  { q: 'Puis-je transférer ma licence ?',           a: 'Oui. Désactivez la licence depuis l\'app sur votre machine actuelle, puis activez-la sur la nouvelle.' },
  { q: 'Support inclus ?',                          a: 'Oui, support Discord inclus dans tous les plans. Réponse généralement sous 24h.' },
]

/* ──────────────────────────────── COMPONENTS ─────────────────────────────── */

function AppWindow({ title, children, accent = 'bg-rust-500' }) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-[#111316] shadow-2xl">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0d0f11] border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-[10px] text-surface-500 ml-1 font-mono">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function FeatureCard({ feature, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
        active
          ? 'bg-rust-500/10 border-rust-500/50 text-white'
          : 'bg-white/[0.02] border-white/5 hover:border-white/10 text-surface-400 hover:text-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{feature.title}</span>
        <ChevronRight size={14} className={`transition-transform ${active ? 'rotate-90 text-rust-500' : ''}`} />
      </div>
      {active && <p className="text-xs text-surface-400 mt-2 leading-relaxed">{feature.desc}</p>}
    </button>
  )
}

function FAQItem({ q, a, index }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border-b border-white/5 ${index === 0 ? 'border-t' : ''}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-5 text-left">
        <span className={`text-sm font-medium transition-colors ${open ? 'text-white' : 'text-surface-300 hover:text-white'}`}>{q}</span>
        <ChevronDown size={15} className={`text-surface-500 flex-shrink-0 ml-4 transition-transform duration-200 ${open ? 'rotate-180 text-rust-500' : ''}`} />
      </button>
      {open && <p className="pb-5 text-sm text-surface-400 leading-relaxed">{a}</p>}
    </div>
  )
}

/* ──────────────────────────────────── PAGE ───────────────────────────────── */

export default function HomePage() {
  const { lang } = useLang()
  const [products, setProducts] = useState([])
  const [activeFeature, setActiveFeature] = useState(0)
  const [version, setVersion] = useState('v1.1.24')

  useEffect(() => {
    fetch('https://api.github.com/repos/DumePaoli/Rust-Server-Manger2/releases/latest')
      .then(r => r.json())
      .then(d => { if (d.tag_name) setVersion(d.tag_name) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    getProducts().then(setProducts).catch(() => setProducts([
      { id: 1, name: 'RSM Pro — 1 Mois',  slug: '1m',       price: 9.99,  duration: '1m',       description: 'Accès complet 1 mois' },
      { id: 2, name: 'RSM Pro — 3 Mois',  slug: '3m',       price: 19.99, duration: '3m',       description: 'Meilleure offre' },
      { id: 3, name: 'RSM Pro — À Vie',   slug: 'lifetime', price: 29.99, duration: 'lifetime', description: 'Accès à vie + mises à jour' },
    ]))
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setActiveFeature(i => (i + 1) % FEATURES.length), 4000)
    return () => clearInterval(timer)
  }, [])

  const featureKeys = ['dashboard','console','players','wipe','backup','discord','plugins','monitoring','autostart']
  const translatedFeatures = FEATURES.map((f, i) => ({
    ...f,
    title: t(`feat.${featureKeys[i]}.title`, lang),
    desc:  t(`feat.${featureKeys[i]}.desc`,  lang),
  }))

  const faqItems = Array.from({ length: 7 }, (_, i) => ({
    q: t(`faq.q${i+1}`, lang),
    a: t(`faq.a${i+1}`, lang),
  }))

  const pcLimits = [t('pricing.f4.1m', lang), t('pricing.f4.3m', lang), t('pricing.f4.lt', lang)]
  const guarantees = [
    t('pricing.guarantee1', lang),
    t('pricing.guarantee2', lang),
    t('pricing.guarantee3', lang),
    t('pricing.guarantee4', lang),
  ]

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#0b0d0e] overflow-hidden pt-16 pb-24">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-rust-500/[0.07] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs text-surface-400 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {t('hero.badge', lang).replace('{version}', version)}
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.05] mb-6">
            {t('hero.title1', lang)}<br />
            <span className="text-rust-500">{t('hero.title2', lang)}</span>
          </h1>

          <p className="text-lg text-surface-400 max-w-2xl mx-auto leading-relaxed mb-10">
            {t('hero.sub', lang)}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link to="/checkout" className="btn-primary px-8 py-3.5 text-base">
              {t('hero.cta.buy', lang)} <ArrowRight size={17} />
            </Link>
            <a href="#features" className="btn-secondary px-8 py-3.5 text-base">
              {t('hero.cta.feat', lang)}
            </a>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-12 text-center mb-16">
            {[
              [t('hero.stat1.v', lang), t('hero.stat1.l', lang)],
              [t('hero.stat2.v', lang), t('hero.stat2.l', lang)],
              [t('hero.stat3.v', lang), t('hero.stat3.l', lang)],
            ].map(([v, l]) => (
              <div key={l}>
                <div className="text-3xl font-black text-white">{v}</div>
                <div className="text-xs text-surface-500 mt-1">{l}</div>
              </div>
            ))}
          </div>

          {/* Hero window mockup */}
          <div className="float max-w-3xl mx-auto">
            <AppWindow title="RSM Pro — Dashboard">
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[['STATUS','🟢 Online','text-green-400'],['PLAYERS','18 / 50','text-rust-400'],['CPU','34%','text-blue-400'],['RAM','6.2 GB','text-purple-400']].map(([l,v,c])=>(
                  <div key={l} className="bg-black/30 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-surface-500 mb-1 font-mono">{l}</div>
                    <div className={`text-sm font-bold font-mono ${c}`}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="bg-black/30 rounded-lg p-3 font-mono text-xs space-y-1.5">
                <div className="text-green-400">[18:42:03] NightWolf_FR joined the game</div>
                <div className="text-surface-400">[18:42:11] Server auto-save completed</div>
                <div className="text-rust-400">[18:43:00] ⚠ Wipe scheduled in 60 minutes</div>
                <div className="text-blue-400">[18:43:05] Backup → save_20250620.zip (142 MB)</div>
                <div className="text-green-400">[18:44:01] Kryztalix joined the game</div>
              </div>
            </AppWindow>
          </div>
        </div>
      </section>

      {/* ── FEATURES INTERACTIVE ─────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-[#0e1012]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-rust-500 text-sm font-semibold uppercase tracking-widest mb-3">{t('feat.label', lang)}</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">{t('feat.title', lang)}</h2>
            <p className="text-surface-400 text-lg max-w-xl mx-auto">{t('feat.sub', lang)}</p>
          </div>

          <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
            <div className="grid sm:grid-cols-2 gap-2">
              {translatedFeatures.map((f, i) => (
                <FeatureCard
                  key={f.slug}
                  feature={f}
                  active={activeFeature === i}
                  onClick={() => setActiveFeature(i)}
                />
              ))}
            </div>

            <div className="lg:sticky lg:top-28">
              <AppWindow title={`RSM Pro — ${translatedFeatures[activeFeature].title}`}>
                <div className={`bg-gradient-to-b ${translatedFeatures[activeFeature].color} rounded-lg p-3`}>
                  {translatedFeatures[activeFeature].preview}
                </div>
              </AppWindow>
              <p className="text-center text-xs text-surface-500 mt-3">
                {translatedFeatures[activeFeature].desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BUILT FOR ADMINS banner ───────────────────────────────────────── */}
      <div className="bg-rust-500/10 border-y border-rust-500/20 py-10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-white text-xl font-bold">
            {t('banner', lang).split('{less}')[0]}
            <span className="text-rust-500">{t('banner.less', lang)}</span>
            {t('banner', lang).split('{less}')[1]?.split('{more}')[0]}
            <span className="text-rust-500">{t('banner.more', lang)}</span>
            {t('banner', lang).split('{more}')[1]}
          </p>
        </div>
      </div>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-[#0b0d0e]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-rust-500 text-sm font-semibold uppercase tracking-widest mb-3">{t('pricing.label', lang)}</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">{t('pricing.title', lang)}</h2>
            <p className="text-surface-400 text-lg">{t('pricing.sub', lang)}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {products.map((p, i) => {
              const highlight = i === 2
              const badge = i === 2 ? t('pricing.badge', lang) : null
              const features = [
                t('pricing.f1', lang),
                t('pricing.f2', lang),
                t('pricing.f3', lang),
                pcLimits[i] || '—',
                t('pricing.f5', lang),
                ...(p.duration === 'lifetime' ? [t('pricing.f6', lang)] : []),
              ]
              return (
                <div key={p.id} className={`relative rounded-2xl p-7 border flex flex-col transition-all duration-300 ${
                  highlight
                    ? 'bg-rust-500/10 border-rust-500/60 shadow-2xl shadow-rust-500/20 scale-[1.03]'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                }`}>
                  {badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-rust-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                      {badge}
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-white font-bold text-lg mb-1">{p.name}</h3>
                    <p className="text-surface-500 text-sm h-10 overflow-hidden">{p.description}</p>
                  </div>
                  <div className="h-16 flex items-center mb-8">
                    <span className={`text-5xl font-black whitespace-nowrap ${highlight ? 'text-rust-400' : 'text-white'}`}>
                      {p.price.toFixed(2).replace('.', ',')} €
                    </span>
                    {p.duration !== 'lifetime' && (
                      <span className="text-surface-400 text-sm ml-2 whitespace-nowrap">
                        {p.duration === '1m' ? t('pricing.month', lang) : t('pricing.3month', lang)}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-surface-300">
                        <Check size={14} className="text-rust-500 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={`/checkout?plan=${p.slug}`}
                    className={`justify-center text-center text-sm py-3 ${highlight ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {t('pricing.buy', lang)} <ArrowRight size={14} />
                  </Link>
                </div>
              )
            })}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-surface-500">
            {guarantees.map(s => (
              <span key={s} className="flex items-center gap-2"><Check size={12} className="text-rust-500" /> {s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ──────────────────────────────────────────────────────── */}
      <section id="reviews" className="py-24 bg-[#0e1012]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-rust-500 text-sm font-semibold uppercase tracking-widest mb-3">{t('reviews.label', lang)}</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">{t('reviews.title', lang)}</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {REVIEWS.map((r) => (
              <div key={r.author} className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-colors">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: r.stars }).map((_, i) => (
                    <Star key={i} size={13} className="fill-rust-500 text-rust-500" />
                  ))}
                </div>
                <p className="text-surface-300 text-sm leading-relaxed mb-5">"{r.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rust-500/20 border border-rust-500/40 flex items-center justify-center text-rust-400 text-xs font-bold">
                    {r.author[0]}
                  </div>
                  <span className="text-surface-400 text-sm font-medium">{r.author}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 bg-[#0b0d0e]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-rust-500 text-sm font-semibold uppercase tracking-widest mb-3">{t('faq.label', lang)}</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">{t('faq.title', lang)}</h2>
          </div>
          <div>
            {faqItems.map((f, i) => <FAQItem key={i} {...f} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#0e1012] relative overflow-hidden">
        <div className="absolute inset-0 bg-rust-500/[0.04] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-rust-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            {t('cta.title1', lang)}<br />{t('cta.title2', lang)}
          </h2>
          <p className="text-surface-400 text-lg mb-10">{t('cta.sub', lang)}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/checkout" className="btn-primary px-8 py-4 text-base">
              {t('cta.buy', lang)} <ArrowRight size={17} />
            </Link>
            <a href="/download" className="btn-secondary px-8 py-4 text-base">
              <Download size={16} /> {t('cta.download', lang)}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
