const pool = require('../config/database');

function gererErreurBDD(error, res, contexte) {
  console.error(`Erreur (${contexte}) :`, error);

  switch (error.code) {
    case '23503': // violation de clé étrangère
      return res.status(409).json({ erreur: "Impossible de réaliser cette opération : des emprunts sont liés à cet adhérent." });
    case '23514': // violation de contrainte CHECK
      return res.status(400).json({ erreur: "Une des valeurs fournies ne respecte pas les contraintes autorisées." });
    case '22P02': // format de donnée invalide
      return res.status(400).json({ erreur: "Format de donnée invalide." });
    default:
      return res.status(500).json({ erreur: "Une erreur serveur est survenue." });
  }
}

// 1. AJOUTER UN ADHÉRENT (Create)
async function ajouterAdherent(req, res) {
  const { nom, contact } = req.body;

  try {
    const requete = `
      INSERT INTO adherents (nom, contact)
      VALUES ($1, $2)
      RETURNING *
    `;
    const resultat = await pool.query(requete, [nom, contact]);

    res.status(201).json(resultat.rows[0]);
  } catch (error) {
    gererErreurBDD(error, res, 'ajouterAdherent');
  }
}

// 2. LISTER LES ADHÉRENTS (Read)
async function listeAdherents(req, res) {
  try {
    const resultat = await pool.query('SELECT * FROM adherents ORDER BY nom ASC');
    res.status(200).json(resultat.rows);
  } catch (error) {
    gererErreurBDD(error, res, 'listeAdherents');
  }
}

// 3. OBTENIR UN ADHÉRENT PAR ID
async function obtenirAdherent(req, res) {
  try {
    const resultat = await pool.query('SELECT * FROM adherents WHERE id = $1', [req.params.id]);

    if (resultat.rows.length === 0) {
      return res.status(404).json({ erreur: "Adhérent introuvable." });
    }

    res.status(200).json(resultat.rows[0]);
  } catch (error) {
    gererErreurBDD(error, res, 'obtenirAdherent');
  }
}

// 4. MODIFIER UN ADHÉRENT (Update partiel)
async function modifierAdherent(req, res) {
  const { id } = req.params;
  const { nom, contact } = req.body;

  try {
    const adherentExistant = await pool.query('SELECT * FROM adherents WHERE id = $1', [id]);
    if (adherentExistant.rows.length === 0) {
      return res.status(404).json({ erreur: "Adhérent introuvable." });
    }

    const adherentActuel = adherentExistant.rows[0];
    const nouveauNom = nom !== undefined ? nom : adherentActuel.nom;
    const nouveauContact = contact !== undefined ? contact : adherentActuel.contact;

    const requete = `
      UPDATE adherents
      SET nom = $1, contact = $2
      WHERE id = $3
      RETURNING *
    `;
    const resultat = await pool.query(requete, [nouveauNom, nouveauContact, id]);

    res.status(200).json(resultat.rows[0]);
  } catch (error) {
    gererErreurBDD(error, res, 'modifierAdherent');
  }
}

// 5. SUPPRIMER UN ADHÉRENT (Delete)
async function supprimerAdherent(req, res) {
  const { id } = req.params;

  try {
    const adherentExistant = await pool.query('SELECT id FROM adherents WHERE id = $1', [id]);
    if (adherentExistant.rows.length === 0) {
      return res.status(404).json({ erreur: "Adhérent introuvable." });
    }

    await pool.query('DELETE FROM adherents WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
  
    if (error.code === '23001') {
      return res.status(409).json({ erreur: "Impossible de supprimer cet adhérent : il possède un historique d'emprunts." });
    }
    gererErreurBDD(error, res, 'supprimerAdherent');
  }
}

// 6. HISTORIQUE DES EMPRUNTS D'UN ADHÉRENT (en cours + passés)
// Besoin fonctionnel explicite du cahier des charges (section 2)
async function obtenirHistoriqueEmprunts(req, res) {
  const { id } = req.params;

  try {
    const adherentExistant = await pool.query('SELECT id FROM adherents WHERE id = $1', [id]);
    if (adherentExistant.rows.length === 0) {
      return res.status(404).json({ erreur: "Adhérent introuvable." });
    }

    const requete = `
      SELECT
        emprunts.id,
        livres.titre AS livre_titre,
        emprunts.date_emprunt,
        emprunts.date_retour_prevue,
        emprunts.date_retour_effective,
        CASE
          WHEN emprunts.date_retour_effective IS NULL THEN 'en cours'
          ELSE 'terminé'
        END AS statut_emprunt,
        CASE
          WHEN emprunts.date_retour_effective IS NULL
               AND emprunts.date_retour_prevue < CURRENT_DATE THEN true
          ELSE false
        END AS en_retard
      FROM emprunts
      JOIN livres ON emprunts.livre_id = livres.id
      WHERE emprunts.adherent_id = $1
      ORDER BY emprunts.date_emprunt DESC
    `;
    const resultat = await pool.query(requete, [id]);

    res.status(200).json(resultat.rows);
  } catch (error) {
    gererErreurBDD(error, res, 'obtenirHistoriqueEmprunts');
  }
}

module.exports = {
  ajouterAdherent,
  listeAdherents,
  obtenirAdherent,
  modifierAdherent,
  supprimerAdherent,
  obtenirHistoriqueEmprunts
};