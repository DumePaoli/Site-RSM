import { useEffect, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000')

function StatusDot({ ok, loading }) {
  if (loading) return <span className="w-3 h-3 rounded-full bg-surface-600 animate-pulse inline-block" />
  return <span className={`w-3 h-3 rounded-full inline-block ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
}

export default function StatusPage() {
  const { lang } = useLang()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastCheck, setLastCheck] = useState(null)

  async function fetchStatus() {
    setLoading(true)
    try {
      const { data } = await axios.get(`${BASE}/api/status`)
      setStatus(data)
    } catch {
      setStatus({ site: false, bot: false, licenseServer: false })
    }
    setLastCheck(new Date())
    setLoading(false)
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 60_000)
    return () => clearInterval(interval)
  }, [])

  const services = [
    {
      key: 'site',
      label: lang === 'fr' ? 'Site web' : 'Website',
      desc: lang === 'fr' ? 'Serveur principal RSM Pro' : 'RSM Pro main server',
      ok: status?.site,
    },
    {
      key: 'bot',
      label: 'Discord Bot',
      desc: status?.botTag || 'RSM Pro Bot',
      ok: status?.bot,
    },
    {
      key: 'licenseServer',
      label: lang === 'fr' ? 'Serveur de licences' : 'License Server',
      desc: lang === 'fr' ? 'Validation des clés de licence' : 'License key validation',
      ok: status?.licenseServer,
    },
  ]

  const allOk = services.every(s => s.ok)
  const someDown = services.some(s => !s.ok)

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-8">
      {/* Global status */}
      <div className={`rounded-xl p-6 flex items-center gap-4 ${allOk ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${allOk ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          {loading ? '...' : allOk ? '✓' : '!'}
        </div>
        <div>
          <p className={`font-bold text-lg ${allOk ? 'text-green-400' : 'text-red-400'}`}>
            {loading
              ? (lang === 'fr' ? 'Vérification...' : 'Checking...')
              : allOk
                ? (lang === 'fr' ? 'Tous les services sont opérationnels' : 'All systems operational')
                : (lang === 'fr' ? 'Certains services sont perturbés' : 'Some services are disrupted')}
          </p>
          {lastCheck && (
            <p className="text-surface-500 text-sm">
              {lang === 'fr' ? 'Dernière vérification' : 'Last checked'} : {lastCheck.toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-US')}
            </p>
          )}
        </div>
        <button onClick={fetchStatus} className="ml-auto text-surface-500 hover:text-white transition-colors text-sm">
          {lang === 'fr' ? 'Actualiser' : 'Refresh'}
        </button>
      </div>

      {/* Services */}
      <div className="space-y-3">
        {services.map(s => (
          <div key={s.key} className="card p-5 flex items-center gap-4">
            <StatusDot ok={s.ok} loading={loading} />
            <div className="flex-1">
              <p className="text-white font-medium">{s.label}</p>
              <p className="text-surface-500 text-sm">{s.desc}</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              loading ? 'bg-surface-800 text-surface-500'
              : s.ok ? 'bg-green-500/15 text-green-400'
              : 'bg-red-500/15 text-red-400'
            }`}>
              {loading ? '...' : s.ok ? (lang === 'fr' ? 'Opérationnel' : 'Operational') : (lang === 'fr' ? 'Perturbé' : 'Disrupted')}
            </span>
          </div>
        ))}
      </div>

      {/* Discord members */}
      {status?.memberCount && (
        <div className="card p-5 flex items-center gap-4">
          <span className="text-2xl">👥</span>
          <div>
            <p className="text-white font-medium">{status.memberCount} {lang === 'fr' ? 'membres Discord' : 'Discord members'}</p>
            <p className="text-surface-500 text-sm">{lang === 'fr' ? 'Rejoins notre communauté' : 'Join our community'}</p>
          </div>
          <a href="https://discord.gg/gbEGEaT9Qr" target="_blank" rel="noreferrer"
            className="ml-auto btn-primary text-sm py-1.5 px-4">Discord</a>
        </div>
      )}
    </div>
  )
}
