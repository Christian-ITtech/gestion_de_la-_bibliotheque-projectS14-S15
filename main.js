require('dotenv').config();
const { app } = require('./app')
const pool = require('./config/database');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Le serveur écoute sur : http://localhost:${PORT}`);
});
