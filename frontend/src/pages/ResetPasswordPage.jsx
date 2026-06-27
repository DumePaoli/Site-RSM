import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { resetPassword } from '../api/client'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas')
    if (password.length < 6) return setError('Minimum 6 caractères')
    setLoading(true)
    setError('')
    try {
      await resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch(e) {
      setError(e.response?.data?.detail || 'Lien invalide ou expiré')
    } finally {
      setLoading(false)
    }
  }

  if (!token) return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="card text-center max-w-md w-full space-y-4">
        <p className="text-red-400">Lien invalide. <Link to="/forgot-password" className="text-rust-500 hover:underline">Demander un nouveau lien</Link></p>
      </div>
    </div>
  )

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-rust-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <KeyRound size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Nouveau mot de passe</h1>
          <p className="text-surface-400 text-sm mt-2">Choisis un nouveau mot de passe pour ton compte</p>
        </div>

        {done ? (
          <div className="card text-center space-y-4">
            <div className="text-4xl">✓</div>
            <p className="text-white font-semibold">Mot de passe mis à jour !</p>
            <p className="text-surface-400 text-sm">Tu vas être redirigé vers la page de connexion...</p>
          </div>
        ) : (
          <form onSubmit={submit} className="card space-y-4">
            <div>
              <label className="label">Nouveau mot de passe</label>
              <input type="password" className="input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div>
              <label className="label">Confirmer le mot de passe</label>
              <input type="password" className="input" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
