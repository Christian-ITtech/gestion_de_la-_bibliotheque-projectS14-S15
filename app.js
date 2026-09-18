const express = require('express');
const app = express();


// 1. Middlewares de parsing du corps des requêtes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const logger = require('./middlewares/logger');
app.use(logger);


app.use(express.static('public'));


const auteurRoutes = require('./routes/auteurRoutes');
const adherentRoutes = require('./routes/adherentRoutes');
const livreRoutes = require('./routes/livreRoutes');
const empruntRoutes = require('./routes/empruntRoutes');
const statistiqueRoutes = require('./routes/statistiqueRoutes');


app.use('/api', auteurRoutes);
app.use('/api', adherentRoutes);
app.use('/api', livreRoutes);
app.use('/api', empruntRoutes);
app.use('/api', statistiqueRoutes);


const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

module.exports = { app };