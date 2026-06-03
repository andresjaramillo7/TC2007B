export interface LinkedChildGroup {
  grupo_id: number;
  nombre: string;
  grado: number;
  grupo_letra: string;
  ciclo_escolar: string;
}

export interface LinkedChild {
  alumno_id: number;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  grupo: LinkedChildGroup;
  foto_url: string | null;
  parentesco: string;
}

export interface ChildRow {
  alumno_id: number;
  nombre: string;
  apellido: string;
  grupo_id: number;
  grupo_nombre: string;
  grado: number;
  grupo_letra: string;
  ciclo_escolar: string;
  foto_url: string | null;
  parentesco: string;
}
