import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, LayoutDashboard, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <nav className="sticky top-0 z-50 bg-[#0b0d0e]/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="RSM Pro" className="w-8 h-8 object-contain" />
            <span className="font-black text-white text-sm tracking-tight">RSM <span className="text-rust-500">Pro</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7 text-sm text-surface-400">
            <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#pricing"  className="hover:text-white transition-colors">Tarifs</a>
            <a href="#reviews"  className="hover:text-white transition-colors">Avis</a>
            <a href="#faq"      className="hover:text-white transition-colors">FAQ</a>
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-white transition-colors">
                  <LayoutDashboard size={14} /> Mon compte
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-red-400 transition-colors">
                  <LogOut size={14} /> Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-surface-400 hover:text-white transition-colors">Connexion</Link>
                <Link to="/checkout" className="btn-primary text-sm py-2 px-5">Acheter</Link>
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
          {[['#features','Fonctionnalités'],['#pricing','Tarifs'],['#reviews','Avis'],['#faq','FAQ']].map(([h,l]) => (
            <a key={l} href={h} onClick={() => setOpen(false)} className="block text-sm text-surface-400 hover:text-white py-1.5">{l}</a>
          ))}
          <div className="pt-3 border-t border-white/5 space-y-2">
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="block text-sm text-white py-1.5">Mon compte</Link>
                <button onClick={() => { handleLogout(); setOpen(false) }} className="block text-sm text-red-400 py-1.5">Déconnexion</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="block text-sm text-surface-400 py-1.5">Connexion</Link>
                <Link to="/checkout" onClick={() => setOpen(false)} className="btn-primary w-full justify-center mt-2">Acheter</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
