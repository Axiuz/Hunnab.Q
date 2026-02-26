import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Pool global de MySQL para toda la API.
 * Variables esperadas en `.env`:
 * DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, DB_SOCKET_PATH (opcional).
 */
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  socketPath: process.env.DB_SOCKET_PATH || undefined,
  waitForConnections: true,
  connectionLimit: 10,
});
