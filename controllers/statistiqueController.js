const pool = require('../config/database');

async function obtenirStatistiques(req, res) {
  try {
    
    const [
      totalLivres,
      totalAdherents,
      empruntsEnCours,
      empruntsEnRetard,
      livrePlusEmprunte,
      adherentLePlusActif
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM livres'),
      pool.query('SELECT COUNT(*) FROM adherents'),
      pool.query(
        'SELECT COUNT(*) FROM emprunts WHERE date_retour_effective IS NULL'
      ),
      pool.query(
        `SELECT COUNT(*) FROM emprunts
         WHERE date_retour_effective IS NULL
           AND date_retour_prevue < CURRENT_DATE`
      ),
      pool.query(
        `SELECT livres.id, livres.titre, COUNT(emprunts.id) AS nombre_emprunts
         FROM emprunts
         JOIN livres ON emprunts.livre_id = livres.id
         GROUP BY livres.id, livres.titre
         ORDER BY nombre_emprunts DESC
         LIMIT 1`
      ),
      pool.query(
        `SELECT adherents.id, adherents.nom, COUNT(emprunts.id) AS nombre_emprunts
         FROM emprunts
         JOIN adherents ON emprunts.adherent_id = adherents.id
         GROUP BY adherents.id, adherents.nom
         ORDER BY nombre_emprunts DESC
         LIMIT 1`
      )
    ]);

    res.status(200).json({
      totalLivres: parseInt(totalLivres.rows[0].count, 10),
      totalAdherents: parseInt(totalAdherents.rows[0].count, 10),
      empruntsEnCours: parseInt(empruntsEnCours.rows[0].count, 10),
      empruntsEnRetard: parseInt(empruntsEnRetard.rows[0].count, 10),
      // null si aucun emprunt n'a jamais été enregistré (table vide)
      livrePlusEmprunte: livrePlusEmprunte.rows[0] || null,
      adherentLePlusActif: adherentLePlusActif.rows[0] || null
    });
  } catch (error) {
    console.error('Erreur (obtenirStatistiques) :', error);
    res.status(500).json({ erreur: "Une erreur est survenue lors du calcul des statistiques." });
  }
}

module.exports = {
  obtenirStatistiques
};