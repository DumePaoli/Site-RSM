import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Zap, Shield, RotateCcw, DiscIcon, Archive, Calendar,
  Monitor, Plug, Users, Terminal, ChevronDown, Star,
  CheckCircle2, ArrowRight, Download
} from 'lucide-react'
import { getProducts } from '../api/client'

const FEATURES = [
  { icon: <Zap size={22} />,        title: 'Démarrage 1 clic',      desc: 'Lancez, arrêtez ou redémarrez votre serveur instantanément depuis l\'interface.' },
  { icon: <Terminal size={22} />,    title: 'Console RCON',           desc: 'Console RCON intégrée avec historique de commandes et auto-complétion.' },
  { icon: <Users size={22} />,       title: 'Gestion joueurs',        desc: 'Kick, ban, message privé, historique de présence — tout en quelques clics.' },
  { icon: <DiscIcon size={22} />,    title: 'Discord Bot',            desc: 'Notifications, alertes crash, relay chat Rust→Discord, rapports journaliers.' },
  { icon: <Archive size={22} />,     title: 'Sauvegardes auto',       desc: 'ZIP planifiés de votre carte et données, rotation automatique.' },
  { icon: <Calendar size={22} />,    title: 'Wipe planifié',          desc: 'Programmez vos wipes avec avertissements in-game à intervalles configurables.' },
  { icon: <Monitor size={22} />,     title: 'Monitoring temps réel',  desc: 'Graphiques CPU, RAM, joueurs — historique 1 heure en anneau circulaire.' },
  { icon: <Plug size={22} />,        title: 'Plugins Carbon',         desc: 'Installez, mettez à jour et gérez vos plugins Carbon depuis l\'UI.' },
  { icon: <RotateCcw size={22} />,   title: 'Auto-redémarrage',       desc: 'Détection de crash avec redémarrage automatique pour un uptime maximal.' },
  { icon: <Shield size={22} />,      title: 'Whitelist & Bans',       desc: 'Gérez vos listes blanches et bans directement depuis l\'interface.' },
  { icon: <Users size={22} />,       title: 'Multi-serveurs',         desc: 'Gérez plusieurs serveurs Rust depuis une seule application.' },
  { icon: <Zap size={22} />,         title: 'Mises à jour auto',      desc: 'RSM Pro se met à jour en arrière-plan — aucune action requise.' },
]

const REVIEWS = [
  { author: 'NightWolf_FR',  rating: 5, text: 'Meilleur outil que j\'aie utilisé pour mon serveur Rust. Le Discord bot seul vaut l\'achat. Setup en 10 minutes.' },
  { author: 'Kryztalix',     rating: 5, text: 'Enfin une interface graphique propre pour Rust. Plus besoin de taper des commandes à la main. Je recommande 100%.' },
  { author: 'AdminPvP2024',  rating: 5, text: 'La gestion des wipes planifiés est parfaite. Mes joueurs ont des avertissements in-game et tout se fait automatiquement.' },
  { author: 'SteelBackpack', rating: 5, text: 'Support très réactif sur Discord. Problème résolu en 20 min. Logiciel stable depuis 3 mois sans crash.' },
  { author: 'RustFR_Admin',  rating: 5, text: 'J\'ai essayé d\'autres outils, RSM Pro est de loin le plus complet. Les sauvegardes auto m\'ont sauvé 2 fois déjà.' },
  { author: 'Toxicus_PVP',   rating: 4, text: 'Interface claire, plugins Carbon gérés facilement. Petite courbe d\'apprentissage mais les docs sont bien faites.' },
]

const FAQS = [
  { q: 'Sur quel OS fonctionne RSM Pro ?',      a: 'Windows 10 et 11 64-bit uniquement. L\'application est un exécutable autonome — aucune installation Python ou autre runtime requise.' },
  { q: 'Combien de serveurs puis-je gérer ?',    a: 'Autant que vous voulez. RSM Pro supporte la gestion multi-serveurs depuis une seule interface.' },
  { q: 'Carbon ou Oxide — lequel est supporté ?', a: 'Les deux. RSM Pro détecte automatiquement votre framework de plugins et adapte les chemins en conséquence.' },
  { q: 'Ma licence est valable combien de temps ?', a: 'Les plans mensuels et 3 mois s\'expirent à la date indiquée. Le plan À Vie vous donne accès pour toujours, mises à jour incluses.' },
  { q: 'Comment activer ma licence ?',           a: 'Après achat, vous recevez un email avec votre clé RSM-XXXX-XXXX-XXXX. Entrez-la dans l\'onglet Licence de l\'application.' },
  { q: 'Puis-je transférer ma licence ?',        a: 'Oui. Depuis l\'application, désactivez la licence sur votre machine actuelle, puis activez-la sur la nouvelle.' },
  { q: 'Support inclus ?',                       a: 'Oui, support Discord inclus dans tous les plans. Réponse généralement sous 24h.' },
]

function PricingCard({ product, highlight }) {
  return (
    <div className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02] ${
      highlight
        ? 'bg-rust-500/10 border-2 border-rust-500 shadow-2xl shadow-rust-500/20'
        : 'bg-surface-800 border border-surface-700 hover:border-surface-600'
    }`}>
      {highlight && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-rust-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
            Plus populaire
          </span>
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">{product.name}</h3>
        <p className="text-surface-400 text-sm mt-1">{product.description}</p>
      </div>
      <div className="mb-8">
        <span className={`text-5xl font-black ${highlight ? 'text-rust-400' : 'text-white'}`}>
          {product.price.toFixed(2).replace('.', ',')} €
        </span>
        {product.duration !== 'lifetime' && (
          <span className="text-surface-400 text-sm ml-2">/ {product.duration === '1m' ? 'mois' : '3 mois'}</span>
        )}
      </div>
      <ul className="space-y-3 mb-8 flex-1">
        {['Toutes les fonctionnalités', 'Mises à jour incluses', 'Support Discord', 'Multi-serveurs', 'Livraison instantanée'].map(f => (
          <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
            <CheckCircle2 size={16} className="text-rust-500 flex-shrink-0" />
            {f}
          </li>
        ))}
        {product.duration === 'lifetime' && (
          <li className="flex items-center gap-3 text-sm text-rust-400 font-semibold">
            <CheckCircle2 size={16} className="text-rust-500 flex-shrink-0" />
            Accès à vie garanti
          </li>
        )}
      </ul>
      <Link
        to={`/checkout?plan=${product.slug}`}
        className={highlight ? 'btn-primary justify-center text-center' : 'btn-secondary justify-center text-center'}
      >
        Acheter maintenant <ArrowRight size={16} />
      </Link>
    </div>
  )
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-surface-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-800 transition-colors"
      >
        <span className="font-medium text-white text-sm">{q}</span>
        <ChevronDown size={16} className={`text-surface-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 text-surface-400 text-sm leading-relaxed border-t border-surface-700 pt-4">
          {a}
        </div>
      )}
    </div>
  )
}

export default function HomePage() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    getProducts().then(setProducts).catch(() => {
      setProducts([
        { id: 1, name: 'RSM Pro — 1 Mois',  slug: '1m',       price: 9.99,  duration: '1m',       description: 'Accès complet 1 mois' },
        { id: 2, name: 'RSM Pro — 3 Mois',  slug: '3m',       price: 19.99, duration: '3m',       description: 'Accès complet 3 mois — Meilleure offre' },
        { id: 3, name: 'RSM Pro — À Vie',   slug: 'lifetime', price: 29.99, duration: 'lifetime', description: 'Accès à vie + toutes mises à jour futures' },
      ])
    })
  }, [])

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-surface-900 pt-20 pb-32">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-rust-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-rust-500/3 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)', backgroundSize: '60px 60px' }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rust-500/10 border border-rust-500/30 rounded-full text-rust-400 text-sm font-medium mb-8">
            <Zap size={14} /> Application Windows — Aucune installation requise
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6 glow-rust">
            Gérez votre serveur<br />
            <span className="text-rust-500">Rust</span> sans prise de tête
          </h1>
          <p className="text-xl text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Interface graphique Windows tout-en-un — démarrage, RCON, sauvegardes, wipes planifiés, Discord bot et plugins Carbon en quelques clics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/checkout" className="btn-primary text-base px-8 py-4">
              Acheter maintenant <ArrowRight size={18} />
            </Link>
            <a href="#features" className="btn-secondary text-base px-8 py-4">
              Voir les fonctionnalités
            </a>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[['500+', 'Serveurs gérés'], ['99.9%', 'Uptime garanti'], ['< 24h', 'Support']].map(([v, l]) => (
              <div key={l}>
                <div className="text-2xl font-black text-rust-500">{v}</div>
                <div className="text-xs text-surface-400 mt-1">{l}</div>
              </div>
            ))}
          </div>

          {/* Dashboard mockup */}
          <div className="mt-16 relative max-w-4xl mx-auto">
            <div className="bg-surface-800 border border-surface-700 rounded-2xl overflow-hidden shadow-2xl">
              {/* Fake window bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-surface-850 border-b border-surface-700">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <span className="ml-3 text-xs text-surface-400 font-mono">Rust Server Manager Pro</span>
              </div>
              {/* Fake dashboard content */}
              <div className="p-6 grid grid-cols-4 gap-4">
                {[
                  { label: 'Serveur', value: '🟢 En ligne', accent: 'text-green-400' },
                  { label: 'Joueurs', value: '18 / 50', accent: 'text-rust-400' },
                  { label: 'CPU', value: '34%', accent: 'text-blue-400' },
                  { label: 'RAM', value: '6.2 GB', accent: 'text-purple-400' },
                ].map(s => (
                  <div key={s.label} className="bg-surface-750 rounded-lg p-4">
                    <div className="text-xs text-surface-400 mb-1">{s.label}</div>
                    <div className={`font-bold text-sm ${s.accent}`}>{s.value}</div>
                  </div>
                ))}
                <div className="col-span-4 bg-surface-750 rounded-lg p-4">
                  <div className="text-xs text-surface-400 mb-3">Console RCON</div>
                  <div className="font-mono text-xs space-y-1">
                    <div className="text-green-400">[18:42:03] PlayerA joined the game</div>
                    <div className="text-surface-400">[18:42:11] Server save completed</div>
                    <div className="text-rust-400">[18:43:00] Warning: Wipe in 60 minutes</div>
                    <div className="text-blue-400">[18:43:05] Backup created: save_20250620_1843.zip</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Glow */}
            <div className="absolute -inset-1 bg-rust-500/10 rounded-2xl blur-xl -z-10" />
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-surface-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">Tout ce dont votre serveur a besoin</h2>
            <p className="section-sub mx-auto">RSM Pro regroupe en une seule app tout ce que vous feriez normalement à la main ou avec plusieurs outils séparés.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="group bg-surface-800 border border-surface-700 hover:border-rust-500/50 rounded-xl p-5 transition-all duration-300 hover:bg-surface-750">
                <div className="w-10 h-10 bg-rust-500/10 border border-rust-500/20 rounded-lg flex items-center justify-center text-rust-500 mb-4 group-hover:bg-rust-500/20 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white text-sm mb-2">{f.title}</h3>
                <p className="text-surface-400 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Screenshots ───────────────────────────────────────────────────────── */}
      <section className="py-24 bg-surface-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">Interface pensée pour les admins</h2>
            <p className="section-sub mx-auto">Chaque écran est conçu pour vous faire gagner du temps et éviter les erreurs.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'Dashboard',      desc: 'Vue d\'ensemble serveur' },
              { name: 'Joueurs',        desc: 'Gestion des joueurs' },
              { name: 'Console',        desc: 'RCON en temps réel' },
              { name: 'Discord',        desc: 'Bot & notifications' },
              { name: 'Wipe Manager',   desc: 'Planification wipes' },
              { name: 'Plugins',        desc: 'Carbon plugin manager' },
            ].map((s) => (
              <div key={s.name} className="group relative bg-surface-800 border border-surface-700 rounded-xl overflow-hidden aspect-video hover:border-rust-500/50 transition-colors cursor-default">
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Monitor size={32} className="text-surface-600 group-hover:text-rust-500/50 transition-colors mb-2" />
                  <span className="text-sm font-semibold text-surface-500 group-hover:text-white transition-colors">{s.name}</span>
                  <span className="text-xs text-surface-600 group-hover:text-surface-400 transition-colors mt-1">{s.desc}</span>
                </div>
                {/* Screenshot placeholder gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-surface-750 to-surface-850 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
          <p className="text-center text-surface-400 text-sm mt-6">
            Captures d'écran disponibles sur notre <a href="https://discord.gg" className="text-rust-500 hover:underline">Discord</a>
          </p>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-surface-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">Tarifs simples et transparents</h2>
            <p className="section-sub mx-auto">Pas d'abonnement caché. Livraison instantanée par email. Commencez dès aujourd'hui.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {products.map((p, i) => (
              <PricingCard key={p.id} product={p} highlight={i === 1} />
            ))}
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-surface-400">
            <span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-rust-500" /> Paiement sécurisé Stripe & PayPal</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-rust-500" /> Livraison instantanée par email</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-rust-500" /> Support Discord inclus</span>
          </div>
        </div>
      </section>

      {/* ── Reviews ───────────────────────────────────────────────────────────── */}
      <section id="reviews" className="py-24 bg-surface-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">Ce que disent nos admins</h2>
            <p className="section-sub mx-auto">Des centaines d'admins font confiance à RSM Pro pour leurs serveurs Rust.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REVIEWS.map((r) => (
              <div key={r.author} className="bg-surface-800 border border-surface-700 rounded-xl p-6">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} size={14} className="text-rust-500 fill-rust-500" />
                  ))}
                </div>
                <p className="text-surface-300 text-sm leading-relaxed mb-4">"{r.text}"</p>
                <div className="text-surface-400 text-xs font-mono">— {r.author}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 bg-surface-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">Questions fréquentes</h2>
            <p className="section-sub mx-auto">Tout ce que vous devez savoir avant d'acheter.</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((f) => <FAQItem key={f.q} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-surface-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-b from-rust-500/10 to-transparent border border-rust-500/30 rounded-2xl p-12">
            <h2 className="text-4xl font-black text-white mb-4">Prêt à gérer votre serveur ?</h2>
            <p className="text-surface-400 mb-8">Rejoignez des centaines d'admins qui utilisent RSM Pro chaque jour.</p>
            <Link to="/checkout" className="btn-primary text-base px-10 py-4">
              Commencer maintenant <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
