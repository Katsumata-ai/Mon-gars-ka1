-- Migration: Transfert des données existantes vers les nouvelles tables
-- Date: 2024
-- Description: Migre les données de generated_images vers character_images et decor_images

-- =====================================================
-- 1. VÉRIFICATION PRÉALABLE
-- =====================================================

-- Compter les enregistrements existants pour vérification
DO $$
DECLARE
    total_count INTEGER;
    character_count INTEGER;
    decor_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM generated_images;
    SELECT COUNT(*) INTO character_count FROM generated_images WHERE image_type = 'character';
    SELECT COUNT(*) INTO decor_count FROM generated_images WHERE image_type = 'background';
    
    RAISE NOTICE 'AVANT MIGRATION:';
    RAISE NOTICE 'Total generated_images: %', total_count;
    RAISE NOTICE 'Images de personnages: %', character_count;
    RAISE NOTICE 'Images de décors: %', decor_count;
END $$;

-- =====================================================
-- 2. MIGRATION DES IMAGES DE PERSONNAGES
-- =====================================================

-- Insérer toutes les images de personnages dans character_images
INSERT INTO character_images (
    id,
    user_id,
    project_id,
    original_prompt,
    optimized_prompt,
    image_url,
    metadata,
    created_at,
    updated_at
)
SELECT 
    id,
    user_id,
    project_id,
    original_prompt,
    optimized_prompt,
    image_url,
    metadata,
    created_at,
    COALESCE(updated_at, created_at) as updated_at
FROM generated_images 
WHERE image_type = 'character'
ON CONFLICT (id) DO NOTHING; -- Éviter les doublons si la migration est relancée

-- =====================================================
-- 3. MIGRATION DES IMAGES DE DÉCORS
-- =====================================================

-- Insérer toutes les images de décors dans decor_images
INSERT INTO decor_images (
    id,
    user_id,
    project_id,
    original_prompt,
    optimized_prompt,
    image_url,
    metadata,
    created_at,
    updated_at
)
SELECT 
    id,
    user_id,
    project_id,
    original_prompt,
    optimized_prompt,
    image_url,
    metadata,
    created_at,
    COALESCE(updated_at, created_at) as updated_at
FROM generated_images 
WHERE image_type = 'background'
ON CONFLICT (id) DO NOTHING; -- Éviter les doublons si la migration est relancée

-- =====================================================
-- 4. VÉRIFICATION POST-MIGRATION
-- =====================================================

DO $$
DECLARE
    original_character_count INTEGER;
    original_decor_count INTEGER;
    migrated_character_count INTEGER;
    migrated_decor_count INTEGER;
BEGIN
    -- Compter les originaux
    SELECT COUNT(*) INTO original_character_count FROM generated_images WHERE image_type = 'character';
    SELECT COUNT(*) INTO original_decor_count FROM generated_images WHERE image_type = 'background';
    
    -- Compter les migrés
    SELECT COUNT(*) INTO migrated_character_count FROM character_images;
    SELECT COUNT(*) INTO migrated_decor_count FROM decor_images;
    
    RAISE NOTICE 'APRÈS MIGRATION:';
    RAISE NOTICE 'Personnages - Original: %, Migré: %', original_character_count, migrated_character_count;
    RAISE NOTICE 'Décors - Original: %, Migré: %', original_decor_count, migrated_decor_count;
    
    -- Vérifier l'intégrité
    IF original_character_count != migrated_character_count THEN
        RAISE EXCEPTION 'ERREUR: Nombre de personnages migrés incorrect! Original: %, Migré: %', 
            original_character_count, migrated_character_count;
    END IF;
    
    IF original_decor_count != migrated_decor_count THEN
        RAISE EXCEPTION 'ERREUR: Nombre de décors migrés incorrect! Original: %, Migré: %', 
            original_decor_count, migrated_decor_count;
    END IF;
    
    RAISE NOTICE 'MIGRATION RÉUSSIE: Toutes les données ont été migrées correctement!';
END $$;

-- =====================================================
-- 5. VÉRIFICATION DES MÉTADONNÉES
-- =====================================================

-- Vérifier que les métadonnées importantes sont préservées
DO $$
DECLARE
    character_with_metadata INTEGER;
    decor_with_metadata INTEGER;
    character_migrated_metadata INTEGER;
    decor_migrated_metadata INTEGER;
BEGIN
    -- Compter les enregistrements avec métadonnées dans l'original
    SELECT COUNT(*) INTO character_with_metadata 
    FROM generated_images 
    WHERE image_type = 'character' AND metadata IS NOT NULL AND metadata != '{}';
    
    SELECT COUNT(*) INTO decor_with_metadata 
    FROM generated_images 
    WHERE image_type = 'background' AND metadata IS NOT NULL AND metadata != '{}';
    
    -- Compter les enregistrements avec métadonnées dans les nouvelles tables
    SELECT COUNT(*) INTO character_migrated_metadata 
    FROM character_images 
    WHERE metadata IS NOT NULL AND metadata != '{}';
    
    SELECT COUNT(*) INTO decor_migrated_metadata 
    FROM decor_images 
    WHERE metadata IS NOT NULL AND metadata != '{}';
    
    RAISE NOTICE 'VÉRIFICATION MÉTADONNÉES:';
    RAISE NOTICE 'Personnages avec métadonnées - Original: %, Migré: %', 
        character_with_metadata, character_migrated_metadata;
    RAISE NOTICE 'Décors avec métadonnées - Original: %, Migré: %', 
        decor_with_metadata, decor_migrated_metadata;
END $$;

-- =====================================================
-- 6. CRÉATION D'UNE VUE DE BACKUP (OPTIONNEL)
-- =====================================================

-- Créer une vue pour accéder facilement aux données originales si besoin
CREATE OR REPLACE VIEW generated_images_backup AS
SELECT 
    id,
    user_id,
    project_id,
    image_type,
    original_prompt,
    optimized_prompt,
    image_url,
    metadata,
    created_at,
    updated_at
FROM generated_images
WHERE image_type IN ('character', 'background');

COMMENT ON VIEW generated_images_backup IS 'Vue de backup des données originales avant migration vers les tables spécialisées';
