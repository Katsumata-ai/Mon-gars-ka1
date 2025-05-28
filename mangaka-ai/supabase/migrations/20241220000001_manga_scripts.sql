-- Migration pour ajouter la table des scripts de manga
-- Created: 2024-12-20
-- Description: Table pour stocker les scripts détaillés des projets manga

-- Table pour les scripts de manga
CREATE TABLE manga_scripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES manga_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Mon Manga',
    description TEXT DEFAULT '',
    script_data JSONB NOT NULL DEFAULT '{
        "chapters": []
    }'::jsonb,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_manga_scripts_project_id ON manga_scripts(project_id);
CREATE INDEX idx_manga_scripts_user_id ON manga_scripts(user_id);
CREATE INDEX idx_manga_scripts_updated_at ON manga_scripts(updated_at DESC);

-- Index GIN pour les requêtes JSONB
CREATE INDEX idx_manga_scripts_script_data ON manga_scripts USING GIN (script_data);

-- RLS (Row Level Security)
ALTER TABLE manga_scripts ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs ne voient que leurs propres scripts
CREATE POLICY "Users can view their own scripts" ON manga_scripts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scripts" ON manga_scripts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scripts" ON manga_scripts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scripts" ON manga_scripts
    FOR DELETE USING (auth.uid() = user_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_manga_scripts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER trigger_update_manga_scripts_updated_at
    BEFORE UPDATE ON manga_scripts
    FOR EACH ROW
    EXECUTE FUNCTION update_manga_scripts_updated_at();

-- Fonction pour créer automatiquement un script vide lors de la création d'un projet
CREATE OR REPLACE FUNCTION create_default_script_for_project()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO manga_scripts (project_id, user_id, title, description)
    VALUES (NEW.id, NEW.user_id, NEW.title || ' - Script', 'Script généré automatiquement');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer un script par défaut lors de la création d'un projet
CREATE TRIGGER trigger_create_default_script
    AFTER INSERT ON manga_projects
    FOR EACH ROW
    EXECUTE FUNCTION create_default_script_for_project();

-- Table pour l'historique des versions des scripts (optionnel)
CREATE TABLE manga_script_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    script_id UUID NOT NULL REFERENCES manga_scripts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    script_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Index pour l'historique des versions
CREATE INDEX idx_manga_script_versions_script_id ON manga_script_versions(script_id);
CREATE INDEX idx_manga_script_versions_created_at ON manga_script_versions(created_at DESC);

-- RLS pour l'historique des versions
ALTER TABLE manga_script_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view script versions they own" ON manga_script_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM manga_scripts 
            WHERE manga_scripts.id = manga_script_versions.script_id 
            AND manga_scripts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert script versions they own" ON manga_script_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM manga_scripts 
            WHERE manga_scripts.id = manga_script_versions.script_id 
            AND manga_scripts.user_id = auth.uid()
        )
    );

-- Fonction pour sauvegarder une version du script
CREATE OR REPLACE FUNCTION save_script_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Sauvegarder l'ancienne version si le script_data a changé
    IF OLD.script_data IS DISTINCT FROM NEW.script_data THEN
        INSERT INTO manga_script_versions (script_id, version_number, script_data, created_by)
        VALUES (OLD.id, OLD.version, OLD.script_data, auth.uid());
        
        -- Incrémenter le numéro de version
        NEW.version = OLD.version + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour sauvegarder automatiquement les versions
CREATE TRIGGER trigger_save_script_version
    BEFORE UPDATE ON manga_scripts
    FOR EACH ROW
    EXECUTE FUNCTION save_script_version();

-- Vue pour obtenir les statistiques des scripts
CREATE VIEW manga_script_stats AS
SELECT 
    ms.id,
    ms.project_id,
    ms.title,
    ms.updated_at,
    COALESCE(jsonb_array_length(ms.script_data->'chapters'), 0) as chapter_count,
    (
        SELECT COUNT(*)
        FROM jsonb_array_elements(ms.script_data->'chapters') as chapter,
             jsonb_array_elements(chapter->'scenes') as scene
    ) as scene_count,
    (
        SELECT COUNT(*)
        FROM jsonb_array_elements(ms.script_data->'chapters') as chapter,
             jsonb_array_elements(chapter->'scenes') as scene,
             jsonb_array_elements(scene->'panels') as panel
    ) as panel_count,
    (
        SELECT COUNT(*)
        FROM jsonb_array_elements(ms.script_data->'chapters') as chapter,
             jsonb_array_elements(chapter->'scenes') as scene,
             jsonb_array_elements(scene->'panels') as panel,
             jsonb_array_elements(panel->'dialogues') as dialogue
    ) as dialogue_count
FROM manga_scripts ms;

-- Commentaires pour la documentation
COMMENT ON TABLE manga_scripts IS 'Scripts détaillés des projets manga avec structure chapitres/scènes/panels';
COMMENT ON COLUMN manga_scripts.script_data IS 'Données JSON contenant la structure complète du script';
COMMENT ON TABLE manga_script_versions IS 'Historique des versions des scripts pour le versioning';
COMMENT ON VIEW manga_script_stats IS 'Statistiques calculées des scripts (nombre de chapitres, scènes, panels, dialogues)';
