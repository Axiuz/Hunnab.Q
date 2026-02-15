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

-- USUARIO_CUENTA
CREATE TABLE IF NOT EXISTS usuario_cuenta (
  id_usuario INT UNSIGNED PRIMARY KEY,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  direccion_envio VARCHAR(255) NULL,

  CONSTRAINT fk_usuario_cuenta_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- USUARIO_INVITADO
CREATE TABLE IF NOT EXISTS usuario_invitado (
  id_usuario INT UNSIGNED PRIMARY KEY,
  sesion_temporal VARCHAR(100) NOT NULL,
  CONSTRAINT uq_usuario_invitado_sesion UNIQUE (sesion_temporal),

  CONSTRAINT fk_usuario_invitado_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- USUARIO_ADMINISTRADOR
CREATE TABLE IF NOT EXISTS usuario_administrador (
  id_usuario INT UNSIGNED PRIMARY KEY,
  nivel_permiso TINYINT UNSIGNED NOT NULL DEFAULT 1,

  CONSTRAINT fk_usuario_admin_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE
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

-- CARRITO
CREATE TABLE IF NOT EXISTS carrito (
  id_carrito INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT UNSIGNED NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('ACTIVO','PAGADO','CANCELADO') NOT NULL DEFAULT 'ACTIVO',

  CONSTRAINT fk_carrito_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- DETALLE_CARRITO
CREATE TABLE IF NOT EXISTS detalle_carrito (
  id_detalle INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_carrito INT UNSIGNED NOT NULL,
  id_producto INT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,

  CONSTRAINT fk_detalle_carrito
    FOREIGN KEY (id_carrito) REFERENCES carrito(id_carrito)
    ON DELETE CASCADE,

  CONSTRAINT fk_detalle_producto
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
    ON DELETE RESTRICT,

  CONSTRAINT uq_detalle_carrito_producto UNIQUE (id_carrito, id_producto)
) ENGINE=InnoDB;

-- ÍNDICES
CREATE INDEX idx_usuario_correo ON usuario(correo);
CREATE INDEX idx_producto_categoria ON producto(categoria);


