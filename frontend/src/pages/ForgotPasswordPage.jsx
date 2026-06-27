import { useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { forgotPassword } from '../api/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await forgotPassword(email)
      setSent(true)
    } catch {
      setError('Une erreur est survenue. Réessaie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-rust-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <KeyRound size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Mot de passe oublié</h1>
          <p className="text-surface-400 text-sm mt-2">Entre ton email pour recevoir un lien de réinitialisation</p>
        </div>

        {sent ? (
          <div className="card text-center space-y-4">
            <div className="text-4xl">📧</div>
            <p className="text-white font-semibold">Email envoyé !</p>
            <p className="text-surface-400 text-sm">Si un compte existe avec cet email, tu recevras un lien dans quelques minutes. Vérifie aussi tes spams.</p>
            <Link to="/login" className="btn-primary w-full justify-center py-2.5 inline-flex">Retour à la connexion</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="card space-y-4">
            <div>
              <label className="label">Adresse email</label>
              <input type="email" className="input" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>
            <p className="text-center text-surface-500 text-sm">
              <Link to="/login" className="text-rust-500 hover:underline">Retour à la connexion</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
