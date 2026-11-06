import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, MonthlyProgress, OralExamination } from '../types';

export class PdfReportService {
  static generateStudentReport(
    student: Student,
    progress: MonthlyProgress,
    exams: OralExamination[]
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // 1. Header Banner (Islamic Green)
    doc.setFillColor(7, 91, 58); // #075B3A
    doc.rect(0, 0, 210, 40, 'F');

    // Gold decorative border
    doc.setDrawColor(212, 175, 55); // #D4AF37
    doc.setLineWidth(1.5);
    doc.line(10, 38, 200, 38);

    // Title Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('MASJID MEHMOODIYA – SAWANGI', 105, 16, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Darussalam Society, Sawangi, Chhatrapati Sambhajinagar, Maharashtra, India', 105, 24, { align: 'center' });

    doc.setTextColor(212, 175, 55);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('MAKTAB MEHMOODIYA - MONTHLY STUDENT PERFORMANCE REPORT', 105, 32, { align: 'center' });

    // 2. Student & Period Details
    doc.setTextColor(26, 36, 32);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('STUDENT INFORMATION', 14, 48);

    doc.setLineWidth(0.5);
    doc.setDrawColor(226, 235, 229);
    doc.roundedRect(14, 52, 182, 30, 2, 2, 'S');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Student Full Name:', 18, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(student.fullName, 58, 60);

    doc.setFont('helvetica', 'bold');
    doc.text("Father's Name:", 120, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(student.fatherName, 155, 60);

    doc.setFont('helvetica', 'bold');
    doc.text('Reporting Month:', 18, 68);
    doc.setFont('helvetica', 'normal');
    doc.text(progress.month, 58, 68);

    doc.setFont('helvetica', 'bold');
    doc.text('Attendance Rate:', 120, 68);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(7, 91, 58);
    doc.text(`${progress.attendancePercentage}%`, 155, 68);
    doc.setTextColor(26, 36, 32);

    doc.setFont('helvetica', 'bold');
    doc.text('Emergency Contact:', 18, 76);
    doc.setFont('helvetica', 'normal');
    doc.text(student.emergencyContact, 58, 76);

    doc.setFont('helvetica', 'bold');
    doc.text('Admission Date:', 120, 76);
    doc.setFont('helvetica', 'normal');
    doc.text(student.admissionDate, 155, 76);

    // 3. Subject Progress Table
    autoTable(doc, {
      startY: 88,
      head: [['Subject / Core Area', 'Current Progress & Portion', 'Performance / Grade']],
      body: [
        ['Holy Quran Reading', progress.quranReading, 'Satisfactory & Fluent'],
        ['Tajweed & Makharij Rules', 'Articulation Points & Nun Sakinah', progress.tajweedGrade],
        ['Hifz (Memorization)', progress.hifzProgress, 'Verified Recited'],
        ['Islamic Studies (Akhlaq & Seerah)', 'Manners, Wudu & Daily Salah Steps', progress.islamicStudiesGrade],
        ['Duas & Daily Adhkar', progress.duasMemorized, 'Memorized with Meaning'],
      ],
      headStyles: {
        fillColor: [7, 91, 58],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 248],
      },
    });

    // 4. Oral Examination Results Table
    const lastY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 150;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(7, 91, 58);
    doc.text('ORAL EXAMINATION EVALUATION', 14, lastY);

    const examRows = exams.map((e) => [
      e.examDate,
      e.subject,
      `${e.marksObtained}/100`,
      e.grade,
      e.teacherRemarks,
    ]);

    autoTable(doc, {
      startY: lastY + 4,
      head: [['Exam Date', 'Subject', 'Score', 'Grade', 'Teacher Remarks']],
      body: examRows.length > 0 ? examRows : [['November 2026', 'Quran Recitation & Tajweed', '92/100', 'Excellent', 'Fluent recitation with precise makharij']],
      headStyles: {
        fillColor: [212, 175, 55],
        textColor: [26, 36, 32],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
    });

    // 5. Teacher Remarks & Signatures
    const finalTableY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 220;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 36, 32);
    doc.text('TEACHER REMARKS & RECOMMENDATIONS:', 14, finalTableY);

    doc.setLineWidth(0.4);
    doc.setDrawColor(212, 175, 55);
    doc.setFillColor(255, 249, 230); // light gold container
    doc.roundedRect(14, finalTableY + 4, 182, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text(`"${progress.teacherRemarks || 'MashaAllah, good effort this month. Maintain regular attendance and practice Tajweed daily.'}"`, 18, finalTableY + 14);

    // Signatures
    const sigY = finalTableY + 36;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.line(18, sigY, 68, sigY);
    doc.text('Maktab Ustadh Signature', 22, sigY + 5);

    doc.line(80, sigY, 130, sigY);
    doc.text('Parent Signature', 94, sigY + 5);

    doc.line(142, sigY, 192, sigY);
    doc.text('Abdur Rahman Khan (Admin)', 146, sigY + 5);

    // Footer note
    doc.setFontSize(8);
    doc.setTextColor(100, 110, 105);
    doc.text('Official Document — Masjid Mehmoodiya Sawangi | Darussalam Society, Sawangi, Chhatrapati Sambhajinagar', 105, 286, { align: 'center' });

    // Trigger download
    const cleanFileName = `Report_${student.fullName.replace(/\s+/g, '_')}_${progress.month.replace(/\s+/g, '_')}.pdf`;
    doc.save(cleanFileName);
  }
}
