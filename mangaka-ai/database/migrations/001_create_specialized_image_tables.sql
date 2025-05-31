-- Migration: Création des tables spécialisées pour les images
-- Date: 2024
-- Description: Sépare les images de personnages et de décors en tables distinctes

-- =====================================================
-- 1. CRÉATION DE LA TABLE character_images
-- =====================================================

CREATE TABLE IF NOT EXISTS character_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL,
    original_prompt TEXT,
    optimized_prompt TEXT,
    image_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_character_images_user_id ON character_images(user_id);
CREATE INDEX IF NOT EXISTS idx_character_images_project_id ON character_images(project_id);
CREATE INDEX IF NOT EXISTS idx_character_images_created_at ON character_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_character_images_user_project ON character_images(user_id, project_id);

-- Index GIN pour les métadonnées JSONB
CREATE INDEX IF NOT EXISTS idx_character_images_metadata ON character_images USING GIN(metadata);

-- =====================================================
-- 2. CRÉATION DE LA TABLE decor_images
-- =====================================================

CREATE TABLE IF NOT EXISTS decor_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL,
    original_prompt TEXT,
    optimized_prompt TEXT,
    image_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_decor_images_user_id ON decor_images(user_id);
CREATE INDEX IF NOT EXISTS idx_decor_images_project_id ON decor_images(project_id);
CREATE INDEX IF NOT EXISTS idx_decor_images_created_at ON decor_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decor_images_user_project ON decor_images(user_id, project_id);

-- Index GIN pour les métadonnées JSONB
CREATE INDEX IF NOT EXISTS idx_decor_images_metadata ON decor_images USING GIN(metadata);

-- =====================================================
-- 3. POLITIQUES RLS (Row Level Security)
-- =====================================================

-- Activer RLS sur les nouvelles tables
ALTER TABLE character_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE decor_images ENABLE ROW LEVEL SECURITY;

-- Politiques pour character_images
CREATE POLICY "Users can view their own character images" ON character_images
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own character images" ON character_images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own character images" ON character_images
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own character images" ON character_images
    FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour decor_images
CREATE POLICY "Users can view their own decor images" ON decor_images
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own decor images" ON decor_images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decor images" ON decor_images
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decor images" ON decor_images
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 4. TRIGGERS POUR updated_at
-- =====================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour character_images
CREATE TRIGGER update_character_images_updated_at
    BEFORE UPDATE ON character_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers pour decor_images
CREATE TRIGGER update_decor_images_updated_at
    BEFORE UPDATE ON decor_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. COMMENTAIRES POUR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE character_images IS 'Table spécialisée pour stocker les images de personnages générées';
COMMENT ON TABLE decor_images IS 'Table spécialisée pour stocker les images de décors/backgrounds générées';

COMMENT ON COLUMN character_images.metadata IS 'Métadonnées JSON contenant les traits, style, archétype, etc.';
COMMENT ON COLUMN decor_images.metadata IS 'Métadonnées JSON contenant les traits, style, archétype, etc.';
