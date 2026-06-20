import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, Copy, Download, ArrowRight, Mail } from 'lucide-react'
import { getOrder } from '../api/client'

export default function SuccessPage() {
  const [params] = useSearchParams()
  const [order, setOrder] = useState(null)
  const [copied, setCopied] = useState(false)
  const orderId = params.get('order')

  useEffect(() => {
    if (!orderId) return
    const poll = async () => {
      try {
        const o = await getOrder(orderId)
        setOrder(o)
        if (o.status !== 'paid') setTimeout(poll, 2000)
      } catch {}
    }
    poll()
  }, [orderId])

  const copy = () => {
    navigator.clipboard.writeText(order.license_key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-rust-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-surface-400">Confirmation du paiement…</p>
      </div>
    </div>
  )

  if (order.status !== 'paid') return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail size={28} className="text-yellow-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Paiement en attente</h1>
        <p className="text-surface-400 mb-6">Votre commande #{order.id} est en cours de traitement. Vous recevrez votre clé par email dès confirmation.</p>
        <Link to="/" className="btn-secondary">Retour à l'accueil</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">
        {/* Success icon */}
        <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 size={40} className="text-green-400" />
        </div>

        <h1 className="text-3xl font-black text-white mb-2">Merci pour votre achat !</h1>
        <p className="text-surface-400 mb-8">
          Votre clé a été envoyée à <strong className="text-white">{order.email}</strong>
        </p>

        {/* License key */}
        <div className="bg-surface-800 border border-rust-500/30 rounded-2xl p-6 mb-6 text-left">
          <div className="text-xs text-surface-400 uppercase tracking-wider mb-3">Votre clé de licence</div>
          <div className="flex items-center gap-3 bg-surface-750 border border-surface-600 rounded-xl px-4 py-3 mb-4">
            <span className="font-mono text-rust-400 font-bold text-lg flex-1 select-all">{order.license_key}</span>
            <button onClick={copy} className="text-surface-400 hover:text-white transition-colors" title="Copier">
              <Copy size={18} />
            </button>
          </div>
          {copied && <p className="text-green-400 text-xs flex items-center gap-1"><CheckCircle2 size={12} /> Copié !</p>}

          <div className="bg-rust-500/5 border border-rust-500/20 rounded-lg p-4 mt-4">
            <p className="text-xs text-surface-400 leading-relaxed">
              <strong className="text-white">Installation :</strong> Téléchargez RSM Pro, extrayez l'archive, lancez <code className="text-rust-400">RustServerManager.exe</code> et entrez cette clé dans l'onglet Licence.
            </p>
          </div>
        </div>

        {/* Product */}
        <div className="text-surface-400 text-sm mb-8">
          Commande <strong className="text-white">#{order.id}</strong> — {order.product_name}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="https://github.com/dumepaoli/rust-server-manger2/releases/latest"
            target="_blank" rel="noreferrer"
            className="btn-primary justify-center">
            <Download size={16} /> Télécharger RSM Pro
          </a>
          <Link to="/dashboard" className="btn-secondary justify-center">
            Mon compte <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
