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

const SCREENSHOTS = {
  dashboard:  'https://i.postimg.cc/w362J6xy/dashboard-(2).png',
  console:    'https://i.postimg.cc/t7XkPXR1/console.png',
  rcon:       'https://i.postimg.cc/hhpr1Hh3/rcon.png',
  players:    'https://i.postimg.cc/z30jF93n/joueurs.png',
  wipe:       'https://i.postimg.cc/bsrRC32K/wipe.png',
  backup:     'https://i.postimg.cc/Tp1c7CWN/save.png',
  discord:    'https://i.postimg.cc/6T9cR96G/discord.png',
  plugins:    'https://i.postimg.cc/HjB29fj2/plugins.png',
  scheduling: 'https://i.postimg.cc/WtXnwQtH/programation.png',
  settings:   'https://i.postimg.cc/2Vyxc2Bw/reglages.png',
  servers:    'https://i.postimg.cc/RNhTsXnb/servers.png',
}

const FEATURES = [
  { slug: 'dashboard',  title: 'Dashboard',        desc: '', color: '', preview: <img src={SCREENSHOTS.dashboard}  alt="Dashboard"  className="w-full rounded-lg" /> },
  { slug: 'console',    title: 'Console RCON',     desc: '', color: '', preview: <img src={SCREENSHOTS.rcon}       alt="RCON"       className="w-full rounded-lg" /> },
  { slug: 'players',    title: 'Gestion joueurs',  desc: '', color: '', preview: <img src={SCREENSHOTS.players}   alt="Joueurs"    className="w-full rounded-lg" /> },
  { slug: 'wipe',       title: 'Wipe Manager',     desc: '', color: '', preview: <img src={SCREENSHOTS.wipe}      alt="Wipe"       className="w-full rounded-lg" /> },
  { slug: 'backup',     title: 'Sauvegardes auto', desc: '', color: '', preview: <img src={SCREENSHOTS.backup}    alt="Sauvegardes" className="w-full rounded-lg" /> },
  { slug: 'discord',    title: 'Discord Bot',      desc: '', color: '', preview: <img src={SCREENSHOTS.discord}   alt="Discord"    className="w-full rounded-lg" /> },
  { slug: 'plugins',    title: 'Plugin Manager',   desc: '', color: '', preview: <img src={SCREENSHOTS.plugins}   alt="Plugins"    className="w-full rounded-lg" /> },
  { slug: 'monitoring', title: 'Monitoring',       desc: '', color: '', preview: <img src={SCREENSHOTS.scheduling} alt="Monitoring" className="w-full rounded-lg" /> },
  { slug: 'autostart',  title: 'Auto-redémarrage', desc: '', color: '', preview: <img src={SCREENSHOTS.settings}  alt="Réglages"   className="w-full rounded-lg" /> },
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
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    fetch(`${base}/api/version`)
      .then(r => r.json())
      .then(d => { if (d.version) setVersion(d.version) })
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

          {/* Hero screenshot */}
          <div className="float max-w-3xl mx-auto">
            <AppWindow title="Rust Server Manager Pro — Dashboard">
              <img src={SCREENSHOTS.dashboard} alt="RSM Pro Dashboard" className="w-full rounded-lg" />
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
              <AppWindow title={`Rust Server Manager Pro — ${translatedFeatures[activeFeature].title}`}>
                {translatedFeatures[activeFeature].preview}
              </AppWindow>
              <p className="text-center text-xs text-surface-500 mt-3">
                {translatedFeatures[activeFeature].desc}
              </p>
            </div>
          </div>
        </div>
      </section>

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
