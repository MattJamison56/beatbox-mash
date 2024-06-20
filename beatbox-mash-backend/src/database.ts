import sql, { ConnectionPool } from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config: sql.config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  server: process.env.DB_SERVER!,
  port: parseInt(process.env.DB_PORT!, 10),
  database: process.env.DB_NAME!,
  options: {
    encrypt: true, // For Azure
    trustServerCertificate: true // For local development
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log('Connected to MSSQL');
    return pool;
  })
  .catch((err) => {
    console.error('Database Connection Failed! Bad Config: ', err);
    throw err;
  });

export { poolPromise };
