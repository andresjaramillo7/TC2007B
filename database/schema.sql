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

CREATE TABLE IF NOT EXISTS tutor_alumno (
  id SERIAL PRIMARY KEY,
  tutor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  alumno_id INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE RESTRICT,
  parentesco VARCHAR(50) NOT NULL,
  UNIQUE (tutor_id, alumno_id)
);

CREATE TABLE IF NOT EXISTS chats (
  id SERIAL PRIMARY KEY,
  alumno_id INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE RESTRICT,
  asignacion_docente_id INTEGER NOT NULL REFERENCES asignaciones_docentes(id) ON DELETE RESTRICT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_chats_alumno_asignacion
    UNIQUE (alumno_id, asignacion_docente_id)
);

CREATE TABLE IF NOT EXISTS chat_participantes (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  UNIQUE (chat_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS mensajes (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  remitente_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  contenido TEXT NOT NULL CHECK (
    CHAR_LENGTH(TRIM(contenido)) >= 1
    AND CHAR_LENGTH(contenido) <= 2000
  ),
  leido BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_participantes_usuario_id
  ON chat_participantes(usuario_id);

CREATE INDEX IF NOT EXISTS idx_mensajes_chat_fecha
  ON mensajes(chat_id, fecha_envio DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_tutor_alumno_alumno_id
  ON tutor_alumno(alumno_id);

CREATE TABLE IF NOT EXISTS avisos_grupales (
  id SERIAL PRIMARY KEY,
  grupo_id INTEGER NOT NULL REFERENCES grupos(id) ON DELETE RESTRICT,
  remitente_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  titulo VARCHAR(150) NOT NULL CHECK (
    CHAR_LENGTH(TRIM(titulo)) >= 1
  ),
  contenido TEXT NOT NULL CHECK (
    CHAR_LENGTH(TRIM(contenido)) >= 1
    AND CHAR_LENGTH(contenido) <= 3000
  ),
  fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_avisos_grupales_remitente_fecha
  ON avisos_grupales(remitente_id, fecha_publicacion DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_avisos_grupales_grupo_fecha
  ON avisos_grupales(grupo_id, fecha_publicacion DESC, id DESC);

CREATE TABLE IF NOT EXISTS firmas_boleta (
  id SERIAL PRIMARY KEY,
  tutor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  alumno_id INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE RESTRICT,
  periodo VARCHAR(30) NOT NULL CHECK (
    periodo IN (
      'primer trimestre',
      'segundo trimestre',
      'tercer trimestre'
    )
  ),
  comentario TEXT CHECK (
    comentario IS NULL OR CHAR_LENGTH(comentario) <= 500
  ),
  fecha_firma TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tutor_id, alumno_id, periodo)
);
