-- Migracion: simplificar esquema y reemplazar detalle_carrito por pedidos.
-- Fecha: 2026-02-23
-- Objetivo:
-- 1) Mantener tablas: usuario, producto, pedidos
-- 2) Migrar datos historicos de carrito/detalle_carrito -> pedidos (si existen)
-- 3) Eliminar tablas no usadas

USE Hunnab_Q;

-- Crear tabla destino si no existe.
CREATE TABLE IF NOT EXISTS pedidos (
  id_pedido INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT UNSIGNED NOT NULL,
  id_producto INT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  estado ENUM('PENDIENTE','PAGADO','CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_pedidos_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE,
  CONSTRAINT fk_pedidos_producto
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
    ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Detectar existencia de tablas antiguas para migrar datos.
SET @has_carrito := (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'carrito'
);

SET @has_detalle := (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'detalle_carrito'
);

-- Migracion de datos:
-- - id_pedido = id_detalle para conservar trazabilidad
-- - estado ACTIVO -> PENDIENTE
-- - Evita duplicados si el script se ejecuta mas de una vez
SET @migrate_sql := IF(
  @has_carrito = 1 AND @has_detalle = 1,
  "INSERT INTO pedidos (
      id_pedido,
      id_usuario,
      id_producto,
      cantidad,
      precio_unitario,
      estado,
      fecha_creacion
    )
    SELECT
      dc.id_detalle,
      c.id_usuario,
      dc.id_producto,
      dc.cantidad,
      dc.precio_unitario,
      CASE c.estado
        WHEN 'ACTIVO' THEN 'PENDIENTE'
        WHEN 'PAGADO' THEN 'PAGADO'
        WHEN 'CANCELADO' THEN 'CANCELADO'
        ELSE 'PENDIENTE'
      END AS estado_migrado,
      c.fecha_creacion
    FROM detalle_carrito dc
    INNER JOIN carrito c
      ON c.id_carrito = dc.id_carrito
    LEFT JOIN pedidos p
      ON p.id_pedido = dc.id_detalle
    WHERE p.id_pedido IS NULL",
  "SELECT 'SKIP: no existen carrito y/o detalle_carrito para migrar' AS migracion"
);

PREPARE migrate_stmt FROM @migrate_sql;
EXECUTE migrate_stmt;
DEALLOCATE PREPARE migrate_stmt;

-- Ajustar AUTO_INCREMENT despues de insertar ids historicos.
SET @next_id := (SELECT COALESCE(MAX(id_pedido), 0) + 1 FROM pedidos);
SET @ai_sql := CONCAT('ALTER TABLE pedidos AUTO_INCREMENT = ', @next_id);
PREPARE ai_stmt FROM @ai_sql;
EXECUTE ai_stmt;
DEALLOCATE PREPARE ai_stmt;

-- Crear indice si aun no existe.
SET @has_idx_pedidos_usuario_estado := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pedidos'
    AND INDEX_NAME = 'idx_pedidos_usuario_estado'
);

SET @idx_sql := IF(
  @has_idx_pedidos_usuario_estado = 0,
  "CREATE INDEX idx_pedidos_usuario_estado ON pedidos(id_usuario, estado)",
  "SELECT 'SKIP: indice idx_pedidos_usuario_estado ya existe' AS indice"
);

PREPARE idx_stmt FROM @idx_sql;
EXECUTE idx_stmt;
DEALLOCATE PREPARE idx_stmt;

-- Eliminar tablas antiguas/no usadas.
DROP TABLE IF EXISTS detalle_carrito;
DROP TABLE IF EXISTS carrito;
DROP TABLE IF EXISTS usuario_cuenta;
DROP TABLE IF EXISTS usuario_invitado;
DROP TABLE IF EXISTS usuario_administrador;

