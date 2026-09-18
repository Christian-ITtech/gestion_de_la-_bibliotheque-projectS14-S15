const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.log('Database connection error:', err.message);
    } else {
        console.log(`Database ${process.env.DB_NAME} successfully connected to the server.`)
    }
})

module.exports = pool;