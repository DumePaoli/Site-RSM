import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-surface-950 border-t border-surface-800 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-rust-500 rounded-lg flex items-center justify-center text-white font-black text-sm">R</div>
              <span className="font-bold text-white">RSM <span className="text-rust-500">Pro</span></span>
            </div>
            <p className="text-surface-400 text-sm leading-relaxed">
              L'outil de référence pour gérer votre serveur Rust sous Windows. Interface graphique, automatisation et Discord bot intégrés.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-2 text-sm text-surface-400">
              <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
              <li><a href="#pricing"  className="hover:text-white transition-colors">Tarifs</a></li>
              <li><a href="#reviews"  className="hover:text-white transition-colors">Avis clients</a></li>
              <li><a href="#faq"      className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Compte</h4>
            <ul className="space-y-2 text-sm text-surface-400">
              <li><Link to="/login"     className="hover:text-white transition-colors">Connexion</Link></li>
              <li><Link to="/register"  className="hover:text-white transition-colors">Créer un compte</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Mon tableau de bord</Link></li>
              <li><Link to="/checkout"  className="hover:text-white transition-colors">Acheter</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-surface-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-surface-400 text-xs">© 2025 Rust Server Manager Pro. Tous droits réservés.</p>
          <p className="text-surface-400 text-xs">Non affilié à Facepunch Studios.</p>
        </div>
      </div>
    </footer>
  )
}
