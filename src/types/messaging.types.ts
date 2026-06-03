export interface ChatInboxEntry {
  chat_id: number;
  tutor: {
    tutor_id: number;
    nombre: string;
    apellido: string;
  };
  alumno: {
    alumno_id: number;
    nombre: string;
    apellido: string;
  };
  ultimo_mensaje: string | null;
  ultima_fecha: string | null;
  no_leidos: number;
}

export interface MessageResponse {
  mensaje_id: number;
  remitente_id: number;
  contenido: string;
  leido: boolean;
  fecha_envio: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
