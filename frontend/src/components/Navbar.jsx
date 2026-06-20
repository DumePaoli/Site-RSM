import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { t } from '../i18n'
import { LogOut, LayoutDashboard, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { lang, switchLang } = useLang()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const navLinks = [
    ['#features', t('nav.features', lang)],
    ['#pricing',  t('nav.pricing',  lang)],
    ['#reviews',  t('nav.reviews',  lang)],
    ['#faq',      t('nav.faq',      lang)],
  ]

  return (
    <nav className="sticky top-0 z-50 bg-[#0b0d0e]/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="RSM Pro" className="w-8 h-8 object-contain" />
            <span className="font-black text-white text-sm tracking-tight">Rust Server Manager <span className="text-rust-500">Pro</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7 text-sm text-surface-400">
            {navLinks.map(([h, l]) => (
              <a key={h} href={h} className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>

          {/* Auth + lang */}
          <div className="hidden md:flex items-center gap-4">
            {/* Lang toggle */}
            <div className="flex items-center gap-1 text-xs border border-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => switchLang('fr')}
                className={`px-2.5 py-1.5 transition-colors ${lang === 'fr' ? 'bg-rust-500 text-white' : 'text-surface-400 hover:text-white'}`}
              >FR</button>
              <button
                onClick={() => switchLang('en')}
                className={`px-2.5 py-1.5 transition-colors ${lang === 'en' ? 'bg-rust-500 text-white' : 'text-surface-400 hover:text-white'}`}
              >EN</button>
            </div>

            {user ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors">
                  <LayoutDashboard size={14} /> {t('nav.account', lang)}
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-red-400 transition-colors">
                  <LogOut size={14} /> {t('nav.logout', lang)}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-surface-400 hover:text-white transition-colors">{t('nav.login', lang)}</Link>
                <Link to="/checkout" className="btn-primary text-sm py-2 px-5">{t('nav.buy', lang)}</Link>
              </>
            )}
          </div>

          <button className="md:hidden text-surface-400 hover:text-white" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-[#0d0f11] border-b border-white/5 px-6 py-4 space-y-3">
          {navLinks.map(([h, l]) => (
            <a key={h} href={h} onClick={() => setOpen(false)} className="block text-sm text-surface-400 hover:text-white py-1.5">{l}</a>
          ))}
          <div className="pt-3 border-t border-white/5 space-y-2">
            {/* Mobile lang toggle */}
            <div className="flex items-center gap-2 py-1.5">
              <span className="text-xs text-surface-500">Langue :</span>
              <button onClick={() => switchLang('fr')} className={`text-xs px-2 py-1 rounded ${lang === 'fr' ? 'bg-rust-500 text-white' : 'text-surface-400'}`}>FR</button>
              <button onClick={() => switchLang('en')} className={`text-xs px-2 py-1 rounded ${lang === 'en' ? 'bg-rust-500 text-white' : 'text-surface-400'}`}>EN</button>
            </div>
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="block text-sm text-white py-1.5">{t('nav.account', lang)}</Link>
                <button onClick={() => { handleLogout(); setOpen(false) }} className="block text-sm text-red-400 py-1.5">{t('nav.logout', lang)}</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="block text-sm text-surface-400 py-1.5">{t('nav.login', lang)}</Link>
                <Link to="/checkout" onClick={() => setOpen(false)} className="btn-primary w-full justify-center mt-2">{t('nav.buy', lang)}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
