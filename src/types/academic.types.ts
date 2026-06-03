export interface GroupInfo {
  grupo_id: number;
  nombre: string;
  grado: number;
  grupo_letra: string;
  ciclo_escolar: string;
}

export interface SubjectInfo {
  materia_id: number;
  nombre: string;
}

export interface Assignment {
  asignacion_id: number;
  grupo: GroupInfo;
  materia: SubjectInfo;
}

export interface Student {
  alumno_id: number;
  nombre: string;
  apellido: string;
  foto_url: string | null;
}
