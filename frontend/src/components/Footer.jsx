import { Link } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { t } from '../i18n'

export default function Footer() {
  const { lang } = useLang()
  return (
    <footer className="bg-[#0b0d0e] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-[1fr_auto_auto] gap-12 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <img src="/logo.png" alt="RSM Pro" className="w-8 h-8 object-contain" />
              <span className="font-black text-white text-sm tracking-tight">Rust Server Manager <span className="text-rust-500">Pro</span></span>
            </div>
            <p className="text-surface-500 text-sm leading-relaxed max-w-xs">{t('footer.desc', lang)}</p>
          </div>
          <div>
            <p className="text-white text-xs font-semibold uppercase tracking-widest mb-5">{t('footer.nav', lang)}</p>
            <ul className="space-y-3 text-sm text-surface-500">
              {[
                ['#features', t('nav.features', lang)],
                ['#pricing',  t('nav.pricing',  lang)],
                ['#reviews',  t('nav.reviews',  lang)],
                ['#faq',      t('nav.faq',      lang)],
              ].map(([h,l]) => (
                <li key={h}><a href={h} className="hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white text-xs font-semibold uppercase tracking-widest mb-5">{t('footer.account', lang)}</p>
            <ul className="space-y-3 text-sm text-surface-500">
              {[
                ['/login',     t('footer.login',     lang)],
                ['/register',  t('footer.register',  lang)],
                ['/dashboard', t('footer.dashboard', lang)],
                ['/checkout',  t('footer.buy',       lang)],
              ].map(([to,l]) => (
                <li key={to}><Link to={to} className="hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between gap-3 text-xs text-surface-600">
          <p>{t('footer.copy', lang)}</p>
          <p>{t('footer.disclaimer', lang)}</p>
        </div>
      </div>
    </footer>
  )
}
