# RSM Shop — Déploiement

## Architecture

```
Frontend (Vercel / Netlify)  →  Backend (Fly.io / VPS)  →  License Server (Fly.io)
```

## 1. Backend (Fly.io)

```bash
cd website/backend
cp .env.example .env
# Remplir .env avec vos vraies clés

fly launch --name rsm-shop-api
fly secrets import < .env
fly deploy
```

`fly.toml` recommandé :
```toml
[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"
  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

## 2. Frontend (Vercel)

```bash
cd website/frontend
# Créer .env.production
echo "VITE_API_URL=https://rsm-shop-api.fly.dev" > .env.production

vercel --prod
```

## 3. Stripe — Configurer le webhook

Dashboard Stripe → Webhooks → Ajouter un endpoint :
- URL : `https://rsm-shop-api.fly.dev/api/webhooks/stripe`
- Événements : `checkout.session.completed`
- Copier le `Signing secret` → `STRIPE_WEBHOOK_SECRET` dans `.env`

## 4. Variables d'environnement

Toutes les variables sont dans `backend/.env.example`.

## 5. Premier lancement

```bash
# Tester localement
cd website
bash dev.sh

# Accès admin : http://localhost:5174/admin
# Mot de passe : valeur de ADMIN_PASSWORD dans .env
```
