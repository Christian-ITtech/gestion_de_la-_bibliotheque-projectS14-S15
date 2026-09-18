const { Pool } = require('pg');
require('dotenv').config();

// ============================================================
// config/database.js
// En local : connexion via DB_HOST/DB_USER/... (voir .env.example)
// Sur Render : connexion via une seule variable DATABASE_URL,
// fournie automatiquement par le service PostgreSQL de Render.
// Render exige aussi une connexion chiffrée (SSL) en production.
// ============================================================

const utiliseUneChaineUnique = Boolean(process.env.DATABASE_URL);

const pool = utiliseUneChaineUnique
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    pool.query('SELECT NOW()', (err, res) => {
        if (err) {
            console.log('Database connection error:', err.message);
        } else {
            console.log('Database connected successfully.');
        }
    });

module.exports = pool;