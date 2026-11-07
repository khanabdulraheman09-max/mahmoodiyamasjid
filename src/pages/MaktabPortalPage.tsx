import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  StudentRepository,
  AttendanceRepository,
  ProgressRepository,
  ExamRepository,
} from '../services/repositories';
import {
  GraduationCap,
  Users,
  CalendarCheck,
  Award,
  FileText,
  Search,
  Plus,
  Download,
  CheckCircle,
  XCircle,
  Edit,
  Mic,
  BookOpen
} from 'lucide-react';
import {
  INITIAL_STUDENTS,
  INITIAL_ATTENDANCE,
  INITIAL_PROGRESS,
  INITIAL_ORAL_EXAMS
} from '../data/mockData';
import { Student, AttendanceRecord, MonthlyProgress, OralExamination } from '../types';
import { PdfReportService } from '../services/pdfService';
import { useNavigation } from '../context/NavigationContext';
import { NativeService } from '../services/nativeService';

export const MaktabPortalPage: React.FC = () => {
  const { isAdmin, currentUser } = useAuth();
  const { registerBackHandler } = useNavigation();
  const canEdit = isAdmin;

  const [activeTab, setActiveTab] = useState<'students' | 'attendance' | 'evaluations' | 'exams'>('students');
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [progressList, setProgressList] = useState<MonthlyProgress[]>(INITIAL_PROGRESS);
  const [examList, setExamList] = useState<OralExamination[]>(INITIAL_ORAL_EXAMS);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(INITIAL_STUDENTS[0]);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Close modals on Android Back button
  useEffect(() => {
    if (!showAddStudentModal) return;
    return registerBackHandler(
      'maktab_add_student_modal',
      () => {
        setShowAddStudentModal(false);
        return true;
      },
      90
    );
  }, [showAddStudentModal, registerBackHandler]);

  useEffect(() => {
    if (!showProgressModal) return;
    return registerBackHandler(
      'maktab_progress_modal',
      () => {
        setShowProgressModal(false);
        return true;
      },
      90
    );
  }, [showProgressModal, registerBackHandler]);

  useEffect(() => {
    if (!showExamModal) return;
    return registerBackHandler(
      'maktab_exam_modal',
      () => {
        setShowExamModal(false);
        return true;
      },
      90
    );
  }, [showExamModal, registerBackHandler]);

  // Registration form states
  const [newStudentName, setNewStudentName] = useState('');
  const [newFatherName, setNewFatherName] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newAddress, setNewAddress] = useState('');

  // Evaluation form states
  const [evalQuranReading, setEvalQuranReading] = useState('Para 5, Surah An-Nisa (Ayah 1-20)');
  const [evalTajweed, setEvalTajweed] = useState<'A+' | 'A' | 'B' | 'C'>('A');
  const [evalHifz, setEvalHifz] = useState('Surah Al-Mulk (Ayah 1-15)');
  const [evalIslamicStudies, setEvalIslamicStudies] = useState<'A+' | 'A' | 'B' | 'C'>('A');
  const [evalDuas, setEvalDuas] = useState('Duas before sleeping and after waking');
  const [evalAttendancePct, setEvalAttendancePct] = useState<number>(95);
  const [evalRemarks, setEvalRemarks] = useState('Diligent student, attends regularly with good adab.');

  // Exam form states
  const [examSubject, setExamSubject] = useState<'Quran Recitation' | 'Tajweed Rules' | 'Hifz Revision' | 'Daily Duas' | 'Islamic Knowledge'>('Quran Recitation');
  const [examMarks, setExamMarks] = useState<number>(92);
  const [examGrade, setExamGrade] = useState<'Excellent' | 'Good' | 'Needs Improvement'>('Excellent');
  const [examRemarks, setExamRemarks] = useState('Clear pronunciation of throat letters and fluent recitation.');

  // Load from SQLite Repositories on initial mount
  useEffect(() => {
    let isMounted = true;
    async function loadFromRepositories() {
      try {
        const [loadedStudents, loadedAttendance, loadedProgress, loadedExams] = await Promise.all([
          StudentRepository.getAll(),
          AttendanceRepository.getAll(),
          ProgressRepository.getAll(),
          ExamRepository.getAll(),
        ]);

        if (isMounted) {
          if (loadedStudents && loadedStudents.length > 0) setStudents(loadedStudents);
          if (loadedAttendance && loadedAttendance.length > 0) setAttendance(loadedAttendance);
          if (loadedProgress && loadedProgress.length > 0) setProgressList(loadedProgress);
          if (loadedExams && loadedExams.length > 0) setExamList(loadedExams);
        }
      } catch (err) {
        console.warn('Loaded fallback data while database initialized:', err);
      }
    }
    loadFromRepositories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter students based on search query
  const visibleStudents = students.filter((s) => {
    return s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           s.fatherName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleToggleAttendance = async (studentId: string) => {
    if (!canEdit) return;
    const today = new Date().toISOString().split('T')[0];
    const existing = attendance.find((a) => a.studentId === studentId && a.date === today);

    const recordToSave: AttendanceRecord = existing
      ? { ...existing, status: existing.status === 'PRESENT' ? 'ABSENT' : 'PRESENT' }
      : {
          id: `att_${studentId}_${Date.now()}`,
          studentId,
          date: today,
          status: 'PRESENT',
          markedBy: currentUser?.displayName || 'Admin',
          timestamp: Date.now(),
        };

    setAttendance((prev) => {
      const idx = prev.findIndex((a) => a.id === recordToSave.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = recordToSave;
        return updated;
      }
      return [...prev, recordToSave];
    });

    try {
      await AttendanceRepository.save(recordToSave);
    } catch (e) {
      console.warn('Offline attendance save queued:', e);
    }
  };

  const handleDownloadPdf = (student: Student) => {
    const prog = progressList.find((p) => p.studentId === student.id) || {
      id: `prog_${student.id}`,
      studentId: student.id,
      month: 'November 2026',
      quranReading: 'Para 1, Al-Fatihah & Al-Baqarah',
      tajweedGrade: 'A',
      hifzProgress: 'Surah An-Nas to Al-Ikhlas',
      islamicStudiesGrade: 'A',
      duasMemorized: 'Basic daily eating & mosque supplications',
      attendancePercentage: 94,
      teacherRemarks: 'Consistent effort. Regular practice recommended.',
      evaluationDate: new Date().toISOString().split('T')[0],
    };

    const studentExams = examList.filter((e) => e.studentId === student.id);
    PdfReportService.generateStudentReport(student, prog, studentExams);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newFatherName) return;

    const newStudent: Student = {
      id: `student_0${students.length + 1}`,
      fullName: newStudentName,
      fatherName: newFatherName,
      guardianName: newFatherName,
      contactNumber: newContact || '+91 98000 00000',
      dateOfBirth: newDob || '2016-01-01',
      address: newAddress || 'Sawangi, Chhatrapati Sambhajinagar',
      admissionDate: new Date().toISOString().split('T')[0],
      parentId: `parent_0${students.length + 1}`,
      emergencyContact: newContact || '+91 98000 00000',
    };

    setStudents([...students, newStudent]);
    setShowAddStudentModal(false);
    setNewStudentName('');
    setNewFatherName('');
    setNewContact('');
    setSuccessToast(`Student ${newStudentName} registered locally (queued for sync)!`);
    setTimeout(() => setSuccessToast(null), 4000);

    try {
      await StudentRepository.insert(newStudent);
    } catch (err) {
      console.warn('Offline student save queued:', err);
    }
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const newProgress: MonthlyProgress = {
      id: `prog_${selectedStudent.id}_${Date.now()}`,
      studentId: selectedStudent.id,
      month: 'November 2026',
      quranReading: evalQuranReading,
      tajweedGrade: evalTajweed,
      hifzProgress: evalHifz,
      islamicStudiesGrade: evalIslamicStudies,
      duasMemorized: evalDuas,
      attendancePercentage: Number(evalAttendancePct),
      teacherRemarks: evalRemarks,
      evaluationDate: new Date().toISOString().split('T')[0],
    };

    setProgressList([newProgress, ...progressList.filter((p) => p.studentId !== selectedStudent.id)]);
    setShowProgressModal(false);
    setSuccessToast(`Monthly progress recorded for ${selectedStudent.fullName}!`);
    setTimeout(() => setSuccessToast(null), 4000);

    try {
      await ProgressRepository.save(newProgress);
    } catch (err) {
      console.warn('Offline evaluation save queued:', err);
    }
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const newExam: OralExamination = {
      id: `exam_${Date.now()}`,
      studentId: selectedStudent.id,
      examDate: new Date().toISOString().split('T')[0],
      subject: examSubject,
      marksObtained: Number(examMarks),
      grade: examGrade,
      teacherRemarks: examRemarks,
    };

    setExamList([newExam, ...examList]);
    setShowExamModal(false);
    setSuccessToast(`Oral exam recorded for ${selectedStudent.fullName}: ${examMarks}/100!`);
    setTimeout(() => setSuccessToast(null), 4000);

    try {
      await ExamRepository.save(newExam);
    } catch (err) {
      console.warn('Offline exam save queued:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-24 right-4 z-50 bg-[#075B3A] text-white px-5 py-3 rounded-xl shadow-xl flex items-center space-x-2 border-2 border-[#D4AF37] animate-bounce">
          <CheckCircle className="w-5 h-5 text-[#D4AF37]" />
          <span className="text-sm font-bold">{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#075B3A] flex items-center space-x-2">
            <GraduationCap className="w-8 h-8 text-[#D4AF37]" />
            <span>Maktab Mehmoodiya Portal (مکتب محمودیہ)</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Single-Class Maktab Management: Student Performance, Daily Attendance, Monthly Evaluations & Oral Exams
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-1.5 bg-gray-100 p-1.5 rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'students' ? 'bg-[#075B3A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Students ({visibleStudents.length})</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'attendance' ? 'bg-[#075B3A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Daily Attendance (حاضری)</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('evaluations')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'evaluations' ? 'bg-[#075B3A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Monthly Performance (کارکردگی)</span>
          </button>

          <button
            onClick={() => setActiveTab('exams')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'exams' ? 'bg-[#075B3A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Oral Exams (زبانی امتحان)</span>
          </button>
        </div>
      </div>

      {/* VISITOR TRANSPARENCY NOTICE */}
      {!isAdmin && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start space-x-3 text-xs text-emerald-900 shadow-sm">
          <div className="p-2 rounded-xl bg-[#075B3A] text-[#D4AF37] flex-shrink-0 mt-0.5">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-[#075B3A]">Public Viewer Mode (ناظر موڈ)</div>
            <p className="text-emerald-800 text-xs mt-0.5 leading-relaxed">
              You are viewing the Maktab directory in Visitor mode. Syllabus progress, Quran recitation, and academic evaluations are shown. To protect student privacy, parent contact numbers, residential addresses, and attendance registers are restricted to Mosque Administration.
            </p>
          </div>
        </div>
      )}

      {/* ADMIN ACTION BAR (VISIBLE ONLY TO ADMIN) */}
      {canEdit && (
        <div className="bg-gradient-to-r from-[#FFF9E6] via-white to-[#E4F3EC] p-4 rounded-2xl border-2 border-[#D4AF37]/50 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#075B3A] text-[#D4AF37]">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#075B3A]">Admin Management Panel (انتظامی پینل)</h4>
              <p className="text-xs text-gray-600">
                Logged in as Admin: <strong className="text-gray-900">{currentUser?.displayName || 'Admin'}</strong>. You have full editing privileges.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (students.length > 0 && !selectedStudent) setSelectedStudent(students[0]);
                setShowProgressModal(true);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-[#075B3A] text-white rounded-xl text-xs font-bold hover:bg-[#043A25] shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              <span>Record Monthly Performance (کارکردگی درج کریں)</span>
            </button>

            <button
              onClick={() => {
                if (students.length > 0 && !selectedStudent) setSelectedStudent(students[0]);
                setShowExamModal(true);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-[#D4AF37] text-[#043A25] rounded-xl text-xs font-bold hover:bg-[#AA8A22] shadow-sm transition-all"
            >
              <Mic className="w-4 h-4" />
              <span>Record Oral Exam (امتحان درج کریں)</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. STUDENTS DIRECTORY TAB */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search student or father name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
              />
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2 bg-[#075B3A] text-white text-xs font-bold rounded-xl hover:bg-[#043A25] transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Register New Student (نیا داخلہ)</span>
              </button>
            )}
          </div>

          {/* Student Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleStudents.map((student) => {
              const studentProgress = progressList.find((p) => p.studentId === student.id);
              const studentExams = examList.filter((e) => e.studentId === student.id);

              return (
                <div
                  key={student.id}
                  className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-[#D4AF37] hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 bg-[#E4F3EC] text-[#075B3A] font-bold text-[10px] rounded-full uppercase">
                        Class 1
                      </span>
                      <span className="text-xs text-gray-400 font-mono font-bold">ID: {student.id}</span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 mb-1">{student.fullName}</h3>
                    <p className="text-xs text-gray-500">Father: <strong className="text-gray-800">{student.fatherName}</strong></p>
                    {isAdmin ? (
                      <>
                        <p className="text-xs text-gray-500">Contact: <strong className="text-gray-700">{student.contactNumber}</strong></p>
                        <p className="text-xs text-gray-500 truncate" title={student.address}>Address: {student.address}</p>
                      </>
                    ) : (
                      <p className="text-[11px] text-gray-500 py-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium text-[10px]">
                          🔒 Contact & address shielded for privacy
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-gray-500">Admitted: {student.admissionDate}</p>

                    {/* Quick Stats */}
                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
                      <span>Attendance: <strong className="text-[#075B3A] font-bold">{studentProgress?.attendancePercentage || 94}%</strong></span>
                      <span>Exams: <strong className="text-[#D4AF37] font-bold">{studentExams.length} Recorded</strong></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                    <button
                      onClick={() => handleDownloadPdf(student)}
                      className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-[#E4F3EC] text-[#075B3A] hover:bg-[#075B3A] hover:text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF Report Card (رپورٹ کارڈ)</span>
                    </button>

                    {canEdit && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowProgressModal(true);
                          }}
                          className="flex items-center justify-center space-x-1 px-2.5 py-1.5 bg-gray-100 hover:bg-[#075B3A] hover:text-white text-gray-700 rounded-lg text-[11px] font-bold transition-all"
                        >
                          <Edit className="w-3 h-3" />
                          <span>+ Progress (کارکردگی)</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowExamModal(true);
                          }}
                          className="flex items-center justify-center space-x-1 px-2.5 py-1.5 bg-gray-100 hover:bg-[#D4AF37] hover:text-[#043A25] text-gray-700 rounded-lg text-[11px] font-bold transition-all"
                        >
                          <Mic className="w-3 h-3" />
                          <span>+ Exam (امتحان)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#075B3A] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold">Daily Class Attendance Tracker (روزانہ حاضری)</h3>
              <p className="text-xs text-emerald-200">
                Date: {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <span className="text-xs bg-[#D4AF37] text-[#043A25] font-bold px-3 py-1 rounded-full self-start sm:self-auto">
              Single Class (12 Enrolled)
            </span>
          </div>

          <div className="divide-y divide-gray-100 p-2">
            {students.map((student) => {
              const today = new Date().toISOString().split('T')[0];
              const todayRecord = attendance.find((a) => a.studentId === student.id && a.date === today);
              const isPresent = todayRecord ? todayRecord.status === 'PRESENT' : true;

              return (
                <div key={student.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
                  <div>
                    <span className="text-sm font-bold text-gray-900 block">{student.fullName}</span>
                    <span className="text-xs text-gray-500">Father: {student.fatherName} • Contact: {student.contactNumber}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleAttendance(student.id)}
                      disabled={!canEdit}
                      className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        isPresent
                          ? 'bg-[#075B3A] text-white hover:bg-[#043A25]'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {isPresent ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      <span>{isPresent ? 'PRESENT (حاضر)' : 'ABSENT (غیر حاضر)'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MONTHLY PROGRESS TAB */}
      {activeTab === 'evaluations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200">
            <div>
              <h3 className="text-lg font-bold text-[#075B3A]">
                Monthly Student Evaluations (ماہانہ رپورٹ برائے نومبر 2026)
              </h3>
              <p className="text-xs text-gray-500">
                Comprehensive tracking of Quran reading, Tajweed grade, Hifz, and Islamic Studies
              </p>
            </div>

            {canEdit && (
              <button
                onClick={() => {
                  if (students.length > 0 && !selectedStudent) setSelectedStudent(students[0]);
                  setShowProgressModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2.5 bg-[#075B3A] text-white text-xs font-bold rounded-xl hover:bg-[#043A25] shadow-sm transition-all"
              >
                <Plus className="w-4 h-4 text-[#D4AF37]" />
                <span>+ Add Student Performance (نئی کارکردگی درج کریں)</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {progressList.map((prog) => {
              const student = students.find((s) => s.id === prog.studentId);
              if (!student) return null;

              return (
                <div key={prog.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
                    <div>
                      <h4 className="text-base font-bold text-gray-900">{student.fullName}</h4>
                      <p className="text-xs text-gray-500">Father: {student.fatherName} • Month: <strong>{prog.month}</strong></p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold bg-[#E4F3EC] text-[#075B3A] px-3 py-1 rounded-full">
                        Attendance: {prog.attendancePercentage}%
                      </span>
                      {canEdit && (
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setEvalQuranReading(prog.quranReading);
                            setEvalTajweed(prog.tajweedGrade);
                            setEvalHifz(prog.hifzProgress);
                            setEvalIslamicStudies(prog.islamicStudiesGrade);
                            setEvalDuas(prog.duasMemorized);
                            setEvalAttendancePct(prog.attendancePercentage);
                            setEvalRemarks(prog.teacherRemarks);
                            setShowProgressModal(true);
                          }}
                          className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 hover:bg-[#075B3A] hover:text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadPdf(student)}
                        className="flex items-center space-x-1 px-3 py-1 bg-[#D4AF37] text-[#043A25] font-bold text-xs rounded-lg hover:bg-[#AA8A22]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF Report Card</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <span className="text-gray-400 block font-semibold">Quran Reading:</span>
                      <strong className="text-gray-800">{prog.quranReading}</strong>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <span className="text-gray-400 block font-semibold">Tajweed Grade:</span>
                      <span className="font-bold text-[#075B3A] bg-[#E4F3EC] px-2 py-0.5 rounded-full inline-block mt-0.5">
                        Grade {prog.tajweedGrade}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <span className="text-gray-400 block font-semibold">Hifz Progress:</span>
                      <strong className="text-gray-800">{prog.hifzProgress}</strong>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <span className="text-gray-400 block font-semibold">Islamic Studies:</span>
                      <span className="font-bold text-[#075B3A] bg-[#E4F3EC] px-2 py-0.5 rounded-full inline-block mt-0.5">
                        Grade {prog.islamicStudiesGrade}
                      </span>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 p-3 rounded-xl text-xs border border-emerald-100">
                    <span className="font-bold text-[#075B3A] block mb-0.5">Teacher Remarks:</span>
                    <p className="text-gray-700 italic">"{prog.teacherRemarks}"</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. ORAL EXAMS TAB */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200">
            <div>
              <h3 className="text-lg font-bold text-[#075B3A]">
                Oral Examinations & Testing (زبانی امتحانات)
              </h3>
              <p className="text-xs text-gray-500">
                Evaluation of pronunciation, memorization, and adab
              </p>
            </div>

            {canEdit && (
              <button
                onClick={() => {
                  if (students.length > 0 && !selectedStudent) setSelectedStudent(students[0]);
                  setShowExamModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2.5 bg-[#075B3A] text-white text-xs font-bold rounded-xl hover:bg-[#043A25] shadow-sm transition-all"
              >
                <Plus className="w-4 h-4 text-[#D4AF37]" />
                <span>+ Record Oral Exam Marks (امتحان درج کریں)</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-[#075B3A] text-white font-bold">
                <tr>
                  <th className="px-4 py-3 text-left">Student Name</th>
                  <th className="px-4 py-3 text-left">Subject</th>
                  <th className="px-4 py-3 text-left">Exam Date</th>
                  <th className="px-4 py-3 text-center">Marks (100)</th>
                  <th className="px-4 py-3 text-center">Grade</th>
                  <th className="px-4 py-3 text-left">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {examList.map((exam) => {
                  const student = students.find((s) => s.id === exam.studentId);
                  if (!student) return null;

                  return (
                    <tr key={exam.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-gray-900">{student.fullName}</td>
                      <td className="px-4 py-3 font-semibold text-[#075B3A]">{exam.subject}</td>
                      <td className="px-4 py-3 text-gray-500">{exam.examDate}</td>
                      <td className="px-4 py-3 text-center font-bold text-base text-gray-900">{exam.marksObtained}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2.5 py-1 bg-[#E4F3EC] text-[#075B3A] font-bold rounded-full">
                          {exam.grade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 italic">{exam.teacherRemarks}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1. REGISTRATION MODAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-[#D4AF37]">
            <h3 className="text-lg font-bold text-[#075B3A] mb-4">Register Student for Maktab (طالب علم کا نیا داخلہ)</h3>
            <form onSubmit={handleAddStudent} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Student Full Name (طالب علم کا نام)</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                  placeholder="e.g. Mohammed Zaid Khan"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Father's Name (والد کا نام)</label>
                <input
                  type="text"
                  required
                  value={newFatherName}
                  onChange={(e) => setNewFatherName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                  placeholder="e.g. Tariq Khan"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Contact Number (فون نمبر)</label>
                  <input
                    type="text"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                    placeholder="+91 98000 00000"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={newDob}
                    onChange={(e) => setNewDob(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Residential Address (پتہ)</label>
                <textarea
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                  placeholder="Darussalam Society, Sawangi"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#075B3A] text-white text-xs font-bold rounded-xl hover:bg-[#043A25] shadow-md"
                >
                  Confirm Registration (داخلہ کریں)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. PROGRESS EVALUATION MODAL (NOW WITH STUDENT SELECTOR!) */}
      {showProgressModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-[#D4AF37] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-lg font-bold text-[#075B3A] flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-[#D4AF37]" />
                <span>Record Student Performance (ماہانہ کارکردگی)</span>
              </h3>
              <button
                onClick={() => setShowProgressModal(false)}
                className="text-gray-400 hover:text-gray-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvaluation} className="space-y-3.5 pt-3">
              {/* Select Student */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Select Student (طالب علم منتخب کریں)
                </label>
                <select
                  value={selectedStudent?.id || ''}
                  onChange={(e) => {
                    const found = students.find((s) => s.id === e.target.value);
                    if (found) setSelectedStudent(found);
                  }}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} s/o {s.fatherName} ({s.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Quran Reading Progress (قرآن پاک کی خواندگی)</label>
                <input
                  type="text"
                  required
                  value={evalQuranReading}
                  onChange={(e) => setEvalQuranReading(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                  placeholder="e.g. Para 5, Surah An-Nisa (Ayah 1-20)"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Tajweed Grade (تجوید کا درجہ)</label>
                  <select
                    value={evalTajweed}
                    onChange={(e) => setEvalTajweed(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    <option value="A+">A+ (Distinction - ممتاز)</option>
                    <option value="A">A (Very Good - بہت اچھا)</option>
                    <option value="B">B (Good - اچھا)</option>
                    <option value="C">C (Needs Practice - محنت درکار)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Islamic Studies (دینیات)</label>
                  <select
                    value={evalIslamicStudies}
                    onChange={(e) => setEvalIslamicStudies(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    <option value="A+">A+ (Distinction)</option>
                    <option value="A">A (Very Good)</option>
                    <option value="B">B (Good)</option>
                    <option value="C">C (Needs Practice)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Hifz Progress Portion (حفظ کی سورتیں)</label>
                <input
                  type="text"
                  required
                  value={evalHifz}
                  onChange={(e) => setEvalHifz(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                  placeholder="e.g. Surah Al-Mulk (Ayah 1-15)"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Duas & Adhkar Memorized (مسنون دعائیں)</label>
                <input
                  type="text"
                  required
                  value={evalDuas}
                  onChange={(e) => setEvalDuas(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                  placeholder="e.g. Duas before sleeping, eating, and entering mosque"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Attendance Percentage (حاضری کا تناسب %)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={evalAttendancePct}
                  onChange={(e) => setEvalAttendancePct(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Teacher Remarks & Advice (استاد کی رائے اور نصیحت)</label>
                <textarea
                  required
                  rows={2}
                  value={evalRemarks}
                  onChange={(e) => setEvalRemarks(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                  placeholder="e.g. Diligent student with excellent manners and regular attendance."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowProgressModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#075B3A] text-white text-xs font-bold rounded-xl hover:bg-[#043A25] shadow-md transition-all"
                >
                  Save Monthly Performance (کارکردگی محفوظ کریں)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ORAL EXAM MODAL (COMPLETE IMPLEMENTATION!) */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-[#D4AF37]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-lg font-bold text-[#075B3A] flex items-center space-x-2">
                <Award className="w-5 h-5 text-[#D4AF37]" />
                <span>Record Oral Exam Marks (زبانی امتحان کے نمبر درج کریں)</span>
              </h3>
              <button
                onClick={() => setShowExamModal(false)}
                className="text-gray-400 hover:text-gray-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-3.5 pt-3">
              {/* Select Student */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Select Student (طالب علم منتخب کریں)
                </label>
                <select
                  value={selectedStudent?.id || ''}
                  onChange={(e) => {
                    const found = students.find((s) => s.id === e.target.value);
                    if (found) setSelectedStudent(found);
                  }}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} s/o {s.fatherName} ({s.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Examination Subject (مضمون)</label>
                <select
                  value={examSubject}
                  onChange={(e) => setExamSubject(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="Quran Recitation">Quran Recitation (ناظرہ قرآن کریم)</option>
                  <option value="Tajweed Rules">Tajweed Rules (قواعد تجوید)</option>
                  <option value="Hifz Revision">Hifz Revision (حفظ دور)</option>
                  <option value="Daily Duas">Daily Duas (مسنون دعائیں)</option>
                  <option value="Islamic Knowledge">Islamic Knowledge & Adab (دینی مسائل اور آداب)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Marks Obtained / 100 (نمبر)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={examMarks}
                    onChange={(e) => setExamMarks(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-[#075B3A] focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Overall Grade (گریڈ)</label>
                  <select
                    value={examGrade}
                    onChange={(e) => setExamGrade(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    <option value="Excellent">Excellent (ممتاز)</option>
                    <option value="Good">Good (بہتر)</option>
                    <option value="Needs Improvement">Needs Improvement (محنت طلب)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Examiner Remarks & Advice (ممتحن کے تاثرات)</label>
                <textarea
                  required
                  rows={2}
                  value={examRemarks}
                  onChange={(e) => setExamRemarks(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                  placeholder="e.g. Clear pronunciation of throat letters and fluent recitation."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#075B3A] text-white text-xs font-bold rounded-xl hover:bg-[#043A25] shadow-md transition-all"
                >
                  Save Exam Marks (امتحان محفوظ کریں)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
