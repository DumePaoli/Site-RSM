import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-[#0b0d0e] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-[1fr_auto_auto] gap-12 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <img src="/logo.png" alt="RSM Pro" className="w-8 h-8 object-contain" />
              <span className="font-black text-white text-sm tracking-tight">RSM <span className="text-rust-500">Pro</span></span>
            </div>
            <p className="text-surface-500 text-sm leading-relaxed max-w-xs">
              Interface Windows tout-en-un pour la gestion de serveurs Rust. Carbon &amp; Oxide. Multi-serveurs. Auto-tout.
            </p>
          </div>
          <div>
            <p className="text-white text-xs font-semibold uppercase tracking-widest mb-5">Navigation</p>
            <ul className="space-y-3 text-sm text-surface-500">
              {[['#features','Fonctionnalités'],['#pricing','Tarifs'],['#reviews','Avis'],['#faq','FAQ']].map(([h,l]) => (
                <li key={l}><a href={h} className="hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white text-xs font-semibold uppercase tracking-widest mb-5">Compte</p>
            <ul className="space-y-3 text-sm text-surface-500">
              {[['/login','Connexion'],['/register','Créer un compte'],['/dashboard','Mon tableau de bord'],['/checkout','Acheter']].map(([to,l]) => (
                <li key={l}><Link to={to} className="hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between gap-3 text-xs text-surface-600">
          <p>© 2025 Rust Server Manager Pro. Tous droits réservés.</p>
          <p>Non affilié à Facepunch Studios.</p>
        </div>
      </div>
    </footer>
  )
}
