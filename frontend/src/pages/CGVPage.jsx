import { useSEO } from '../hooks/useSEO'

export default function CGVPage() {
  useSEO(
    'Conditions Générales de Vente — Rust Server Manager Pro',
    'Conditions générales de vente de Rust Server Manager Pro.',
    '/cgv'
  )
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto prose prose-invert">
        <h1 className="text-3xl font-black text-white mb-2">Conditions Générales de Vente</h1>
        <p className="text-surface-400 text-sm mb-10">Dernière mise à jour : juin 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">1. Identification du vendeur</h2>
          <p className="text-surface-400">Rust Server Manager Pro est édité par RSM Pro. Contact : <a href="mailto:noreply@rustservermanagerpro.com" className="text-rust-400 hover:underline">noreply@rustservermanagerpro.com</a></p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">2. Produits et services</h2>
          <p className="text-surface-400">Rust Server Manager Pro est un logiciel Windows vendu sous forme de licence d'utilisation numérique (1 mois, 3 mois, à vie). Aucun bien physique n'est livré. La clé de licence est envoyée par email après confirmation du paiement.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">3. Prix</h2>
          <p className="text-surface-400">Les prix sont affichés en euros TTC. Nous nous réservons le droit de modifier nos tarifs à tout moment. Le prix applicable est celui en vigueur au moment de la commande.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">4. Paiement</h2>
          <p className="text-surface-400">Le paiement s'effectue en ligne via Stripe (carte bancaire) ou PayPal. La commande est validée après confirmation du paiement. Toutes les transactions sont sécurisées.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">5. Livraison</h2>
          <p className="text-surface-400">La clé de licence est délivrée immédiatement après paiement, par email et sur la page de confirmation. En cas de non-réception, contactez-nous.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">6. Droit de rétractation</h2>
          <p className="text-surface-400">Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux contenus numériques fournis immédiatement après achat et dont l'exécution a commencé avec l'accord préalable du consommateur. En validant votre achat, vous renoncez expressément à votre droit de rétractation.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">7. Remboursements</h2>
          <p className="text-surface-400">Les remboursements sont accordés au cas par cas, uniquement si la clé de licence ne fonctionne pas et que nous ne pouvons pas résoudre le problème dans un délai de 48h. Contactez le support via Discord.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">8. Utilisation de la licence</h2>
          <p className="text-surface-400">La licence est personnelle et non transférable. Elle est limitée à un nombre de machines défini selon l'offre choisie. Toute revente ou partage de clé entraîne la révocation immédiate sans remboursement.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">9. Données personnelles</h2>
          <p className="text-surface-400">Les données collectées (email, nom) sont utilisées uniquement pour la gestion des commandes et licences. Elles ne sont pas revendues à des tiers. Conformément au RGPD, vous pouvez demander l'accès, la rectification ou la suppression de vos données en nous contactant.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">10. Litiges</h2>
          <p className="text-surface-400">En cas de litige, une solution amiable sera recherchée en priorité. À défaut, les tribunaux français seront compétents. Le droit applicable est le droit français.</p>
        </section>
      </div>
    </div>
  )
}
