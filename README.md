 # Hunnab.Q

> Plataforma web fullstack construida con React, Node/Express y MySQL.

---

## Estructura del proyecto

```
Hunnab.Q/
├── public/          # Assets estáticos
├── src/             # Frontend React
├── server/          # API Node/Express
│   └── db.mjs       # Conexión MySQL con mysql2/promise
├── build/           # Build de producción
├── BD Hunnab.sql    # Script de base de datos
├── .env.example     # Variables de entorno de ejemplo
└── package.json
```

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [MySQL](https://www.mysql.com/) v8 o superior
- npm

---

## Instalación

**1. Clona el repositorio**

```bash
git clone https://github.com/Axiuz/Hunnab.Q.git
cd Hunnab.Q
```

**2. Instala las dependencias**

```bash
npm install
```

**3. Configura las variables de entorno**

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales de MySQL y demás configuración necesaria.

**4. Crea la base de datos**

Ejecuta el script SQL en tu servidor MySQL:

```bash
mysql -u tu_usuario -p < "BD Hunnab.sql"
```

---

## Desarrollo

Necesitas dos terminales corriendo simultáneamente:

**Terminal 1 — API (Puerto 4000)**

```bash
npm run api
```

**Terminal 2 — Frontend (Puerto 3000)**

```bash
npm start
```

| Servicio  | URL                        |
|-----------|----------------------------|
| Frontend  | http://localhost:3000       |
| API REST  | http://localhost:4000       |

---

##  Build de producción

```bash
npm run build
```

Los archivos compilados quedarán en la carpeta `/build`.

---

## Stack 

| Capa       | Tecnología                      |
|------------|---------------------------------|
| Frontend   | React                           |
| Backend    | Node.js + Express               |
| Base de datos | MySQL + `mysql2/promise`     |
| Estilos    | CSS                             |

---

##  Scripts disponibles

| Comando         | Descripción                              |
|-----------------|------------------------------------------|
| `npm start`     | Inicia el frontend en modo desarrollo    |
| `npm run api`   | Inicia el servidor Express               |
| `npm run build` | Genera el build de producción            |
