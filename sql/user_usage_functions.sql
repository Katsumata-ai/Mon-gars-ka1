-- Fonctions SQL pour gérer l'usage utilisateur et les limitations

-- Table pour stocker l'usage utilisateur
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  character_images INTEGER DEFAULT 0,
  decor_images INTEGER DEFAULT 0,
  scene_generation INTEGER DEFAULT 0,
  project_pages INTEGER DEFAULT 0,
  total_projects INTEGER DEFAULT 0,
  project_exports INTEGER DEFAULT 0,
  monthly_generations INTEGER DEFAULT 0,
  storage_space BIGINT DEFAULT 0, -- en bytes
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_last_reset ON user_usage(last_reset_date);

-- Politique RLS pour user_usage
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Politique : les utilisateurs ne peuvent voir que leurs propres données
CREATE POLICY "Users can view own usage" ON user_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Politique : les utilisateurs peuvent mettre à jour leurs propres données
CREATE POLICY "Users can update own usage" ON user_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Politique : insertion automatique pour nouveaux utilisateurs
CREATE POLICY "Users can insert own usage" ON user_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fonction pour obtenir les statistiques d'usage d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_usage_stats(user_id UUID)
RETURNS TABLE (
  character_images INTEGER,
  decor_images INTEGER,
  scene_generation INTEGER,
  project_pages INTEGER,
  total_projects INTEGER,
  project_exports INTEGER,
  monthly_generations INTEGER,
  storage_space BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur demande ses propres stats
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Créer l'enregistrement s'il n'existe pas
  INSERT INTO user_usage (user_id) 
  VALUES (user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Réinitialiser les compteurs mensuels si nécessaire
  UPDATE user_usage 
  SET 
    monthly_generations = 0,
    project_exports = 0,
    last_reset_date = CURRENT_DATE
  WHERE 
    user_usage.user_id = get_user_usage_stats.user_id 
    AND last_reset_date < DATE_TRUNC('month', CURRENT_DATE);

  -- Retourner les statistiques
  RETURN QUERY
  SELECT 
    u.character_images,
    u.decor_images,
    u.scene_generation,
    u.project_pages,
    u.total_projects,
    u.project_exports,
    u.monthly_generations,
    u.storage_space
  FROM user_usage u
  WHERE u.user_id = get_user_usage_stats.user_id;
END;
$$;

-- Fonction pour incrémenter l'usage d'un utilisateur
CREATE OR REPLACE FUNCTION increment_user_usage(
  user_id UUID,
  usage_type TEXT,
  amount INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur modifie ses propres données
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Créer l'enregistrement s'il n'existe pas
  INSERT INTO user_usage (user_id) 
  VALUES (user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Incrémenter selon le type d'usage
  CASE usage_type
    WHEN 'character_images' THEN
      UPDATE user_usage SET character_images = character_images + amount WHERE user_usage.user_id = increment_user_usage.user_id;
    WHEN 'decor_images' THEN
      UPDATE user_usage SET decor_images = decor_images + amount WHERE user_usage.user_id = increment_user_usage.user_id;
    WHEN 'scene_generation' THEN
      UPDATE user_usage SET scene_generation = scene_generation + amount WHERE user_usage.user_id = increment_user_usage.user_id;
    WHEN 'project_pages' THEN
      UPDATE user_usage SET project_pages = project_pages + amount WHERE user_usage.user_id = increment_user_usage.user_id;
    WHEN 'total_projects' THEN
      UPDATE user_usage SET total_projects = total_projects + amount WHERE user_usage.user_id = increment_user_usage.user_id;
    WHEN 'project_exports' THEN
      UPDATE user_usage SET project_exports = project_exports + amount WHERE user_usage.user_id = increment_user_usage.user_id;
    WHEN 'monthly_generations' THEN
      UPDATE user_usage SET monthly_generations = monthly_generations + amount WHERE user_usage.user_id = increment_user_usage.user_id;
    WHEN 'storage_space' THEN
      UPDATE user_usage SET storage_space = storage_space + amount WHERE user_usage.user_id = increment_user_usage.user_id;
    ELSE
      RAISE EXCEPTION 'Invalid usage type: %', usage_type;
  END CASE;

  -- Mettre à jour le timestamp
  UPDATE user_usage SET updated_at = NOW() WHERE user_usage.user_id = increment_user_usage.user_id;

  RETURN TRUE;
END;
$$;

-- Fonction pour réinitialiser l'usage mensuel
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  -- Réinitialiser les compteurs mensuels pour tous les utilisateurs
  UPDATE user_usage 
  SET 
    monthly_generations = 0,
    project_exports = 0,
    last_reset_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE last_reset_date < DATE_TRUNC('month', CURRENT_DATE);

  GET DIAGNOSTICS reset_count = ROW_COUNT;
  
  RETURN reset_count;
END;
$$;

-- Fonction pour obtenir les limites d'un utilisateur basées sur son plan
CREATE OR REPLACE FUNCTION get_user_limits(user_id UUID)
RETURNS TABLE (
  plan_id TEXT,
  character_images INTEGER,
  decor_images INTEGER,
  scene_generation INTEGER,
  project_pages INTEGER,
  total_projects INTEGER,
  project_exports INTEGER,
  monthly_generations INTEGER,
  storage_space BIGINT,
  advanced_tools BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan TEXT;
BEGIN
  -- Vérifier que l'utilisateur demande ses propres limites
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Obtenir le plan actuel de l'utilisateur
  SELECT 
    CASE 
      WHEN us.status = 'active' AND us.current_period_end > NOW() THEN 'senior'
      ELSE 'junior'
    END INTO user_plan
  FROM user_subscriptions us
  WHERE us.user_id = get_user_limits.user_id
    AND us.status = 'active'
  ORDER BY us.created_at DESC
  LIMIT 1;

  -- Si pas d'abonnement trouvé, utiliser le plan gratuit
  IF user_plan IS NULL THEN
    user_plan := 'junior';
  END IF;

  -- Retourner les limites selon le plan
  IF user_plan = 'senior' THEN
    RETURN QUERY SELECT 
      user_plan,
      -1, -- character_images illimité
      -1, -- decor_images illimité
      -1, -- scene_generation illimité
      -1, -- project_pages illimité
      -1, -- total_projects illimité
      -1, -- project_exports illimité
      -1, -- monthly_generations illimité
      -1::BIGINT, -- storage_space illimité
      TRUE; -- advanced_tools activé
  ELSE
    RETURN QUERY SELECT 
      user_plan,
      5,   -- character_images
      5,   -- decor_images
      10,  -- scene_generation
      10,  -- project_pages
      3,   -- total_projects
      5,   -- project_exports
      10,  -- monthly_generations
      104857600::BIGINT, -- storage_space (100MB)
      FALSE; -- advanced_tools désactivé
  END IF;
END;
$$;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_user_usage_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_user_usage_updated_at
  BEFORE UPDATE ON user_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage_updated_at();

-- Fonction pour initialiser l'usage d'un nouvel utilisateur
CREATE OR REPLACE FUNCTION initialize_user_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_usage (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger pour initialiser automatiquement l'usage lors de l'inscription
CREATE TRIGGER trigger_initialize_user_usage
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_usage();
