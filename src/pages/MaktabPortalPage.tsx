import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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
  AlertCircle,
  UserCheck
} from 'lucide-react';
import {
  INITIAL_STUDENTS,
  INITIAL_ATTENDANCE,
  INITIAL_PROGRESS,
  INITIAL_ORAL_EXAMS
} from '../data/mockData';
import { Student, AttendanceRecord, MonthlyProgress, OralExamination } from '../types';
import { PdfReportService } from '../services/pdfService';

export const MaktabPortalPage: React.FC = () => {
  const { isTeacher, isAdmin, isParent, currentUser, canAccessStudent } = useAuth();

  const [activeTab, setActiveTab] = useState<'students' | 'attendance' | 'evaluations' | 'exams'>('students');
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [progressList, setProgressList] = useState<MonthlyProgress[]>(INITIAL_PROGRESS);
  const [examList, setExamList] = useState<OralExamination[]>(INITIAL_ORAL_EXAMS);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form states
  const [newStudentName, setNewStudentName] = useState('');
  const [newFatherName, setNewFatherName] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newAddress, setNewAddress] = useState('');

  // Evaluation form states
  const [evalQuranReading, setEvalQuranReading] = useState('Para 5, Surah An-Nisa');
  const [evalTajweed, setEvalTajweed] = useState<'A+' | 'A' | 'B' | 'C'>('A');
  const [evalHifz, setEvalHifz] = useState('Surah Al-Mulk (Ayah 1-15)');
  const [evalIslamicStudies, setEvalIslamicStudies] = useState<'A+' | 'A' | 'B' | 'C'>('A');
  const [evalDuas, setEvalDuas] = useState('Duas before sleeping and after waking');
  const [evalRemarks, setEvalRemarks] = useState('Diligent student, attends regularly.');

  // Exam form states
  const [examSubject, setExamSubject] = useState<'Quran Recitation' | 'Tajweed Rules' | 'Hifz Revision' | 'Daily Duas' | 'Islamic Knowledge'>('Quran Recitation');
  const [examMarks, setExamMarks] = useState<number>(90);
  const [examGrade, setExamGrade] = useState<'Excellent' | 'Good' | 'Needs Improvement'>('Excellent');
  const [examRemarks, setExamRemarks] = useState('Clear pronunciation of throat letters.');

  // Filter students based on role and search query
  const visibleStudents = students.filter((s) => {
    // Parent restriction: ONLY see their own child
    if (isParent && !canAccessStudent(s.id)) return false;
    return s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           s.fatherName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleToggleAttendance = (studentId: string) => {
    if (!isTeacher) return;
    const today = new Date().toISOString().split('T')[0];
    setAttendance((prev) => {
      const existing = prev.find((a) => a.studentId === studentId && a.date === today);
      if (existing) {
        return prev.map((a) =>
          a.id === existing.id
            ? { ...a, status: a.status === 'PRESENT' ? 'ABSENT' : 'PRESENT' }
            : a
        );
      } else {
        return [
          ...prev,
          {
            id: `att_${studentId}_${Date.now()}`,
            studentId,
            date: today,
            status: 'PRESENT',
            markedBy: currentUser.displayName,
            timestamp: Date.now(),
          },
        ];
      }
    });
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

  const handleAddStudent = (e: React.FormEvent) => {
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
    setSuccessToast(`Student ${newStudentName} successfully registered!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
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
      attendancePercentage: 95,
      teacherRemarks: evalRemarks,
      evaluationDate: new Date().toISOString().split('T')[0],
    };

    setProgressList([newProgress, ...progressList.filter((p) => p.studentId !== selectedStudent.id)]);
    setShowProgressModal(false);
    setSuccessToast(`Monthly progress recorded for ${selectedStudent.fullName}!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleSaveExam = (e: React.FormEvent) => {
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
    setSuccessToast(`Oral examination recorded for ${selectedStudent.fullName}!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast */}
      {successToast && (
        <div className="fixed top-24 right-4 z-50 bg-[#075B3A] text-white px-5 py-3 rounded-xl shadow-xl flex items-center space-x-2 border-2 border-[#D4AF37]">
          <CheckCircle className="w-5 h-5 text-[#D4AF37]" />
          <span className="text-sm font-bold">{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#075B3A] flex items-center space-x-2">
            <GraduationCap className="w-8 h-8 text-[#D4AF37]" />
            <span>Maktab Mehmoodiya – Sawangi</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Single-Class Maktab Management: Student Records, Daily Attendance, Monthly Evaluations & Oral Exams
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-1.5 bg-gray-100 p-1.5 rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'students' ? 'bg-[#075B3A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Students ({visibleStudents.length})</span>
          </button>

          {!isParent && (
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'attendance' ? 'bg-[#075B3A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Daily Attendance</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('evaluations')}
            className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'evaluations' ? 'bg-[#075B3A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Monthly Progress</span>
          </button>

          <button
            onClick={() => setActiveTab('exams')}
            className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'exams' ? 'bg-[#075B3A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Oral Exams</span>
          </button>
        </div>
      </div>

      {/* Parent Isolated Warning if viewing as Parent */}
      {isParent && (
        <div className="bg-[#FFF9E6] p-4 rounded-xl border border-[#D4AF37] flex items-center justify-between text-xs font-bold text-[#AA8A22]">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4" />
            <span>Parent Access Portal: You are viewing solely your assigned child's records ({visibleStudents[0]?.fullName}).</span>
          </div>
          <span className="bg-[#D4AF37] text-[#043A25] px-2 py-0.5 rounded-full text-[10px]">Strict Child Privacy</span>
        </div>
      )}

      {/* 1. STUDENTS DIRECTORY TAB */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
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
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#075B3A] text-white text-xs font-bold rounded-xl hover:bg-[#043A25] shadow-sm transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Register New Student</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-2xl border border-gray-200 hover:border-[#D4AF37] p-5 shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 bg-[#E4F3EC] text-[#075B3A] font-bold text-[10px] rounded-full uppercase">
                      Class 1
                    </span>
                    <span className="text-xs text-gray-400 font-mono">ID: {student.id}</span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 mb-1">{student.fullName}</h3>
                  <p className="text-xs text-gray-500">Father: <strong className="text-gray-700">{student.fatherName}</strong></p>
                  <p className="text-xs text-gray-500">Contact: {student.contactNumber}</p>
                  <p className="text-xs text-gray-500">Admitted: {student.admissionDate}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleDownloadPdf(student)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-1.5 bg-[#E4F3EC] text-[#075B3A] hover:bg-[#075B3A] hover:text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>

                  {isTeacher && (
                    <button
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowProgressModal(true);
                      }}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
                      title="Evaluate Monthly Progress"
                    >
                      Evaluate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#075B3A] text-white px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold">Daily Class Attendance Tracker</h3>
              <p className="text-xs text-emerald-200">Date: {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <span className="text-xs bg-[#D4AF37] text-[#043A25] font-bold px-3 py-1 rounded-full">
              Single Class (1–20 Enrolled)
            </span>
          </div>

          <div className="divide-y divide-gray-100 p-2">
            {students.map((student) => {
              const todayRecord = attendance.find((a) => a.studentId === student.id && a.date === new Date().toISOString().split('T')[0]);
              const isPresent = todayRecord ? todayRecord.status === 'PRESENT' : true;

              return (
                <div key={student.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
                  <div>
                    <span className="text-sm font-bold text-gray-900 block">{student.fullName}</span>
                    <span className="text-xs text-gray-500">Father: {student.fatherName} • {student.contactNumber}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleAttendance(student.id)}
                      className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        isPresent
                          ? 'bg-[#075B3A] text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {isPresent ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      <span>{isPresent ? 'PRESENT' : 'ABSENT'}</span>
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
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#075B3A]">Monthly Student Evaluations (November 2026)</h3>
          </div>

          <div className="space-y-3">
            {progressList.map((prog) => {
              const student = students.find((s) => s.id === prog.studentId);
              if (!student) return null;
              if (isParent && !canAccessStudent(student.id)) return null;

              return (
                <div key={prog.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
                    <div>
                      <h4 className="text-base font-bold text-gray-900">{student.fullName}</h4>
                      <p className="text-xs text-gray-500">Father: {student.fatherName} • Month: {prog.month}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold bg-[#E4F3EC] text-[#075B3A] px-3 py-1 rounded-full">
                        Attendance: {prog.attendancePercentage}%
                      </span>
                      <button
                        onClick={() => handleDownloadPdf(student)}
                        className="flex items-center space-x-1 px-3 py-1 bg-[#D4AF37] text-[#043A25] font-bold text-xs rounded-lg hover:bg-[#AA8A22]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF Card</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <span className="text-gray-500 block">Quran Reading:</span>
                      <strong className="text-gray-800">{prog.quranReading}</strong>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <span className="text-gray-500 block">Tajweed Grade:</span>
                      <strong className="text-[#075B3A] font-bold text-sm">{prog.tajweedGrade}</strong>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <span className="text-gray-500 block">Hifz Progress:</span>
                      <strong className="text-gray-800">{prog.hifzProgress}</strong>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <span className="text-gray-500 block">Islamic Studies:</span>
                      <strong className="text-[#075B3A] font-bold text-sm">{prog.islamicStudiesGrade}</strong>
                    </div>
                  </div>

                  <div className="bg-[#FFF9E6] p-3 rounded-xl border border-[#D4AF37]/30 text-xs">
                    <span className="font-bold text-[#AA8A22] block mb-0.5">Teacher Remarks:</span>
                    <p className="text-gray-800 italic">"{prog.teacherRemarks}"</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. ORAL EXAMINATIONS TAB */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#075B3A]">Oral Examination Records</h3>
          </div>

          <div className="overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#075B3A] text-white font-bold">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Exam Subject</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Grade</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {examList.map((exam) => {
                  const student = students.find((s) => s.id === exam.studentId);
                  if (!student) return null;
                  if (isParent && !canAccessStudent(student.id)) return null;

                  return (
                    <tr key={exam.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-gray-900">{student.fullName}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800">{exam.subject}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                          {exam.marksObtained}/100
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#AA8A22]">{exam.grade}</td>
                      <td className="py-3 px-4 text-gray-500">{exam.examDate}</td>
                      <td className="py-3 px-4 text-gray-600 italic">"{exam.teacherRemarks}"</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-[#D4AF37]">
            <h3 className="text-lg font-bold text-[#075B3A] mb-4">Register Student for Maktab</h3>
            <form onSubmit={handleAddStudent} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Father's Name</label>
                <input
                  type="text"
                  required
                  value={newFatherName}
                  onChange={(e) => setNewFatherName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Contact Number</label>
                  <input
                    type="text"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
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
                <label className="text-xs font-bold text-gray-700 block mb-1">Residential Address</label>
                <textarea
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#075B3A] text-white text-xs font-bold rounded-xl hover:bg-[#043A25]"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Evaluation Modal */}
      {showProgressModal && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-[#D4AF37]">
            <h3 className="text-lg font-bold text-[#075B3A] mb-1">
              Monthly Evaluation: {selectedStudent.fullName}
            </h3>
            <p className="text-xs text-gray-500 mb-4">Enter monthly progress across Quran, Tajweed, and Hifz</p>

            <form onSubmit={handleSaveEvaluation} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Quran Reading Progress</label>
                <input
                  type="text"
                  required
                  value={evalQuranReading}
                  onChange={(e) => setEvalQuranReading(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Tajweed Grade</label>
                  <select
                    value={evalTajweed}
                    onChange={(e) => setEvalTajweed(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="A+">A+ (Distinction)</option>
                    <option value="A">A (Very Good)</option>
                    <option value="B">B (Good)</option>
                    <option value="C">C (Needs Practice)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Islamic Studies Grade</label>
                  <select
                    value={evalIslamicStudies}
                    onChange={(e) => setEvalIslamicStudies(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="A+">A+ (Distinction)</option>
                    <option value="A">A (Very Good)</option>
                    <option value="B">B (Good)</option>
                    <option value="C">C (Needs Practice)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Hifz Progress Portion</label>
                <input
                  type="text"
                  required
                  value={evalHifz}
                  onChange={(e) => setEvalHifz(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Teacher Remarks & Advice</label>
                <textarea
                  required
                  rows={2}
                  value={evalRemarks}
                  onChange={(e) => setEvalRemarks(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProgressModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#075B3A] text-white text-xs font-bold rounded-xl hover:bg-[#043A25]"
                >
                  Save Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
