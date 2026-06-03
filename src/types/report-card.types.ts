export interface ReportCardGroup {
  grupo_id: number;
  nombre: string;
  grado: number;
  grupo_letra: string;
  ciclo_escolar: string;
}

export interface ReportCardAlumno {
  alumno_id: number;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  grupo: ReportCardGroup;
  foto_url: string | null;
}

export interface ReportCardDocente {
  docente_id: number;
  nombre: string;
  apellido: string;
}

export interface ReportCardSubject {
  materia_id: number;
  nombre: string;
}

export interface ReportCardGrade {
  periodo: string;
  nota: number | null;
  comentario: string | null;
  fecha_registro: string | null;
}

export interface ReportCardSubjectEntry {
  asignacion_id: number;
  materia: ReportCardSubject;
  docente: ReportCardDocente;
  calificaciones: ReportCardGrade[];
}

export interface ReportCardData {
  alumno: ReportCardAlumno;
  boleta: ReportCardSubjectEntry[];
  firmas: ReportCardFirmaSlot[];
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

export interface GradeRow {
  asignacion_id: number;
  materia_id: number;
  nombre_materia: string;
  docente_id: number;
  docente_nombre: string;
  docente_apellido: string;
  periodo: string;
  calificacion: string | null;
  comentario: string | null;
  fecha_registro: string | null;
}

export interface SignatureRow {
  firma_id: number;
  alumno_id: number;
  periodo: string;
  comentario: string | null;
  fecha_firma: string;
}

export interface ReportCardFirmaSlot {
  periodo: string;
  firmada: boolean;
  firma_id: number | null;
  comentario: string | null;
  fecha_firma: string | null;
}
