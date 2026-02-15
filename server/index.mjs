import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { pool } from './db.mjs';

dotenv.config();

const app = express();
const port = Number(process.env.API_PORT || 4000);

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/db/ping', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: true, db: rows[0] });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'No se pudo conectar a MySQL.' });
  }
});

async function ensureUsersSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuario (
      id_usuario INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL,
      correo VARCHAR(150) NULL UNIQUE,
      usuario VARCHAR(80) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      tipo_usuario ENUM('CUENTA','INVITADO','ADMIN') NOT NULL DEFAULT 'CUENTA',
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [columns] = await pool.query(
    `
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'usuario'
        AND COLUMN_NAME = 'correo'
      LIMIT 1
    `
  );

  if (columns.length === 0) {
    await pool.query('ALTER TABLE usuario ADD COLUMN correo VARCHAR(150) NULL UNIQUE AFTER nombre');
  }
}

app.post('/api/auth/register', async (req, res) => {
  const nombre = String(req.body?.nombre || '').trim();
  const correo = String(req.body?.correo || '').trim().toLowerCase();
  const usuario = String(req.body?.usuario || '').trim();
  const password = String(req.body?.password || '').trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordPattern = /^(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{6,10}$/;

  if (!nombre || !correo || !usuario || !password) {
    res.status(400).json({ ok: false, error: 'Nombre, correo, usuario y contrasena son obligatorios.' });
    return;
  }
  if (!emailPattern.test(correo)) {
    res.status(400).json({ ok: false, error: 'Ingresa un correo electronico valido.' });
    return;
  }
  if (!passwordPattern.test(password)) {
    res.status(400).json({
      ok: false,
      error:
        'La contrasena debe tener entre 6 y 10 caracteres, incluir al menos un signo especial (!@#$%^&*) y solo puede contener letras (sin enie ni acentos), numeros y esos signos.',
    });
    return;
  }

  try {
    const [existing] = await pool.query(
      'SELECT id_usuario FROM usuario WHERE usuario = ? OR correo = ? LIMIT 1',
      [usuario, correo]
    );
    if (existing.length > 0) {
      res.status(409).json({ ok: false, error: 'El usuario o correo ya existe.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO usuario (nombre, correo, usuario, password_hash, tipo_usuario) VALUES (?, ?, ?, ?, ?)',
      [nombre, correo, usuario, passwordHash, 'CUENTA']
    );

    res.status(201).json({ ok: true, message: 'Registro exitoso.' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error en /api/auth/register:', error);
    res.status(500).json({ ok: false, error: 'Error registrando usuario en MySQL.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const usuario = String(req.body?.usuario || '').trim();
  const password = String(req.body?.password || '').trim();

  if (!usuario || !password) {
    res.status(400).json({ ok: false, error: 'Usuario y contrasena son obligatorios.' });
    return;
  }

  try {
    const [rows] = await pool.query(
      'SELECT id_usuario, nombre, usuario, password_hash FROM usuario WHERE usuario = ? LIMIT 1',
      [usuario]
    );
    if (rows.length === 0) {
      res.status(401).json({ ok: false, error: 'Usuario o contrasena incorrectos.' });
      return;
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ ok: false, error: 'Usuario o contrasena incorrectos.' });
      return;
    }

    res.json({
      ok: true,
      user: {
        id: user.id_usuario,
        nombre: user.nombre,
        usuario: user.usuario,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error en /api/auth/login:', error);
    res.status(500).json({ ok: false, error: 'Error validando login en MySQL.' });
  }
});

async function startServer() {
  try {
    await ensureUsersSchema();
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`API escuchando en http://localhost:${port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('No se pudo inicializar el esquema MySQL:', error);
    process.exit(1);
  }
}

startServer();
