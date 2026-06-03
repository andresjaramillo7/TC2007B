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

CREATE TABLE IF NOT EXISTS calificaciones (
  id SERIAL PRIMARY KEY,
  alumno_id INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE RESTRICT,
  asignacion_docente_id INTEGER NOT NULL REFERENCES asignaciones_docentes(id) ON DELETE RESTRICT,
  periodo VARCHAR(30) NOT NULL CHECK (
    periodo IN (
      'primer trimestre',
      'segundo trimestre',
      'tercer trimestre'
    )
  ),
  calificacion NUMERIC(4, 2) NOT NULL CHECK (
    calificacion >= 0 AND calificacion <= 10
  ),
  comentario TEXT CHECK (
    comentario IS NULL OR CHAR_LENGTH(comentario) <= 500
  ),
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (alumno_id, asignacion_docente_id, periodo)
);
