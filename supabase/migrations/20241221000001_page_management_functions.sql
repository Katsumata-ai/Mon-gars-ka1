-- Migration pour les fonctions de gestion intelligente des pages
-- Created: 2024-12-21
-- Description: Fonctions SQL pour la numérotation intelligente et la réorganisation des pages

-- Fonction pour renuméroter les pages après suppression
CREATE OR REPLACE FUNCTION renumber_pages_after_deletion(
  p_project_id UUID,
  p_deleted_page_number INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Décrémenter le numéro de toutes les pages après celle supprimée
  UPDATE pages 
  SET 
    page_number = page_number - 1,
    updated_at = NOW()
  WHERE 
    project_id = p_project_id 
    AND page_number > p_deleted_page_number;
    
  -- Log de l'opération
  RAISE NOTICE 'Pages renumérotées après suppression de la page % du projet %', 
    p_deleted_page_number, p_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour réorganiser les pages en transaction
CREATE OR REPLACE FUNCTION reorder_pages_transaction(
  p_project_id UUID,
  p_updates JSONB
)
RETURNS VOID AS $$
DECLARE
  update_record JSONB;
BEGIN
  -- Parcourir chaque mise à jour
  FOR update_record IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    UPDATE pages 
    SET 
      page_number = (update_record->>'page_number')::INTEGER,
      updated_at = NOW()
    WHERE 
      id = (update_record->>'id')::UUID
      AND project_id = p_project_id;
  END LOOP;
  
  -- Vérifier la cohérence de la numérotation
  PERFORM validate_page_numbering(p_project_id);
  
  RAISE NOTICE 'Pages réorganisées pour le projet %', p_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour valider la numérotation des pages
CREATE OR REPLACE FUNCTION validate_page_numbering(p_project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  page_count INTEGER;
  expected_numbers INTEGER[];
  actual_numbers INTEGER[];
BEGIN
  -- Compter les pages
  SELECT COUNT(*) INTO page_count
  FROM pages 
  WHERE project_id = p_project_id;
  
  -- Générer la séquence attendue (1, 2, 3, ...)
  SELECT ARRAY(SELECT generate_series(1, page_count)) INTO expected_numbers;
  
  -- Récupérer les numéros actuels triés
  SELECT ARRAY(
    SELECT page_number 
    FROM pages 
    WHERE project_id = p_project_id 
    ORDER BY page_number
  ) INTO actual_numbers;
  
  -- Comparer les séquences
  IF expected_numbers = actual_numbers THEN
    RETURN TRUE;
  ELSE
    RAISE WARNING 'Numérotation incohérente détectée pour le projet %. Attendu: %, Actuel: %', 
      p_project_id, expected_numbers, actual_numbers;
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour corriger automatiquement la numérotation
CREATE OR REPLACE FUNCTION fix_page_numbering(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
  page_record RECORD;
  new_number INTEGER := 1;
  fixed_count INTEGER := 0;
BEGIN
  -- Parcourir les pages dans l'ordre de création
  FOR page_record IN 
    SELECT id, page_number 
    FROM pages 
    WHERE project_id = p_project_id 
    ORDER BY created_at, id
  LOOP
    -- Mettre à jour si le numéro ne correspond pas
    IF page_record.page_number != new_number THEN
      UPDATE pages 
      SET 
        page_number = new_number,
        updated_at = NOW()
      WHERE id = page_record.id;
      
      fixed_count := fixed_count + 1;
    END IF;
    
    new_number := new_number + 1;
  END LOOP;
  
  RAISE NOTICE 'Correction de numérotation terminée. % pages corrigées pour le projet %', 
    fixed_count, p_project_id;
    
  RETURN fixed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir le prochain numéro de page disponible
CREATE OR REPLACE FUNCTION get_next_page_number(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
  max_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(page_number), 0) + 1 
  INTO max_number
  FROM pages 
  WHERE project_id = p_project_id;
  
  RETURN max_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour valider la numérotation lors des insertions/mises à jour
CREATE OR REPLACE FUNCTION validate_page_number_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier que le numéro de page est positif
  IF NEW.page_number <= 0 THEN
    RAISE EXCEPTION 'Le numéro de page doit être positif';
  END IF;
  
  -- Vérifier l'unicité du numéro de page dans le projet
  IF EXISTS (
    SELECT 1 FROM pages 
    WHERE project_id = NEW.project_id 
    AND page_number = NEW.page_number 
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
  ) THEN
    RAISE EXCEPTION 'Le numéro de page % existe déjà pour ce projet', NEW.page_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur la table pages
DROP TRIGGER IF EXISTS validate_page_number ON pages;
CREATE TRIGGER validate_page_number
  BEFORE INSERT OR UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION validate_page_number_trigger();

-- Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_pages_project_page_number 
ON pages(project_id, page_number);

CREATE INDEX IF NOT EXISTS idx_pages_project_created_at 
ON pages(project_id, created_at);

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION renumber_pages_after_deletion(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_pages_transaction(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_page_numbering(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION fix_page_numbering(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_page_number(UUID) TO authenticated;
