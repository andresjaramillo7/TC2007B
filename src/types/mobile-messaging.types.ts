export interface TutorChatInboxAlumno {
  alumno_id: number;
  nombre: string;
  apellido: string;
}

export interface TutorChatInboxDocente {
  docente_id: number;
  nombre: string;
  apellido: string;
}

export interface TutorChatInboxMateria {
  materia_id: number;
  nombre: string;
}

export interface TutorChatInboxEntry {
  chat_id: number;
  asignacion_id: number;
  alumno: TutorChatInboxAlumno;
  docente: TutorChatInboxDocente;
  materia: TutorChatInboxMateria;
  ultimo_mensaje: string | null;
  ultima_fecha: string | null;
  no_leidos: number;
}

export interface StartChatResult {
  chat_id: number;
  mensaje_id: number;
  chat_creado: boolean;
}
