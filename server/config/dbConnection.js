const dotenv = require("dotenv");
const mysql = require("mysql2/promise");

dotenv.config();

const poolPromise = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

poolPromise
  .getConnection()
  .then(() => {
    console.log("Connected to MySQL (Pool)");
  })
  .catch((error) => {
    console.error("Error connecting to MySQL:", error);
    throw error;
  });

module.exports = poolPromise;
