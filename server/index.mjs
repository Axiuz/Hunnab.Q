import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { pool } from './db.mjs';
import JWTManager from './jwt-manager.mjs';
import { PayPalOrdersService } from './paypal-orders.mjs';

dotenv.config();

/**
 * API de autenticacion para Hunnab.Q.
 * Incluye:
 * - Health checks
 * - Registro de usuario
 * - Login contra MySQL con password hash (bcrypt)
 */
const app = express();
const port = Number(process.env.API_PORT || 4000);
const PASSWORD_PATTERN = /^(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{6,10}$/;
const PASSWORD_RULES_ERROR =
  'La contrasena debe tener entre 6 y 10 caracteres, incluir al menos un signo especial (!@#$%^&*) y solo puede contener letras (sin enie ni acentos), numeros y esos signos.';
const ORDER_STATUS_VALUES = new Set(['PENDIENTE', 'EN PREPARACION', 'ENVIADO']);
const BASE_CATALOG_PRODUCTS = [
  {
    nombre: 'Collar Aquamarina',
    descripcion: 'Collar de la coleccion base Hunnab.Q.',
    precio: 250,
    stock: 15,
    categoria: 'COLLAR_HOMBRE',
  },
  {
    nombre: 'Collar Nautilus',
    descripcion: 'Collar de la coleccion base Hunnab.Q.',
    precio: 270,
    stock: 12,
    categoria: 'COLLAR_HOMBRE',
  },
  {
    nombre: 'Collar Libelula',
    descripcion: 'Collar de la coleccion base Hunnab.Q.',
    precio: 170,
    stock: 18,
    categoria: 'COLLAR_HOMBRE',
  },
  {
    nombre: 'Collar Amatista',
    descripcion: 'Collar de la coleccion base Hunnab.Q.',
    precio: 280,
    stock: 10,
    categoria: 'COLLAR_MUJER',
  },
  {
    nombre: 'Collar Oro',
    descripcion: 'Collar de la coleccion base Hunnab.Q.',
    precio: 310,
    stock: 8,
    categoria: 'COLLAR_MUJER',
  },
  {
    nombre: 'Arracadas Clasicas',
    descripcion: 'Arete de la coleccion base Hunnab.Q.',
    precio: 260,
    stock: 14,
    categoria: 'ARETE',
  },
  {
    nombre: 'Arracadas Chunky',
    descripcion: 'Arete de la coleccion base Hunnab.Q.',
    precio: 320,
    stock: 9,
    categoria: 'ARETE',
  },
  {
    nombre: 'Anillo Modelo',
    descripcion: 'Anillo de la coleccion base Hunnab.Q.',
    precio: 290,
    stock: 11,
    categoria: 'ANILLO',
  },
  {
    nombre: 'Anillo Muestra',
    descripcion: 'Anillo de la coleccion base Hunnab.Q.',
    precio: 260,
    stock: 16,
    categoria: 'ANILLO',
  },
  {
    nombre: 'Pulsera Piedra Volcanica',
    descripcion: 'Pulsera de la coleccion base Hunnab.Q.',
    precio: 180,
    stock: 20,
    categoria: 'PULSERA_HOMBRE',
  },
  {
    nombre: 'Pulsera Onyx',
    descripcion: 'Pulsera de la coleccion base Hunnab.Q.',
    precio: 210,
    stock: 13,
    categoria: 'PULSERA_MUJER',
  },
];

// Middlewares globales
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

const jwtManager = new JWTManager({
  secret: process.env.JWT_SECRET || '',
  issuer: process.env.JWT_ISSUER || 'hunnab-api',
  audience: process.env.JWT_AUDIENCE || 'hunnab-web',
  expiresInSeconds: process.env.JWT_EXPIRES_IN_SECONDS || 86400,
});

const paypal = new PayPalOrdersService({
  env: process.env.PAYPAL_ENV || 'sandbox',
  clientId: process.env.PAYPAL_CLIENT_ID || '',
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
});
const hasPayPalCredentials = Boolean(
  String(process.env.PAYPAL_CLIENT_ID || '').trim() &&
  String(process.env.PAYPAL_CLIENT_SECRET || '').trim()
);
const emailJsConfig = {
  serviceId: String(process.env.EMAILJS_SERVICE_ID || '').trim(),
  templateId: String(process.env.EMAILJS_TEMPLATE_ID || '').trim(),
  publicKey: String(process.env.EMAILJS_PUBLIC_KEY || '').trim(),
  privateKey: String(process.env.EMAILJS_PRIVATE_KEY || '').trim(),
};

function isEmailJsConfigured() {
  return Boolean(
    emailJsConfig.serviceId &&
    emailJsConfig.templateId &&
    emailJsConfig.publicKey &&
    emailJsConfig.privateKey
  );
}

// Verifica que la API esta viva.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Verifica conexion real a MySQL.
app.get('/api/db/ping', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: true, db: rows[0] });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'No se pudo conectar a MySQL.' });
  }
});

/**
 * Asegura la tabla `usuario` minima requerida por login/registro.
 * Se ejecuta al arrancar la API para evitar errores por esquema faltante.
 */
async function ensureUsersSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuario (
      id_usuario INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(80) NOT NULL,
      correo VARCHAR(150) NOT NULL UNIQUE,
      usuario VARCHAR(80) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      tipo_usuario ENUM('CUENTA','INVITADO','ADMIN') NOT NULL DEFAULT 'CUENTA',
      fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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

/**
 * Asegura tabla de productos compatible con el esquema base.
 */
async function ensureProductsSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS producto (
      id_producto INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(150) NOT NULL,
      descripcion TEXT NULL,
      precio DECIMAL(10,2) NOT NULL,
      stock INT UNSIGNED NOT NULL DEFAULT 0,
      categoria ENUM(
        'ANILLO',
        'COLLAR_MUJER',
        'COLLAR_HOMBRE',
        'PULSERA_MUJER',
        'PULSERA_HOMBRE',
        'ARETE'
      ) NOT NULL,
      fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Inserta productos base del catalogo si aun no existen por nombre.
 * No sobrescribe cambios manuales ya existentes en la BD.
 */
async function ensureBaseProductsSeeded() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const product of BASE_CATALOG_PRODUCTS) {
      await connection.query(
        `
          INSERT INTO producto (nombre, descripcion, precio, stock, categoria)
          SELECT ?, ?, ?, ?, ?
          FROM DUAL
          WHERE NOT EXISTS (
            SELECT 1
            FROM producto
            WHERE nombre = ?
            LIMIT 1
          )
        `,
        [
          product.nombre,
          product.descripcion,
          Number(product.precio),
          Number.parseInt(product.stock, 10),
          product.categoria,
          product.nombre,
        ]
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Asegura tablas para pedidos persistidos en MySQL.
 */
async function ensureOrdersSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id_pedido INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      id_usuario INT UNSIGNED NOT NULL,
      id_producto INT UNSIGNED NOT NULL,
      cantidad INT UNSIGNED NOT NULL DEFAULT 1,
      precio_unitario DECIMAL(10,2) NOT NULL,
      subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
      estado ENUM('PENDIENTE','EN PREPARACION','ENVIADO') NOT NULL DEFAULT 'PENDIENTE',
      fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_pedidos_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        ON DELETE CASCADE,
      CONSTRAINT fk_pedidos_producto
        FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
        ON DELETE RESTRICT
    )
  `);

  const [idxUserState] = await pool.query(
    `
      SELECT INDEX_NAME
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'pedidos'
        AND INDEX_NAME = 'idx_pedidos_usuario_estado'
      LIMIT 1
    `
  );
  if (idxUserState.length === 0) {
    await pool.query('CREATE INDEX idx_pedidos_usuario_estado ON pedidos (id_usuario, estado)');
  }
}

function mapOrderStatus(estado) {
  const normalized = String(estado || 'PENDIENTE').trim().toUpperCase();
  if (normalized === 'PENDIENTE') {
    return 'Pendiente';
  }
  if (normalized === 'EN PREPARACION' || normalized === 'PAGADO') {
    return 'En preparacion';
  }
  if (normalized === 'ENVIADO') {
    return 'Enviado';
  }
  return 'Pendiente';
}

function normalizeOrderStatus(estado) {
  const normalized = String(estado || '').trim().toUpperCase().replace(/\s+/g, ' ');
  if (ORDER_STATUS_VALUES.has(normalized)) {
    return normalized;
  }
  if (normalized === 'PAGADO') {
    return 'EN PREPARACION';
  }
  return 'PENDIENTE';
}

function parseRequestedOrderStatus(estado) {
  const normalized = String(estado || '').trim().toUpperCase().replace(/\s+/g, ' ');
  return ORDER_STATUS_VALUES.has(normalized) ? normalized : null;
}

function mapOrderRows(rows) {
  return rows.map((row) => {
    const orderId = Number(row.id_pedido || 0);
    const subtotal = Number(row.subtotal || (Number(row.cantidad || 0) * Number(row.precio_unitario || 0)));
    const statusKey = normalizeOrderStatus(row.estado);
    return {
      id: `PED-${orderId}`,
      idPedido: orderId,
      createdAt: row.fecha_creacion instanceof Date ? row.fecha_creacion.toISOString() : row.fecha_creacion,
      statusKey,
      status: mapOrderStatus(statusKey),
      user: {
        id: Number(row.id_usuario || 0),
        usuario: String(row.usuario || '').trim(),
        nombre: String(row.nombre || row.usuario || '').trim(),
      },
      total: subtotal,
      items: [
        {
          productId: Number(row.id_producto || 0),
          title: String(row.nombre_producto || `Producto #${row.id_producto || ''}`).trim(),
          quantity: Number(row.cantidad || 0),
          unitPrice: Number(row.precio_unitario || 0),
          subtotal,
        },
      ],
    };
  });
}

function normalizeOrderItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      const productId = String(item?.productId || '').trim();
      const title = String(item?.title || '').trim();
      const quantity = Number.parseInt(item?.quantity, 10);
      const unitPrice = Number.parseFloat(item?.unitPrice);
      if (!productId || !title || !Number.isInteger(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
        return null;
      }
      const subtotal = Number((quantity * unitPrice).toFixed(2));
      return {
        productId,
        title,
        quantity,
        unitPrice: Number(unitPrice.toFixed(2)),
        subtotal,
      };
    })
    .filter(Boolean);
}

function formatOrderDateForEmail(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value || '');
  }
  return date.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
}

async function getOrderEmailConfirmationData(orderId) {
  const parsedOrderId = Number.parseInt(orderId, 10);
  if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
    return null;
  }

  const [rows] = await pool.query(
    `
      SELECT
        p.id_pedido,
        p.id_usuario,
        p.fecha_creacion,
        p.cantidad,
        p.precio_unitario,
        p.subtotal,
        pr.nombre AS nombre_producto,
        u.nombre AS nombre_usuario,
        u.correo
      FROM pedidos p
      INNER JOIN usuario u ON u.id_usuario = p.id_usuario
      LEFT JOIN producto pr ON pr.id_producto = p.id_producto
      WHERE p.id_pedido = ?
      LIMIT 1
    `,
    [parsedOrderId]
  );

  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const row = rows[0];
  const correo = String(row.correo || '').trim();
  if (!correo) {
    return null;
  }

  const units = Number(row.cantidad || 0);
  const unitPrice = Number(row.precio_unitario || 0);
  const subtotal = Number(row.subtotal || 0);
  const tax = Number((subtotal * 0.16).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));
  const itemName = String(row.nombre_producto || `Producto #${row.id_pedido}`).trim();
  const frontendBaseUrl = String(
    process.env.FRONTEND_BASE_URL || process.env.CORS_ORIGIN || 'http://localhost:3000'
  ).replace(/\/$/, '');
  const fallbackImage = `${frontendBaseUrl}/imagenes/hunnabpng.png`;

  return {
    orderId: Number(row.id_pedido || parsedOrderId),
    userId: Number(row.id_usuario || 0),
    correo,
    templateParams: {
      // Campos nuevos compatibles con tu plantilla HTML actual
      order_id: `PED-${row.id_pedido}`,
      orders: [
        {
          name: itemName,
          units,
          price: unitPrice.toFixed(2),
          image_url: fallbackImage,
        },
      ],
      cost: {
        tax: tax.toFixed(2),
        total: total.toFixed(2),
      },
      nombre: String(row.nombre_usuario || '').trim() || 'Cliente',
      pedidoID: `PED-${row.id_pedido}`,
      fecha: formatOrderDateForEmail(row.fecha_creacion),
      email: correo,
      to_email: correo,
      correo,
    },
  };
}

async function sendOrderEmailConfirmation(data) {
  if (!data || !data.templateParams || !data.correo) {
    throw new Error('ORDER_OR_EMAIL_NOT_FOUND');
  }
  if (!isEmailJsConfigured()) {
    throw new Error('EMAILJS_NOT_CONFIGURED');
  }

  const emailJsResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service_id: emailJsConfig.serviceId,
      template_id: emailJsConfig.templateId,
      user_id: emailJsConfig.publicKey,
      accessToken: emailJsConfig.privateKey,
      template_params: data.templateParams,
    }),
  });

  const emailJsText = await emailJsResponse.text().catch(() => '');
  if (!emailJsResponse.ok) {
    throw new Error(`EMAILJS_SEND_FAILED:${emailJsResponse.status}:${emailJsText || ''}`);
  }

  return {
    orderId: data.orderId,
    to: data.correo,
  };
}

// Crear orden de PayPal y devolver approvalUrl
app.post('/api/paypal/create-order', jwtManager.authenticateRequired(), async (req, res) => {
  try {
    if (!hasPayPalCredentials) {
      res.status(503).json({
        ok: false,
        error: 'PayPal no esta configurado en el servidor. Agrega PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET.',
      });
      return;
    }

    const baseUrl = String(
      process.env.FRONTEND_BASE_URL || process.env.CORS_ORIGIN || 'http://localhost:3000'
    ).replace(/\/$/, '');
    const currency = process.env.PAYPAL_CURRENCY || 'MXN';

    // El front te manda total (por ejemplo draft.total)
    const total = Number(req.body?.total);

    const result = await paypal.createOrder({
      currency,
      total,
      returnUrl: `${baseUrl}/#/checkout?paypal=success`,
      cancelUrl: `${baseUrl}/#/checkout?paypal=cancel`,
      brandName: 'Hunnab.Q',
    });

    if (!result?.id || !result?.approvalUrl) {
      res.status(500).json({ ok: false, error: 'PayPal no devolvio approvalUrl.' });
      return;
    }

    res.json({ ok: true, id: result.id, approvalUrl: result.approvalUrl });
  } catch (error) {
    console.error('Error en /api/paypal/create-order:', error);
    res.status(500).json({ ok: false, error: 'No se pudo crear la orden de PayPal.' });
  }
});

// Capturar orden PayPal
app.post('/api/paypal/capture-order', jwtManager.authenticateRequired(), async (req, res) => {
  try {
    if (!hasPayPalCredentials) {
      res.status(503).json({
        ok: false,
        error: 'PayPal no esta configurado en el servidor. Agrega PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET.',
      });
      return;
    }

    const orderId = String(req.body?.orderId || '').trim();
    if (!orderId) {
      res.status(400).json({ ok: false, error: 'orderId es obligatorio.' });
      return;
    }

    const capture = await paypal.captureOrder(orderId);

    // Validación mínima de “COMPLETED”
    const status = String(capture?.status || '').toUpperCase();
    if (status !== 'COMPLETED') {
      res.status(400).json({
        ok: false,
        error: `Captura no completada (status=${capture?.status || '?'}).`,
        capture,
      });
      return;
    }

    res.json({ ok: true, capture });
  } catch (error) {
    console.error('Error en /api/paypal/capture-order:', error);
    res.status(500).json({ ok: false, error: 'No se pudo capturar el pago en PayPal.' });
  }
});

function inferProductCategory(item) {
  const base = `${String(item?.productId || '')} ${String(item?.title || '')}`.toLowerCase();
  if (base.includes('arete') || base.includes('arracada')) {
    return 'ARETE';
  }
  if (base.includes('pulsera')) {
    return 'PULSERA_MUJER';
  }
  if (base.includes('collar') || base.includes('gargantilla') || base.includes('corbatin')) {
    return 'COLLAR_MUJER';
  }
  if (base.includes('anillo')) {
    return 'ANILLO';
  }
  return 'ANILLO';
}

function mapCrudCategoryToDb(categoryKey, fallbackTitle = '') {
  const normalized = String(categoryKey || '').trim().toLowerCase();
  if (normalized.includes('arete')) {
    return 'ARETE';
  }
  if (normalized.startsWith('anillo') || normalized.includes('/anillo')) {
    return 'ANILLO';
  }
  if (normalized.startsWith('collares') || normalized.includes('collar')) {
    if (normalized.includes('dama')) {
      return 'COLLAR_MUJER';
    }
    if (normalized.includes('caballero') || normalized.includes('hombre')) {
      return 'COLLAR_HOMBRE';
    }
    return 'COLLAR_HOMBRE';
  }
  if (normalized.startsWith('pulseras') || normalized.includes('pulsera')) {
    if (normalized.includes('dama')) {
      return 'PULSERA_MUJER';
    }
    if (normalized.includes('caballero') || normalized.includes('hombre')) {
      return 'PULSERA_HOMBRE';
    }
    return 'PULSERA_MUJER';
  }

  return inferProductCategory({ title: fallbackTitle, productId: normalized });
}

async function resolveDbProductId(connection, item) {
  const parsedId = Number.parseInt(item.productId, 10);
  if (Number.isInteger(parsedId) && parsedId > 0) {
    const [rows] = await connection.query(
      'SELECT id_producto FROM producto WHERE id_producto = ? LIMIT 1',
      [parsedId]
    );
    if (rows.length > 0) {
      return Number(rows[0].id_producto);
    }
  }

  const [rowsByName] = await connection.query(
    'SELECT id_producto FROM producto WHERE nombre = ? LIMIT 1',
    [item.title]
  );
  if (rowsByName.length > 0) {
    return Number(rowsByName[0].id_producto);
  }

  const category = inferProductCategory(item);
  const [insertResult] = await connection.query(
    `
      INSERT INTO producto (nombre, descripcion, precio, stock, categoria)
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      item.title,
      'Producto autogenerado desde pedido web.',
      Number(item.unitPrice || 0),
      0,
      category,
    ]
  );
  return Number(insertResult.insertId || 0) || null;
}

// Endpoint de registro: valida entrada, evita duplicados y guarda hash.
app.post('/api/auth/register', async (req, res) => {
  const nombre = String(req.body?.nombre || '').trim();
  const correo = String(req.body?.correo || '').trim().toLowerCase();
  const usuario = String(req.body?.usuario || '').trim();
  const password = String(req.body?.password || '').trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!nombre || !correo || !usuario || !password) {
    res.status(400).json({ ok: false, error: 'Nombre, correo, usuario y contrasena son obligatorios.' });
    return;
  }
  if (!emailPattern.test(correo)) {
    res.status(400).json({ ok: false, error: 'Ingresa un correo electronico valido.' });
    return;
  }
  if (!PASSWORD_PATTERN.test(password)) {
    res.status(400).json({
      ok: false,
      error: PASSWORD_RULES_ERROR,
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

// Endpoint para cambio de contrasena desde "Editar cuenta".
app.post('/api/auth/change-password', jwtManager.authenticateRequired(), async (req, res) => {
  const authUser = jwtManager.getRequestUser(req);
  const userId = Number.parseInt(authUser?.id, 10);
  const hasValidUserId = Number.isInteger(userId) && userId > 0;
  const usuario = String(authUser?.usuario || '').trim();
  const currentPassword = String(req.body?.currentPassword || '').trim();
  const newPassword = String(req.body?.newPassword || '').trim();

  if (!usuario || !currentPassword || !newPassword) {
    res.status(400).json({
      ok: false,
      error: 'Usuario y contrasenas son obligatorios.',
    });
    return;
  }

  if (!PASSWORD_PATTERN.test(newPassword)) {
    res.status(400).json({ ok: false, error: PASSWORD_RULES_ERROR });
    return;
  }

  try {
    const selectQuery = hasValidUserId
      ? 'SELECT id_usuario, password_hash FROM usuario WHERE id_usuario = ? AND usuario = ? LIMIT 1'
      : 'SELECT id_usuario, password_hash FROM usuario WHERE usuario = ? LIMIT 1';
    const selectParams = hasValidUserId ? [userId, usuario] : [usuario];
    const [rows] = await pool.query(selectQuery, selectParams);

    if (rows.length === 0) {
      res.status(404).json({ ok: false, error: 'No se encontro el usuario.' });
      return;
    }

    const user = rows[0];
    const validCurrentPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validCurrentPassword) {
      res.status(401).json({ ok: false, error: 'La contrasena actual es incorrecta.' });
      return;
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
    if (isSamePassword) {
      res.status(409).json({ ok: false, error: 'La nueva contrasena debe ser diferente a la actual.' });
      return;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE usuario SET password_hash = ? WHERE id_usuario = ?', [newPasswordHash, user.id_usuario]);

    res.json({ ok: true, message: 'Contrasena actualizada correctamente.' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error en /api/auth/change-password:', error);
    res.status(500).json({ ok: false, error: 'Error actualizando la contrasena en MySQL.' });
  }
});

// Endpoint para eliminar cuenta desde "Editar cuenta".
app.post('/api/auth/delete-account', jwtManager.authenticateRequired(), async (req, res) => {
  const authUser = jwtManager.getRequestUser(req);
  const userId = Number.parseInt(authUser?.id, 10);
  const hasValidUserId = Number.isInteger(userId) && userId > 0;
  const usuario = String(authUser?.usuario || '').trim();
  const password = String(req.body?.password || '').trim();

  if (!usuario || !password) {
    res.status(400).json({
      ok: false,
      error: 'Usuario y contrasena son obligatorios.',
    });
    return;
  }

  try {
    const selectQuery = hasValidUserId
      ? 'SELECT id_usuario, password_hash FROM usuario WHERE id_usuario = ? AND usuario = ? LIMIT 1'
      : 'SELECT id_usuario, password_hash FROM usuario WHERE usuario = ? LIMIT 1';
    const selectParams = hasValidUserId ? [userId, usuario] : [usuario];
    const [rows] = await pool.query(selectQuery, selectParams);

    if (rows.length === 0) {
      res.status(404).json({ ok: false, error: 'No se encontro el usuario.' });
      return;
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ ok: false, error: 'La contrasena actual es incorrecta.' });
      return;
    }

    await pool.query('DELETE FROM usuario WHERE id_usuario = ?', [user.id_usuario]);
    res.json({ ok: true, message: 'Cuenta eliminada correctamente.' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error en /api/auth/delete-account:', error);
    res.status(500).json({ ok: false, error: 'Error eliminando la cuenta en MySQL.' });
  }
});

// Endpoint de login: valida credenciales y devuelve datos minimos de sesion.
app.post('/api/auth/login', async (req, res) => {
  const usuario = String(req.body?.usuario || '').trim();
  const password = String(req.body?.password || '').trim();

  if (!usuario || !password) {
    res.status(400).json({ ok: false, error: 'Usuario y contrasena son obligatorios.' });
    return;
  }

  try {
    const [rows] = await pool.query(
      'SELECT id_usuario, nombre, usuario, password_hash, tipo_usuario FROM usuario WHERE usuario = ? LIMIT 1',
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

    const authUser = {
      id: Number(user.id_usuario || 0),
      nombre: String(user.nombre || user.usuario || '').trim(),
      usuario: String(user.usuario || '').trim(),
      tipoUsuario: String(user.tipo_usuario || 'CUENTA').trim() || 'CUENTA',
    };
    const token = jwtManager.createAccessToken({
      id: authUser.id,
      usuario: authUser.usuario,
      tipoUsuario: authUser.tipoUsuario,
    });

    res.json({
      ok: true,
      user: authUser,
      token,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error en /api/auth/login:', error);
    res.status(500).json({ ok: false, error: 'Error validando login en MySQL.' });
  }
});

// Guarda en MySQL el alta/edicion realizada desde el CRUD local del panel admin.
app.post('/api/products/admin-create', jwtManager.authenticateRequired(), async (req, res) => {
  const authUser = jwtManager.getRequestUser(req);
  const adminUserId = Number.parseInt(authUser?.id, 10);
  const hasValidAdminUserId = Number.isInteger(adminUserId) && adminUserId > 0;
  const adminUsername = String(authUser?.usuario || '').trim();
  const dbProductId = Number.parseInt(req.body?.product?.dbProductId, 10);
  const hasValidDbProductId = Number.isInteger(dbProductId) && dbProductId > 0;
  const lookupTitleRaw = req.body?.product?.lookupTitle;
  const forceCreate = Boolean(req.body?.product?.forceCreate);
  const title = String(req.body?.product?.title || '').trim();
  const lookupTitle = String(lookupTitleRaw || title).trim();
  const price = Number.parseFloat(req.body?.product?.price);
  const stock = Number.parseInt(req.body?.product?.stock, 10);
  const categoryKey = String(req.body?.product?.categoryKey || '').trim();
  const description = String(req.body?.product?.description || 'Producto creado desde CRUD local.').trim();

  if (!adminUsername || !title || !Number.isFinite(price) || !Number.isInteger(stock) || stock < 0) {
    res.status(400).json({ ok: false, error: 'Datos incompletos para guardar producto en MySQL.' });
    return;
  }

  try {
    if (!jwtManager.isAdmin(authUser)) {
      res.status(403).json({ ok: false, error: 'No tienes permisos para guardar productos.' });
      return;
    }

    const adminLookupQuery = hasValidAdminUserId
      ? 'SELECT tipo_usuario FROM usuario WHERE id_usuario = ? AND usuario = ? LIMIT 1'
      : 'SELECT tipo_usuario FROM usuario WHERE usuario = ? LIMIT 1';
    const adminLookupParams = hasValidAdminUserId ? [adminUserId, adminUsername] : [adminUsername];
    const [adminRows] = await pool.query(adminLookupQuery, adminLookupParams);
    if (adminRows.length === 0) {
      res.status(404).json({ ok: false, error: 'No se encontro el usuario administrador.' });
      return;
    }

    const role = String(adminRows[0].tipo_usuario || '').trim().toUpperCase();
    if (role !== 'ADMIN' && role !== 'ADMINISTRADOR') {
      res.status(403).json({ ok: false, error: 'No tienes permisos para guardar productos.' });
      return;
    }

    const dbCategory = mapCrudCategoryToDb(categoryKey, title);
    if (forceCreate) {
      const [insertResult] = await pool.query(
        'INSERT INTO producto (nombre, descripcion, precio, stock, categoria) VALUES (?, ?, ?, ?, ?)',
        [title, description || null, Number(price.toFixed(2)), stock, dbCategory]
      );

      res.status(201).json({
        ok: true,
        product: {
          idProducto: Number(insertResult.insertId || 0),
          nombre: title,
          categoria: dbCategory,
        },
        created: true,
      });
      return;
    }

    let existingId = null;
    if (hasValidDbProductId) {
      const [idRows] = await pool.query(
        'SELECT id_producto FROM producto WHERE id_producto = ? LIMIT 1',
        [dbProductId]
      );
      if (idRows.length > 0) {
        existingId = Number(idRows[0].id_producto || 0);
      }
    }

    if (!existingId && lookupTitle) {
      const [lookupRows] = await pool.query(
        'SELECT id_producto FROM producto WHERE nombre = ? LIMIT 1',
        [lookupTitle]
      );
      if (lookupRows.length > 0) {
        existingId = Number(lookupRows[0].id_producto || 0);
      }
    }

    if (!existingId && title && title !== lookupTitle) {
      const [titleRows] = await pool.query(
        'SELECT id_producto FROM producto WHERE nombre = ? LIMIT 1',
        [title]
      );
      if (titleRows.length > 0) {
        existingId = Number(titleRows[0].id_producto || 0);
      }
    }

    if (existingId) {
      await pool.query(
        'UPDATE producto SET nombre = ?, descripcion = ?, precio = ?, stock = ?, categoria = ? WHERE id_producto = ?',
        [title, description || null, Number(price.toFixed(2)), stock, dbCategory, existingId]
      );
      res.json({
        ok: true,
        product: { idProducto: existingId, nombre: title, categoria: dbCategory },
        created: false,
      });
      return;
    }

    const [insertResult] = await pool.query(
      'INSERT INTO producto (nombre, descripcion, precio, stock, categoria) VALUES (?, ?, ?, ?, ?)',
      [title, description || null, Number(price.toFixed(2)), stock, dbCategory]
    );

    res.status(201).json({
      ok: true,
      product: {
        idProducto: Number(insertResult.insertId || 0),
        nombre: title,
        categoria: dbCategory,
      },
      created: true,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error en /api/products/admin-create:', error);
    res.status(500).json({ ok: false, error: 'Error guardando producto del CRUD en MySQL.' });
  }
});

// Crea pedido con sus items y devuelve el ID persistido en MySQL.
app.post('/api/orders/create', jwtManager.authenticateRequired(), async (req, res) => {
  const authUser = jwtManager.getRequestUser(req);
  const userId = Number.parseInt(authUser?.id, 10);
  const hasValidUserId = Number.isInteger(userId) && userId > 0;
  const username = String(authUser?.usuario || '').trim();
  const items = normalizeOrderItems(req.body?.items);

  if (!hasValidUserId || !username || items.length === 0) {
    res.status(400).json({ ok: false, error: 'Usuario valido e items del pedido son obligatorios.' });
    return;
  }

  const requestedTotal = Number.parseFloat(req.body?.total);
  const calculatedTotal = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  const safeTotal = Number.isFinite(requestedTotal) ? Number(requestedTotal.toFixed(2)) : calculatedTotal;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const userLookupQuery = hasValidUserId
      ? 'SELECT id_usuario, usuario, nombre FROM usuario WHERE id_usuario = ? AND usuario = ? LIMIT 1'
      : 'SELECT id_usuario, usuario, nombre FROM usuario WHERE usuario = ? LIMIT 1';
    const userLookupParams = hasValidUserId ? [userId, username] : [username];
    const [userRows] = await connection.query(userLookupQuery, userLookupParams);
    if (userRows.length === 0) {
      await connection.rollback();
      res.status(404).json({ ok: false, error: 'No se encontro el usuario para guardar el pedido.' });
      return;
    }

    const user = userRows[0];
    const insertedOrderIds = [];
    const normalizedItems = [];
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const dbProductId = await resolveDbProductId(connection, item);
      if (!dbProductId) {
        await connection.rollback();
        res.status(404).json({
          ok: false,
          error: `No se encontro el producto "${item.title}" en la tabla producto.`,
        });
        return;
      }

      const [orderInsert] = await connection.query(
        'INSERT INTO pedidos (id_usuario, id_producto, cantidad, precio_unitario, estado) VALUES (?, ?, ?, ?, ?)',
        [user.id_usuario, dbProductId, item.quantity, item.unitPrice, 'EN PREPARACION']
      );
      const insertedId = Number(orderInsert.insertId);
      insertedOrderIds.push(insertedId);
      normalizedItems.push({
        idPedido: insertedId,
        productId: dbProductId,
        title: item.title,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: Number((item.quantity * item.unitPrice).toFixed(2)),
      });
    }

    await connection.commit();
    const primaryOrderId = insertedOrderIds[0];
    const emailConfirmation = {
      attempted: false,
      sent: false,
    };

    if (isEmailJsConfigured()) {
      emailConfirmation.attempted = true;
      try {
        const emailData = await getOrderEmailConfirmationData(primaryOrderId);
        const sendResult = await sendOrderEmailConfirmation(emailData);
        emailConfirmation.sent = true;
        emailConfirmation.to = sendResult.to;
      } catch (emailError) {
        emailConfirmation.sent = false;
        emailConfirmation.error = 'No se pudo enviar el correo de confirmacion.';
        const rawMessage = String(emailError?.message || '');
        if (rawMessage.startsWith('EMAILJS_SEND_FAILED:')) {
          const messageParts = rawMessage.split(':');
          emailConfirmation.provider = 'emailjs';
          emailConfirmation.providerStatus = Number.parseInt(messageParts[1], 10) || 0;
          emailConfirmation.providerDetails = messageParts.slice(2).join(':');
        } else if (rawMessage === 'ORDER_OR_EMAIL_NOT_FOUND') {
          emailConfirmation.provider = 'local';
          emailConfirmation.providerDetails = 'No se encontro el pedido o correo en la base de datos.';
        }
        // eslint-disable-next-line no-console
        console.error('Error enviando confirmacion automatica de pedido:', emailError);
      }
    } else {
      emailConfirmation.reason = 'EMAILJS_NOT_CONFIGURED';
    }

    res.status(201).json({
      ok: true,
      order: {
        id: `PED-${primaryOrderId}`,
        idPedido: primaryOrderId,
        lineasPedido: insertedOrderIds,
        createdAt: new Date().toISOString(),
        status: 'En preparacion',
        statusKey: 'EN PREPARACION',
        user: {
          id: Number(user.id_usuario),
          usuario: String(user.usuario || '').trim(),
          nombre: String(user.nombre || user.usuario || '').trim(),
        },
        total: safeTotal,
        items: normalizedItems,
      },
      emailConfirmation,
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      // noop
    }
    // eslint-disable-next-line no-console
    console.error('Error en /api/orders/create:', error);
    res.status(500).json({ ok: false, error: 'Error guardando pedido en MySQL.' });
  } finally {
    connection.release();
  }
});

// Envia confirmacion por EmailJS usando datos desde MySQL:
// - nombre/correo desde tabla `usuario`
// - pedidoId desde tabla `pedidos`
app.post('/api/orders/:orderId/email-confirmation', jwtManager.authenticateRequired(), async (req, res) => {
  const authUser = jwtManager.getRequestUser(req);
  const authUserId = Number.parseInt(authUser?.id, 10);
  const isAdmin = jwtManager.isAdmin(authUser);
  const orderId = Number.parseInt(req.params?.orderId, 10);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    res.status(400).json({ ok: false, error: 'orderId invalido.' });
    return;
  }

  if (!isEmailJsConfigured()) {
    res.status(503).json({
      ok: false,
      error: 'EmailJS no esta configurado. Agrega EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY y EMAILJS_PRIVATE_KEY.',
    });
    return;
  }

  try {
    const emailData = await getOrderEmailConfirmationData(orderId);
    if (!emailData) {
      res.status(404).json({ ok: false, error: 'No se encontro el pedido o correo del usuario.' });
      return;
    }

    const ownerId = Number(emailData.userId || 0);
    if (!isAdmin && ownerId !== authUserId) {
      res.status(403).json({ ok: false, error: 'No tienes permisos para enviar correo de este pedido.' });
      return;
    }

    const sendResult = await sendOrderEmailConfirmation(emailData);

    res.json({
      ok: true,
      message: 'Correo de confirmacion enviado.',
      orderId: sendResult.orderId,
      to: sendResult.to,
    });
  } catch (error) {
    const message = String(error?.message || '');
    if (message.startsWith('EMAILJS_SEND_FAILED:')) {
      const details = message.split(':').slice(2).join(':');
      res.status(502).json({
        ok: false,
        error: 'EmailJS rechazo el envio del correo.',
        details,
      });
      return;
    }
    // eslint-disable-next-line no-console
    console.error('Error en /api/orders/:orderId/email-confirmation:', error);
    res.status(500).json({ ok: false, error: 'No se pudo enviar el correo de confirmacion.' });
  }
});

// Lista pedidos del usuario logueado (desde MySQL).
app.get('/api/orders/user-orders', jwtManager.authenticateRequired(), async (req, res) => {
  const authUser = jwtManager.getRequestUser(req);
  const userId = Number.parseInt(authUser?.id, 10);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ ok: false, error: 'No se pudo identificar al usuario autenticado.' });
    return;
  }

  try {
    const [rows] = await pool.query(
      `
        SELECT
          p.id_pedido,
          p.id_usuario,
          u.usuario,
          u.nombre,
          p.id_producto,
          pr.nombre AS nombre_producto,
          p.cantidad,
          p.precio_unitario,
          p.subtotal,
          p.estado,
          p.fecha_creacion
        FROM pedidos p
        INNER JOIN usuario u ON u.id_usuario = p.id_usuario
        LEFT JOIN producto pr ON pr.id_producto = p.id_producto
        WHERE p.id_usuario = ?
        ORDER BY p.id_pedido DESC
      `,
      [userId]
    );
    res.json({ ok: true, orders: mapOrderRows(rows) });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error en /api/orders/user-orders:', error);
    res.status(500).json({ ok: false, error: 'Error consultando pedidos en MySQL.' });
  }
});

// Lista todos los pedidos para panel super usuario.
app.get('/api/orders/admin-orders', jwtManager.authenticateRequired(), async (req, res) => {
  const authUser = jwtManager.getRequestUser(req);
  const adminUserId = Number.parseInt(authUser?.id, 10);
  const hasValidAdminUserId = Number.isInteger(adminUserId) && adminUserId > 0;
  const adminUsername = String(authUser?.usuario || '').trim();
  if (!adminUsername) {
    res.status(400).json({ ok: false, error: 'Identidad de administrador incompleta.' });
    return;
  }

  try {
    if (!jwtManager.isAdmin(authUser)) {
      res.status(403).json({ ok: false, error: 'No tienes permisos para ver todos los pedidos.' });
      return;
    }

    const adminLookupQuery = hasValidAdminUserId
      ? 'SELECT tipo_usuario FROM usuario WHERE id_usuario = ? AND usuario = ? LIMIT 1'
      : 'SELECT tipo_usuario FROM usuario WHERE usuario = ? LIMIT 1';
    const adminLookupParams = hasValidAdminUserId ? [adminUserId, adminUsername] : [adminUsername];
    const [adminRows] = await pool.query(adminLookupQuery, adminLookupParams);
    if (adminRows.length === 0) {
      res.status(404).json({ ok: false, error: 'No se encontro el usuario administrador.' });
      return;
    }

    const role = String(adminRows[0].tipo_usuario || '').trim().toUpperCase();
    if (role !== 'ADMIN' && role !== 'ADMINISTRADOR') {
      res.status(403).json({ ok: false, error: 'No tienes permisos para ver todos los pedidos.' });
      return;
    }

    const [rows] = await pool.query(
      `
        SELECT
          p.id_pedido,
          p.id_usuario,
          u.usuario,
          u.nombre,
          p.id_producto,
          pr.nombre AS nombre_producto,
          p.cantidad,
          p.precio_unitario,
          p.subtotal,
          p.estado,
          p.fecha_creacion
        FROM pedidos p
        INNER JOIN usuario u ON u.id_usuario = p.id_usuario
        LEFT JOIN producto pr ON pr.id_producto = p.id_producto
        ORDER BY p.id_pedido DESC
      `
    );
    res.json({ ok: true, orders: mapOrderRows(rows) });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error en /api/orders/admin-orders:', error);
    res.status(500).json({ ok: false, error: 'Error consultando pedidos de administrador.' });
  }
});

// Actualiza el estado de un pedido (solo super usuario).
app.post('/api/orders/admin-update-status', jwtManager.authenticateRequired(), async (req, res) => {
  const authUser = jwtManager.getRequestUser(req);
  const adminUserId = Number.parseInt(authUser?.id, 10);
  const hasValidAdminUserId = Number.isInteger(adminUserId) && adminUserId > 0;
  const adminUsername = String(authUser?.usuario || '').trim();
  const orderId = Number.parseInt(req.body?.orderId, 10);
  const normalizedStatus = parseRequestedOrderStatus(req.body?.status);

  if (!adminUsername || !Number.isInteger(orderId) || orderId <= 0) {
    res.status(400).json({ ok: false, error: 'Datos incompletos para actualizar estado del pedido.' });
    return;
  }
  if (!normalizedStatus) {
    res.status(400).json({ ok: false, error: 'Estado de pedido no permitido.' });
    return;
  }

  try {
    if (!jwtManager.isAdmin(authUser)) {
      res.status(403).json({ ok: false, error: 'No tienes permisos para actualizar pedidos.' });
      return;
    }

    const adminLookupQuery = hasValidAdminUserId
      ? 'SELECT tipo_usuario FROM usuario WHERE id_usuario = ? AND usuario = ? LIMIT 1'
      : 'SELECT tipo_usuario FROM usuario WHERE usuario = ? LIMIT 1';
    const adminLookupParams = hasValidAdminUserId ? [adminUserId, adminUsername] : [adminUsername];
    const [adminRows] = await pool.query(adminLookupQuery, adminLookupParams);
    if (adminRows.length === 0) {
      res.status(404).json({ ok: false, error: 'No se encontro el usuario administrador.' });
      return;
    }

    const role = String(adminRows[0].tipo_usuario || '').trim().toUpperCase();
    if (role !== 'ADMIN' && role !== 'ADMINISTRADOR') {
      res.status(403).json({ ok: false, error: 'No tienes permisos para actualizar pedidos.' });
      return;
    }

    const [orderRows] = await pool.query('SELECT id_pedido FROM pedidos WHERE id_pedido = ? LIMIT 1', [orderId]);
    if (orderRows.length === 0) {
      res.status(404).json({ ok: false, error: 'No se encontro el pedido.' });
      return;
    }

    await pool.query('UPDATE pedidos SET estado = ? WHERE id_pedido = ?', [normalizedStatus, orderId]);
    res.json({
      ok: true,
      order: {
        idPedido: orderId,
        statusKey: normalizedStatus,
        status: mapOrderStatus(normalizedStatus),
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error en /api/orders/admin-update-status:', error);
    res.status(500).json({ ok: false, error: 'Error actualizando el estado del pedido.' });
  }
});

// Arranque controlado de la API.
async function startServer() {
  try {
    await ensureUsersSchema();
    await ensureProductsSchema();
    await ensureBaseProductsSeeded();
    await ensureOrdersSchema();
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
