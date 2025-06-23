# 🎨 Configuration MCP Stripe pour Mangaka AI

## 📋 Vue d'ensemble

Ce guide explique comment configurer et utiliser le serveur MCP (Model Context Protocol) Stripe pour gérer les paiements et checkout dans Mangaka AI.

## 🚀 Installation

Le package Stripe Agent Toolkit est déjà installé dans le projet :

```bash
npm install @stripe/agent-toolkit
```

## ⚙️ Configuration

### 1. Variables d'environnement

Ajoutez vos clés Stripe dans le fichier `.env.local` :

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_votre-cle-secrete-stripe
STRIPE_PUBLISHABLE_KEY=pk_test_votre-cle-publique-stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_votre-cle-publique-stripe
```

### 2. Configuration MCP

Le fichier `mcp-config.json` contient la configuration du serveur MCP :

```json
{
  "mcpServers": {
    "stripe": {
      "command": "npx",
      "args": ["-y", "@stripe/mcp", "--tools=all", "--api-key=STRIPE_SECRET_KEY"]
    }
  }
}
```

## 🛠️ Utilisation

### Démarrage manuel

```bash
# Démarrer avec tous les outils
npx -y @stripe/mcp --tools=all --api-key=YOUR_STRIPE_SECRET_KEY

# Démarrer avec des outils spécifiques
npx -y @stripe/mcp --tools=customers.create,products.create,paymentLinks.create --api-key=YOUR_STRIPE_SECRET_KEY
```

### Script de démarrage

Utilisez le script fourni pour un démarrage simplifié :

```bash
node scripts/start-stripe-mcp.js
```

## 🔧 Outils disponibles

Le serveur MCP Stripe fournit les outils suivants :

### Clients
- `customers.create` - Créer un nouveau client
- `customers.read` - Lire les informations client

### Produits et Prix
- `products.create` - Créer un nouveau produit
- `products.read` - Lire les informations produit
- `prices.create` - Créer un nouveau prix
- `prices.read` - Lire les informations de prix

### Paiements
- `paymentLinks.create` - Créer un lien de paiement
- `paymentIntents.read` - Lire les intentions de paiement

### Factures
- `invoices.create` - Créer une nouvelle facture
- `invoices.update` - Mettre à jour une facture
- `invoiceItems.create` - Créer un élément de facture

### Abonnements
- `subscriptions.read` - Lire les informations d'abonnement
- `subscriptions.update` - Mettre à jour un abonnement

### Autres
- `balance.read` - Récupérer le solde
- `refunds.create` - Créer un remboursement
- `coupons.create` - Créer un coupon
- `coupons.read` - Lire les informations de coupon
- `disputes.update` - Mettre à jour un litige
- `disputes.read` - Lire les informations de litige
- `documentation.read` - Rechercher dans la documentation Stripe

## 🧪 Test et débogage

### MCP Inspector

Pour déboguer le serveur MCP, utilisez l'inspecteur MCP :

```bash
# Construire le serveur (si nécessaire)
npm run build

# Démarrer l'inspecteur MCP
npx @modelcontextprotocol/inspector node dist/index.js --tools=all --api-key=YOUR_STRIPE_SECRET_KEY
```

### Tests de base

```bash
# Tester la connexion
npx -y @stripe/mcp --tools=customers.create --api-key=sk_test_...

# Vérifier les outils disponibles
npx -y @stripe/mcp --tools=all --api-key=sk_test_...
```

## 🔐 Sécurité

- ⚠️ **Jamais** exposer la clé secrète Stripe côté client
- Utilisez les clés de test (`sk_test_`) en développement
- Utilisez les clés de production (`sk_live_`) uniquement en production
- Stockez les clés dans les variables d'environnement, jamais dans le code

## 🎯 Intégration avec Mangaka AI

Le serveur MCP Stripe sera utilisé pour :

1. **Checkout des upsells** - Liens de paiement pour les fonctionnalités premium
2. **Gestion des abonnements** - Abonnements Pro et Enterprise
3. **Facturation** - Génération automatique de factures
4. **Remboursements** - Gestion des remboursements clients

## 📚 Ressources

- [Documentation Stripe Agent Toolkit](https://github.com/stripe/agent-toolkit)
- [Model Context Protocol](https://modelcontextprotocol.com/)
- [Documentation Stripe API](https://docs.stripe.com/api)
- [Guide MCP Stripe](https://docs.stripe.com/agents)
