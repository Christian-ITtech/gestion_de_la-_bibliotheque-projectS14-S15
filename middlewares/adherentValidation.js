function validerCreationAdherent(req, res, next) {
  const { nom, contact } = req.body;
  const erreurs = [];

  if (!nom || typeof nom !== 'string' || nom.trim() === '') {
    erreurs.push("Le nom de l'adhérent est obligatoire.");
  }

  if (!contact || typeof contact !== 'string' || contact.trim() === '') {
    erreurs.push("Le contact est obligatoire.");
  }

  if (erreurs.length > 0) {
    return res.status(400).json({ erreurs });
  }

  next();
}

function validerModificationAdherent(req, res, next) {
  const { nom, contact } = req.body;
  const erreurs = [];

  // Mise à jour partielle 
  if (nom !== undefined && nom.trim() === '') {
    erreurs.push("Le nom ne peut pas être vide.");
  }

  if (contact !== undefined && contact.trim() === '') {
    erreurs.push("Le contact ne peut pas être vide.");
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
  validerCreationAdherent,
  validerModificationAdherent,
  validerIdParametre
};