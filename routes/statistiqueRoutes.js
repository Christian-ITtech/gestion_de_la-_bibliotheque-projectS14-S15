const express = require('express');
const router = express.Router();

const { obtenirStatistiques } = require('../controllers/statistiqueController');


router.get('/statistiques', obtenirStatistiques);

module.exports = router;