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
