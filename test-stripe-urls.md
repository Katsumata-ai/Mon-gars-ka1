# Test des URLs Stripe - Résolution du problème de retour

## Problème résolu ✅

Le problème était que le bouton "Retour" de Stripe redirigait vers :
- ❌ `https://mangaka-ai.vercel.app/dashboard?canceled=true` (mauvais domaine + erreur 404)

## Solution implémentée ✅

### 1. Correction du domaine
- ✅ Changé `mangaka-ai.vercel.app` → `ai-manga-generator.com`

### 2. URL de retour dynamique
- ✅ Ajout du paramètre `return_url` dans l'API Stripe
- ✅ Détection automatique de la page d'origine
- ✅ Redirection intelligente vers la page d'origine

### 3. Page de gestion des annulations
- ✅ Nouvelle page `/payment-canceled` 
- ✅ Redirection automatique après 3 secondes
- ✅ Boutons de retour manuel

### 4. Middleware de redirection
- ✅ Redirection automatique des anciennes URLs `?canceled=true`

## URLs de test

### Depuis la landing page (/)
```
/api/stripe/create-checkout-session?plan=monthly&return_url=%2F
```
→ Annulation redirige vers `/payment-canceled?return_url=%2F`
→ Retour automatique vers `/`

### Depuis le dashboard (/dashboard)
```
/api/stripe/create-checkout-session?plan=yearly&return_url=%2Fdashboard
```
→ Annulation redirige vers `/payment-canceled?return_url=%2Fdashboard`
→ Retour automatique vers `/dashboard`

### Depuis une page d'édition (/project/123/edit)
```
/api/stripe/create-checkout-session?plan=monthly&return_url=%2Fproject%2F123%2Fedit
```
→ Annulation redirige vers `/payment-canceled?return_url=%2Fproject%2F123%2Fedit`
→ Retour automatique vers `/project/123/edit`

## Composants mis à jour

1. **API Route** : `src/app/api/stripe/create-checkout-session/route.ts`
   - Paramètre `return_url` 
   - Domaine corrigé vers `ai-manga-generator.com`

2. **Pricing Section** : `src/components/ui/pricing-section.tsx`
   - Ajout de `return_url` dans les liens Stripe

3. **Checkout Button** : `src/components/stripe/CheckoutButton.tsx`
   - Ajout de `return_url` dans les liens Stripe

4. **Upgrade Buttons** : `src/components/settings/UpgradeButtons.tsx`
   - Ajout de `return_url` dans les liens Stripe

5. **Page d'annulation** : `src/app/payment-canceled/page.tsx`
   - Nouvelle page avec redirection automatique

6. **Middleware** : `src/middleware.ts`
   - Redirection des anciennes URLs `?canceled=true`

## Flux utilisateur amélioré

1. **Utilisateur clique sur un CTA** (landing, dashboard, settings, etc.)
2. **Redirection vers Stripe** avec `return_url` de la page actuelle
3. **Si annulation** → Stripe redirige vers `/payment-canceled?return_url=...`
4. **Page d'annulation** affiche un message et redirige automatiquement
5. **Retour à la page d'origine** en 3 secondes ou clic manuel

## Avantages

✅ **UX fluide** : L'utilisateur revient exactement où il était
✅ **Mobile-friendly** : Fonctionne sur mobile et desktop
✅ **Domaine correct** : Plus d'erreur 404
✅ **Rétrocompatibilité** : Les anciennes URLs sont redirigées
✅ **Feedback visuel** : Page d'annulation claire avec options
