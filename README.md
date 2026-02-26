 Hunnab.Q (React + MySQL)

Proyecto con:

- Frontend React (`src/`)
- API Node/Express (`server/`)
- Conexión MySQL con `mysql2/promise` (`server/db.mjs`)

## 1) Preparar base de datos

En MySQL Workbench ejecuta:

```sql
SOURCE server/sql/init.sql;
```

Ese script crea la base `Hunnab_Q` y las tablas `usuario`, `producto` y `pedidos`.

## 2) Crear usuario de BD para la app

```sql
CREATE USER IF NOT EXISTS 'appuser'@'localhost' IDENTIFIED BY 'AppPass_123!';
CREATE USER IF NOT EXISTS 'appuser'@'127.0.0.1' IDENTIFIED BY 'AppPass_123!';

GRANT ALL PRIVILEGES ON Hunnab_Q.* TO 'appuser'@'localhost';
GRANT ALL PRIVILEGES ON Hunnab_Q.* TO 'appuser'@'127.0.0.1';
FLUSH PRIVILEGES;
```

## 3) Variables de entorno

Crea `.env` en la raíz con:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=appuser
DB_PASSWORD=AppPass_123!
DB_NAME=Hunnab_Q

API_PORT=4000
CORS_ORIGIN=http://localhost:3000

# Opcional en macOS si usas socket:
# DB_SOCKET_PATH=/tmp/mysql.sock
```

## 4) Instalar dependencias

```bash
npm install
```

## 5) Ejecutar en desarrollo

Terminal 1 (API):

```bash
npm run api
```

Terminal 2 (frontend):

```bash
npm start
```

- Frontend: `http://localhost:3000`
- API: `http://localhost:4000`

## 6) Probar conexión

Con la API arriba:

- `http://localhost:4000/api/health`
- `http://localhost:4000/api/db/ping`

Si `/api/db/ping` responde `ok: true`, la conexión a MySQL está correcta.

## Endpoints de autenticación

- `POST /api/auth/register`
  - body:
  - `{ "nombre": "...", "correo": "...", "usuario": "...", "password": "..." }`
- `POST /api/auth/login`
  - body:
  - `{ "usuario": "...", "password": "..." }`

La contraseña se guarda hasheada (`bcrypt`) en `usuario.password_hash`.
