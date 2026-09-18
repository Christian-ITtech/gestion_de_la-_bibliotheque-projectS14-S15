const express = require('express');
const router = express.Router();

const {
  ajouterAuteur,
  listeAuteurs,
  obtenirAuteur,
  modifierAuteur,
  supprimerAuteur
} = require('../controllers/auteurController');

const {
  validerCreationAuteur,
  validerModificationAuteur,
  validerIdParametre
} = require('../middlewares/auteurValidation');

router.get('/auteurs', listeAuteurs);
router.get('/auteurs/:id', validerIdParametre, obtenirAuteur);
router.post('/auteurs', validerCreationAuteur, ajouterAuteur);
router.put('/auteurs/:id', validerIdParametre, validerModificationAuteur, modifierAuteur);
router.delete('/auteurs/:id', validerIdParametre, supprimerAuteur);

module.exports = router;