-- Nettoyage préalable
DROP TABLE IF EXISTS emprunts;
DROP TABLE IF EXISTS livres;
DROP TABLE IF EXISTS adherents;
DROP TABLE IF EXISTS auteurs;

-- Table : auteurs
CREATE TABLE auteurs (
    id            SERIAL PRIMARY KEY,
    nom           VARCHAR(150) NOT NULL,
    nationalite   VARCHAR(100)
);

-- Table : adherents
CREATE TABLE adherents (
    id            SERIAL PRIMARY KEY,
    nom           VARCHAR(150) NOT NULL,
    contact       VARCHAR(150) NOT NULL
);


-- Table : livres
CREATE TABLE livres (
    id                  SERIAL PRIMARY KEY,
    titre               VARCHAR(255) NOT NULL,
    auteur_id           INTEGER NOT NULL REFERENCES auteurs(id) ON DELETE RESTRICT,
    annee_publication   INTEGER CHECK (annee_publication > 0 AND annee_publication <= EXTRACT(YEAR FROM CURRENT_DATE)),
    statut              VARCHAR(20) NOT NULL DEFAULT 'disponible'
                        CHECK (statut IN ('disponible', 'emprunte'))
);

-- Table : emprunts
CREATE TABLE emprunts (
    id                      SERIAL PRIMARY KEY,
    adherent_id             INTEGER NOT NULL REFERENCES adherents(id) ON DELETE RESTRICT,
    livre_id                INTEGER NOT NULL REFERENCES livres(id) ON DELETE RESTRICT,
    date_emprunt            DATE NOT NULL DEFAULT CURRENT_DATE,
    date_retour_prevue      DATE NOT NULL,
    date_retour_effective   DATE,
    CHECK (date_retour_prevue > date_emprunt)
);

-- Index — pensés pour les besoins fonctionnels du cahier des charges

-- Recherche de livres par titre ou par auteur
CREATE INDEX idx_livres_titre ON livres (titre);
CREATE INDEX idx_livres_auteur_id ON livres (auteur_id);

-- Consultation des emprunts d'un adhérent / d'un livre
CREATE INDEX idx_emprunts_adherent_id ON emprunts (adherent_id);
CREATE INDEX idx_emprunts_livre_id ON emprunts (livre_id);

-- Emprunts en cours (date_retour_effective IS NULL) : index partiel,
CREATE INDEX idx_emprunts_en_cours ON emprunts (date_retour_prevue)
    WHERE date_retour_effective IS NULL;
