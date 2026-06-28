import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  ChevronDown, ChevronRight,
  ArrowRight, Download, Check, Star, X
} from 'lucide-react'
import { getProducts } from '../api/client'
import { useLang } from '../contexts/LangContext'
import { t } from '../i18n'

/* ─────────────────────────────────── DATA ────────────────────────────────── */

const SCREENSHOTS = {
  dashboard:  '/dashboard.png',
  console:    '/console.png',
  rcon:       '/rcon.png',
  players:    '/joueurs.png',
  wipe:       '/wipe.png',
  backup:     '/save.png',
  discord:    '/discord.png',
  plugins:    '/plugins.png',
  scheduling: '/programtion.png',
  settings:   '/r%C3%A9glages.png',
  servers:    '/servers.png',
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
  { author: 'NightWolf_FR',  stars: 5, text: "Meilleur outil que j'aie utilisé pour mon serveur Rust. Le Discord bot seul vaut l'achat. Setup en 10 minutes." },
  { author: 'Kryztalix',     stars: 5, text: 'Enfin une interface graphique propre pour Rust. Plus besoin de taper des commandes à la main. Je recommande 100%.' },
  { author: 'AdminPvP2024',  stars: 5, text: 'La gestion des wipes planifiés est parfaite. Warnings in-game automatiques, tout se fait sans moi.' },
  { author: 'SteelBackpack', stars: 5, text: 'Support très réactif sur Discord. Problème résolu en 20 min. Logiciel stable depuis 3 mois sans crash.' },
  { author: 'RustFR_Admin',  stars: 5, text: "J'ai essayé d'autres outils, RSM Pro est de loin le plus complet. Les sauvegardes auto m'ont sauvé 2 fois." },
  { author: 'Toxicus_PVP',   stars: 4, text: "Interface claire, plugins Carbon gérés facilement. Petite courbe d'apprentissage mais les docs sont bien faites." },
]

/* ──────────────────────────────── COMPONENTS ─────────────────────────────── */

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
  const [lightbox, setLightbox] = useState(null)

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
          <div className="float max-w-3xl mx-auto rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
            <img src={SCREENSHOTS.dashboard} alt="RSM Pro Dashboard" className="w-full" />
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
              <button
                onClick={() => setLightbox(translatedFeatures[activeFeature].preview.props.src)}
                className="block w-full rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 hover:border-rust-500/50 transition-colors cursor-zoom-in"
              >
                {translatedFeatures[activeFeature].preview}
              </button>
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
            <a href="https://github.com/DumePaoli/RSM-Releases/releases/latest/download/Rust.Server.Manager.Pro.exe" className="btn-secondary px-8 py-4 text-base">
              <Download size={16} /> {t('cta.download', lang)}
            </a>
          </div>
        </div>
      </section>

      {/* ── LIGHTBOX ─────────────────────────────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/60 hover:text-white bg-white/10 rounded-full p-2"
            onClick={() => setLightbox(null)}
          >
            <X size={20} />
          </button>
          <img
            src={lightbox}
            alt="Screenshot"
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
