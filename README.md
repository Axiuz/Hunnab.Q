# Hunnab.Q (React + MySQL)

Este proyecto ahora incluye:

- Frontend React (`src/`)
- API Node/Express (`server/`)
- Conexion a MySQL con `mysql2/promise` (`server/db.mjs`)

## 1) Configurar MySQL Workbench

1. Abre MySQL Workbench.
2. Crea o usa una conexion con estos datos (ejemplo local):
   - `Hostname`: `localhost`
   - `Port`: `3306`
   - `Username`: `root`
   - `Password`: tu password real
3. Abre un query tab y ejecuta:
   - `server/sql/init.sql`

Ese script crea la base `login_demo` y la tabla `users`.

## 2) Variables de entorno

1. Copia `.env.example` a `.env`
2. Ajusta credenciales:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=TU_PASSWORD
DB_NAME=login_demo
DB_PORT=3306

API_PORT=4000
CORS_ORIGIN=http://localhost:3000
```

## 3) Instalar dependencias

```bash
npm install
```

## 4) Ejecutar API y frontend

En terminal 1:

```bash
npm run api
```

En terminal 2:

```bash
npm start
```

Frontend: `http://localhost:3000`  
API: `http://localhost:4000`

## 5) Probar conexion a MySQL

Con la API corriendo, abre:

- `http://localhost:4000/api/health`
- `http://localhost:4000/api/db/ping`

Si `/api/db/ping` responde `ok: true`, la conexion a MySQL funciona.

## Endpoints de autenticacion

- `POST /api/auth/register`
  - body: `{ "nombre": "...", "usuario": "...", "password": "..." }`
- `POST /api/auth/login`
  - body: `{ "usuario": "...", "password": "..." }`

La pagina `#/cuenta` ya usa estos endpoints.
