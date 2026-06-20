import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, LogOut, LayoutDashboard, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <nav className="sticky top-0 z-50 bg-surface-900/90 backdrop-blur-md border-b border-surface-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="RSM Pro" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-white text-sm hidden sm:block">RSM <span className="text-rust-500">Pro</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-sm text-surface-400">
            <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#pricing"  className="hover:text-white transition-colors">Tarifs</a>
            <a href="#reviews"  className="hover:text-white transition-colors">Avis</a>
            <a href="#faq"      className="hover:text-white transition-colors">FAQ</a>
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-2 text-sm text-surface-400 hover:text-white transition-colors">
                  <LayoutDashboard size={15} /> Mon compte
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-surface-400 hover:text-red-400 transition-colors">
                  <LogOut size={15} /> Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-surface-400 hover:text-white transition-colors">Connexion</Link>
                <Link to="/checkout" className="btn-primary text-sm py-2 px-4">Acheter</Link>
              </>
            )}
          </div>

          {/* Mobile */}
          <button className="md:hidden text-surface-400" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-surface-850 border-b border-surface-700 px-4 py-4 space-y-3">
          <a href="#features" className="block text-surface-400 hover:text-white py-2 text-sm" onClick={() => setOpen(false)}>Fonctionnalités</a>
          <a href="#pricing"  className="block text-surface-400 hover:text-white py-2 text-sm" onClick={() => setOpen(false)}>Tarifs</a>
          <a href="#reviews"  className="block text-surface-400 hover:text-white py-2 text-sm" onClick={() => setOpen(false)}>Avis</a>
          <a href="#faq"      className="block text-surface-400 hover:text-white py-2 text-sm" onClick={() => setOpen(false)}>FAQ</a>
          {user ? (
            <>
              <Link to="/dashboard" className="block text-sm text-white py-2" onClick={() => setOpen(false)}>Mon compte</Link>
              <button onClick={() => { handleLogout(); setOpen(false) }} className="block text-sm text-red-400 py-2">Déconnexion</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block text-sm text-surface-400 py-2" onClick={() => setOpen(false)}>Connexion</Link>
              <Link to="/checkout" className="btn-primary w-full justify-center" onClick={() => setOpen(false)}>Acheter</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
