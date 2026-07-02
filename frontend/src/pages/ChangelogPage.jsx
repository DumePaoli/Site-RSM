import { useEffect, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000')

function formatDate(iso, lang) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function renderBody(body) {
  // Release body uses simple markdown-ish headings/lists (### Section, - item)
  const lines = body.split('\n').filter(Boolean)
  return lines.map((line, i) => {
    if (line.startsWith('### ')) {
      return <p key={i} className="text-surface-300 font-semibold text-sm mt-3 mb-1">{line.replace('### ', '')}</p>
    }
    if (line.startsWith('- ')) {
      return <li key={i} className="text-surface-500 text-sm ml-4 list-disc">{line.replace(/^- /, '').replace(/\s*\(`[a-f0-9]+`\)$/, '')}</li>
    }
    return <p key={i} className="text-surface-500 text-sm">{line}</p>
  })
}

export default function ChangelogPage() {
  const { lang } = useLang()
  const [releases, setReleases] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    axios.get(`${BASE}/api/releases`)
      .then(({ data }) => setReleases(data))
      .catch(() => setError(true))
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Changelog</h1>
        <p className="text-surface-500 text-sm">
          {lang === 'fr' ? 'Historique des mises à jour de Rust Server Manager Pro.' : 'Update history for Rust Server Manager Pro.'}
        </p>
      </div>

      {error && (
        <div className="card p-5 text-center text-surface-500 text-sm">
          {lang === 'fr' ? 'Impossible de charger le changelog pour le moment.' : 'Could not load the changelog right now.'}
        </div>
      )}

      {!releases && !error && (
        <div className="card p-5 text-center text-surface-500 text-sm">
          {lang === 'fr' ? 'Chargement…' : 'Loading…'}
        </div>
      )}

      {releases && releases.length === 0 && (
        <div className="card p-5 text-center text-surface-500 text-sm">
          {lang === 'fr' ? 'Aucune version publiée pour le moment.' : 'No releases published yet.'}
        </div>
      )}

      <div className="space-y-4">
        {releases?.map(rel => (
          <div key={rel.tag} className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white font-bold text-lg font-mono">{rel.tag}</h2>
              <span className="text-surface-600 text-xs">{formatDate(rel.published_at, lang)}</span>
            </div>
            <div className="space-y-0.5">
              {rel.body ? renderBody(rel.body) : (
                <p className="text-surface-600 text-sm italic">
                  {lang === 'fr' ? 'Pas de notes de version.' : 'No release notes.'}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
