const express = require('express');
const router = express.Router();

const {
  ajouterLivre,
  listeLivres,
  obtenirLivre,
  modifierLivre,
  supprimerLivre
} = require('../controllers/livreController');

const {
  validerCreationLivre,
  validerModificationLivre,
  validerIdParametre
} = require('../middlewares/livreValidation');


router.get('/livres', listeLivres);
router.get('/livres/:id', validerIdParametre, obtenirLivre);
router.post('/livres', validerCreationLivre, ajouterLivre);
router.put('/livres/:id', validerIdParametre, validerModificationLivre, modifierLivre);
router.delete('/livres/:id', validerIdParametre, supprimerLivre);

module.exports = router;