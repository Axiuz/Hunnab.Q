CREATE DATABASE IF NOT EXISTS Hunnab_Q
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE Hunnab_Q;

-- USUARIO
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  correo VARCHAR(150) NOT NULL,
  usuario VARCHAR(80) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  tipo_usuario ENUM('CUENTA','INVITADO','ADMIN') NOT NULL DEFAULT 'CUENTA',
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_usuario_correo UNIQUE (correo),
  CONSTRAINT uq_usuario_usuario UNIQUE (usuario)
) ENGINE=InnoDB;

-- PRODUCTO
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
) ENGINE=InnoDB;

-- PEDIDOS (antes detalle_carrito)
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
) ENGINE=InnoDB;

-- ÍNDICES
CREATE INDEX idx_usuario_correo ON usuario(correo);
CREATE INDEX idx_producto_categoria ON producto(categoria);
CREATE INDEX idx_pedidos_usuario_estado ON pedidos(id_usuario, estado);

-- PRODUCTOS BASE (idempotente por nombre)
INSERT INTO producto (nombre, descripcion, precio, stock, categoria)
SELECT 'Collar Aquamarina', 'Collar de la coleccion base Hunnab.Q.', 250.00, 15, 'COLLAR_HOMBRE'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Collar Aquamarina' LIMIT 1);

INSERT INTO producto (nombre, descripcion, precio, stock, categoria)
SELECT 'Collar Nautilus', 'Collar de la coleccion base Hunnab.Q.', 270.00, 12, 'COLLAR_HOMBRE'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Collar Nautilus' LIMIT 1);

INSERT INTO producto (nombre, descripcion, precio, stock, categoria)
SELECT 'Collar Libelula', 'Collar de la coleccion base Hunnab.Q.', 170.00, 18, 'COLLAR_HOMBRE'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Collar Libelula' LIMIT 1);

INSERT INTO producto (nombre, descripcion, precio, stock, categoria)
SELECT 'Collar Amatista', 'Collar de la coleccion base Hunnab.Q.', 280.00, 10, 'COLLAR_MUJER'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Collar Amatista' LIMIT 1);

INSERT INTO producto (nombre, descripcion, precio, stock, categoria)
SELECT 'Collar Oro', 'Collar de la coleccion base Hunnab.Q.', 310.00, 8, 'COLLAR_MUJER'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Collar Oro' LIMIT 1);

INSERT INTO producto (nombre, descripcion, precio, stock, categoria)
SELECT 'Arracadas Clasicas', 'Arete de la coleccion base Hunnab.Q.', 260.00, 14, 'ARETE'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Arracadas Clasicas' LIMIT 1);

INSERT INTO producto (nombre, descripcion, precio, stock, categoria)
SELECT 'Arracadas Chunky', 'Arete de la coleccion base Hunnab.Q.', 320.00, 9, 'ARETE'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Arracadas Chunky' LIMIT 1);

INSERT INTO producto (nombre, descripcion, precio, stock, categoria)
SELECT 'Anillo Modelo', 'Anillo de la coleccion base Hunnab.Q.', 290.00, 11, 'ANILLO'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Anillo Modelo' LIMIT 1);

INSERT INTO producto (nombre, descripcion, precio, stock, categoria)
SELECT 'Anillo Muestra', 'Anillo de la coleccion base Hunnab.Q.', 260.00, 16, 'ANILLO'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Anillo Muestra' LIMIT 1);

INSERT INTO producto (nombre, descripcion, precio, stock, categoria)
SELECT 'Pulsera Piedra Volcanica', 'Pulsera de la coleccion base Hunnab.Q.', 180.00, 20, 'PULSERA_HOMBRE'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Pulsera Piedra Volcanica' LIMIT 1);

INSERT INTO producto (nombre, descripcion, precio, stock, categoria)
SELECT 'Pulsera Onyx', 'Pulsera de la coleccion base Hunnab.Q.', 210.00, 13, 'PULSERA_MUJER'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Pulsera Onyx' LIMIT 1);
