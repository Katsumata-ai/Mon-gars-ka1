# 🚀 MANGAKA AI - Guide de Déploiement Vercel

## ⚡ Déploiement Rapide

### 1. **Connecter à Vercel**
```bash
# Installer Vercel CLI (optionnel)
npm i -g vercel

# Ou directement via GitHub
# 1. Aller sur vercel.com
# 2. "Import Git Repository"
# 3. Sélectionner votre repo GitHub
```

### 2. **Variables d'Environnement Vercel**
Dans le dashboard Vercel, ajouter ces variables :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# XAI Grok API
XAI_API_KEY=votre_xai_api_key
XAI_API_URL=https://api.x.ai/v1

# Stripe PRODUCTION
STRIPE_SECRET_KEY=sk_live_votre_cle_secrete
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_votre_cle_publique
STRIPE_WEBHOOK_SECRET=whsec_votre_webhook_secret

# Next.js
NEXTAUTH_SECRET=votre_secret_aleatoire_32_caracteres
NEXTAUTH_URL=https://votre-domaine.vercel.app
NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app
```

### 3. **Configuration Automatique**
Vercel détecte automatiquement :
- ✅ Framework Next.js
- ✅ Build command: `npm run build`
- ✅ Output directory: `.next`
- ✅ Node.js version: 18.x

### 4. **Domaine Custom**
1. Dans Vercel Dashboard → Settings → Domains
2. Ajouter votre domaine (ex: mangaia.ai)
3. Configurer DNS chez votre registrar :
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

## 🔧 Configuration Avancée

### Webhooks Stripe
1. Dans Stripe Dashboard → Webhooks
2. Ajouter endpoint : `https://votre-domaine.vercel.app/api/webhooks/stripe`
3. Événements à écouter :
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### Optimisations Production
- ✅ Compression activée
- ✅ Images optimisées
- ✅ Headers de sécurité
- ✅ Output standalone
- ✅ SWC Minify

## 🎯 Checklist Pré-Déploiement

- [ ] Variables d'environnement configurées
- [ ] Clés Stripe en mode LIVE
- [ ] Webhooks Stripe configurés
- [ ] Domaine custom configuré
- [ ] Tests Playwright passent
- [ ] Base Supabase en production

## 🚀 Déploiement Final

```bash
# Commit final
git add .
git commit -m "Ready for production deployment"
git push origin main

# Vercel déploie automatiquement !
```

## 📊 Monitoring Post-Déploiement

1. **Vercel Analytics** : Activé automatiquement
2. **Stripe Dashboard** : Surveiller les paiements
3. **Supabase Dashboard** : Surveiller la DB
4. **Logs Vercel** : Surveiller les erreurs

---

**🎉 Votre SaaS Mangaka AI est prêt pour le monde ! 🚀**
