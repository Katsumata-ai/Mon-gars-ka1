-- Migration pour la renumérotation manuelle des pages
-- Created: 2024-12-21
-- Description: Fonctions SQL pour permettre à l'utilisateur de modifier manuellement les numéros de pages

-- Fonction pour renuméroter une page spécifique avec gestion des conflits
CREATE OR REPLACE FUNCTION update_page_number(
  p_page_id UUID,
  p_new_page_number INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_project_id UUID;
  v_old_page_number INTEGER;
  v_conflicting_page_id UUID;
  v_result JSONB;
BEGIN
  -- Récupérer les informations de la page à modifier
  SELECT project_id, page_number 
  INTO v_project_id, v_old_page_number
  FROM pages 
  WHERE id = p_page_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Page non trouvée'
    );
  END IF;
  
  -- Vérifier que le nouveau numéro est positif
  IF p_new_page_number <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Le numéro de page doit être positif'
    );
  END IF;
  
  -- Si le numéro ne change pas, rien à faire
  IF v_old_page_number = p_new_page_number THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Aucun changement nécessaire'
    );
  END IF;
  
  -- Vérifier s'il y a une page avec le nouveau numéro
  SELECT id INTO v_conflicting_page_id
  FROM pages 
  WHERE project_id = v_project_id 
    AND page_number = p_new_page_number 
    AND id != p_page_id;
  
  -- Commencer la transaction
  BEGIN
    IF v_conflicting_page_id IS NOT NULL THEN
      -- Il y a un conflit : échanger les numéros
      -- Utiliser un numéro temporaire pour éviter la violation de contrainte
      UPDATE pages 
      SET page_number = -1, updated_at = NOW()
      WHERE id = p_page_id;
      
      UPDATE pages 
      SET page_number = v_old_page_number, updated_at = NOW()
      WHERE id = v_conflicting_page_id;
      
      UPDATE pages 
      SET page_number = p_new_page_number, updated_at = NOW()
      WHERE id = p_page_id;
      
      v_result := jsonb_build_object(
        'success', true,
        'action', 'swap',
        'swapped_with', v_conflicting_page_id,
        'message', format('Pages échangées : %s ↔ %s', v_old_page_number, p_new_page_number)
      );
    ELSE
      -- Pas de conflit : simple mise à jour
      UPDATE pages 
      SET page_number = p_new_page_number, updated_at = NOW()
      WHERE id = p_page_id;
      
      v_result := jsonb_build_object(
        'success', true,
        'action', 'update',
        'message', format('Page renumérotée : %s → %s', v_old_page_number, p_new_page_number)
      );
    END IF;
    
    -- Ajouter les informations de la page modifiée
    v_result := v_result || jsonb_build_object(
      'page_id', p_page_id,
      'old_number', v_old_page_number,
      'new_number', p_new_page_number,
      'project_id', v_project_id
    );
    
    RETURN v_result;
    
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Erreur lors de la renumérotation: %s', SQLERRM)
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour renuméroter plusieurs pages en une seule transaction
CREATE OR REPLACE FUNCTION batch_update_page_numbers(
  p_updates JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_update JSONB;
  v_page_id UUID;
  v_new_number INTEGER;
  v_results JSONB := '[]'::JSONB;
  v_result JSONB;
BEGIN
  -- Parcourir chaque mise à jour
  FOR v_update IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    v_page_id := (v_update->>'page_id')::UUID;
    v_new_number := (v_update->>'new_number')::INTEGER;
    
    -- Appliquer la mise à jour
    SELECT update_page_number(v_page_id, v_new_number) INTO v_result;
    
    -- Ajouter le résultat à la liste
    v_results := v_results || jsonb_build_array(v_result);
    
    -- Si une erreur s'est produite, arrêter
    IF NOT (v_result->>'success')::BOOLEAN THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Erreur lors de la mise à jour en lot',
        'failed_at', v_update,
        'details', v_result
      );
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', format('%s pages mises à jour avec succès', jsonb_array_length(p_updates)),
    'results', v_results
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir la liste des pages avec leurs numéros actuels
CREATE OR REPLACE FUNCTION get_pages_with_numbers(p_project_id UUID)
RETURNS TABLE(
  page_id UUID,
  page_number INTEGER,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.page_number,
    p.title,
    p.created_at,
    p.updated_at
  FROM pages p
  WHERE p.project_id = p_project_id
  ORDER BY p.page_number ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour valider la cohérence de la numérotation
CREATE OR REPLACE FUNCTION validate_project_page_numbering(p_project_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_page_count INTEGER;
  v_min_number INTEGER;
  v_max_number INTEGER;
  v_duplicates INTEGER;
  v_gaps INTEGER[];
  v_expected_numbers INTEGER[];
  v_actual_numbers INTEGER[];
BEGIN
  -- Compter les pages
  SELECT COUNT(*) INTO v_page_count
  FROM pages 
  WHERE project_id = p_project_id;
  
  IF v_page_count = 0 THEN
    RETURN jsonb_build_object(
      'valid', true,
      'message', 'Aucune page dans le projet'
    );
  END IF;
  
  -- Récupérer les statistiques
  SELECT MIN(page_number), MAX(page_number)
  INTO v_min_number, v_max_number
  FROM pages 
  WHERE project_id = p_project_id;
  
  -- Vérifier les doublons
  SELECT COUNT(*) INTO v_duplicates
  FROM (
    SELECT page_number, COUNT(*) as cnt
    FROM pages 
    WHERE project_id = p_project_id
    GROUP BY page_number
    HAVING COUNT(*) > 1
  ) duplicates;
  
  -- Récupérer les numéros actuels
  SELECT ARRAY(
    SELECT page_number 
    FROM pages 
    WHERE project_id = p_project_id 
    ORDER BY page_number
  ) INTO v_actual_numbers;
  
  -- Générer la séquence attendue
  SELECT ARRAY(SELECT generate_series(1, v_page_count)) INTO v_expected_numbers;
  
  -- Trouver les gaps
  SELECT ARRAY(
    SELECT s.i
    FROM generate_series(1, v_max_number) s(i)
    WHERE s.i NOT IN (SELECT unnest(v_actual_numbers))
  ) INTO v_gaps;
  
  RETURN jsonb_build_object(
    'valid', (v_duplicates = 0 AND v_gaps = '{}' AND v_min_number = 1),
    'page_count', v_page_count,
    'min_number', v_min_number,
    'max_number', v_max_number,
    'duplicates_count', v_duplicates,
    'gaps', v_gaps,
    'actual_numbers', v_actual_numbers,
    'expected_numbers', v_expected_numbers,
    'message', CASE 
      WHEN v_duplicates > 0 THEN 'Numéros de pages dupliqués détectés'
      WHEN v_gaps != '{}' THEN 'Gaps dans la numérotation détectés'
      WHEN v_min_number != 1 THEN 'La numérotation ne commence pas à 1'
      ELSE 'Numérotation valide'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION update_page_number(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION batch_update_page_numbers(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pages_with_numbers(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_project_page_numbering(UUID) TO authenticated;
