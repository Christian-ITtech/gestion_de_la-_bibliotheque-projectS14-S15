const pool = require('../config/database');

// ============================================================
// Fonction utilitaire : traduit les erreurs PostgreSQL courantes
// en réponses HTTP adaptées, plutôt que de toujours renvoyer 500.
// ============================================================
function gererErreurBDD(error, res, contexte) {
  console.error(`Erreur (${contexte}) :`, error);

  switch (error.code) {
    case '23503': // violation de clé étrangère
      return res.status(400).json({ erreur: "Référence invalide : l'auteur indiqué n'existe pas." });
    case '23514': // violation de contrainte CHECK (ex. année, statut)
      return res.status(400).json({ erreur: "Une des valeurs fournies ne respecte pas les contraintes autorisées." });
    case '22P02': // format de donnée invalide (texte au lieu d'un nombre, etc.)
      return res.status(400).json({ erreur: "Format de donnée invalide." });
    default:
      return res.status(500).json({ erreur: "Une erreur serveur est survenue." });
  }
}

// ------------------------------------------------------------
// 1. AJOUTER UN LIVRE (Create)
// ------------------------------------------------------------
async function ajouterLivre(req, res) {
  const { titre, auteur_id, annee_publication } = req.body;

  try {
    // Règle métier : l'auteur doit exister avant de créer le livre
    const auteurCheck = await pool.query('SELECT id FROM auteurs WHERE id = $1', [auteur_id]);
    if (auteurCheck.rows.length === 0) {
      return res.status(404).json({ erreur: "L'auteur spécifié n'existe pas." });
    }

    const requete = `
      INSERT INTO livres (titre, auteur_id, annee_publication)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const resultat = await pool.query(requete, [titre, auteur_id, annee_publication || null]);

    res.status(201).json(resultat.rows[0]);
  } catch (error) {
    gererErreurBDD(error, res, 'ajouterLivre');
  }
}

// ------------------------------------------------------------
// 2. LISTER / RECHERCHER LES LIVRES (Read — avec recherche + pagination)
// GET /api/livres?recherche=...&page=1&limite=10
// ------------------------------------------------------------
async function listeLivres(req, res) {
  try {
    const recherche = req.query.recherche ? req.query.recherche.trim() : null;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limite = Math.min(Math.max(parseInt(req.query.limite) || 10, 1), 100);
    const decalage = (page - 1) * limite;

    let clauseBase = `
      FROM livres
      JOIN auteurs ON livres.auteur_id = auteurs.id
    `;
    const valeurs = [];

    if (recherche) {
      valeurs.push(`%${recherche}%`);
      clauseBase += ` WHERE livres.titre ILIKE $${valeurs.length} OR auteurs.nom ILIKE $${valeurs.length}`;
    }

    // Compte total (nécessaire pour que le frontend calcule le nombre de pages)
    const compteResultat = await pool.query(`SELECT COUNT(*) ${clauseBase}`, valeurs);
    const total = parseInt(compteResultat.rows[0].count, 10);

    valeurs.push(limite, decalage);
    const requeteFinale = `
      SELECT livres.id, livres.titre, livres.annee_publication, livres.statut, auteurs.nom AS auteur_nom
      ${clauseBase}
      ORDER BY livres.titre ASC
      LIMIT $${valeurs.length - 1} OFFSET $${valeurs.length}
    `;

    const resultat = await pool.query(requeteFinale, valeurs);

    res.status(200).json({
      donnees: resultat.rows,
      pagination: { page, limite, total, totalPages: Math.ceil(total / limite) }
    });
  } catch (error) {
    gererErreurBDD(error, res, 'listeLivres');
  }
}

// ------------------------------------------------------------
// 3. OBTENIR UN LIVRE PAR ID (utile pour pré-remplir un formulaire d'édition)
// ------------------------------------------------------------
async function obtenirLivre(req, res) {
  try {
    const requete = `
      SELECT livres.id, livres.titre, livres.annee_publication, livres.statut,
             livres.auteur_id, auteurs.nom AS auteur_nom
      FROM livres
      JOIN auteurs ON livres.auteur_id = auteurs.id
      WHERE livres.id = $1
    `;
    const resultat = await pool.query(requete, [req.params.id]);

    if (resultat.rows.length === 0) {
      return res.status(404).json({ erreur: "Livre introuvable." });
    }

    res.status(200).json(resultat.rows[0]);
  } catch (error) {
    gererErreurBDD(error, res, 'obtenirLivre');
  }
}

// ------------------------------------------------------------
// 4. MODIFIER UN LIVRE (Update partiel)
// ------------------------------------------------------------
async function modifierLivre(req, res) {
  const { id } = req.params;
  const { titre, auteur_id, annee_publication, statut } = req.body;

  try {
    const livreExistant = await pool.query('SELECT * FROM livres WHERE id = $1', [id]);
    if (livreExistant.rows.length === 0) {
      return res.status(404).json({ erreur: "Livre introuvable." });
    }

    if (auteur_id !== undefined) {
      const auteurCheck = await pool.query('SELECT id FROM auteurs WHERE id = $1', [auteur_id]);
      if (auteurCheck.rows.length === 0) {
        return res.status(404).json({ erreur: "L'auteur spécifié n'existe pas." });
      }
    }

    // Mise à jour partielle : on ne remplace que les champs réellement fournis
    const livreActuel = livreExistant.rows[0];
    const nouveauTitre = titre !== undefined ? titre : livreActuel.titre;
    const nouvelAuteurId = auteur_id !== undefined ? auteur_id : livreActuel.auteur_id;
    const nouvelleAnnee = annee_publication !== undefined ? annee_publication : livreActuel.annee_publication;
    const nouveauStatut = statut !== undefined ? statut : livreActuel.statut;

    const requete = `
      UPDATE livres
      SET titre = $1, auteur_id = $2, annee_publication = $3, statut = $4
      WHERE id = $5
      RETURNING *
    `;
    const resultat = await pool.query(
      requete,
      [nouveauTitre, nouvelAuteurId, nouvelleAnnee, nouveauStatut, id]
    );

    res.status(200).json(resultat.rows[0]);
  } catch (error) {
    gererErreurBDD(error, res, 'modifierLivre');
  }
}

// ------------------------------------------------------------
// 5. SUPPRIMER UN LIVRE (Delete)
// ------------------------------------------------------------
async function supprimerLivre(req, res) {
  const { id } = req.params;

  try {
    const livreExistant = await pool.query('SELECT id FROM livres WHERE id = $1', [id]);
    if (livreExistant.rows.length === 0) {
      return res.status(404).json({ erreur: "Livre introuvable." });
    }

    await pool.query('DELETE FROM livres WHERE id = $1', [id]);
    res.status(204).send(); // 204 : suppression réussie, aucun contenu à renvoyer
  } catch (error) {
    // Cas particulier prévu par le schema.sql : ON DELETE RESTRICT sur emprunts.livre_id
    // PostgreSQL renvoie le code 23001 (restrict_violation) pour ce cas précis,
    // différent de 23503 (foreign_key_violation) utilisé lors d'une insertion/modification.
    if (error.code === '23001') {
      return res.status(409).json({ erreur: "Impossible de supprimer ce livre : il possède un historique d'emprunts." });
    }
    gererErreurBDD(error, res, 'supprimerLivre');
  }
}

module.exports = {
  ajouterLivre,
  listeLivres,
  obtenirLivre,
  modifierLivre,
  supprimerLivre
};