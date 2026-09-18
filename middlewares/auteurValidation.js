function validerCreationAuteur(req, res, next) {
  const { nom, nationalite } = req.body;
  const erreurs = [];

  if (!nom || typeof nom !== 'string' || nom.trim() === '') {
    erreurs.push("Le nom de l'auteur est obligatoire.");
  }

  if (nationalite !== undefined && nationalite !== null && typeof nationalite !== 'string') {
    erreurs.push("La nationalité doit être une chaîne de caractères.");
  }

  if (erreurs.length > 0) {
    return res.status(400).json({ erreurs });
  }

  next();
}

function validerModificationAuteur(req, res, next) {
  const { nom, nationalite } = req.body;
  const erreurs = [];

  if (nom !== undefined && nom.trim() === '') {
    erreurs.push("Le nom ne peut pas être vide.");
  }

  if (nationalite !== undefined && nationalite !== null && typeof nationalite !== 'string') {
    erreurs.push("La nationalité doit être une chaîne de caractères.");
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
  validerCreationAuteur,
  validerModificationAuteur,
  validerIdParametre
};