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
    <nav className="sticky top-0 z-50 bg-surface-950/95 backdrop-blur-sm border-b border-surface-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="RSM Pro" className="w-7 h-7 object-contain" />
            <span className="font-black text-white tracking-tight text-sm">RSM <span className="text-rust-500">Pro</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8 text-xs font-mono text-surface-500 uppercase tracking-widest">
            <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#pricing"  className="hover:text-white transition-colors">Tarifs</a>
            <a href="#reviews"  className="hover:text-white transition-colors">Avis</a>
            <a href="#faq"      className="hover:text-white transition-colors">FAQ</a>
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-1.5 text-xs font-mono text-surface-400 hover:text-white transition-colors uppercase tracking-widest">
                  <LayoutDashboard size={13} /> Mon compte
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-mono text-surface-500 hover:text-red-400 transition-colors uppercase tracking-widest">
                  <LogOut size={13} /> Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-xs font-mono text-surface-500 hover:text-white transition-colors uppercase tracking-widest">Connexion</Link>
                <Link to="/checkout" className="btn-primary text-xs py-2 px-4">Acheter</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-surface-400 hover:text-white" onClick={() => setOpen(!open)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-surface-950 border-b border-surface-800 px-6 py-4 space-y-4">
          {[['#features','Fonctionnalités'],['#pricing','Tarifs'],['#reviews','Avis'],['#faq','FAQ']].map(([h,l]) => (
            <a key={l} href={h} onClick={() => setOpen(false)}
              className="block text-xs font-mono text-surface-500 hover:text-white py-1 uppercase tracking-widest">{l}</a>
          ))}
          <div className="pt-2 border-t border-surface-800">
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="block text-xs font-mono text-white py-2">Mon compte</Link>
                <button onClick={() => { handleLogout(); setOpen(false) }} className="block text-xs font-mono text-red-400 py-2">Déconnexion</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="block text-xs font-mono text-surface-400 py-2">Connexion</Link>
                <Link to="/checkout" onClick={() => setOpen(false)} className="btn-primary w-full justify-center mt-2 text-xs py-2.5">Acheter</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
