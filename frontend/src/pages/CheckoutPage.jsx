import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, Tag, CreditCard, Wallet, ArrowRight, Lock } from 'lucide-react'
import { getProducts, checkCoupon, createCheckout } from '../api/client'

const PLAN_LABELS = { '1m': '1 Mois', '3m': '3 Mois', 'lifetime': 'À Vie' }

export default function CheckoutPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const [products, setProducts]       = useState([])
  const [selectedPlan, setSelected]   = useState(params.get('plan') || 'lifetime')
  const [email, setEmail]             = useState('')
  const [coupon, setCoupon]           = useState('')
  const [couponResult, setCouponRes]  = useState(null)
  const [couponError, setCouponErr]   = useState('')
  const [paymentMethod, setPayment]   = useState('stripe')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  useEffect(() => {
    getProducts().then(setProducts).catch(() => {
      setProducts([
        { id: 1, name: 'RSM Pro — 1 Mois',  slug: '1m',       price: 9.99,  duration: '1m',       description: 'Accès complet 1 mois' },
        { id: 2, name: 'RSM Pro — 3 Mois',  slug: '3m',       price: 19.99, duration: '3m',       description: 'Meilleure offre' },
        { id: 3, name: 'RSM Pro — À Vie',   slug: 'lifetime', price: 29.99, duration: 'lifetime', description: 'Accès à vie' },
      ])
    })
  }, [])

  const product = products.find(p => p.slug === selectedPlan) || products[2]
  const discount = couponResult ? (product?.price || 0) * couponResult.discount_pct / 100 : 0
  const total = product ? Math.max(0, product.price - discount) : 0

  const applyCode = async () => {
    setCouponErr('')
    setCouponRes(null)
    try {
      const r = await checkCoupon(coupon, selectedPlan)
      setCouponRes(r)
    } catch (e) {
      setCouponErr(e.response?.data?.detail || 'Code invalide')
    }
  }

  const submit = async () => {
    if (!email) return setError('Entrez votre email')
    setLoading(true)
    setError('')
    try {
      const r = await createCheckout({
        product_slug: selectedPlan,
        email,
        coupon_code: couponResult ? coupon : '',
        payment_method: paymentMethod,
      })
      if (paymentMethod === 'stripe') {
        window.location.href = r.checkout_url
      } else {
        navigate(`/success?order=${r.order_id}`)
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Erreur lors du paiement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black text-white mb-2">Finaliser l'achat</h1>
        <p className="text-surface-400 mb-10">Livraison instantanée par email après paiement.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left — form */}
          <div className="space-y-6">
            {/* Plan selector */}
            <div className="card">
              <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Choisir un plan</h2>
              <div className="space-y-3">
                {products.map((p) => (
                  <button
                    key={p.slug}
                    onClick={() => { setSelected(p.slug); setCouponRes(null); setCouponErr('') }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                      selectedPlan === p.slug
                        ? 'border-rust-500 bg-rust-500/10'
                        : 'border-surface-700 bg-surface-750 hover:border-surface-600'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-white text-sm">{p.name}</div>
                      <div className="text-surface-400 text-xs mt-0.5">{p.description}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-black text-lg ${selectedPlan === p.slug ? 'text-rust-400' : 'text-white'}`}>
                        {p.price.toFixed(2).replace('.', ',')} €
                      </div>
                      {p.slug === '3m' && <div className="text-rust-500 text-xs font-semibold">Meilleure offre</div>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div className="card">
              <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Votre email</h2>
              <input
                type="email"
                placeholder="votre@email.com"
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <p className="text-surface-400 text-xs mt-2">Votre clé de licence sera envoyée à cette adresse.</p>
            </div>

            {/* Coupon */}
            <div className="card">
              <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                <Tag size={14} className="inline mr-2" />Code promo
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="XXXXXXX"
                  className="input font-mono uppercase flex-1"
                  value={coupon}
                  onChange={e => setCoupon(e.target.value.toUpperCase())}
                />
                <button onClick={applyCode} className="btn-secondary px-4 py-3 whitespace-nowrap">Appliquer</button>
              </div>
              {couponResult && (
                <p className="text-green-400 text-sm mt-2 flex items-center gap-2">
                  <CheckCircle2 size={14} /> -{couponResult.discount_pct}% appliqué !
                </p>
              )}
              {couponError && <p className="text-red-400 text-sm mt-2">{couponError}</p>}
            </div>

            {/* Payment method */}
            <div className="card">
              <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Méthode de paiement</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPayment('stripe')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    paymentMethod === 'stripe' ? 'border-rust-500 bg-rust-500/10' : 'border-surface-700 hover:border-surface-600'
                  }`}
                >
                  <CreditCard size={18} className={paymentMethod === 'stripe' ? 'text-rust-500' : 'text-surface-400'} />
                  <span className={`font-semibold text-sm ${paymentMethod === 'stripe' ? 'text-white' : 'text-surface-400'}`}>Carte</span>
                </button>
                <button
                  onClick={() => setPayment('paypal')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    paymentMethod === 'paypal' ? 'border-rust-500 bg-rust-500/10' : 'border-surface-700 hover:border-surface-600'
                  }`}
                >
                  <Wallet size={18} className={paymentMethod === 'paypal' ? 'text-rust-500' : 'text-surface-400'} />
                  <span className={`font-semibold text-sm ${paymentMethod === 'paypal' ? 'text-white' : 'text-surface-400'}`}>PayPal</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right — summary */}
          <div>
            <div className="card sticky top-24 space-y-5">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Récapitulatif</h2>

              {product && (
                <div className="bg-rust-500/5 border border-rust-500/20 rounded-xl p-4">
                  <div className="font-semibold text-white text-sm">{product.name}</div>
                  <div className="text-surface-400 text-xs mt-1">{product.description}</div>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-surface-400">
                  <span>Sous-total</span>
                  <span>{product ? `${product.price.toFixed(2).replace('.', ',')} €` : '—'}</span>
                </div>
                {couponResult && (
                  <div className="flex justify-between text-green-400">
                    <span>Réduction ({couponResult.discount_pct}%)</span>
                    <span>-{discount.toFixed(2).replace('.', ',')} €</span>
                  </div>
                )}
                <div className="border-t border-surface-700 pt-3 flex justify-between font-bold text-white text-lg">
                  <span>Total</span>
                  <span className="text-rust-400">{total.toFixed(2).replace('.', ',')} €</span>
                </div>
              </div>

              <ul className="space-y-2 text-xs text-surface-400">
                {['Toutes les fonctionnalités incluses', 'Livraison instantanée par email', 'Support Discord inclus', 'Mises à jour gratuites'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-rust-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>
              )}

              <button
                onClick={submit}
                disabled={loading || !product}
                className="btn-primary w-full justify-center text-base py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Chargement…' : (
                  <><Lock size={16} /> Payer {total.toFixed(2).replace('.', ',')} € <ArrowRight size={16} /></>
                )}
              </button>

              <p className="text-center text-surface-400 text-xs flex items-center justify-center gap-1">
                <Lock size={11} /> Paiement sécurisé — chiffrement SSL
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
