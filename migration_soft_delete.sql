-- ============================================================
-- Migration : suppression logique (soft delete)
-- Ajoute une colonne 'actif' aux tables auteurs, adherents, livres.
-- Un enregistrement désactivé (actif = false) disparaît des listes
-- et devient non modifiable, mais reste en base pour préserver
-- l'intégrité de l'historique des emprunts.
-- ============================================================

ALTER TABLE auteurs
  ADD COLUMN IF NOT EXISTS actif BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE adherents
  ADD COLUMN IF NOT EXISTS actif BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE livres
  ADD COLUMN IF NOT EXISTS actif BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_auteurs_actif ON auteurs (actif);
CREATE INDEX IF NOT EXISTS idx_adherents_actif ON adherents (actif);
CREATE INDEX IF NOT EXISTS idx_livres_actif ON livres (actif);