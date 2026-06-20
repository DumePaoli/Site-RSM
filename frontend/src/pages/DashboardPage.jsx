import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Copy, CheckCircle2, RefreshCw, Download, ShoppingBag, LogOut } from 'lucide-react'
import { getMyOrders, resendKey } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

function StatusBadge({ status }) {
  const cls = { paid: 'badge-paid', pending: 'badge-pending', failed: 'badge-failed', refunded: 'badge-refunded' }
  const labels = { paid: 'Payé', pending: 'En attente', failed: 'Échoué', refunded: 'Remboursé' }
  return <span className={cls[status] || 'badge'}>{labels[status] || status}</span>
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied]   = useState(null)
  const [resent, setResent]   = useState(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    getMyOrders().then(setOrders).finally(() => setLoading(false))
  }, [user])

  const copy = (key, id) => {
    navigator.clipboard.writeText(key)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const resend = async (id) => {
    await resendKey(id)
    setResent(id)
    setTimeout(() => setResent(null), 3000)
  }

  const handleLogout = () => { logout(); navigate('/') }

  if (!user) return null

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black text-white">Mon compte</h1>
            <p className="text-surface-400 mt-1 text-sm">{user.email}</p>
          </div>
          <div className="flex gap-3">
            <Link to="/checkout" className="btn-primary text-sm py-2 px-4">Acheter</Link>
            <button onClick={handleLogout} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
              <LogOut size={14} /> Déconnexion
            </button>
          </div>
        </div>

        {/* Orders */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <ShoppingBag size={18} className="text-rust-500" />
            <h2 className="text-white font-semibold">Mes commandes &amp; licences</h2>
          </div>

          {loading && (
            <div className="text-center py-12 text-surface-400">
              <div className="w-8 h-8 border-2 border-rust-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Chargement…
            </div>
          )}

          {!loading && orders.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBag size={40} className="text-surface-600 mx-auto mb-4" />
              <p className="text-surface-400 mb-4">Aucune commande pour l'instant</p>
              <Link to="/checkout" className="btn-primary text-sm">Acheter RSM Pro</Link>
            </div>
          )}

          {!loading && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map(o => (
                <div key={o.id} className="bg-surface-750 border border-surface-700 rounded-xl p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                    <div>
                      <div className="font-semibold text-white text-sm">{o.product_name}</div>
                      <div className="text-surface-400 text-xs mt-1">
                        Commande #{o.id} — {o.paid_at ? new Date(o.paid_at).toLocaleDateString('fr-FR') : 'N/A'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-rust-400 font-bold">{o.amount.toFixed(2).replace('.', ',')} €</span>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>

                  {o.license_key && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 bg-surface-800 border border-surface-600 rounded-lg px-4 py-3">
                        <span className="font-mono text-rust-400 text-sm flex-1 select-all">{o.license_key}</span>
                        <button onClick={() => copy(o.license_key, o.id)} className="text-surface-400 hover:text-white transition-colors" title="Copier">
                          {copied === o.id ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} />}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href="https://github.com/dumepaoli/rust-server-manger2/releases/latest"
                          target="_blank" rel="noreferrer"
                          className="btn-secondary text-xs py-2 px-3"
                        >
                          <Download size={13} /> Télécharger
                        </a>
                        <button onClick={() => resend(o.id)} className="btn-secondary text-xs py-2 px-3">
                          <RefreshCw size={13} /> {resent === o.id ? 'Email envoyé !' : 'Renvoyer par email'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
