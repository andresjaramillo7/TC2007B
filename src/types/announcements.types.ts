export interface AnnouncementRow {
  aviso_id: number;
  grupo_id: number;
  grupo_nombre: string;
  remitente_usuario_id: number;
  remitente_nombre: string;
  remitente_apellido: string;
  remitente_rol: string;
  titulo: string;
  contenido: string;
  fecha_publicacion: string;
}

export interface AnnouncementResponse {
  aviso_id: number;
  grupo: {
    grupo_id: number;
    nombre: string;
  };
  remitente: {
    usuario_id: number;
    nombre: string;
    apellido: string;
    rol: string;
  };
  titulo: string;
  contenido: string;
  fecha_publicacion: string;
}

export interface PublishAnnouncementInput {
  grupo_id: number;
  titulo: string;
  contenido: string;
}

export interface PublishAnnouncementResult {
  message: string;
  aviso_id: number;
}
