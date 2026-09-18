function validerCreationLivre(req, res, next) {
  const { titre, auteur_id, annee_publication } = req.body;
  const erreurs = [];

  if (!titre || typeof titre !== 'string' || titre.trim() === '') {
    erreurs.push("Le titre est obligatoire.");
  }

  if (auteur_id === undefined || auteur_id === null || isNaN(Number(auteur_id))) {
    erreurs.push("L'identifiant de l'auteur (auteur_id) est obligatoire et doit être un nombre.");
  }

  if (annee_publication !== undefined && annee_publication !== null) {
    const annee = Number(annee_publication);
    const anneeCourante = new Date().getFullYear();
    if (isNaN(annee) || annee <= 0 || annee > anneeCourante) {
      erreurs.push(`L'année de publication doit être un nombre valide entre 1 et ${anneeCourante}.`);
    }
  }

  if (erreurs.length > 0) {
    return res.status(400).json({ erreurs });
  }

  next();
}

function validerModificationLivre(req, res, next) {
  const { titre, auteur_id, annee_publication, statut } = req.body;
  const erreurs = [];

  if (titre !== undefined && titre.trim() === '') {
    erreurs.push("Le titre ne peut pas être vide.");
  }

  if (auteur_id !== undefined && isNaN(Number(auteur_id))) {
    erreurs.push("auteur_id doit être un nombre.");
  }

  if (annee_publication !== undefined) {
    const annee = Number(annee_publication);
    const anneeCourante = new Date().getFullYear();
    if (isNaN(annee) || annee <= 0 || annee > anneeCourante) {
      erreurs.push(`L'année de publication doit être un nombre valide entre 1 et ${anneeCourante}.`);
    }
  }

  if (statut !== undefined && !['disponible', 'emprunte'].includes(statut)) {
    erreurs.push("Le statut doit être 'disponible' ou 'emprunte'.");
  }

  if (erreurs.length > 0) {
    return res.status(400).json({ erreurs });
  }

  next();
}

function validerIdParametre(req, res, next) {
  if (isNaN(Number(req.params.id))) {
    return res.status(400).json({ erreur: "L'identifiant fourni dans l'URL doit être un nombre." });
  }
  next();
}

module.exports = {
  validerCreationLivre,
  validerModificationLivre,
  validerIdParametre
};