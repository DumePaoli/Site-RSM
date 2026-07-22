import { useSEO } from '../hooks/useSEO'

export default function PrivacyPage() {
  useSEO(
    'Politique de Confidentialité — Rust Server Manager Pro',
    'Politique de confidentialité et protection des données de Rust Server Manager Pro.',
    '/confidentialite'
  )
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto prose prose-invert">
        <h1 className="text-3xl font-black text-white mb-2">Politique de Confidentialité</h1>
        <p className="text-surface-400 text-sm mb-10">Dernière mise à jour : juin 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">1. Responsable du traitement</h2>
          <p className="text-surface-400">RSM Pro est responsable du traitement de vos données personnelles. Contact : <a href="mailto:noreply@rustservermanagerpro.com" className="text-rust-400 hover:underline">noreply@rustservermanagerpro.com</a></p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">2. Données collectées</h2>
          <p className="text-surface-400 mb-3">Nous collectons les données suivantes :</p>
          <ul className="text-surface-400 space-y-1 list-disc list-inside">
            <li><strong className="text-white">Email</strong> — pour la livraison de licence, la connexion et les notifications</li>
            <li><strong className="text-white">Nom</strong> (optionnel) — fourni lors de l'inscription</li>
            <li><strong className="text-white">Identifiant Discord</strong> (optionnel) — si vous connectez votre compte Discord</li>
            <li><strong className="text-white">Données de paiement</strong> — traitées directement par Stripe ou PayPal, nous n'y avons pas accès</li>
            <li><strong className="text-white">Clés de licence</strong> — associées à votre compte</li>
            <li><strong className="text-white">Adresse IP</strong> — collectée temporairement pour la sécurité (protection anti-brute force)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">3. Finalités du traitement</h2>
          <p className="text-surface-400 mb-2">Vos données sont utilisées pour :</p>
          <ul className="text-surface-400 space-y-1 list-disc list-inside">
            <li>La gestion de votre compte et de vos commandes</li>
            <li>La livraison et la validation des licences logicielles</li>
            <li>L'envoi d'emails transactionnels (confirmation d'achat, expiration de licence)</li>
            <li>La sécurité de la plateforme (prévention de la fraude)</li>
            <li>L'attribution du rôle Discord Customer (avec votre consentement)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">4. Base légale</h2>
          <p className="text-surface-400">Le traitement est fondé sur l'exécution du contrat (livraison du logiciel acheté) et notre intérêt légitime à assurer la sécurité de la plateforme. Pour la connexion Discord, le traitement repose sur votre consentement explicite.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">5. Conservation des données</h2>
          <p className="text-surface-400">Vos données sont conservées aussi longtemps que votre compte est actif, et jusqu'à 3 ans après la fin de la relation commerciale pour respecter nos obligations légales (facturation). Les tokens de réinitialisation de mot de passe expirent après 1 heure.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">6. Partage des données</h2>
          <p className="text-surface-400">Nous ne vendons pas vos données. Elles peuvent être partagées avec :</p>
          <ul className="text-surface-400 space-y-1 list-disc list-inside mt-2">
            <li><strong className="text-white">Stripe / PayPal</strong> — traitement des paiements</li>
            <li><strong className="text-white">Hostinger</strong> — hébergement du site et des données</li>
            <li><strong className="text-white">Discord</strong> — si vous connectez votre compte (votre identifiant Discord uniquement)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">7. Vos droits (RGPD)</h2>
          <p className="text-surface-400 mb-2">Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
          <ul className="text-surface-400 space-y-1 list-disc list-inside">
            <li><strong className="text-white">Droit d'accès</strong> — obtenir une copie de vos données</li>
            <li><strong className="text-white">Droit de rectification</strong> — corriger des données inexactes</li>
            <li><strong className="text-white">Droit à l'effacement</strong> — demander la suppression de votre compte et données</li>
            <li><strong className="text-white">Droit à la portabilité</strong> — recevoir vos données dans un format structuré</li>
            <li><strong className="text-white">Droit d'opposition</strong> — s'opposer au traitement</li>
          </ul>
          <p className="text-surface-400 mt-3">Pour exercer ces droits, contactez-nous : <a href="mailto:noreply@rustservermanagerpro.com" className="text-rust-400 hover:underline">noreply@rustservermanagerpro.com</a></p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">8. Cookies</h2>
          <p className="text-surface-400">Ce site utilise uniquement le stockage local (localStorage) pour maintenir votre session de connexion. Aucun cookie de traçage ou publicitaire n'est utilisé.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">9. Sécurité</h2>
          <p className="text-surface-400">Vos mots de passe sont stockés chiffrés (bcrypt). Les connexions sont sécurisées via HTTPS. Des mécanismes anti-brute force sont en place pour protéger votre compte.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">10. Contact et réclamations</h2>
          <p className="text-surface-400">Pour toute question relative à la confidentialité : <a href="mailto:noreply@rustservermanagerpro.com" className="text-rust-400 hover:underline">noreply@rustservermanagerpro.com</a>. En cas de réclamation non résolue, vous pouvez saisir la <a href="https://www.cnil.fr" target="_blank" rel="noreferrer" className="text-rust-400 hover:underline">CNIL</a>.</p>
        </section>
      </div>
    </div>
  )
}
