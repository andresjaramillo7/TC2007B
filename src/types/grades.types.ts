export interface GradeRow {
  calificacion_id: number;
  asignacion_id: number;
  materia: string;
  periodo: string;
  nota: number;
  comentario: string | null;
  fecha_registro: string;
}

export interface GradeTableEntry {
  alumno: {
    alumno_id: number;
    nombre: string;
    apellido: string;
    foto_url: string | null;
  };
  calificacion: {
    calificacion_id: number;
    nota: number;
    comentario: string | null;
    fecha_registro: string;
  } | null;
}

export interface UpsertGradeInput {
  alumno_id: number;
  asignacion_id: number;
  periodo: string;
  nota: number;
  comentario: string | null;
}

export interface BulkGradeItem {
  alumno_id: number;
  nota: number;
  comentario: string | null;
}

export interface BulkGradeInput {
  asignacion_id: number;
  periodo: string;
  calificaciones: BulkGradeItem[];
}

export type Periodo = 'primer trimestre' | 'segundo trimestre' | 'tercer trimestre';
