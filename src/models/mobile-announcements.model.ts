import { query } from '../db/connection';
import type { MobileAnnouncementRow } from '../types/mobile-announcements.types';

export async function findAnnouncementsByTutorId(
  tutorId: number,
): Promise<MobileAnnouncementRow[]> {
  const rows = await query(
    `SELECT
       ag.id AS aviso_id,
       g.id AS grupo_id,
       CONCAT(g.grado, '° ', g.grupo_letra) AS grupo_nombre,
       u.id AS autor_usuario_id,
       u.nombre AS autor_nombre,
       u.apellido AS autor_apellido,
       u.rol AS autor_rol,
       ag.titulo,
       ag.contenido,
       ag.fecha_publicacion
     FROM avisos_grupales ag
     JOIN grupos g ON g.id = ag.grupo_id
     JOIN usuarios u ON u.id = ag.remitente_id
     WHERE ag.grupo_id IN (
       SELECT DISTINCT a.grupo_id
       FROM tutor_alumno ta
       JOIN alumnos a ON a.id = ta.alumno_id
       WHERE ta.tutor_id = $1
     )
     ORDER BY ag.fecha_publicacion DESC, ag.id DESC`,
    [tutorId],
  );
  return rows as MobileAnnouncementRow[];
}
