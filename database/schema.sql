CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('docente', 'tutor', 'admin')),
  foto_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grupos (
  id SERIAL PRIMARY KEY,
  grado INTEGER NOT NULL,
  grupo_letra VARCHAR(10) NOT NULL,
  ciclo_escolar VARCHAR(20) NOT NULL,
  UNIQUE (grado, grupo_letra, ciclo_escolar)
);

CREATE TABLE IF NOT EXISTS materias (
  id SERIAL PRIMARY KEY,
  nombre_materia VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS asignaciones_docentes (
  id SERIAL PRIMARY KEY,
  docente_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  grupo_id INTEGER NOT NULL REFERENCES grupos(id) ON DELETE RESTRICT,
  materia_id INTEGER NOT NULL REFERENCES materias(id) ON DELETE RESTRICT,
  UNIQUE (docente_id, grupo_id, materia_id)
);

CREATE TABLE IF NOT EXISTS alumnos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  grupo_id INTEGER NOT NULL REFERENCES grupos(id) ON DELETE RESTRICT,
  foto_url VARCHAR(500),
  UNIQUE (nombre, apellido, grupo_id)
);
