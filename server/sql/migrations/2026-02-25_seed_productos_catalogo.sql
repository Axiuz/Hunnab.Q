USE Hunnab_Q;

-- Seed de productos base actuales del catalogo frontend.
-- Es idempotente: solo inserta productos faltantes por `nombre`.
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

SELECT id_producto, nombre, precio, stock, categoria
FROM producto
ORDER BY id_producto ASC;
