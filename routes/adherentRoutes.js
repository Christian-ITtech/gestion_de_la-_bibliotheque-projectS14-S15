const express = require('express');
const router = express.Router();

const {
  ajouterAdherent,
  listeAdherents,
  obtenirAdherent,
  modifierAdherent,
  supprimerAdherent,
  obtenirHistoriqueEmprunts
} = require('../controllers/adherentController');

const {
  validerCreationAdherent,
  validerModificationAdherent,
  validerIdParametre
} = require('../middlewares/adherentValidation');


router.get('/adherents', listeAdherents);
router.get('/adherents/:id', validerIdParametre, obtenirAdherent);
router.get('/adherents/:id/emprunts', validerIdParametre, obtenirHistoriqueEmprunts);
router.post('/adherents', validerCreationAdherent, ajouterAdherent);
router.put('/adherents/:id', validerIdParametre, validerModificationAdherent, modifierAdherent);
router.delete('/adherents/:id', validerIdParametre, supprimerAdherent);

module.exports = router;