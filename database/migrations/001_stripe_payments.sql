-- 🎨 MANGAKA AI - Migration Stripe Payments
-- Création des tables pour gérer les paiements et abonnements Stripe

-- Table des plans d'abonnement
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  stripe_product_id VARCHAR(100) UNIQUE NOT NULL,
  stripe_price_id VARCHAR(100) UNIQUE NOT NULL,
  price_amount INTEGER NOT NULL, -- Prix en centimes
  currency VARCHAR(3) DEFAULT 'eur',
  billing_interval VARCHAR(20) DEFAULT 'month', -- month, year
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des abonnements utilisateurs
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  stripe_customer_id VARCHAR(100),
  stripe_subscription_id VARCHAR(100) UNIQUE,
  stripe_payment_intent_id VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'inactive', -- active, inactive, canceled, past_due
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des paiements
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id),
  stripe_payment_intent_id VARCHAR(100) UNIQUE NOT NULL,
  stripe_charge_id VARCHAR(100),
  amount INTEGER NOT NULL, -- Montant en centimes
  currency VARCHAR(3) DEFAULT 'eur',
  status VARCHAR(50) NOT NULL, -- succeeded, pending, failed, canceled
  payment_method VARCHAR(50), -- card, sepa_debit, etc.
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des crédits utilisateur (pour le système freemium)
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_remaining INTEGER DEFAULT 10, -- Crédits gratuits de départ
  credits_total INTEGER DEFAULT 10,
  last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- Fonction pour obtenir l'abonnement actif d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_active_subscription(p_user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_name VARCHAR(100),
  status VARCHAR(50),
  current_period_end TIMESTAMP WITH TIME ZONE,
  features JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id,
    sp.name,
    us.status,
    us.current_period_end,
    sp.features
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id 
    AND us.status = 'active'
    AND (us.current_period_end IS NULL OR us.current_period_end > NOW())
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un utilisateur a accès à une fonctionnalité
CREATE OR REPLACE FUNCTION user_has_feature(p_user_id UUID, p_feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  subscription_features JSONB;
  has_feature BOOLEAN := false;
BEGIN
  -- Récupérer les fonctionnalités de l'abonnement actif
  SELECT features INTO subscription_features
  FROM get_user_active_subscription(p_user_id);
  
  -- Si pas d'abonnement actif, vérifier les fonctionnalités gratuites
  IF subscription_features IS NULL THEN
    -- Fonctionnalités gratuites par défaut
    has_feature := p_feature_name IN ('basic_generation', 'limited_export');
  ELSE
    -- Vérifier si la fonctionnalité est dans l'abonnement
    has_feature := subscription_features ? p_feature_name;
  END IF;
  
  RETURN has_feature;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour décrémenter les crédits
CREATE OR REPLACE FUNCTION use_credit(p_user_id UUID, p_amount INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
  has_unlimited BOOLEAN := false;
BEGIN
  -- Vérifier si l'utilisateur a un abonnement avec crédits illimités
  SELECT user_has_feature(p_user_id, 'unlimited_generation') INTO has_unlimited;
  
  IF has_unlimited THEN
    RETURN true;
  END IF;
  
  -- Décrémenter les crédits
  UPDATE user_credits 
  SET 
    credits_remaining = credits_remaining - p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id 
    AND credits_remaining >= p_amount
  RETURNING credits_remaining INTO current_credits;
  
  RETURN current_credits IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement les crédits lors de l'inscription
CREATE OR REPLACE FUNCTION create_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_credits (user_id, credits_remaining, credits_total)
  VALUES (NEW.id, 10, 10)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_credits();

-- Insérer les plans par défaut
INSERT INTO subscription_plans (name, stripe_product_id, stripe_price_id, price_amount, features) VALUES
('Mangaka AI Pro', 'prod_SY0ZQhzm9vU2kq', 'price_1RcuYMCAB3oSopcYA07F9P3T', 1900, 
 '["unlimited_generation", "advanced_tools", "hd_export", "priority_support"]'),
('Mangaka AI Enterprise', 'prod_SY0ZEpwGy06hmM', 'price_1RcuYRCAB3oSopcYqji7rnax', 4900, 
 '["unlimited_generation", "advanced_tools", "hd_export", "priority_support", "api_access", "team_collaboration", "custom_branding"]')
ON CONFLICT (stripe_product_id) DO NOTHING;

-- Politique RLS (Row Level Security)
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Politiques pour user_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Politiques pour payments
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Politiques pour user_credits
CREATE POLICY "Users can view their own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits" ON user_credits
  FOR UPDATE USING (auth.uid() = user_id);
