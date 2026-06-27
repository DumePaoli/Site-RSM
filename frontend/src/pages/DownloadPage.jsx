import { useEffect, useState } from 'react'
import { Download, RefreshCw, Tag, ExternalLink } from 'lucide-react'
import { getReleases } from '../api/client'

const DOWNLOAD_BASE = 'https://github.com/DumePaoli/Rust-Server-Manger2/releases/download'
const EXE_NAME = 'Rust.Server.Manager.Pro.exe'

export default function DownloadPage() {
  const [releases, setReleases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    getReleases()
      .then(data => { setReleases(data); if (data.length) setExpanded(data[0].tag) })
      .catch(() => setError('Impossible de charger les releases.'))
      .finally(() => setLoading(false))
  }, [])

  const latest = releases[0]

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-black text-white mb-2">Télécharger RSM Pro</h1>
          <p className="text-surface-400">Toujours à jour — Windows uniquement</p>
        </div>

        {/* Download box */}
        {latest && (
          <div className="card border border-rust-500/30 bg-rust-500/5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Tag size={14} className="text-rust-400" />
                  <span className="text-rust-400 font-mono font-bold">{latest.tag}</span>
                  <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full">Dernière version</span>
                </div>
                <p className="text-surface-400 text-sm">{latest.published_at ? new Date(latest.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
              </div>
              <a
                href={`${DOWNLOAD_BASE}/${latest.tag}/${EXE_NAME}`}
                className="btn-primary flex items-center gap-2 text-sm px-6 py-3"
                download
              >
                <Download size={16} /> Télécharger {latest.tag}
              </a>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-surface-400">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3" />
            Chargement des releases...
          </div>
        )}

        {error && <p className="text-red-400 text-center">{error}</p>}

        {/* Changelog */}
        {releases.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-white font-bold text-lg">Historique des versions</h2>
            {releases.map(rel => (
              <div key={rel.tag} className="card">
                <button
                  onClick={() => setExpanded(expanded === rel.tag ? null : rel.tag)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <Tag size={14} className="text-rust-400 flex-shrink-0" />
                    <span className="text-white font-semibold">{rel.name || rel.tag}</span>
                    {rel === releases[0] && <span className="text-xs bg-rust-500/15 text-rust-400 px-2 py-0.5 rounded-full">Latest</span>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-surface-500 text-xs">{rel.published_at ? new Date(rel.published_at).toLocaleDateString('fr-FR') : ''}</span>
                    <span className="text-surface-500">{expanded === rel.tag ? '▲' : '▼'}</span>
                  </div>
                </button>
                {expanded === rel.tag && (
                  <div className="mt-4 pt-4 border-t border-surface-700 space-y-3">
                    {rel.body ? (
                      <pre className="text-surface-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                        {rel.body}
                      </pre>
                    ) : (
                      <p className="text-surface-500 text-sm italic">Pas de notes de version.</p>
                    )}
                    <div className="flex gap-3">
                      <a
                        href={`${DOWNLOAD_BASE}/${rel.tag}/${EXE_NAME}`}
                        className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
                        download
                      >
                        <Download size={12} /> Télécharger {rel.tag}
                      </a>
                      <a href={rel.url} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5 text-surface-400">
                        <ExternalLink size={12} /> GitHub
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Requirements */}
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
