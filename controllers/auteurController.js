const pool = require('../config/database');

// ============================================================
// Fonction utilitaire : traduit les erreurs PostgreSQL courantes
// en réponses HTTP adaptées, plutôt que de toujours renvoyer 500.
// ============================================================
function gererErreurBDD(error, res, contexte) {
  console.error(`Erreur (${contexte}) :`, error);

  switch (error.code) {
    case '23503': // violation de clé étrangère
      return res.status(409).json({ erreur: "Impossible de réaliser cette opération : des livres sont liés à cet auteur." });
    case '23514': // violation de contrainte CHECK
      return res.status(400).json({ erreur: "Une des valeurs fournies ne respecte pas les contraintes autorisées." });
    case '22P02': // format de donnée invalide
      return res.status(400).json({ erreur: "Format de donnée invalide." });
    default:
      return res.status(500).json({ erreur: "Une erreur serveur est survenue." });
  }
}

// ------------------------------------------------------------
// 1. AJOUTER UN AUTEUR (Create)
// ------------------------------------------------------------
async function ajouterAuteur(req, res) {
  const { nom, nationalite } = req.body;

  try {
    const requete = `
      INSERT INTO auteurs (nom, nationalite)
      VALUES ($1, $2)
      RETURNING *
    `;
    const resultat = await pool.query(requete, [nom, nationalite || null]);

    res.status(201).json(resultat.rows[0]);
  } catch (error) {
    gererErreurBDD(error, res, 'ajouterAuteur');
  }
}

// ------------------------------------------------------------
// 2. LISTER LES AUTEURS (Read)
// ------------------------------------------------------------
async function listeAuteurs(req, res) {
  try {
    const resultat = await pool.query('SELECT * FROM auteurs ORDER BY nom ASC');
    res.status(200).json(resultat.rows);
  } catch (error) {
    gererErreurBDD(error, res, 'listeAuteurs');
  }
}

// ------------------------------------------------------------
// 3. OBTENIR UN AUTEUR PAR ID (utile pour pré-remplir un formulaire d'édition)
// ------------------------------------------------------------
async function obtenirAuteur(req, res) {
  try {
    const resultat = await pool.query('SELECT * FROM auteurs WHERE id = $1', [req.params.id]);

    if (resultat.rows.length === 0) {
      return res.status(404).json({ erreur: "Auteur introuvable." });
    }

    res.status(200).json(resultat.rows[0]);
  } catch (error) {
    gererErreurBDD(error, res, 'obtenirAuteur');
  }
}

// ------------------------------------------------------------
// 4. MODIFIER UN AUTEUR (Update partiel)
// ------------------------------------------------------------
async function modifierAuteur(req, res) {
  const { id } = req.params;
  const { nom, nationalite } = req.body;

  try {
    const auteurExistant = await pool.query('SELECT * FROM auteurs WHERE id = $1', [id]);
    if (auteurExistant.rows.length === 0) {
      return res.status(404).json({ erreur: "Auteur introuvable." });
    }

    const auteurActuel = auteurExistant.rows[0];
    const nouveauNom = nom !== undefined ? nom : auteurActuel.nom;
    const nouvelleNationalite = nationalite !== undefined ? nationalite : auteurActuel.nationalite;

    const requete = `
      UPDATE auteurs
      SET nom = $1, nationalite = $2
      WHERE id = $3
      RETURNING *
    `;
    const resultat = await pool.query(requete, [nouveauNom, nouvelleNationalite, id]);

    res.status(200).json(resultat.rows[0]);
  } catch (error) {
    gererErreurBDD(error, res, 'modifierAuteur');
  }
}

// ------------------------------------------------------------
// 5. SUPPRIMER UN AUTEUR (Delete)
// ------------------------------------------------------------
async function supprimerAuteur(req, res) {
  const { id } = req.params;

  try {
    const auteurExistant = await pool.query('SELECT id FROM auteurs WHERE id = $1', [id]);
    if (auteurExistant.rows.length === 0) {
      return res.status(404).json({ erreur: "Auteur introuvable." });
    }

    await pool.query('DELETE FROM auteurs WHERE id = $1', [id]);
    res.status(204).send(); // 204 : suppression réussie, aucun contenu à renvoyer
  } catch (error) {
    // Cas particulier prévu par le schema.sql : ON DELETE RESTRICT sur livres.auteur_id
    // PostgreSQL renvoie le code 23001 (restrict_violation) pour ce cas précis,
    // différent de 23503 (foreign_key_violation) utilisé lors d'une insertion/modification.
    if (error.code === '23001') {
      return res.status(409).json({ erreur: "Impossible de supprimer cet auteur : il possède des livres enregistrés." });
    }
    gererErreurBDD(error, res, 'supprimerAuteur');
  }
}

module.exports = {
  ajouterAuteur,
  listeAuteurs,
  obtenirAuteur,
  modifierAuteur,
  supprimerAuteur
};