import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-surface-950 border-t border-surface-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-12 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="RSM Pro" className="w-7 h-7 object-contain" />
              <span className="font-black text-white tracking-tight">RSM <span className="text-rust-500">Pro</span></span>
            </div>
            <p className="text-surface-500 text-xs leading-relaxed max-w-xs font-mono">
              Interface Windows pour la gestion de serveurs Rust.<br />
              Carbon &amp; Oxide. Multi-serveurs. Auto-tout.
            </p>
          </div>
          <div>
            <p className="font-mono text-xs text-surface-600 uppercase tracking-widest mb-4">Navigation</p>
            <ul className="space-y-2 text-sm text-surface-500">
              {[['#features','Fonctionnalités'],['#pricing','Tarifs'],['#reviews','Avis'],['#faq','FAQ']].map(([h,l]) => (
                <li key={l}><a href={h} className="hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono text-xs text-surface-600 uppercase tracking-widest mb-4">Compte</p>
            <ul className="space-y-2 text-sm text-surface-500">
              {[['/login','Connexion'],['/register','Créer un compte'],['/dashboard','Mon tableau de bord'],['/checkout','Acheter']].map(([to,l]) => (
                <li key={l}><Link to={to} className="hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-surface-800 pt-8 flex flex-col md:flex-row justify-between gap-4">
          <p className="font-mono text-xs text-surface-600">© 2025 Rust Server Manager Pro — Tous droits réservés.</p>
          <p className="font-mono text-xs text-surface-600">Non affilié à Facepunch Studios.</p>
        </div>
      </div>
    </footer>
  )
}
