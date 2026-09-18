const express = require('express');
const router = express.Router();

const {
  creerEmprunt,
  enregistrerRetour,
  listeEmprunts,
  listeEmpruntsEnCours,
  listeEmpruntsEnRetard,
  obtenirEmprunt
} = require('../controllers/empruntController');

const {
  validerCreationEmprunt,
  validerIdParametre
} = require('../middlewares/empruntValidation');


router.get('/emprunts/en-cours', listeEmpruntsEnCours);
router.get('/emprunts/en-retard', listeEmpruntsEnRetard);
router.get('/emprunts/:id', validerIdParametre, obtenirEmprunt);
router.get('/emprunts', listeEmprunts);

router.post('/emprunts', validerCreationEmprunt, creerEmprunt);
router.put('/emprunts/:id/retour', validerIdParametre, enregistrerRetour);

module.exports = router;