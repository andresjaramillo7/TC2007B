import PDFDocument from 'pdfkit';
import { getConsolidatedReportCard } from './report-card.service';
import type { ReportCardData } from '../types/report-card.types';

function sanitizePdfFilename(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function translatePeriod(periodo: string): string {
  const map: Record<string, string> = {
    'primer trimestre': '1er Trimestre',
    'segundo trimestre': '2do Trimestre',
    'tercer trimestre': '3er Trimestre',
  };
  return map[periodo] || periodo;
}

export async function generateReportCardPdf(
  tutorId: number,
  studentId: number,
): Promise<{ buffer: Buffer; filename: string }> {
  const data: ReportCardData = await getConsolidatedReportCard(tutorId, studentId);

  const rawName = data.alumno.nombre_completo;
  const safeName = sanitizePdfFilename(rawName);
  const filename = `boleta-${safeName}.pdf`;

  const doc = new PDFDocument({ margin: 50 });
  const buffers: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => buffers.push(chunk));

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      const buffer = Buffer.concat(buffers);
      resolve({ buffer, filename });
    });
    doc.on('error', reject);

    const { alumno, boleta, firmas } = data;

    doc.font('Helvetica-Bold').fontSize(18).text('Boleta de calificaciones', { align: 'center' });
    doc.moveDown(1.5);

    doc.font('Helvetica-Bold').fontSize(12).text(`Alumno: `, { continued: true });
    doc.font('Helvetica').fontSize(12).text(`${alumno.nombre_completo}`);
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').fontSize(12).text(`Grupo: `, { continued: true });
    doc.font('Helvetica').fontSize(12).text(`${alumno.grupo.nombre}`);
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').fontSize(12).text(`Ciclo escolar: `, { continued: true });
    doc.font('Helvetica').fontSize(12).text(`${alumno.grupo.ciclo_escolar}`);
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').fontSize(12).text(`Fecha de generación: `, { continued: true });
    doc.font('Helvetica').fontSize(12).text(`${formatDate(new Date())}`);
    doc.moveDown(1.5);

    if (boleta.length === 0) {
      doc.font('Helvetica').fontSize(12).text('No hay materias asignadas para este alumno.');
    } else {
      for (const entry of boleta) {
        doc.font('Helvetica-Bold').fontSize(13).text(`${entry.materia.nombre}`);
        doc.font('Helvetica').fontSize(11).text(`Docente: ${entry.docente.nombre} ${entry.docente.apellido}`);
        doc.moveDown(0.3);

        const tableTop = doc.y;
        const col1X = 50;
        const col2X = 200;
        const col3X = 300;
        const col4X = 400;

        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('Periodo', col1X, tableTop);
        doc.text('Calificación', col2X, tableTop);
        doc.text('Comentario', col3X, tableTop);
        doc.text('Fecha', col4X, tableTop);
        doc.moveDown(0.3);

        doc.font('Helvetica').fontSize(10);
        for (const grade of entry.calificaciones) {
          const rowY = doc.y;
          const displayNota = grade.nota !== null ? grade.nota.toFixed(2) : '—';
          const displayComentario = grade.comentario ?? '—';
          const displayFecha = grade.fecha_registro
            ? formatDate(new Date(grade.fecha_registro))
            : '—';

          doc.text(translatePeriod(grade.periodo), col1X, rowY, { width: 140 });
          doc.text(String(displayNota), col2X, rowY, { width: 90 });
          doc.text(displayComentario, col3X, rowY, { width: 90 });
          doc.text(displayFecha, col4X, rowY, { width: 100 });
          doc.moveDown(0.5);
        }
        doc.moveDown(1);
      }
    }

    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(14).text('Estado de firmas', { align: 'center' });
    doc.moveDown(0.5);

    for (const firma of firmas) {
      doc.font('Helvetica-Bold').fontSize(11).text(`${translatePeriod(firma.periodo)}: `, { continued: true });
      if (firma.firmada) {
        doc.font('Helvetica').fontSize(11).text(`Firmada`);
        doc.font('Helvetica').fontSize(10).text(`  Fecha de firma: ${firma.fecha_firma ? formatDate(new Date(firma.fecha_firma)) : '—'}`);
      } else {
        doc.font('Helvetica').fontSize(11).text(`Pendiente`);
      }
      doc.moveDown(0.5);
    }

    doc.end();
  });
}
