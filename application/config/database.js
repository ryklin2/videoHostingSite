require('dotenv').config();

const dbConfig = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'csc317_user',
    password: process.env.DB_PASSWORD || 'aztec',
    database: process.env.DB_NAME || 'csc317_project',
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  // You can add other environments (production, test) here if needed
};

module.exports = dbConfig;