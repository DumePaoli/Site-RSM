import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle2, Tag, CreditCard, ArrowRight, Lock, LogIn } from 'lucide-react'
import { getProducts, checkCoupon, createCheckout } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { t } from '../i18n'

export default function CheckoutPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { lang } = useLang()
  const [products, setProducts]       = useState([])
  const [selectedPlan, setSelected]   = useState(params.get('plan') || 'lifetime')
  const [coupon, setCoupon]           = useState('')
  const [couponResult, setCouponRes]  = useState(null)
  const [couponError, setCouponErr]   = useState('')
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

  const redirectParam = `?redirect=/checkout${params.get('plan') ? `?plan=${params.get('plan')}` : ''}`

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-rust-500/10 border border-rust-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <LogIn size={24} className="text-rust-500" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">{t('checkout.need_account', lang)}</h1>
          <p className="text-surface-400 mb-8">{t('checkout.need_account.sub', lang)}</p>
          <div className="flex flex-col gap-3">
            <Link to={`/register${redirectParam}`} className="btn-primary justify-center py-3 text-base">
              {t('checkout.create_account', lang)}
            </Link>
            <Link to={`/login${redirectParam}`} className="btn-secondary justify-center py-3">
              {t('checkout.have_account', lang)}
            </Link>
          </div>
        </div>
      </div>
    )
  }

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
    setLoading(true)
    setError('')
    try {
      const r = await createCheckout({
        product_slug: selectedPlan,
        coupon_code: couponResult ? coupon : '',
        payment_method: 'stripe',
      })
      if (r.free) { window.location.href = `/success?order=${r.order_id}`; return }
      window.location.href = r.checkout_url
    } catch (e) {
      setError(e.response?.data?.detail || 'Erreur lors du paiement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black text-white mb-2">{t('checkout.title', lang)}</h1>
        <p className="text-surface-400 mb-10">{t('checkout.sub', lang)}</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left — form */}
          <div className="space-y-6">
            {/* Plan selector */}
            <div className="card">
              <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">{t('checkout.plan', lang)}</h2>
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
                      {p.slug === '3m' && <div className="text-rust-500 text-xs font-semibold">{t('pricing.badge', lang)}</div>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Account info */}
            <div className="card">
              <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">{t('checkout.account', lang)}</h2>
              <div className="flex items-center justify-between bg-surface-800 rounded-xl px-4 py-3">
                <div>
                  <div className="text-white text-sm font-medium">{user.name || user.email}</div>
                  <div className="text-surface-400 text-xs">{user.email}</div>
                </div>
                <CheckCircle2 size={16} className="text-rust-500 flex-shrink-0" />
              </div>
              <p className="text-surface-400 text-xs mt-2">{t('checkout.account.sub', lang)}</p>
            </div>

            {/* Coupon */}
            <div className="card">
              <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                <Tag size={14} className="inline mr-2" />{t('checkout.coupon', lang)}
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('checkout.coupon.placeholder', lang)}
                  className="input font-mono uppercase flex-1"
                  value={coupon}
                  onChange={e => setCoupon(e.target.value.toUpperCase())}
                />
                <button onClick={applyCode} className="btn-secondary px-4 py-3 whitespace-nowrap">{t('checkout.coupon.apply', lang)}</button>
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
              <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">{t('checkout.payment', lang)}</h2>
              <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-rust-500 bg-rust-500/10">
                <CreditCard size={18} className="text-rust-500" />
                <span className="font-semibold text-sm text-white">{t('checkout.payment.stripe', lang)}</span>
              </div>
              <p className="text-surface-400 text-xs mt-3">
                {t('checkout.payment.other', lang)}{' '}
                <a
                  href="https://discord.gg/gbEGEaT9Qr"
                  target="_blank"
                  rel="noreferrer"
                  className="text-rust-400 hover:text-rust-300 transition-colors font-medium"
                >
                  {t('checkout.payment.other.link', lang)}
                </a>.
              </p>
            </div>
          </div>

          {/* Right — summary */}
          <div>
            <div className="card sticky top-24 space-y-5">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">{t('checkout.summary', lang)}</h2>

              {product && (
                <div className="bg-rust-500/5 border border-rust-500/20 rounded-xl p-4">
                  <div className="font-semibold text-white text-sm">{product.name}</div>
                  <div className="text-surface-400 text-xs mt-1">{product.description}</div>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-surface-400">
                  <span>{t('checkout.subtotal', lang)}</span>
                  <span>{product ? `${product.price.toFixed(2).replace('.', ',')} €` : '—'}</span>
                </div>
                {couponResult && (
                  <div className="flex justify-between text-green-400">
                    <span>{t('checkout.discount', lang)} ({couponResult.discount_pct}%)</span>
                    <span>-{discount.toFixed(2).replace('.', ',')} €</span>
                  </div>
                )}
                <div className="border-t border-surface-700 pt-3 flex justify-between font-bold text-white text-lg">
                  <span>{t('checkout.total', lang)}</span>
                  <span className="text-rust-400">{total.toFixed(2).replace('.', ',')} €</span>
                </div>
              </div>

              <ul className="space-y-2 text-xs text-surface-400">
                {[t('checkout.f1',lang),t('checkout.f2',lang),t('checkout.f3',lang),t('checkout.f4',lang)].map(f => (
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
                {loading ? t('checkout.loading', lang) : (
                  <><Lock size={16} /> {t('checkout.pay', lang)} {total.toFixed(2).replace('.', ',')} € <ArrowRight size={16} /></>
                )}
              </button>

              <p className="text-center text-surface-400 text-xs flex items-center justify-center gap-1">
                <Lock size={11} /> {t('checkout.ssl', lang)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
