export interface MobileAnnouncementRow {
  aviso_id: number;
  grupo_id: number;
  grupo_nombre: string;
  autor_usuario_id: number;
  autor_nombre: string;
  autor_apellido: string;
  autor_rol: string;
  titulo: string;
  contenido: string;
  fecha_publicacion: string;
}

export interface MobileAnnouncementResponse {
  aviso_id: number;
  grupo: {
    grupo_id: number;
    nombre: string;
  };
  autor: {
    usuario_id: number;
    nombre: string;
    apellido: string;
    rol: string;
  };
  titulo: string;
  contenido: string;
  fecha_publicacion: string;
}
