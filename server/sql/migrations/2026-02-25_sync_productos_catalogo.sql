USE Hunnab_Q;

-- Inserta todos los productos base faltantes del catalogo frontend.
-- No borra ni duplica; solo agrega los que no existen por nombre.
INSERT INTO producto (nombre, descripcion, precio, stock, categoria)
SELECT seed.nombre, seed.descripcion, seed.precio, seed.stock, seed.categoria
FROM (
  SELECT 'Collar Aquamarina' AS nombre, 'Collar de la coleccion base Hunnab.Q.' AS descripcion, 250.00 AS precio, 15 AS stock, 'COLLAR_HOMBRE' AS categoria
  UNION ALL SELECT 'Collar Nautilus', 'Collar de la coleccion base Hunnab.Q.', 270.00, 12, 'COLLAR_HOMBRE'
  UNION ALL SELECT 'Collar Libelula', 'Collar de la coleccion base Hunnab.Q.', 170.00, 18, 'COLLAR_HOMBRE'
  UNION ALL SELECT 'Collar Amatista', 'Collar de la coleccion base Hunnab.Q.', 280.00, 10, 'COLLAR_MUJER'
  UNION ALL SELECT 'Collar Oro', 'Collar de la coleccion base Hunnab.Q.', 310.00, 8, 'COLLAR_MUJER'
  UNION ALL SELECT 'Arracadas Clasicas', 'Arete de la coleccion base Hunnab.Q.', 260.00, 14, 'ARETE'
  UNION ALL SELECT 'Arracadas Chunky', 'Arete de la coleccion base Hunnab.Q.', 320.00, 9, 'ARETE'
  UNION ALL SELECT 'Anillo Modelo', 'Anillo de la coleccion base Hunnab.Q.', 290.00, 11, 'ANILLO'
  UNION ALL SELECT 'Anillo Muestra', 'Anillo de la coleccion base Hunnab.Q.', 260.00, 16, 'ANILLO'
  UNION ALL SELECT 'Pulsera Piedra Volcanica', 'Pulsera de la coleccion base Hunnab.Q.', 180.00, 20, 'PULSERA_HOMBRE'
  UNION ALL SELECT 'Pulsera Onyx', 'Pulsera de la coleccion base Hunnab.Q.', 210.00, 13, 'PULSERA_MUJER'
) AS seed
LEFT JOIN producto p
  ON p.nombre = seed.nombre
WHERE p.id_producto IS NULL;

-- Verificacion rapida.
SELECT COUNT(*) AS total_productos FROM producto;
SELECT id_producto, nombre, precio, stock, categoria FROM producto ORDER BY id_producto ASC;
