function estDateValide(chaine) {
  const date = new Date(chaine);
  return chaine !== undefined && !isNaN(date.getTime());
}

function validerCreationEmprunt(req, res, next) {
  const { adherent_id, livre_id, date_retour_prevue } = req.body;
  const erreurs = [];

  if (adherent_id === undefined || adherent_id === null || isNaN(Number(adherent_id))) {
    erreurs.push("adherent_id est obligatoire et doit être un nombre.");
  }

  if (livre_id === undefined || livre_id === null || isNaN(Number(livre_id))) {
    erreurs.push("livre_id est obligatoire et doit être un nombre.");
  }

  if (!date_retour_prevue || !estDateValide(date_retour_prevue)) {
    erreurs.push("date_retour_prevue est obligatoire et doit être une date valide (format AAAA-MM-JJ).");
  } else {
    
    const aujourdHui = new Date();
    aujourdHui.setHours(0, 0, 0, 0);
    const dateRetour = new Date(date_retour_prevue);

    if (dateRetour <= aujourdHui) {
      erreurs.push("La date de retour prévue doit être postérieure à aujourd'hui.");
    }
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
  validerCreationEmprunt,
  validerIdParametre
};