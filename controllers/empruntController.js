const pool = require('../config/database');

function gererErreurBDD(error, res, contexte) {
  console.error(`Erreur (${contexte}) :`, error);

  switch (error.code) {
    case '23503': 
      return res.status(404).json({ erreur: "L'adhérent ou le livre référencé n'existe pas." });
    case '23514':
      return res.status(400).json({ erreur: "Une des valeurs fournies ne respecte pas les contraintes autorisées." });
    case '22P02':
      return res.status(400).json({ erreur: "Format de donnée invalide." });
    default:
      return res.status(500).json({ erreur: "Une erreur serveur est survenue." });
  }
}

async function creerEmprunt(req, res) {
  const { adherent_id, livre_id, date_retour_prevue } = req.body;
  const client = await pool.connect();

  try {

    const adherentCheck = await client.query('SELECT id FROM adherents WHERE id = $1', [adherent_id]);
    if (adherentCheck.rows.length === 0) {
      return res.status(404).json({ erreur: "L'adhérent spécifié n'existe pas." });
    }

    const livreCheck = await client.query('SELECT statut FROM livres WHERE id = $1', [livre_id]);
    if (livreCheck.rows.length === 0) {
      return res.status(404).json({ erreur: "Le livre spécifié n'existe pas." });
    }
    if (livreCheck.rows[0].statut !== 'disponible') {
      return res.status(400).json({ erreur: "Ce livre est déjà emprunté." });
    }

    await client.query('BEGIN');

    const empruntResultat = await client.query(
      `INSERT INTO emprunts (adherent_id, livre_id, date_retour_prevue)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [adherent_id, livre_id, date_retour_prevue]
    );

    await client.query(
      "UPDATE livres SET statut = 'emprunte' WHERE id = $1",
      [livre_id]
    );

    await client.query('COMMIT');

    res.status(201).json(empruntResultat.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    gererErreurBDD(error, res, 'creerEmprunt');
  } finally {
    client.release();
  }
}

async function enregistrerRetour(req, res) {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    const empruntCheck = await client.query('SELECT * FROM emprunts WHERE id = $1', [id]);
    if (empruntCheck.rows.length === 0) {
      return res.status(404).json({ erreur: "Emprunt introuvable." });
    }

    const emprunt = empruntCheck.rows[0];
    if (emprunt.date_retour_effective !== null) {
      return res.status(400).json({ erreur: "Ce livre a déjà été rendu." });
    }

    await client.query('BEGIN');

    const resultat = await client.query(
      `UPDATE emprunts
       SET date_retour_effective = CURRENT_DATE
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    await client.query(
      "UPDATE livres SET statut = 'disponible' WHERE id = $1",
      [emprunt.livre_id]
    );

    await client.query('COMMIT');

    res.status(200).json(resultat.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    gererErreurBDD(error, res, 'enregistrerRetour');
  } finally {
    client.release();
  }
}

// 3. LISTER TOUS LES EMPRUNTS (avec infos livre + adhérent)
async function listeEmprunts(req, res) {
  try {
    const requete = `
      SELECT
        emprunts.id,
        adherents.nom AS adherent_nom,
        livres.titre AS livre_titre,
        emprunts.date_emprunt,
        emprunts.date_retour_prevue,
        emprunts.date_retour_effective,
        CASE WHEN emprunts.date_retour_effective IS NULL THEN 'en cours' ELSE 'termine' END AS statut_emprunt
      FROM emprunts
      JOIN adherents ON emprunts.adherent_id = adherents.id
      JOIN livres ON emprunts.livre_id = livres.id
      ORDER BY emprunts.date_emprunt DESC
    `;
    const resultat = await pool.query(requete);
    res.status(200).json(resultat.rows);
  } catch (error) {
    gererErreurBDD(error, res, 'listeEmprunts');
  }
}

// 4. LISTER LES EMPRUNTS EN COURS
async function listeEmpruntsEnCours(req, res) {
  try {
    const requete = `
      SELECT
        emprunts.id,
        adherents.nom AS adherent_nom,
        livres.titre AS livre_titre,
        emprunts.date_emprunt,
        emprunts.date_retour_prevue
      FROM emprunts
      JOIN adherents ON emprunts.adherent_id = adherents.id
      JOIN livres ON emprunts.livre_id = livres.id
      WHERE emprunts.date_retour_effective IS NULL
      ORDER BY emprunts.date_retour_prevue ASC
    `;
    const resultat = await pool.query(requete);
    res.status(200).json(resultat.rows);
  } catch (error) {
    gererErreurBDD(error, res, 'listeEmpruntsEnCours');
  }
}

async function listeEmpruntsEnRetard(req, res) {
  try {
    const requete = `
      SELECT
        emprunts.id,
        adherents.nom AS adherent_nom,
        adherents.contact AS adherent_contact,
        livres.titre AS livre_titre,
        emprunts.date_emprunt,
        emprunts.date_retour_prevue,
        (CURRENT_DATE - emprunts.date_retour_prevue) AS jours_de_retard
      FROM emprunts
      JOIN adherents ON emprunts.adherent_id = adherents.id
      JOIN livres ON emprunts.livre_id = livres.id
      WHERE emprunts.date_retour_effective IS NULL
        AND emprunts.date_retour_prevue < CURRENT_DATE
      ORDER BY emprunts.date_retour_prevue ASC
    `;
    const resultat = await pool.query(requete);
    res.status(200).json(resultat.rows);
  } catch (error) {
    gererErreurBDD(error, res, 'listeEmpruntsEnRetard');
  }
}

// 6. OBTENIR UN EMPRUNT PAR ID
async function obtenirEmprunt(req, res) {
  try {
    const requete = `
      SELECT
        emprunts.*,
        adherents.nom AS adherent_nom,
        livres.titre AS livre_titre
      FROM emprunts
      JOIN adherents ON emprunts.adherent_id = adherents.id
      JOIN livres ON emprunts.livre_id = livres.id
      WHERE emprunts.id = $1
    `;
    const resultat = await pool.query(requete, [req.params.id]);

    if (resultat.rows.length === 0) {
      return res.status(404).json({ erreur: "Emprunt introuvable." });
    }

    res.status(200).json(resultat.rows[0]);
  } catch (error) {
    gererErreurBDD(error, res, 'obtenirEmprunt');
  }
}

module.exports = {
  creerEmprunt,
  enregistrerRetour,
  listeEmprunts,
  listeEmpruntsEnCours,
  listeEmpruntsEnRetard,
  obtenirEmprunt
};