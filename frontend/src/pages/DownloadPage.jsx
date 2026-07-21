import { Download } from 'lucide-react'

const DOWNLOAD_URL = 'https://github.com/DumePaoli/RSM-Releases/releases/latest/download/RustServerManagerPro.exe'

export default function DownloadPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-black text-white mb-2">Télécharger RSM Pro</h1>
          <p className="text-surface-400">Windows uniquement</p>
        </div>

        <div className="card border border-rust-500/30 bg-rust-500/5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-white font-semibold text-lg">Rust Server Manager Pro</p>
            <p className="text-surface-400 text-sm mt-1">Dernière version disponible</p>
          </div>
          <a
            href={DOWNLOAD_URL}
            className="btn-primary flex items-center gap-2 text-sm px-6 py-3"
            download
          >
            <Download size={16} /> Télécharger
          </a>
        </div>

        <div className="card bg-surface-800/50">
          <h3 className="text-white font-semibold mb-3">Configuration requise</h3>
          <ul className="text-surface-400 text-sm space-y-1">
            <li>🪟 Windows 10 / 11 (64-bit)</li>
            <li>🔑 Clé de licence RSM Pro valide</li>
            <li>🌐 Connexion Internet requise pour l'activation</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
