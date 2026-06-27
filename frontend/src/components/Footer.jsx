import { Link } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { t } from '../i18n'

export default function Footer() {
  const { lang } = useLang()
  return (
    <footer className="bg-[#0b0d0e] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-[1fr_auto_auto_auto] gap-12 mb-12">
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
          <div>
            <p className="text-white text-xs font-semibold uppercase tracking-widest mb-5">Community</p>
            <a href="https://discord.gg/gbEGEaT9Qr" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] transition-colors text-white text-sm font-medium">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.112 18.1.128 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
              Discord
            </a>
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between gap-3 text-xs text-surface-600">
          <p>{t('footer.copy', lang)}</p>
          <div className="flex gap-4">
            <Link to="/cgv" className="hover:text-white transition-colors">CGV</Link>
            <Link to="/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
            <Link to="/download" className="hover:text-white transition-colors">Télécharger</Link>
            <Link to="/status" className="hover:text-white transition-colors">Statut</Link>
            <p>{t('footer.disclaimer', lang)}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
