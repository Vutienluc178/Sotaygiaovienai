
import React, { useState, useRef, useEffect } from 'react';
import { ClassGroup, Student, HomeroomTask, BehaviorRecord, UserSettings, StudentProfileImage, StudentWatchRecord, AcademicRecord, AssessmentWave } from '../types';
import { Icons } from '../constants';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { generateHomeroomAdvice, analyzeHomeroomClass } from '../services/geminiService';

interface HomeroomViewProps {
  classes: ClassGroup[];
  students: Student[];
  tasks: HomeroomTask[];
  records: BehaviorRecord[];
  profiles: StudentProfileImage[];
  watchList: StudentWatchRecord[];
  academicRecords: AcademicRecord[];
  onAddClass: (name: string) => void;
  onDeleteClass: (id: string) => void;
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onAddTask: (task: HomeroomTask) => void;
  onUpdateTask: (task: HomeroomTask) => void;
  onDeleteTask: (id: string) => void;
  onAddRecord: (record: BehaviorRecord) => void;
  onDeleteRecord: (id: string) => void;
  onAddProfile: (profile: StudentProfileImage) => void;
  onDeleteProfile: (id: string) => void;
  onAddWatch: (record: StudentWatchRecord) => void;
  onRemoveWatch: (id: string) => void;
  onUpdateWatchNote: (id: string, note: string) => void;
  onUpdateAcademic: (record: AcademicRecord) => void;
  onResetHomeroom: () => void;
  settings?: UserSettings;
}

interface Sticker {
  id: string;
  iconName: keyof typeof Icons;
  x: number;
  y: number;
  scale: number;
}

interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
}

// A4 Landscape Dimensions (Ratio ~1.414)
const CERT_WIDTH = 1920;
const CERT_HEIGHT = 1358; 

// 5 Common Colors for Certificates
const TEXT_COLORS = [
  { value: '#dc2626', label: 'Đỏ' },       
  { value: '#2563eb', label: 'Xanh' },     
  { value: '#d97706', label: 'Vàng Kim' }, 
  { value: '#16a34a', label: 'Xanh Lá' },  
  { value: '#9333ea', label: 'Tím' },      
];

// 10 Gợi ý khen thưởng
const HONOR_SUGGESTIONS = [
  "Đạt thành tích xuất sắc trong học tập và rèn luyện",
  "Có nhiều tiến bộ vượt bậc trong học tập",
  "Tích cực tham gia các phong trào của lớp và trường",
  "Đạt điểm cao nhất trong kỳ thi vừa qua",
  "Luôn chăm ngoan, lễ phép và giúp đỡ bạn bè",
  "Hoàn thành xuất sắc nhiệm vụ ban cán sự lớp",
  "Đạt giải cao trong kỳ thi học sinh giỏi",
  "Có tinh thần vượt khó vươn lên trong học tập",
  "Gương mẫu đi đầu trong mọi hoạt động",
  "Đóng góp tích cực vào xây dựng tập thể lớp vững mạnh"
];

// Môn học mặc định
const SUBJECTS = ['Toán', 'Văn', 'Anh', 'Lý', 'Hóa', 'Sinh', 'Sử', 'Địa', 'GDCD', 'Tin', 'CN'];

// Assessment Waves Configuration
const WAVES: { id: AssessmentWave; label: string; prev: AssessmentWave | null }[] = [
  { id: 'DOT1', label: 'Đợt 1', prev: null },
  { id: 'DOT2', label: 'Đợt 2', prev: 'DOT1' },
  { id: 'DOT3', label: 'Đợt 3', prev: 'DOT2' },
  { id: 'DOT4', label: 'Đợt 4', prev: 'DOT3' },
  { id: 'DOT5', label: 'Đợt 5', prev: 'DOT4' },
];

const STICKER_LIST: (keyof typeof Icons)[] = [
  'Star', 'Heart', 'Smile', 'Balloon', 'Sun', 'Rocket', 'Bear', 'Flower', 'Trophy', 'Medal',
  'FlowerTulip', 'FlowerDaisy', 'MedalRibbon', 'MedalStar', 'BadgeShield', 'BadgeCheck',
  'StarSparkle', 'LeafOak', 'Butterfly', 'Firework'
];

export const HomeroomView: React.FC<HomeroomViewProps> = ({
  classes, students, tasks, records, profiles, watchList, academicRecords,
  onAddClass, onDeleteClass,
  onAddStudent, onUpdateStudent, onDeleteStudent,
  onAddTask, onUpdateTask, onDeleteTask,
  onAddRecord, onDeleteRecord,
  onAddProfile, onDeleteProfile,
  onAddWatch, onRemoveWatch, onUpdateWatchNote,
  onUpdateAcademic,
  onResetHomeroom,
  settings
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(classes[0]?.id || null);
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'PLAN' | 'BEHAVIOR' | 'HONOR' | 'WATCHLIST' | 'ACADEMIC'>('STUDENTS');
  
  // Modals
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [showCompleteTask, setShowCompleteTask] = useState(false);
  const [showHonorPreview, setShowHonorPreview] = useState(false);
  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [showAddToWatchModal, setShowAddToWatchModal] = useState(false);
  const [showAcademicModal, setShowAcademicModal] = useState(false);
  
  // New Modal for Detailed Student View
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  
  // AI Advisor State
  const [showAIAdvisor, setShowAIAdvisor] = useState(false);
  const [advisorQuery, setAdvisorQuery] = useState('');
  const [advisorResponse, setAdvisorResponse] = useState('');
  const [isAdvisorLoading, setIsAdvisorLoading] = useState(false);

  // Class Analysis State
  const [showClassAnalysis, setShowClassAnalysis] = useState(false);
  const [classAnalysisFocus, setClassAnalysisFocus] = useState('');
  const [classAnalysisResult, setClassAnalysisResult] = useState('');
  const [isClassAnalysisLoading, setIsClassAnalysisLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const excelScoreInputRef = useRef<HTMLInputElement>(null);

  // Filtered Data
  const currentStudents = students.filter(s => s.classId === selectedClassId);
  const currentTasks = tasks.filter(t => t.classId === selectedClassId);
  const currentRecords = records.filter(r => r.classId === selectedClassId);
  const currentClass = classes.find(c => c.id === selectedClassId);
  const currentWatchList = watchList.filter(w => currentStudents.find(s => s.id === w.studentId));

  // Forms State
  const [newClassName, setNewClassName] = useState('');
  const [studentForm, setStudentForm] = useState<Partial<Student>>({ gender: 'Nam' });
  const [taskForm, setTaskForm] = useState<Partial<HomeroomTask>>({ isImportant: false, isCompleted: false });
  const [recordForm, setRecordForm] = useState<Partial<BehaviorRecord>>({ type: 'VIOLATION' });
  
  // Watch List Add Form
  const [watchStudentId, setWatchStudentId] = useState('');
  const [watchNote, setWatchNote] = useState('');

  // Academic Form State
  const [academicStudentId, setAcademicStudentId] = useState('');
  const [academicTerm, setAcademicTerm] = useState<AssessmentWave>('DOT1');
  const [academicScores, setAcademicScores] = useState<{ [key: string]: string }>({});

  // Profile Upload Form State
  const [profileDescription, setProfileDescription] = useState('');

  // Classroom Sync State
  const [classroomCourses, setClassroomCourses] = useState<ClassroomCourse[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [isBatchExporting, setIsBatchExporting] = useState(false);

  // Plan Summary State
  const [planSubTab, setPlanSubTab] = useState<'ACTIVE' | 'ARCHIVE'>('ACTIVE');
  const [summaryFrom, setSummaryFrom] = useState(new Date().toISOString().split('T')[0]);
  const [summaryTo, setSummaryTo] = useState(new Date().toISOString().split('T')[0]);

  // --- HONOR CERTIFICATE STATE ---
  const [honorSchool, setHonorSchool] = useState('Trường THPT Nguyễn Hữu Cảnh');
  const [honorTeacher, setHonorTeacher] = useState('Vũ Tiến Lực');
  const [honorTeacherTitle, setHonorTeacherTitle] = useState('GIÁO VIÊN CHỦ NHIỆM');
  const [honorLocation, setHonorLocation] = useState('TP. Hồ Chí Minh');
  const [honorStudentId, setHonorStudentId] = useState('');
  const [honorClass, setHonorClass] = useState(currentClass?.name || '');
  const [honorWeekMonth, setHonorWeekMonth] = useState('KHEN THƯỞNG TUẦN 1');
  const [honorTitle, setHonorTitle] = useState('Chứng nhận học sinh tiêu biểu');
  const [honorReason, setHonorReason] = useState('Đạt thành tích xuất sắc trong học tập và rèn luyện');
  const [honorDate, setHonorDate] = useState(new Date().toISOString().split('T')[0]);
  const [honorTemplate, setHonorTemplate] = useState<number>(1);
  const [honorBgImage, setHonorBgImage] = useState<string>('');
  const [honorLogo, setHonorLogo] = useState<string>('');
  const [honorStudentImage, setHonorStudentImage] = useState<string>('');
  const [honorFrameId, setHonorFrameId] = useState<number>(1);
  const [honorFontId, setHonorFontId] = useState<number>(1);
  const [honorTextColor, setHonorTextColor] = useState<string>('#dc2626');
  const [honorSchoolPosition, setHonorSchoolPosition] = useState<'LEFT' | 'CENTER'>('LEFT');
  
  // Sticker State
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [draggingStickerId, setDraggingStickerId] = useState<string | null>(null);
  
  // Derived state to fix the error
  const selectedSticker = stickers.find(s => s.id === selectedStickerId);
  
  const certRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // -- HANDLERS --

  useEffect(() => {
    if (selectedClassId && !classes.find(c => c.id === selectedClassId)) {
      setSelectedClassId(classes[0]?.id || null);
    }
  }, [classes, selectedClassId]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.clientWidth;
        const scale = parentWidth / CERT_WIDTH;
        setPreviewScale(scale);
      } else if (window.innerWidth < 1024 && showHonorPreview) {
         const availableWidth = window.innerWidth - 32; 
         const scale = availableWidth / CERT_WIDTH;
         setPreviewScale(scale);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    if (activeTab === 'HONOR' || showHonorPreview) {
        setTimeout(handleResize, 100);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab, showHonorPreview, containerRef.current]);

  const handleAddClass = () => {
    if(newClassName.trim()) {
      onAddClass(newClassName);
      setNewClassName('');
      setShowAddClass(false);
    }
  };

  const handleSaveStudent = () => {
    if(studentForm.name && selectedClassId) {
      if(studentForm.id) {
        onUpdateStudent(studentForm as Student);
      } else {
        onAddStudent({
          ...studentForm,
          id: `stu-${Date.now()}`,
          classId: selectedClassId,
          dob: studentForm.dob || '',
          gender: studentForm.gender || 'Nam',
          name: studentForm.name
        } as Student);
      }
      setShowAddStudent(false);
      setStudentForm({ gender: 'Nam' });
    }
  };

  const handleSaveTask = () => {
    if(taskForm.title && selectedClassId) {
      onAddTask({
        ...taskForm,
        id: `hr-task-${Date.now()}`,
        classId: selectedClassId,
        isCompleted: false,
        isImportant: taskForm.isImportant || false,
        deadline: taskForm.deadline || new Date().toISOString().split('T')[0],
        assignee: taskForm.assignee || '',
        note: taskForm.note || ''
      } as HomeroomTask);
      setShowAddTask(false);
      setTaskForm({ isImportant: false });
    }
  };

  const handleCompleteTask = () => {
    if(taskForm.id && taskForm.result) {
       onUpdateTask({
         ...taskForm as HomeroomTask,
         isCompleted: true,
         result: taskForm.result,
         completedDate: new Date().toISOString().split('T')[0]
       });
       setShowCompleteTask(false);
       setTaskForm({});
    }
  };

  const handleSaveRecord = () => {
    if(recordForm.studentId && recordForm.description && selectedClassId) {
      if (recordForm.studentId === 'ALL') {
         if (window.confirm(`Bạn có chắc muốn ghi nhận nội dung này cho ${currentStudents.length} học sinh không?`)) {
            currentStudents.forEach((student, index) => {
               onAddRecord({
                  ...recordForm,
                  id: `rec-${Date.now()}-${index}`,
                  classId: selectedClassId,
                  studentId: student.id,
                  date: new Date().toISOString()
               } as BehaviorRecord);
            });
         }
      } else {
         onAddRecord({
           ...recordForm,
           id: `rec-${Date.now()}`,
           classId: selectedClassId,
           date: new Date().toISOString()
         } as BehaviorRecord);
      }
      setShowAddRecord(false);
      setRecordForm({ type: 'VIOLATION' });
    }
  };

  const handleAddToWatchList = () => {
    if (watchStudentId && selectedClassId) {
      onAddWatch({
        id: `watch-${Date.now()}`,
        studentId: watchStudentId,
        classId: selectedClassId,
        note: watchNote,
        createdAt: new Date().toISOString()
      });
      setWatchStudentId('');
      setWatchNote('');
      setShowAddToWatchModal(false);
    }
  };

  // --- ACADEMIC LOGIC ---

  const openAcademicModal = (studentId: string) => {
    setAcademicStudentId(studentId);
    const existing = academicRecords.find(r => r.studentId === studentId && r.term === academicTerm);
    setAcademicScores(existing?.subjects || {});
    setShowAcademicModal(true);
  };

  const calculateRank = (avg: number) => {
    if (avg >= 8.0) return 'Giỏi';
    if (avg >= 6.5) return 'Khá';
    if (avg >= 5.0) return 'TB';
    if (avg >= 3.5) return 'Yếu';
    return 'Kém';
  };

  const handleSaveAcademic = () => {
    if (!academicStudentId || !selectedClassId) return;

    const scores = Object.values(academicScores).map(s => parseFloat(s)).filter(n => !isNaN(n));
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    
    const record: AcademicRecord = {
      id: `acad-${academicStudentId}-${academicTerm}`,
      studentId: academicStudentId,
      classId: selectedClassId,
      term: academicTerm,
      subjects: academicScores,
      average: parseFloat(avg.toFixed(1)),
      ranking: calculateRank(avg),
      updatedAt: new Date().toISOString()
    };

    onUpdateAcademic(record);
    setShowAcademicModal(false);
  };

  const handleAskAIAdvisor = async () => {
    if (!activeStudent || !settings?.geminiApiKey) {
       if (!settings?.geminiApiKey) alert("Vui lòng nhập Gemini API Key trong Cài đặt trước.");
       return;
    }

    setIsAdvisorLoading(true);
    setAdvisorResponse('');
    
    try {
       // 1. Gather Student Context
       const sRecords = currentRecords.filter(r => r.studentId === activeStudent.id);
       const sAcademic = academicRecords.filter(r => r.studentId === activeStudent.id);
       const violationCount = sRecords.filter(r => r.type === 'VIOLATION').length;
       const rewardCount = sRecords.filter(r => r.type === 'REWARD').length;
       
       const context = `
       - Họ tên: ${activeStudent.name} (${activeStudent.gender}, ${activeStudent.dob})
       - Lớp: ${currentClass?.name}
       - Hạnh kiểm: ${violationCount} vi phạm, ${rewardCount} khen thưởng.
       - Ghi chú vi phạm gần nhất: ${sRecords.filter(r => r.type === 'VIOLATION').slice(0, 3).map(r => r.description).join('; ')}
       - Học lực gần nhất: ${sAcademic.length > 0 ? `ĐTB ${sAcademic[sAcademic.length-1].average} (${sAcademic[sAcademic.length-1].ranking})` : 'Chưa có dữ liệu'}
       `;

       const advice = await generateHomeroomAdvice(
          settings.geminiApiKey,
          activeStudent.name,
          context,
          advisorQuery || "Học sinh này cần lưu ý gì? Xin lời khuyên chung."
       );
       
       setAdvisorResponse(advice);
    } catch (error: any) {
       setAdvisorResponse(`Lỗi: ${error.message}`);
    } finally {
       setIsAdvisorLoading(false);
    }
  };

  const handleAnalyzeClass = async () => {
    if (!currentClass || !settings?.geminiApiKey) {
       if (!settings?.geminiApiKey) alert("Vui lòng nhập Gemini API Key trong Cài đặt trước.");
       return;
    }

    setIsClassAnalysisLoading(true);
    setClassAnalysisResult('');
    
    try {
       // 1. Gather Class Data
       const totalStudents = currentStudents.length;
       const totalViolations = currentRecords.filter(r => r.type === 'VIOLATION').length;
       const totalRewards = currentRecords.filter(r => r.type === 'REWARD').length;
       
       // Academic Summary
       const academicSummary = currentStudents.map(s => {
          const recs = academicRecords.filter(r => r.studentId === s.id);
          const lastRec = recs[recs.length - 1];
          return lastRec ? `${s.name}: ${lastRec.average} (${lastRec.ranking})` : null;
       }).filter(Boolean).join('; ');

       // Behavior Summary (Top violators)
       const violationCounts: {[key: string]: number} = {};
       currentRecords.filter(r => r.type === 'VIOLATION').forEach(r => {
          violationCounts[r.studentId] = (violationCounts[r.studentId] || 0) + 1;
       });
       const topViolators = Object.entries(violationCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([id, count]) => {
             const s = currentStudents.find(stu => stu.id === id);
             return s ? `${s.name} (${count} lỗi)` : null;
          }).filter(Boolean).join(', ');

       const classData = `
       - Lớp: ${currentClass.name}
       - Sĩ số: ${totalStudents}
       - Tổng vi phạm: ${totalViolations}
       - Tổng khen thưởng: ${totalRewards}
       - Top học sinh vi phạm nhiều: ${topViolators || 'Không có'}
       - Kết quả học tập gần nhất (một số em): ${academicSummary || 'Chưa có dữ liệu'}
       `;

       const analysis = await analyzeHomeroomClass(
          settings.geminiApiKey,
          currentClass.name,
          classData,
          classAnalysisFocus
       );
       
       setClassAnalysisResult(analysis);
    } catch (error: any) {
       setClassAnalysisResult(`Lỗi: ${error.message}`);
    } finally {
       setIsClassAnalysisLoading(false);
    }
  };

  const handleImportAcademicExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClassId) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, {type:'binary'});
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, {header: 1}) as any[][];
      
      // Expected Format: Name | Math | Lit | Eng ...
      const headers = (data[0] || []) as any[]; // Assuming row 0 is header
      let importedCount = 0;

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[0]) continue;
        const studentName = String(row[0]).trim().toLowerCase();
        
        // Find matching student
        const student = currentStudents.find(s => s.name.toLowerCase() === studentName);
        if (student) {
           const newScores: { [key: string]: string } = {};
           
           // Iterate through columns (skipping name)
           for (let j = 1; j < row.length; j++) {
              const headerVal = headers[j];
              const subjectName = String(headerVal).trim();
              const score = row[j] !== undefined ? String(row[j]) : '';
              if (SUBJECTS.includes(subjectName) || score) {
                 newScores[subjectName] = score; // Allow custom subjects from excel
              }
           }

           const validScores = Object.values(newScores).map(s => parseFloat(s)).filter(n => !isNaN(n));
           const avg = validScores.length > 0 ? validScores.reduce((a,b)=>a+b,0)/validScores.length : 0;

           const record: AcademicRecord = {
              id: `acad-${student.id}-${academicTerm}`,
              studentId: student.id,
              classId: selectedClassId,
              term: academicTerm,
              subjects: newScores,
              average: parseFloat(avg.toFixed(1)),
              ranking: calculateRank(avg),
              updatedAt: new Date().toISOString()
           };
           onUpdateAcademic(record);
           importedCount++;
        }
      }
      alert(`Đã nhập điểm cho ${importedCount} học sinh vào ${WAVES.find(w=>w.id===academicTerm)?.label}!`);
      if (excelScoreInputRef.current) excelScoreInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleExportAcademicExcel = () => {
    const prevWaveId = WAVES.find(w => w.id === academicTerm)?.prev;
    
    const data = currentStudents.map(s => {
       const r = academicRecords.find(ar => ar.studentId === s.id && ar.term === academicTerm);
       const prevR = prevWaveId ? academicRecords.find(ar => ar.studentId === s.id && ar.term === prevWaveId) : null;
       
       const row: any = { 'Họ và Tên': s.name };
       SUBJECTS.forEach(sub => {
          row[sub] = r?.subjects[sub] || '';
       });
       row['ĐTB'] = r?.average || '';
       row['Xếp loại'] = r?.ranking || '';
       
       if (prevR && r) {
          const diff = (r.average - prevR.average).toFixed(1);
          row['So với đợt trước'] = parseFloat(diff) > 0 ? `Tăng ${diff}` : (parseFloat(diff) < 0 ? `Giảm ${Math.abs(parseFloat(diff))}` : 'Giữ nguyên');
       }

       return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Diem_${academicTerm}`);
    XLSX.writeFile(wb, `Bang_Diem_${currentClass?.name}_${academicTerm}.xlsx`);
  };

  // Generate Analysis and Record to Behavior
  const handleGenerateAnalysis = () => {
    const prevWaveId = WAVES.find(w => w.id === academicTerm)?.prev;
    if (!prevWaveId) {
       alert("Đây là đợt đầu tiên, chưa có dữ liệu để so sánh.");
       return;
    }

    if (!window.confirm(`Hệ thống sẽ tự động phân tích điểm ${WAVES.find(w=>w.id===academicTerm)?.label} so với ${WAVES.find(w=>w.id===prevWaveId)?.label} và ghi vào sổ thi đua. Tiếp tục?`)) return;

    let count = 0;
    currentStudents.forEach(s => {
       const r = academicRecords.find(ar => ar.studentId === s.id && ar.term === academicTerm);
       const prevR = academicRecords.find(ar => ar.studentId === s.id && ar.term === prevWaveId);

       if (r && prevR) {
          const diff = r.average - prevR.average;
          let note = '';
          let type: 'REWARD' | 'VIOLATION' = 'REWARD'; // Default positive/neutral

          // Analyze subjects
          const improvedSubjects: string[] = [];
          const declinedSubjects: string[] = [];
          
          SUBJECTS.forEach(sub => {
             const s1 = parseFloat(r.subjects[sub] || '0');
             const s2 = parseFloat(prevR.subjects[sub] || '0');
             if (s1 > s2 + 1) improvedSubjects.push(sub); // Improved significantly
             if (s1 < s2 - 1) declinedSubjects.push(sub); // Declined significantly
          });

          if (diff >= 0.5) {
             note = `Tiến bộ học tập ${academicTerm}: ĐTB tăng ${diff.toFixed(1)}đ. ${improvedSubjects.length > 0 ? `Tiến bộ môn: ${improvedSubjects.join(', ')}.` : ''}`;
             type = 'REWARD';
          } else if (diff <= -0.5) {
             note = `Sa sút học tập ${academicTerm}: ĐTB giảm ${Math.abs(diff).toFixed(1)}đ. ${declinedSubjects.length > 0 ? `Sa sút môn: ${declinedSubjects.join(', ')}.` : ''} Cần cố gắng hơn.`;
             type = 'VIOLATION'; // Warning color
          } else {
             return; // No significant change, skip recording
          }

          onAddRecord({
             id: `auto-anal-${Date.now()}-${s.id}`,
             studentId: s.id,
             classId: selectedClassId!,
             type: type,
             description: note,
             date: new Date().toISOString()
          });
          count++;
       }
    });
    alert(`Đã tạo ${count} ghi chú phân tích vào sổ thi đua.`);
  };

  // Helper to render score with color and trend
  const renderScoreCell = (scoreStr: string | undefined, prevScoreStr: string | undefined) => {
     if (!scoreStr) return <span className="text-slate-300">-</span>;
     const score = parseFloat(scoreStr);
     const prevScore = prevScoreStr ? parseFloat(prevScoreStr) : NaN;
     
     let colorClass = 'text-slate-800';
     if (score < 5.0) colorClass = 'text-purple-600 font-bold'; // Low score purple
     
     let trendIcon = null;
     if (!isNaN(prevScore)) {
        if (score > prevScore) {
           colorClass = 'text-green-600 font-bold';
           trendIcon = <span className="text-[10px] ml-1">▲</span>;
        } else if (score < prevScore) {
           colorClass = 'text-red-500 font-bold';
           trendIcon = <span className="text-[10px] ml-1">▼</span>;
        }
     }

     return (
        <span className={colorClass}>
           {score} {trendIcon}
        </span>
     );
  };

  const handleImportStudents = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file || !selectedClassId) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, {type:'binary'});
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, {header: 1}) as any[][];
      
      let count = 0;
      for(let i=1; i<data.length; i++) {
        const row = data[i];
        if(!row[0]) continue;
        onAddStudent({
          id: `stu-imp-${Date.now()}-${i}`,
          classId: selectedClassId,
          name: row[0],
          gender: row[1] === 'Nữ' ? 'Nữ' : 'Nam',
          dob: row[2] || '',
          phone: row[3] || '',
          address: row[4] || ''
        });
        count++;
      }
      alert(`Đã thêm ${count} học sinh!`);
    };
    reader.readAsBinaryString(file);
  };

  const fetchClassroomCourses = async () => {
    if (!settings?.googleAccessToken) {
      alert("Chưa có Access Token! Vui lòng vào Cài đặt để nhập Token Google.");
      return;
    }

    setIsSyncing(true);
    setSyncError('');
    try {
      const response = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
        headers: {
          'Authorization': `Bearer ${settings.googleAccessToken}`,
        },
      });

      if (!response.ok) throw new Error('Lỗi kết nối Google Classroom. Kiểm tra Token.');

      const data = await response.json();
      if (data.courses) {
        setClassroomCourses(data.courses);
        setShowClassroomModal(true);
      } else {
        setSyncError('Không tìm thấy lớp học nào đang hoạt động.');
        setShowClassroomModal(true);
      }
    } catch (err: any) {
      setSyncError(err.message || 'Lỗi khi tải danh sách lớp.');
      setShowClassroomModal(true);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportFromClassroom = async (courseId: string) => {
    if (!selectedClassId || !settings?.googleAccessToken) return;

    setIsSyncing(true);
    try {
      const response = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/students`, {
        headers: {
          'Authorization': `Bearer ${settings.googleAccessToken}`,
        },
      });

      if (!response.ok) throw new Error('Không thể tải danh sách học sinh. Kiểm tra quyền truy cập (Scope).');

      const data = await response.json();
      if (data.students && data.students.length > 0) {
        let addedCount = 0;
        data.students.forEach((s: any) => {
           onAddStudent({
             id: `stu-class-${s.userId}`,
             classId: selectedClassId,
             name: s.profile?.name?.fullName || 'Unknown Student',
             gender: 'Nam',
             dob: '',
             phone: ''
           });
           addedCount++;
        });
        alert(`Đã đồng bộ ${addedCount} học sinh từ Classroom!`);
        setShowClassroomModal(false);
      } else {
        alert("Lớp học này chưa có học sinh nào.");
      }
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const downloadStudentTemplate = () => {
    const headers = [['Họ và Tên', 'Giới tính (Nam/Nữ)', 'Ngày sinh (DD/MM/YYYY)', 'SĐT Phụ Huynh', 'Địa chỉ']];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Hoc_Sinh");
    XLSX.writeFile(wb, "Mau_Danh_Sach_Hoc_Sinh.xlsx");
  };

  const exportBehaviorReport = () => {
    const data = currentStudents.map(s => {
      const sRecords = currentRecords.filter(r => r.studentId === s.id);
      const rewards = sRecords.filter(r => r.type === 'REWARD').length;
      const violations = sRecords.filter(r => r.type === 'VIOLATION').length;
      return {
        'Họ Tên': s.name,
        'Khen Thưởng': rewards,
        'Vi Phạm': violations,
        'Tổng Kết': rewards - violations
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bao_Cao_Thi_Dua");
    XLSX.writeFile(wb, `Bao_Cao_Thi_Dua_${new Date().toLocaleDateString('vi-VN').replace(/\//g,'-')}.xlsx`);
  };

  const exportPlanSummary = () => {
    const filtered = currentTasks.filter(t => 
      t.isCompleted && t.completedDate &&
      t.completedDate >= summaryFrom && t.completedDate <= summaryTo
    );
    const data = filtered.map(t => ({
      'Tên phong trào': t.title,
      'Hạn chót': t.deadline,
      'Ngày hoàn thành': t.completedDate,
      'Người phân công': t.assignee,
      'Ghi chú': t.note,
      'Đánh giá kết quả': t.result
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tong_Ket_Phong_Trao");
    XLSX.writeFile(wb, `Tong_Ket_Phong_Trao_${summaryFrom}_${summaryTo}.xlsx`);
  };

  const getViolationStep = (count: number) => {
    if (count <= 0) return null;
    if (count === 1) return { step: 1, action: "Nhắc nhở", desc: "Đoàn trường, GVCN, GVBM ghi nhận và nhắc nhở học sinh không được tái phạm.", color: "bg-yellow-100 text-yellow-800" };
    if (count === 2) return { step: 2, action: "Viết bản kiểm điểm", desc: "Yêu cầu học sinh viết bản tự kiểm điểm, phê bình và phối hợp giáo dục.", color: "bg-orange-100 text-orange-800" };
    if (count === 3) return { step: 3, action: "Mời Phụ huynh", desc: "Lập biên bản, cam kết, mời PHHS vào trường thông báo.", color: "bg-red-100 text-red-800" };
    if (count === 4) return { step: 4, action: "Khiển trách trước lớp", desc: "Khiển trách trước lớp, thông báo cho PHHS.", color: "bg-rose-200 text-rose-900" };
    return { step: 5, action: "Hội đồng kỷ luật", desc: "Lập hồ sơ đề nghị hội đồng kỷ luật nhà trường xem xét.", color: "bg-red-600 text-white" };
  };

  const handleUploadProfileImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeStudent) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const url = evt.target?.result as string;
      onAddProfile({
        id: `profile-${Date.now()}`,
        studentId: activeStudent.id,
        url,
        description: profileDescription || `Tài liệu ngày ${new Date().toLocaleDateString('vi-VN')}`,
        date: new Date().toISOString()
      });
      setProfileDescription('');
      alert("Đã tải ảnh lên hồ sơ!");
    };
    reader.readAsDataURL(file);
  };

  const handleAddSticker = (iconName: keyof typeof Icons) => {
    const newSticker: Sticker = { id: `stick-${Date.now()}`, iconName, x: 50, y: 50, scale: 1 };
    setStickers(prev => [...prev, newSticker]);
    setSelectedStickerId(newSticker.id);
  };
  const handleRemoveSticker = (id: string) => { setStickers(prev => prev.filter(s => s.id !== id)); if (selectedStickerId === id) setSelectedStickerId(null); };
  const handleMouseDownSticker = (id: string, e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); setDraggingStickerId(id); setSelectedStickerId(id); };
  const handleUpdateStickerScale = (scale: number) => { if (selectedStickerId) setStickers(prev => prev.map(s => s.id === selectedStickerId ? { ...s, scale } : s)); };
  const handleMouseMovePreview = (e: React.MouseEvent) => {
    if (!draggingStickerId || !certRef.current) return;
    const rect = certRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / (rect.width)) * 100;
    const y = ((e.clientY - rect.top) / (rect.height)) * 100;
    setStickers(prev => prev.map(s => s.id === draggingStickerId ? { ...s, x, y } : s));
  };
  const handleMouseUpPreview = () => setDraggingStickerId(null);
  const handleBackgroundClick = () => setSelectedStickerId(null);
  const handleExportHonor = async (skipDownload = false) => {
    if (!certRef.current) return;
    const currentSelection = selectedStickerId;
    setSelectedStickerId(null);
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
      const element = certRef.current;
      const clone = element.cloneNode(true) as HTMLElement;
      const container = document.createElement('div');
      container.style.position = 'fixed'; container.style.top = '0'; container.style.left = '0';
      container.style.width = `${CERT_WIDTH}px`; container.style.height = `${CERT_HEIGHT}px`;
      container.style.opacity = '0'; container.style.zIndex = '-9999'; container.style.overflow = 'hidden';
      container.appendChild(clone); document.body.appendChild(container);
      const controls = clone.querySelectorAll('.sticker-controls'); controls.forEach(el => el.remove());
      const canvas = await html2canvas(clone, { scale: 3, useCORS: true, backgroundColor: null, logging: false, width: CERT_WIDTH, height: CERT_HEIGHT, windowWidth: CERT_WIDTH, windowHeight: CERT_HEIGHT, x: 0, y: 0 });
      if (!skipDownload) {
        const link = document.createElement('a');
        const studentName = currentStudents.find(s => s.id === honorStudentId)?.name || 'HocSinh';
        const cleanName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
        link.download = `VinhDanh_${cleanName}_${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      }
      document.body.removeChild(container);
      return canvas.toDataURL('image/png', 1.0);
    } catch (err) { console.error(err); } finally { setSelectedStickerId(currentSelection); }
  };
  const handleBatchExport = async () => {
    if (currentStudents.length === 0) { alert("Lớp chưa có học sinh nào."); return; }
    if (!window.confirm(`Bạn có chắc muốn xuất ${currentStudents.length} chứng nhận liên tiếp?`)) return;
    setIsBatchExporting(true); const originalStudentId = honorStudentId;
    try {
        for (const student of currentStudents) {
            setHonorStudentId(student.id); await new Promise(resolve => setTimeout(resolve, 600));
            const link = document.createElement('a'); const cleanName = student.name.replace(/[^a-zA-Z0-9]/g, '_');
            link.download = `VinhDanh_${cleanName}.png`; const dataUrl = await handleExportHonor(true);
            if (dataUrl) { link.href = dataUrl; link.click(); }
        } alert("Đã xuất xong!");
    } catch (e) { alert("Có lỗi."); } finally { setHonorStudentId(originalStudentId); setIsBatchExporting(false); }
  };
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) setHonorBgImage(URL.createObjectURL(file)); };
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) setHonorLogo(URL.createObjectURL(file)); };
  const handleStudentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) setHonorStudentImage(URL.createObjectURL(file)); };
  const getFontClass = (id: number) => { if (id === 2) return 'font-greatvibes'; if (id === 3) return 'font-satisfy'; return 'font-dancing'; };
  const LaurelWreathFrame = ({ id }: { id: number }) => (
    <div className="absolute inset-[-10%] z-20 pointer-events-none drop-shadow-lg">
       <svg viewBox="0 0 200 200" className="w-full h-full" overflow="visible">
          {id === 1 && (<><defs><linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fbbf24" /><stop offset="50%" stopColor="#d97706" /><stop offset="100%" stopColor="#f59e0b" /></linearGradient></defs><g transform="translate(100, 15)" fill="url(#goldGradient)"><path d="M0 -12 L3 -3 L12 -3 L5 3 L8 12 L0 7 L-8 12 L-5 3 L-12 -3 L-3 -3 Z" transform="translate(0, 0) scale(1)" /><path d="M0 -12 L3 -3 L12 -3 L5 3 L8 12 L0 7 L-8 12 L-5 3 L-12 -3 L-3 -3 Z" transform="translate(-25, 10) rotate(-20) scale(0.8)" /><path d="M0 -12 L3 -3 L12 -3 L5 3 L8 12 L0 7 L-8 12 L-5 3 L-12 -3 L-3 -3 Z" transform="translate(25, 10) rotate(20) scale(0.8)" /></g><g transform="translate(100, 100) scale(0.9)">{Array.from({length: 10}).map((_, i) => (<path key={`l-${i}`} d="M-50 60 Q-85 0 -40 -60 Q-40 0 -50 60" fill="url(#goldGradient)" transform={`rotate(${-150 + (i * 15)}) translate(0, -90) scale(0.3)`} />))}</g><g transform="translate(100, 100) scale(0.9) scale(-1, 1)">{Array.from({length: 10}).map((_, i) => (<path key={`r-${i}`} d="M-50 60 Q-85 0 -40 -60 Q-40 0 -50 60" fill="url(#goldGradient)" transform={`rotate(${-150 + (i * 15)}) translate(0, -90) scale(0.3)`} />))}</g><circle cx="100" cy="100" r="72" fill="none" stroke="url(#goldGradient)" strokeWidth="3" /></>)}
          {id === 2 && (<><defs><linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#22d3ee" /><stop offset="50%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient></defs><circle cx="100" cy="100" r="72" fill="none" stroke="url(#neonGradient)" strokeWidth="4" strokeDasharray="10 5" /><circle cx="100" cy="100" r="78" fill="none" stroke="url(#neonGradient)" strokeWidth="1.5" opacity="0.6" /><circle cx="100" cy="100" r="66" fill="none" stroke="url(#neonGradient)" strokeWidth="1" opacity="0.4" /><circle cx="100" cy="28" r="4" fill="#22d3ee" /><circle cx="100" cy="172" r="4" fill="#8b5cf6" /><circle cx="28" cy="100" r="4" fill="#3b82f6" /><circle cx="172" cy="100" r="4" fill="#3b82f6" /><path d="M70 165 L100 180 L130 165 L100 155 Z" fill="url(#neonGradient)" /></>)}
          {id === 3 && (<><defs><radialGradient id="royalGradient" cx="50%" cy="50%" r="50%"><stop offset="60%" stopColor="#fbbf24" /><stop offset="100%" stopColor="#b45309" /></radialGradient><linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fff" stopOpacity="0.8" /><stop offset="100%" stopColor="#fff" stopOpacity="0" /></linearGradient></defs><g transform="translate(100, 100)">{Array.from({length: 24}).map((_, i) => (<g key={i} transform={`rotate(${i * 15})`}><path d="M-1 -85 L0 -98 L1 -85 Z" fill="#f59e0b" /><path d="M-0.5 -82 L0 -90 L0.5 -82 Z" fill="#fff" opacity="0.6" /><circle cx="0" cy="-76" r="1.5" fill="#b45309" /></g>))}</g><circle cx="100" cy="100" r="74" fill="none" stroke="url(#royalGradient)" strokeWidth="5" /><circle cx="100" cy="100" r="70" fill="none" stroke="#fff" strokeWidth="1" /><path d="M26 100 Q 26 60 50 40 Q 80 20 100 24 Q 120 20 150 40 Q 174 60 174 100 Q 174 140 150 160 Q 120 180 100 176 Q 80 180 50 160 Q 26 140 26 100" fill="none" stroke="#fcd34d" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" /><path d="M50 150 Q100 180 150 150 L140 140 Q100 165 60 140 Z" fill="url(#royalGradient)" /><path d="M50 150 Q100 180 150 150" fill="none" stroke="#78350f" strokeWidth="1" /></>)}
       </svg>
    </div>
  );
  const renderHonorCert = () => {
    const studentName = currentStudents.find(s => s.id === honorStudentId)?.name || 'HocSinh';
    const dateObj = new Date(honorDate);
    const dateString = `ngày ${dateObj.getDate()} tháng ${dateObj.getMonth() + 1} năm ${dateObj.getFullYear()}`;
    const fullDateString = `${honorLocation}, ${dateString}`;
    const styles: Record<number, string> = { 1: 'bg-[#fffbf0] border-[16px] border-double border-yellow-500 text-slate-800', 2: 'bg-gradient-to-br from-blue-50 to-white border-[24px] border-blue-600 text-blue-900', 3: 'bg-white border-[12px] border-amber-400 ring-[8px] ring-amber-100 ring-inset text-slate-800', 4: 'bg-[#f0fff4] border-[16px] border-double border-green-600 text-green-900', 5: 'bg-white border-y-[40px] border-slate-900 text-slate-900 font-serif', 6: 'bg-gradient-to-r from-purple-100 to-pink-100 border-[8px] border-purple-500 text-purple-900', 7: 'bg-white border-[8px] border-red-600 outline outline-[8px] outline-offset-[8px] outline-red-600 text-red-900', 8: 'bg-gradient-to-b from-slate-900 to-slate-800 text-white border-[8px] border-yellow-400', 9: 'bg-[#fff0f5] border-[20px] border-pink-300 rounded-[3rem]', 10: 'bg-white border-[30px] border-teal-500 border-t-teal-300 border-r-teal-400 border-b-teal-600 border-l-teal-400', 11: 'bg-yellow-50 border-[8px] border-dashed border-orange-400 rounded-[2rem]', 12: 'bg-blue-50 border-[16px] border-dotted border-blue-400 rounded-[1.5rem]', 13: 'bg-pink-50 border-double border-[20px] border-pink-400 rounded-[3rem]', 14: 'bg-green-50 border-[12px] border-green-500 rounded-2xl shadow-[inset_0_0_40px_rgba(34,197,94,0.2)]', 15: 'bg-gradient-to-tr from-yellow-100 via-pink-100 to-blue-100 border-[8px] border-white ring-[8px] ring-purple-300', 16: 'bg-white border-[16px] border-indigo-400 border-t-indigo-200 border-b-indigo-600', 17: 'bg-[#fff] border-[10px] border-red-400 rounded-[60px] shadow-[0_0_0_20px_#fca5a5]', 18: 'bg-cyan-50 border-y-[40px] border-cyan-400 border-dashed', 19: 'bg-lime-50 border-[20px] border-lime-500 rounded-tl-[80px] rounded-br-[80px]', 20: 'bg-orange-50 border-[16px] border-orange-300 border-double rounded-[100px] p-20', };
    const isDark = honorTemplate === 8; const fontClass = getFontClass(honorFontId);
    let bgStyle: React.CSSProperties = { width: `${CERT_WIDTH}px`, height: `${CERT_HEIGHT}px`, flexShrink: 0 };
    if (honorBgImage) { bgStyle.backgroundImage = `url(${honorBgImage})`; bgStyle.backgroundSize = 'cover'; bgStyle.backgroundPosition = 'center'; }
    return (
      <div ref={certRef} className={`relative overflow-hidden flex flex-col ${!honorBgImage ? (styles[honorTemplate] || styles[1]) : ''} ${isDark ? 'text-white' : ''}`} style={bgStyle} onMouseDown={handleBackgroundClick} onMouseMove={handleMouseMovePreview} onMouseUp={handleMouseUpPreview} onMouseLeave={handleMouseUpPreview}>
         {stickers.map(s => { const SIcon = Icons[s.iconName as keyof typeof Icons]; const isSelected = selectedStickerId === s.id; return ( <div key={s.id} className={`absolute cursor-move z-20 group transition-transform ${isSelected ? 'z-30' : ''}`} style={{ left: `${s.x}%`, top: `${s.y}%`, transform: `translate(-50%, -50%) scale(${s.scale * 2})` }} onMouseDown={(e) => handleMouseDownSticker(s.id, e)} > <div className={`drop-shadow-md ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 rounded' : ''}`}> <div className="w-16 h-16"><SIcon /></div> </div> {isSelected && ( <button onClick={(e) => { e.stopPropagation(); handleRemoveSticker(s.id); }} className="sticker-controls absolute -top-4 -right-4 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md hover:bg-red-600" title="Xóa sticker" > &times; </button> )} </div> ) })}
         <div className="h-[75%] w-full flex flex-col items-center justify-center text-center relative z-10 p-12 border-b border-transparent pointer-events-none">
             <div className={`absolute top-28 z-20 max-w-[800px] flex flex-col ${ honorSchoolPosition === 'CENTER' ? 'left-1/2 -translate-x-1/2 items-center text-center' : 'left-20 items-start text-left' }`}> <p className={`uppercase text-4xl font-bold tracking-wide mb-2 font-['Roboto'] ${isDark ? 'text-white/90' : 'text-slate-800/90'}`}> {honorSchool} </p> <p className={`text-5xl font-black mb-4 font-['Roboto'] ${isDark ? 'text-white' : 'text-primary'}`}> Lớp: {honorClass} </p> {honorLogo && ( <img src={honorLogo} alt="Logo" className="h-32 w-auto object-contain drop-shadow-md mt-2" /> )} </div>
             <h1 className={`uppercase text-[8rem] font-black tracking-widest mb-8 leading-none font-['Roboto']`} style={{ color: honorTextColor }} > {honorWeekMonth} </h1>
             <div className="flex items-center justify-center w-full pointer-events-auto mt-4"> {honorStudentImage ? ( <div className="flex flex-row items-end justify-center gap-16 w-full px-10 relative"> <div className="relative w-80 h-80 flex items-center justify-center shrink-0 z-10"> <LaurelWreathFrame id={honorFrameId} /> <div className="w-[68%] h-[68%] rounded-full overflow-hidden border-4 border-white shadow-2xl z-10 bg-white relative"> <img src={honorStudentImage} className="w-full h-full object-cover" alt="Student" /> </div> </div> <div className="text-left flex flex-col justify-end h-80 pb-2 z-20 relative"> <div className="flex-1 flex items-center"> <h2 className={`${fontClass} text-[7rem] font-bold leading-none drop-shadow-sm ${isDark ? 'text-yellow-400' : 'text-slate-900'} relative mb-2 whitespace-nowrap`}> {studentName} </h2> </div> <p className="text-5xl font-black uppercase tracking-widest opacity-90 whitespace-nowrap mt-auto font-['Roboto']" style={{ color: honorTextColor }} > {honorTitle} </p> </div> </div> ) : ( <div className="flex flex-col items-center"> <div className="transform scale-[2.0] mb-6"> {honorTemplate === 1 && <div className="text-yellow-600"><Icons.Trophy /></div>} {honorTemplate === 2 && <div className="text-blue-500"><Icons.Award /></div>} {honorTemplate === 3 && <div className="text-amber-500"><Icons.Star filled /></div>} {honorTemplate === 4 && <div className="text-green-600"><Icons.Crown /></div>} {honorTemplate > 4 && honorTemplate <= 10 && <div className="text-primary"><Icons.Certificate /></div>} {honorTemplate > 10 && <div className="text-pink-500"><Icons.Smile /></div>} </div> <div className="w-full max-w-7xl px-4 mt-2"> <h2 className={`${fontClass} text-[6rem] font-bold mb-4 leading-tight drop-shadow-sm ${isDark ? 'text-yellow-400' : 'text-slate-900'}`}> {studentName} </h2> <p className="text-5xl font-black uppercase tracking-widest opacity-90 mt-2 pb-6 font-['Roboto']" style={{ color: honorTextColor }} > {honorTitle} </p> </div> </div> )} </div>
         </div>
         <div className="h-[25%] w-full flex flex-col justify-end px-24 pb-32 relative z-10 pointer-events-none"> <div className="flex justify-between items-end h-full relative"> <div className="w-[65%] flex flex-col justify-center h-full pr-8 pb-40"> <p className={`text-4xl italic font-bold leading-normal drop-shadow-sm font-['Roboto'] ${isDark ? 'text-slate-200' : 'text-slate-700'}`}> "{honorReason}" </p> </div> <div className="w-[35%] text-center flex flex-col justify-between h-full pt-4"> <div className="flex flex-col items-center pb-4"> <p className={`text-2xl font-bold italic mb-2 font-['Roboto'] ${isDark ? 'text-slate-300' : ''}`}>{fullDateString}</p> <p className="text-3xl font-black uppercase mb-4 font-['Roboto']">{honorTeacherTitle}</p> </div> <div className="pb-4"> <p className={`text-7xl font-bold whitespace-nowrap ${fontClass} ${isDark ? 'text-yellow-400' : 'text-slate-800'}`}> {honorTeacher} </p> </div> </div> </div> </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-white">
      {/* LEFT SIDEBAR (Desktop) / TOP BAR (Mobile) */}
      <div className="w-full md:w-64 md:border-r border-slate-200 flex flex-col bg-slate-50 shrink-0">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
             <Icons.Users /> Lớp Chủ Nhiệm
          </h2>
          <div className="flex gap-2">
             <button 
                onClick={onResetHomeroom}
                className="p-1.5 hover:bg-red-50 text-red-500 rounded-md transition-colors"
                title="Xóa toàn bộ dữ liệu"
             >
               <Icons.Trash />
             </button>
             <button 
              onClick={() => setShowAddClass(true)}
              className="p-1.5 hover:bg-slate-100 rounded-md text-primary" 
             >
              <Icons.Plus />
             </button>
          </div>
        </div>
        <div className="flex overflow-x-auto md:flex-col p-2 gap-2 scrollbar-hide border-b md:border-b-0 border-slate-100">
          {classes.map(cls => (
            <div 
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all shrink-0 min-w-[100px] md:w-full ${
                selectedClassId === cls.id 
                  ? 'bg-blue-100 text-primary border border-blue-200' 
                  : 'bg-white hover:bg-slate-100'
              }`}
            >
              <span className="font-medium truncate">{cls.name}</span>
              {selectedClassId === cls.id && (
                <button onClick={(e)=>{e.stopPropagation(); onDeleteClass(cls.id)}} className="text-red-400 hover:text-red-600 ml-2">
                  <Icons.Trash />
                </button>
              )}
            </div>
          ))}
          {classes.length === 0 && <div className="text-center p-2 text-xs text-slate-400">Thêm lớp +</div>}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
        {!selectedClassId ? (
          <div className="flex items-center justify-center h-full text-slate-400">Chọn lớp để bắt đầu</div>
        ) : (
          <>
            <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide shrink-0">
               <button 
                onClick={() => setActiveTab('STUDENTS')}
                className={`pb-2 border-b-2 font-bold whitespace-nowrap text-sm md:text-base ${activeTab === 'STUDENTS' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}
               >
                 DS Học sinh
               </button>
               <button 
                onClick={() => setActiveTab('PLAN')}
                className={`pb-2 border-b-2 font-bold whitespace-nowrap text-sm md:text-base ${activeTab === 'PLAN' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}
               >
                 Phong trào
               </button>
               <button 
                onClick={() => setActiveTab('BEHAVIOR')}
                className={`pb-2 border-b-2 font-bold whitespace-nowrap text-sm md:text-base ${activeTab === 'BEHAVIOR' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}
               >
                 Thi đua
               </button>
               <button 
                onClick={() => setActiveTab('WATCHLIST')}
                className={`pb-2 border-b-2 font-bold whitespace-nowrap text-sm md:text-base ${activeTab === 'WATCHLIST' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}
               >
                 Theo dõi
               </button>
               <button 
                onClick={() => setActiveTab('ACADEMIC')}
                className={`pb-2 border-b-2 font-bold whitespace-nowrap text-sm md:text-base ${activeTab === 'ACADEMIC' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}
               >
                 Học tập
               </button>
               <button 
                onClick={() => setActiveTab('HONOR')}
                className={`pb-2 border-b-2 font-bold whitespace-nowrap text-sm md:text-base flex items-center gap-1 ${activeTab === 'HONOR' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}
               >
                 <Icons.Award /> Vinh Danh
               </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
              {/* TAB 1: STUDENTS */}
              {activeTab === 'STUDENTS' && (
                <div className="space-y-4">
                  {/* ... (Existing code for Students Tab) ... */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <h3 className="font-bold text-lg text-slate-800">Danh sách học sinh ({currentStudents.length})</h3>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                       <button onClick={fetchClassroomCourses} className="flex-1 md:flex-none text-xs bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 flex items-center justify-center gap-1 shadow-sm">
                          <Icons.GoogleClassroom /> Classroom
                       </button>
                       <button onClick={downloadStudentTemplate} className="flex-1 md:flex-none text-xs bg-white border border-slate-300 px-3 py-2 rounded hover:bg-slate-50 flex items-center justify-center gap-1">
                          <Icons.Download /> Mẫu
                       </button>
                       <button onClick={() => fileInputRef.current?.click()} className="flex-1 md:flex-none text-xs bg-white border border-slate-300 px-3 py-2 rounded hover:bg-slate-50 flex items-center justify-center gap-1">
                          <Icons.Upload /> Excel
                       </button>
                       <input type="file" hidden ref={fileInputRef} onChange={handleImportStudents} accept=".xlsx,.csv" />
                       <button onClick={() => { setClassAnalysisFocus(''); setClassAnalysisResult(''); setShowClassAnalysis(true); }} className="flex-1 md:flex-none text-xs bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-3 py-2 rounded hover:from-purple-600 hover:to-indigo-600 flex items-center justify-center gap-1 shadow-sm">
                          <Icons.Bot /> Phân tích AI
                       </button>
                       <button onClick={() => {setStudentForm({gender:'Nam'}); setShowAddStudent(true)}} className="flex-1 md:flex-none text-xs bg-primary text-white px-3 py-2 rounded hover:bg-blue-600 flex items-center justify-center gap-1 shadow-sm">
                          <Icons.Plus /> Thêm HS
                       </button>
                    </div>
                  </div>
                  
                  {/* DESKTOP TABLE */}
                  <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                        <tr>
                          <th className="p-3">Họ Tên</th>
                          <th className="p-3">Giới tính</th>
                          <th className="p-3">Ngày sinh</th>
                          <th className="p-3">SĐT PH</th>
                          <th className="p-3 text-center">Ghi chú vi phạm</th>
                          <th className="p-3 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentStudents.map(s => {
                          const violationCount = currentRecords.filter(r => r.studentId === s.id && r.type === 'VIOLATION').length;
                          const violationStep = getViolationStep(violationCount);
                          
                          return (
                            <tr key={s.id} className="hover:bg-blue-50 cursor-pointer" onClick={() => setActiveStudent(s)}>
                               <td className="p-3 font-medium text-slate-800">{s.name}</td>
                               <td className="p-3">{s.gender}</td>
                               <td className="p-3">{s.dob}</td>
                               <td className="p-3">{s.phone}</td>
                               <td className="p-3 text-center">
                                  {violationStep && (
                                    <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${violationStep.color}`}>
                                      Lần {violationStep.step}: {violationStep.action}
                                    </span>
                                  )}
                               </td>
                               <td className="p-3 text-right flex justify-end gap-2">
                                 <button onClick={(e) => { e.stopPropagation(); setActiveStudent(s); }} className="text-purple-500 hover:bg-purple-50 p-1.5 rounded" title="Xem chi tiết"><Icons.List /></button>
                                 <button onClick={(e) => { e.stopPropagation(); setStudentForm(s); setShowAddStudent(true); }} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded"><Icons.Edit /></button>
                                 <button onClick={(e) => { e.stopPropagation(); onDeleteStudent(s.id); }} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Icons.Trash /></button>
                               </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE CARDS */}
                  <div className="md:hidden space-y-3">
                    {currentStudents.map(s => {
                       const violationCount = currentRecords.filter(r => r.studentId === s.id && r.type === 'VIOLATION').length;
                       const violationStep = getViolationStep(violationCount);
                       
                       return (
                         <div key={s.id} onClick={() => setActiveStudent(s)} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 relative">
                            <div className="flex justify-between items-start">
                               <div>
                                  <h4 className="font-bold text-slate-800 text-base">{s.name}</h4>
                                  <div className="flex gap-2 text-xs mt-1 text-slate-500">
                                     <span className={`px-2 py-0.5 rounded-full ${s.gender === 'Nam' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                                       {s.gender}
                                     </span>
                                     <span>{s.dob || 'Chưa có NS'}</span>
                                  </div>
                               </div>
                               <button onClick={(e) => {e.stopPropagation(); setStudentForm(s); setShowAddStudent(true)}} className="text-blue-500 p-2 bg-blue-50 rounded-full">
                                  <Icons.Edit />
                               </button>
                            </div>
                            
                            {violationStep && (
                                <div className={`mt-2 p-2 rounded text-xs border-l-4 ${violationStep.color.replace('text', 'border').split(' ')[0]} bg-slate-50`}>
                                   <span className="font-bold">⚠️ Vi phạm lần {violationStep.step}:</span> {violationStep.action}
                                </div>
                            )}

                            <button 
                              onClick={(e) => {e.stopPropagation(); onDeleteStudent(s.id)}} 
                              className="absolute bottom-4 right-4 text-slate-300 hover:text-red-500"
                            >
                               <Icons.Trash />
                            </button>
                         </div>
                       );
                    })}
                  </div>
                  {currentStudents.length === 0 && <div className="p-8 text-center text-slate-400">Chưa có học sinh.</div>}
                </div>
              )}

              {/* TAB 2: ACTIVITY PLAN */}
              {activeTab === 'PLAN' && (
                <div className="space-y-4">
                  {/* ... (Existing code for Plan Tab) ... */}
                  <div className="flex items-center gap-4 border-b border-slate-200 pb-2">
                     <button onClick={() => setPlanSubTab('ACTIVE')} className={`text-sm font-bold pb-2 ${planSubTab === 'ACTIVE' ? 'text-primary border-b-2 border-primary -mb-2.5' : 'text-slate-500'}`}>Đang thực hiện</button>
                     <button onClick={() => setPlanSubTab('ARCHIVE')} className={`text-sm font-bold pb-2 ${planSubTab === 'ARCHIVE' ? 'text-primary border-b-2 border-primary -mb-2.5' : 'text-slate-500'}`}>Lưu trữ & Tổng kết</button>
                  </div>
                  {planSubTab === 'ACTIVE' ? (
                     <>
                        <div className="flex justify-end">
                           <button onClick={() => {setTaskForm({isImportant:false}); setShowAddTask(true)}} className="bg-primary text-white px-3 py-2 rounded text-sm hover:bg-blue-600 flex items-center gap-1 shadow-sm"><Icons.Plus /> Thêm Phong trào</button>
                        </div>
                        <div className="grid gap-3">
                           {currentTasks.filter(t => !t.isCompleted).map(task => (
                              <div key={task.id} className={`bg-white p-4 rounded-xl border flex flex-col gap-2 shadow-sm ${task.isImportant ? 'border-l-4 border-l-yellow-400' : 'border-slate-200'}`}>
                                 <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-slate-800">{task.title}</h4>
                                    {task.isImportant && <div className="text-yellow-500"><Icons.Star filled /></div>}
                                 </div>
                                 <div className="text-xs text-slate-600 grid grid-cols-2 gap-2">
                                    <div className="flex items-center gap-1"><Icons.Calendar /> Hạn chót: {new Date(task.deadline).toLocaleDateString('vi-VN')}</div>
                                    <div className="flex items-center gap-1"><Icons.Users /> Người làm: {task.assignee || 'Chưa phân công'}</div>
                                 </div>
                                 {task.note && <div className="text-xs bg-slate-50 p-2 rounded text-slate-500 italic border border-slate-100 mt-1">"{task.note}"</div>}
                                 <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-50">
                                    <button onClick={() => onDeleteTask(task.id)} className="text-red-400 text-xs px-2 py-1 hover:bg-red-50 rounded">Xóa</button>
                                    <button onClick={() => { setTaskForm(task); setShowCompleteTask(true); }} className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-green-200 transition-colors"><Icons.CheckCircle /> Hoàn thành & Đánh giá</button>
                                 </div>
                              </div>
                           ))}
                           {currentTasks.filter(t => !t.isCompleted).length === 0 && <div className="text-center text-slate-400 py-8">Chưa có phong trào nào đang diễn ra.</div>}
                        </div>
                     </>
                  ) : (
                     <div className="space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                           <h4 className="font-bold text-sm text-slate-700 mb-3 uppercase flex items-center gap-2"><Icons.Table /> Bộ lọc tổng kết</h4>
                           <div className="flex flex-wrap gap-4 items-end">
                              <div><label className="text-xs font-bold text-slate-500 block mb-1">Từ ngày</label><input type="date" value={summaryFrom} onChange={e => setSummaryFrom(e.target.value)} className="border rounded px-2 py-1 text-sm" /></div>
                              <div><label className="text-xs font-bold text-slate-500 block mb-1">Đến ngày</label><input type="date" value={summaryTo} onChange={e => setSummaryTo(e.target.value)} className="border rounded px-2 py-1 text-sm" /></div>
                              <button onClick={exportPlanSummary} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 font-bold shadow-sm flex items-center gap-2"><Icons.Download /> Xuất Báo Cáo Excel</button>
                           </div>
                        </div>
                        <div className="space-y-3">
                           {currentTasks.filter(t => t.isCompleted && t.completedDate && t.completedDate >= summaryFrom && t.completedDate <= summaryTo).map(task => (
                              <div key={task.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 opacity-90">
                                 <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-slate-700 line-through decoration-slate-400">{task.title}</h4>
                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">Đã xong {task.completedDate}</span>
                                 </div>
                                 <div className="text-xs text-slate-500 mt-1">Người thực hiện: {task.assignee}</div>
                                 {task.result && <div className="mt-2 text-sm bg-white p-2 rounded border border-slate-200 text-slate-700"><span className="font-bold text-green-600 block text-xs uppercase mb-1">Kết quả đánh giá:</span>{task.result}</div>}
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
                </div>
              )}

              {/* TAB 3: BEHAVIOR */}
              {activeTab === 'BEHAVIOR' && (
                <div className="space-y-4">
                  {/* ... (Existing code for Behavior Tab) ... */}
                  <div className="flex justify-between items-center gap-2">
                    <h3 className="font-bold text-lg text-slate-800">Thi đua</h3>
                    <div className="flex gap-2">
                       <button onClick={exportBehaviorReport} className="bg-green-600 text-white px-2 py-2 rounded text-sm hover:bg-green-700 flex items-center gap-1 shadow-sm"><Icons.Table /> <span className="hidden md:inline">Báo Cáo</span></button>
                       <button onClick={() => {setRecordForm({type:'VIOLATION'}); setShowAddRecord(true)}} className="bg-primary text-white px-3 py-2 rounded text-sm hover:bg-blue-600 flex items-center gap-1 shadow-sm"><Icons.Plus /> Ghi nhận</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-3">
                        <h4 className="font-bold text-slate-600 text-sm uppercase">Nhật ký gần đây</h4>
                        {currentRecords.sort((a,b) => b.date.localeCompare(a.date)).map(rec => {
                           const st = currentStudents.find(s => s.id === rec.studentId);
                           return (
                             <div key={rec.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex gap-3">
                                <div className={`p-2 rounded-full h-fit flex items-center justify-center shrink-0 ${rec.type === 'REWARD' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>{rec.type === 'REWARD' ? <Icons.Award /> : <Icons.Alert />}</div>
                                <div className="flex-1 min-w-0">
                                   <div className="font-bold text-slate-800 text-sm truncate">{st?.name || 'Unknown'}</div>
                                   <div className="text-xs text-slate-600 italic mb-1 line-clamp-2">{rec.description}</div>
                                   <div className="text-[10px] text-slate-400">{new Date(rec.date).toLocaleString('vi-VN')}</div>
                                </div>
                                <button onClick={() => onDeleteRecord(rec.id)} className="text-slate-300 hover:text-red-500"><Icons.Trash /></button>
                             </div>
                           )
                        })}
                     </div>
                     <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 h-fit">
                        <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><Icons.Bot /> Thống kê</h4>
                        <div className="bg-white p-3 rounded border border-blue-100 text-sm">
                           <ul className="list-disc pl-4 text-slate-600 space-y-1">
                              <li>{currentRecords.filter(r => r.type === 'REWARD').length} lượt khen thưởng</li>
                              <li>{currentRecords.filter(r => r.type === 'VIOLATION').length} lượt vi phạm</li>
                           </ul>
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {/* TAB 5: WATCH LIST (NEW) */}
              {activeTab === 'WATCHLIST' && (
                <div className="space-y-4">
                   <div className="flex justify-between items-center gap-2">
                      <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Icons.Alert /> Danh sách theo dõi đặc biệt</h3>
                      <button 
                        onClick={() => setShowAddToWatchModal(true)} 
                        className="bg-primary text-white px-4 py-2 rounded text-sm hover:bg-blue-600 flex items-center gap-2 shadow-sm font-bold"
                      >
                         <Icons.Plus /> Thêm học sinh
                      </button>
                   </div>

                   <div className="grid grid-cols-1 gap-4">
                      {currentWatchList.length === 0 && (
                         <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                            <p>Chưa có học sinh nào trong danh sách theo dõi.</p>
                         </div>
                      )}
                      
                      {currentWatchList.map(watch => {
                         const student = currentStudents.find(s => s.id === watch.studentId);
                         if (!student) return null;
                         const violationCount = currentRecords.filter(r => r.studentId === student.id && r.type === 'VIOLATION').length;
                         const rewardCount = currentRecords.filter(r => r.studentId === student.id && r.type === 'REWARD').length;
                         const violationStep = getViolationStep(violationCount);

                         return (
                            <div key={watch.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                               {/* Student Info & Stats */}
                               <div className="flex-1 border-r border-slate-100 pr-4">
                                  <div className="flex justify-between items-start mb-2">
                                     <h4 className="font-bold text-lg text-slate-800">{student.name}</h4>
                                     <div className="text-xs text-slate-500">{student.gender} • {student.dob}</div>
                                  </div>
                                  
                                  <div className="flex gap-4 mb-2">
                                     <div className="bg-red-50 text-red-700 px-3 py-1 rounded text-xs font-bold border border-red-100">
                                        {violationCount} Vi phạm
                                     </div>
                                     <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded text-xs font-bold border border-yellow-100">
                                        {rewardCount} Khen thưởng
                                     </div>
                                  </div>

                                  {violationStep ? (
                                     <div className={`mt-2 p-2 rounded text-xs border-l-4 ${violationStep.color.replace('text', 'border').split(' ')[0]} bg-slate-50`}>
                                        <span className="font-bold">⚠️ Mức độ {violationStep.step}:</span> {violationStep.action}
                                     </div>
                                  ) : (
                                     <div className="mt-2 text-xs text-green-600 italic">Hạnh kiểm hiện tại ổn định.</div>
                                  )}
                               </div>

                               {/* Notes & Actions */}
                               <div className="flex-[2] flex flex-col">
                                  <label className="text-xs font-bold text-slate-500 mb-1">Ghi chú theo dõi riêng:</label>
                                  <textarea 
                                     className="w-full border p-2 rounded text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary outline-none flex-1 resize-none min-h-[80px]"
                                     placeholder="Ghi chú các vấn đề cần lưu ý, nhắc nhở..."
                                     value={watch.note}
                                     onChange={(e) => onUpdateWatchNote(watch.id, e.target.value)}
                                  />
                                  <div className="flex justify-end mt-2">
                                     <button 
                                       onClick={() => onRemoveWatch(watch.id)}
                                       className="text-red-500 hover:bg-red-50 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                                     >
                                        <Icons.Trash /> Xóa khỏi danh sách
                                     </button>
                                  </div>
                               </div>
                            </div>
                         );
                      })}
                   </div>
                </div>
              )}

              {/* TAB 6: ACADEMIC (NEW) */}
              {activeTab === 'ACADEMIC' && (
                <div className="space-y-6">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-4">
                         <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Icons.Certificate /> Học tập & Điểm số</h3>
                         <div className="flex bg-slate-100 rounded p-1 text-xs font-bold overflow-x-auto">
                            {WAVES.map(w => (
                               <button 
                                 key={w.id}
                                 onClick={() => setAcademicTerm(w.id)} 
                                 className={`px-3 py-1 rounded whitespace-nowrap ${academicTerm === w.id ? 'bg-white shadow text-primary font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                               >
                                  {w.label}
                               </button>
                            ))}
                         </div>
                      </div>
                      
                      {/* Excel Tools */}
                      <div className="flex flex-wrap gap-2 w-full md:w-auto">
                         <button 
                           onClick={() => excelScoreInputRef.current?.click()}
                           className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 hover:bg-green-700 shadow-sm"
                         >
                            <Icons.Upload /> Nhập Excel
                         </button>
                         <input type="file" hidden ref={excelScoreInputRef} accept=".xlsx,.xls,.csv" onChange={handleImportAcademicExcel} />
                         
                         <button 
                           onClick={handleExportAcademicExcel}
                           className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 hover:bg-slate-50 shadow-sm"
                         >
                            <Icons.Download /> Xuất Thống Kê
                         </button>

                         <button 
                           onClick={handleGenerateAnalysis}
                           className="bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 hover:bg-purple-700 shadow-sm"
                           title="Tự động phân tích so với đợt trước và ghi sổ thi đua"
                         >
                            <Icons.Bot /> Phân tích & Ghi sổ
                         </button>
                      </div>
                   </div>

                   {/* Stats & Charts */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                         <h4 className="font-bold text-sm text-slate-700 mb-4 flex items-center gap-2">📊 Phân phối học lực ({WAVES.find(w=>w.id===academicTerm)?.label})</h4>
                         <div className="flex items-end justify-around h-32 px-4 gap-2">
                            {['Giỏi', 'Khá', 'TB', 'Yếu', 'Kém'].map(rank => {
                               const count = currentStudents.filter(s => {
                                  const r = academicRecords.find(ar => ar.studentId === s.id && ar.term === academicTerm);
                                  return r?.ranking === rank;
                               }).length;
                               const percent = currentStudents.length > 0 ? (count / currentStudents.length) * 100 : 0;
                               const color = rank === 'Giỏi' ? 'bg-green-500' : rank === 'Khá' ? 'bg-blue-500' : rank === 'TB' ? 'bg-yellow-500' : 'bg-red-500';
                               return (
                                  <div key={rank} className="flex flex-col items-center gap-1 w-full group">
                                     <div className="text-xs font-bold text-slate-600">{count}</div>
                                     <div className={`w-full rounded-t ${color} transition-all relative group-hover:opacity-80`} style={{ height: `${Math.max(percent, 5)}%` }}></div>
                                     <div className="text-[10px] font-bold text-slate-500">{rank}</div>
                                  </div>
                               )
                            })}
                         </div>
                      </div>

                      {/* Warnings */}
                      <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                         <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2"><Icons.Alert /> Cảnh báo học sinh yếu</h4>
                         <div className="space-y-2 max-h-32 overflow-y-auto">
                            {currentStudents.filter(s => {
                               const r = academicRecords.find(ar => ar.studentId === s.id && ar.term === academicTerm);
                               return r && (r.average < 5.0 || Object.values(r.subjects).some(score => parseFloat(score) < 3.5));
                            }).length === 0 && <p className="text-xs text-red-400 italic">Không có học sinh nào cần cảnh báo.</p>}
                            
                            {currentStudents.filter(s => {
                               const r = academicRecords.find(ar => ar.studentId === s.id && ar.term === academicTerm);
                               return r && (r.average < 5.0 || Object.values(r.subjects).some(score => parseFloat(score) < 3.5));
                            }).map(s => {
                               const r = academicRecords.find(ar => ar.studentId === s.id && ar.term === academicTerm);
                               return (
                                  <div key={s.id} className="bg-white p-2 rounded border border-red-100 flex justify-between items-center text-xs">
                                     <span className="font-bold text-slate-700">{s.name}</span>
                                     <span className="text-red-600 font-bold">TB: {r?.average}</span>
                                  </div>
                               )
                            })}
                         </div>
                      </div>
                   </div>

                   {/* Grade List */}
                   <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                           <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase">
                              <tr>
                                 <th className="p-3">Họ Tên</th>
                                 <th className="p-3 text-center">Toán</th>
                                 <th className="p-3 text-center">Văn</th>
                                 <th className="p-3 text-center">Anh</th>
                                 <th className="p-3 text-center">Lý</th>
                                 <th className="p-3 text-center">Hóa</th>
                                 <th className="p-3 text-center">TB</th>
                                 <th className="p-3 text-center">Xếp loại</th>
                                 <th className="p-3 text-right">Chi tiết</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {currentStudents.map(s => {
                                 const r = academicRecords.find(ar => ar.studentId === s.id && ar.term === academicTerm);
                                 const prevWave = WAVES.find(w => w.id === academicTerm)?.prev;
                                 const prevR = prevWave ? academicRecords.find(ar => ar.studentId === s.id && ar.term === prevWave) : null;

                                 return (
                                    <tr key={s.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => openAcademicModal(s.id)}>
                                       <td className="p-3 font-medium text-slate-800">{s.name}</td>
                                       <td className="p-3 text-center text-xs">{renderScoreCell(r?.subjects['Toán'], prevR?.subjects['Toán'])}</td>
                                       <td className="p-3 text-center text-xs">{renderScoreCell(r?.subjects['Văn'], prevR?.subjects['Văn'])}</td>
                                       <td className="p-3 text-center text-xs">{renderScoreCell(r?.subjects['Anh'], prevR?.subjects['Anh'])}</td>
                                       <td className="p-3 text-center text-xs">{renderScoreCell(r?.subjects['Lý'], prevR?.subjects['Lý'])}</td>
                                       <td className="p-3 text-center text-xs">{renderScoreCell(r?.subjects['Hóa'], prevR?.subjects['Hóa'])}</td>
                                       <td className="p-3 text-center font-bold text-blue-600">{r?.average || '-'}</td>
                                       <td className="p-3 text-center">
                                          {r?.ranking && (
                                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                r.ranking === 'Giỏi' ? 'bg-green-100 text-green-700' :
                                                r.ranking === 'Khá' ? 'bg-blue-100 text-blue-700' :
                                                r.ranking === 'TB' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                             }`}>
                                                {r.ranking}
                                             </span>
                                          )}
                                       </td>
                                       <td className="p-3 text-right">
                                          <button className="text-slate-400 hover:text-primary"><Icons.Edit /></button>
                                       </td>
                                    </tr>
                                 )
                              })}
                           </tbody>
                        </table>
                      </div>
                   </div>
                </div>
              )}

              {/* TAB 4: HONOR (VINH DANH) */}
              {activeTab === 'HONOR' && (
                <div className="flex flex-col lg:flex-row h-full gap-4 relative">
                   {/* Left: Controls */}
                   <div className="w-full lg:w-1/3 flex flex-col gap-4 overflow-y-auto">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                         <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-2">Thông tin vinh danh</h3>
                         
                         <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Trường</label>
                            <input value={honorSchool} onChange={e => setHonorSchool(e.target.value)} className="w-full border p-2 rounded text-sm" />
                         </div>
                         <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Tên Lớp (Hiển thị)</label>
                            <input value={honorClass} onChange={e => setHonorClass(e.target.value)} className="w-full border p-2 rounded text-sm" placeholder="VD: 10A1" />
                         </div>
                         
                         <div>
                            <label className="text-xs font-bold text-slate-500 block mb-2">Vị trí Tên Trường/Lớp</label>
                            <div className="flex gap-2">
                               <button 
                                 onClick={() => setHonorSchoolPosition('LEFT')}
                                 className={`flex-1 py-2 text-sm border rounded transition-all ${honorSchoolPosition === 'LEFT' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                               >
                                  Góc Trái
                               </button>
                               <button 
                                 onClick={() => setHonorSchoolPosition('CENTER')}
                                 className={`flex-1 py-2 text-sm border rounded transition-all ${honorSchoolPosition === 'CENTER' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                               >
                                  Ở Giữa
                               </button>
                            </div>
                         </div>

                         <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Học sinh</label>
                            <select value={honorStudentId} onChange={e => setHonorStudentId(e.target.value)} className="w-full border p-2 rounded text-sm bg-white">
                               <option value="">-- Chọn học sinh --</option>
                               {currentStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                         </div>
                         <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Tiêu đề (Tuần/Tháng)</label>
                            <input value={honorWeekMonth} onChange={e => setHonorWeekMonth(e.target.value)} className="w-full border p-2 rounded text-sm" placeholder="VD: Ngôi Sao Tuần 1" />
                         </div>
                         <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Tiêu đề Chứng nhận</label>
                            <input value={honorTitle} onChange={e => setHonorTitle(e.target.value)} className="w-full border p-2 rounded text-sm" placeholder="VD: Chứng nhận học sinh tiêu biểu" />
                         </div>
                         
                         {/* TEXT COLOR PICKER */}
                         <div>
                            <label className="text-xs font-bold text-slate-500 block mb-2">Màu chữ Tiêu đề</label>
                            <div className="flex gap-2">
                               {TEXT_COLORS.map(color => (
                                  <button
                                     key={color.value}
                                     onClick={() => setHonorTextColor(color.value)}
                                     style={{ backgroundColor: color.value }}
                                     title={color.label}
                                     className={`w-8 h-8 rounded-full border-2 ${honorTextColor === color.value ? 'border-slate-800 scale-110 shadow-md' : 'border-white'} transition-all`}
                                  />
                               ))}
                            </div>
                         </div>

                         <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Lí do</label>
                            <textarea value={honorReason} onChange={e => setHonorReason(e.target.value)} className="w-full border p-2 rounded text-sm h-20" />
                            {/* Suggestions */}
                            <div className="mt-2 flex flex-wrap gap-1">
                               {HONOR_SUGGESTIONS.map((suggestion, index) => (
                                  <button 
                                    key={index}
                                    onClick={() => setHonorReason(suggestion)}
                                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors border border-slate-200"
                                  >
                                     {suggestion}
                                  </button>
                               ))}
                            </div>
                         </div>
                         
                         <div className="flex gap-2">
                            <div className="flex-1">
                               <label className="text-xs font-bold text-slate-500 block mb-1">Địa điểm</label>
                               <input value={honorLocation} onChange={e => setHonorLocation(e.target.value)} className="w-full border p-2 rounded text-sm" />
                            </div>
                            <div className="flex-1">
                               <label className="text-xs font-bold text-slate-500 block mb-1">Ngày ký</label>
                               <input type="date" value={honorDate} onChange={e => setHonorDate(e.target.value)} className="w-full border p-2 rounded text-sm" />
                            </div>
                         </div>

                         <div className="flex gap-2">
                            <div className="flex-1">
                               <label className="text-xs font-bold text-slate-500 block mb-1">Chức danh</label>
                               <input value={honorTeacherTitle} onChange={e => setHonorTeacherTitle(e.target.value)} className="w-full border p-2 rounded text-sm" />
                            </div>
                            <div className="flex-1">
                               <label className="text-xs font-bold text-slate-500 block mb-1">Tên người ký</label>
                               <input value={honorTeacher} onChange={e => setHonorTeacher(e.target.value)} className="w-full border p-2 rounded text-sm" />
                            </div>
                         </div>
                         
                         {/* FONT SELECTION */}
                         <div>
                            <label className="text-xs font-bold text-slate-500 block mb-2">Chọn Font Tên (Thư Pháp)</label>
                            <div className="flex gap-2">
                                <button 
                                 onClick={() => setHonorFontId(1)}
                                 className={`flex-1 py-2 text-sm border rounded transition-all font-dancing ${honorFontId === 1 ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                               >
                                  Mẫu 1
                               </button>
                               <button 
                                 onClick={() => setHonorFontId(2)}
                                 className={`flex-1 py-2 text-sm border rounded transition-all font-greatvibes ${honorFontId === 2 ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                               >
                                  Mẫu 2
                               </button>
                               <button 
                                 onClick={() => setHonorFontId(3)}
                                 className={`flex-1 py-2 text-sm border rounded transition-all font-satisfy ${honorFontId === 3 ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                               >
                                  Mẫu 3
                               </button>
                            </div>
                         </div>
                      </div>

                      {/* STICKERS SELECTOR & EDITOR */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                         <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-2">Trang trí (Kéo thả)</h3>
                         
                         {/* Scale Control for Selected Sticker */}
                         {selectedStickerId && (
                           <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-3 animate-[fadeIn_0.2s_ease-out]">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-blue-800">Chỉnh sửa Sticker</span>
                                <button onClick={() => handleRemoveSticker(selectedStickerId)} className="text-red-500 hover:text-red-700 text-xs underline">Xóa</button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs">Nhỏ</span>
                                <input 
                                  type="range" 
                                  min="0.5" 
                                  max="3" 
                                  step="0.1" 
                                  value={selectedSticker?.scale || 1} 
                                  onChange={(e) => handleUpdateStickerScale(parseFloat(e.target.value))}
                                  className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-xs">To</span>
                              </div>
                           </div>
                         )}

                         <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto pr-1">
                            {STICKER_LIST.map(icon => {
                               const IconComp = Icons[icon];
                               return (
                                  <button 
                                    key={icon} 
                                    onClick={() => handleAddSticker(icon)}
                                    className="p-2 border rounded hover:bg-slate-50 flex items-center justify-center text-slate-600 hover:text-primary transition-colors"
                                    title="Thêm sticker"
                                  >
                                     <div className="scale-125"><IconComp /></div>
                                  </button>
                               )
                            })}
                         </div>
                         <p className="text-[10px] text-slate-400 text-center">Bấm vào sticker trên hình để chỉnh kích thước.</p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                         <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-2">Chọn mẫu (20 Mẫu)</h3>
                         <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto pr-1">
                            {Array.from({length: 20}, (_, i) => i + 1).map(id => (
                               <button 
                                 key={id} 
                                 onClick={() => setHonorTemplate(id)}
                                 className={`aspect-square rounded border-2 flex items-center justify-center font-bold text-xs transition-colors ${honorTemplate === id ? 'border-primary bg-blue-50 text-primary' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                               >
                                 #{id}
                               </button>
                            ))}
                         </div>
                         
                         {/* STUDENT PHOTO UPLOAD */}
                         <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Ảnh học sinh (Kèm khung)</label>
                            <input type="file" accept="image/*" onChange={handleStudentImageUpload} className="text-xs w-full mb-2" />
                            
                            {honorStudentImage && (
                               <>
                                <div className="flex gap-2 mb-2">
                                   {[1, 2, 3].map(fid => (
                                      <button 
                                        key={fid} 
                                        onClick={() => setHonorFrameId(fid)}
                                        className={`flex-1 py-1 text-xs border rounded transition-all ${honorFrameId === fid ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600'}`}
                                      >
                                         Khung {fid}
                                      </button>
                                   ))}
                                </div>
                                <button onClick={() => setHonorStudentImage('')} className="text-xs text-red-500 underline mt-1">Xóa ảnh học sinh</button>
                               </>
                            )}
                         </div>

                         <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Hình nền riêng (Optional)</label>
                            <input type="file" accept="image/*" onChange={handleBgUpload} className="text-xs w-full" />
                         </div>
                         <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Logo Trường (PNG/Transparent)</label>
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs w-full" />
                         </div>
                      </div>
                   </div>

                   {/* Right: Preview (Hidden on Mobile) */}
                   <div className="hidden lg:flex flex-1 bg-slate-200 rounded-xl overflow-hidden flex-col items-center justify-center p-4 relative shadow-inner">
                      <div className="mb-2 flex items-center gap-2">
                         <span className="text-xs text-slate-500 font-medium uppercase">Xem trước (A4 Ngang)</span>
                         <div className="flex gap-2">
                            <button 
                                onClick={handleBatchExport} 
                                disabled={isBatchExporting}
                                className="bg-emerald-600 text-white px-3 py-1.5 rounded text-sm font-bold shadow hover:bg-emerald-700 flex items-center gap-2 disabled:bg-slate-400"
                            >
                                {isBatchExporting ? 'Đang xử lý...' : <><Icons.Users /> Xuất hàng loạt</>}
                            </button>
                            <button onClick={() => handleExportHonor(false)} className="bg-primary text-white px-4 py-1.5 rounded text-sm font-bold shadow hover:bg-blue-600 flex items-center gap-2">
                                <Icons.Download /> Xuất PNG
                            </button>
                         </div>
                      </div>
                      
                      {/* PREVIEW CONTAINER (DESKTOP) */}
                      {/* Fixed Aspect Ratio to ensure A4 fits perfectly without cut-off */}
                      <div className="w-full aspect-[1.414] bg-white shadow-2xl rounded-lg overflow-hidden relative group flex items-center justify-center" ref={containerRef}>
                         {/* We scale the certificate to fit the container */}
                         <div 
                            style={{ 
                               transform: `scale(${previewScale})`, 
                               transformOrigin: 'center',
                               width: CERT_WIDTH, 
                               height: CERT_HEIGHT
                            }}
                         >
                            {renderHonorCert()}
                         </div>
                      </div>
                   </div>

                   {/* MOBILE FLOATING ACTION BUTTON FOR PREVIEW */}
                   <button 
                      onClick={() => setShowHonorPreview(true)}
                      className="lg:hidden fixed bottom-24 right-4 z-40 bg-primary text-white px-4 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold animate-bounce"
                   >
                      <Icons.Search /> Xem & Tải về
                   </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* --- MODALS --- */}
      
      {/* Add Class */}
      {showAddClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="bg-white p-6 rounded-xl w-full max-w-sm animate-[fadeIn_0.2s_ease-out]">
              <h3 className="font-bold text-lg mb-4">Thêm Lớp Chủ Nhiệm</h3>
              <input 
                autoFocus 
                className="w-full border p-2 rounded mb-4 bg-white text-slate-900 focus:ring-2 focus:ring-primary outline-none" 
                placeholder="Tên lớp (VD: 10A1)"
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                 <button onClick={() => setShowAddClass(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Hủy</button>
                 <button onClick={handleAddClass} className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-600">Thêm</button>
              </div>
           </div>
        </div>
      )}

      {/* Google Classroom Sync Modal */}
      {showClassroomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="bg-white p-6 rounded-xl w-full max-w-md animate-[fadeIn_0.2s_ease-out] flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                 <h3 className="font-bold text-lg flex items-center gap-2 text-green-700">
                    <Icons.GoogleClassroom /> Chọn Lớp Classroom
                 </h3>
                 <button onClick={() => setShowClassroomModal(false)} className="p-1 hover:bg-slate-100 rounded-full"><Icons.Close /></button>
              </div>
              
              {syncError ? (
                 <div className="bg-red-50 text-red-700 p-3 rounded text-sm mb-4 border border-red-100">
                    <p className="font-bold">Lỗi đồng bộ:</p>
                    <p>{syncError}</p>
                    <p className="mt-2 text-xs italic text-slate-500">Gợi ý: Kiểm tra lại Token và đảm bảo Token có quyền (Scope): <br/> <code>https://www.googleapis.com/auth/classroom.rosters.readonly</code></p>
                 </div>
              ) : isSyncing ? (
                 <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-sm text-slate-500">Đang đồng bộ dữ liệu...</p>
                 </div>
              ) : (
                 <div className="flex-1 overflow-y-auto space-y-2">
                    <p className="text-sm text-slate-500 mb-2">Chọn lớp học để nhập danh sách học sinh:</p>
                    {classroomCourses.map(course => (
                       <button 
                          key={course.id}
                          onClick={() => handleImportFromClassroom(course.id)}
                          className="w-full text-left p-3 rounded border border-slate-200 hover:bg-green-50 hover:border-green-200 transition-colors flex justify-between items-center group"
                       >
                          <div>
                             <div className="font-bold text-slate-800">{course.name}</div>
                             {course.section && <div className="text-xs text-slate-500">{course.section}</div>}
                          </div>
                          <div className="text-green-600 opacity-0 group-hover:opacity-100"><Icons.Download /></div>
                       </button>
                    ))}
                    {classroomCourses.length === 0 && <p className="text-center text-slate-400 italic py-4">Không tìm thấy lớp học nào.</p>}
                 </div>
              )}
           </div>
        </div>
      )}

      {/* Add Student */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4 backdrop-blur-sm">
           <div className="bg-white p-6 w-full sm:w-full sm:max-w-md rounded-t-2xl sm:rounded-xl animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out]">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-lg">{studentForm.id ? 'Sửa thông tin' : 'Thêm Học Sinh'}</h3>
                 <button onClick={() => setShowAddStudent(false)} className="sm:hidden p-1 bg-slate-100 rounded-full"><Icons.ChevronDown/></button>
              </div>
              <div className="space-y-3">
                 <input className="w-full border p-2 rounded bg-white text-slate-900" placeholder="Họ và Tên" value={studentForm.name || ''} onChange={e => setStudentForm({...studentForm, name: e.target.value})} />
                 <select className="w-full border p-2 rounded bg-white text-slate-900" value={studentForm.gender} onChange={e => setStudentForm({...studentForm, gender: e.target.value as any})}>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                 </select>
                 <input className="w-full border p-2 rounded bg-white text-slate-900" placeholder="Ngày sinh" type="date" value={studentForm.dob || ''} onChange={e => setStudentForm({...studentForm, dob: e.target.value})} />
                 <input className="w-full border p-2 rounded bg-white text-slate-900" placeholder="SĐT Phụ Huynh" value={studentForm.phone || ''} onChange={e => setStudentForm({...studentForm, phone: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 mt-4 pb-safe">
                 <button onClick={() => setShowAddStudent(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Hủy</button>
                 <button onClick={handleSaveStudent} className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-600">Lưu</button>
              </div>
           </div>
        </div>
      )}

      {/* --- ADD TASK MODAL (PHONG TRAO) --- */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="bg-white p-6 rounded-xl w-full max-w-sm animate-[fadeIn_0.2s_ease-out]">
              <h3 className="font-bold text-lg mb-4">Thêm Phong Trào Lớp</h3>
              <div className="space-y-3">
                 <input className="w-full border p-2 rounded bg-white text-slate-900" placeholder="Tên phong trào" value={taskForm.title || ''} onChange={e => setTaskForm({...taskForm, title: e.target.value})} autoFocus />
                 <input className="w-full border p-2 rounded bg-white text-slate-900" type="date" value={taskForm.deadline || ''} onChange={e => setTaskForm({...taskForm, deadline: e.target.value})} />
                 <input className="w-full border p-2 rounded bg-white text-slate-900" placeholder="Người phụ trách" value={taskForm.assignee || ''} onChange={e => setTaskForm({...taskForm, assignee: e.target.value})} />
                 <textarea className="w-full border p-2 rounded h-20 bg-white text-slate-900 resize-none" placeholder="Ghi chú..." value={taskForm.note || ''} onChange={e => setTaskForm({...taskForm, note: e.target.value})} />
                 <label className="flex items-center gap-2 select-none cursor-pointer"><input type="checkbox" checked={taskForm.isImportant} onChange={e => setTaskForm({...taskForm, isImportant: e.target.checked})} /> Quan trọng</label>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                 <button onClick={() => setShowAddTask(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Hủy</button>
                 <button onClick={handleSaveTask} className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-600">Lưu</button>
              </div>
           </div>
        </div>
      )}

      {/* --- COMPLETE TASK MODAL --- */}
      {showCompleteTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="bg-white p-6 rounded-xl w-full max-w-sm animate-[fadeIn_0.2s_ease-out]">
              <h3 className="font-bold text-lg mb-4">Đánh giá kết quả</h3>
              <p className="text-sm font-bold text-slate-700 mb-2 truncate">{taskForm.title}</p>
              <textarea className="w-full border p-2 rounded h-24 mb-4 bg-white text-slate-900 resize-none" placeholder="Nhập kết quả thực hiện..." value={taskForm.result || ''} onChange={e => setTaskForm({...taskForm, result: e.target.value})} autoFocus />
              <div className="flex justify-end gap-2">
                 <button onClick={() => setShowCompleteTask(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Hủy</button>
                 <button onClick={handleCompleteTask} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Hoàn thành</button>
              </div>
           </div>
        </div>
      )}

      {/* --- ADD RECORD MODAL (THI DUA) --- */}
      {showAddRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="bg-white p-6 rounded-xl w-full max-w-sm animate-[fadeIn_0.2s_ease-out]">
              <h3 className="font-bold text-lg mb-4">Ghi nhận Thi Đua</h3>
              <div className="space-y-3">
                 <select className="w-full border p-2 rounded bg-white text-slate-900" value={recordForm.studentId || ''} onChange={e => setRecordForm({...recordForm, studentId: e.target.value})}>
                    <option value="">-- Chọn học sinh --</option>
                    <option value="ALL" className="font-bold">-- Cả lớp --</option>
                    {currentStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
                 <div className="flex gap-2">
                    <button onClick={() => setRecordForm({...recordForm, type: 'REWARD'})} className={`flex-1 py-2 rounded border ${recordForm.type === 'REWARD' ? 'bg-yellow-100 border-yellow-300 text-yellow-800 font-bold' : 'bg-white'}`}>Khen thưởng</button>
                    <button onClick={() => setRecordForm({...recordForm, type: 'VIOLATION'})} className={`flex-1 py-2 rounded border ${recordForm.type === 'VIOLATION' ? 'bg-red-100 border-red-300 text-red-800 font-bold' : 'bg-white'}`}>Vi phạm</button>
                 </div>
                 <textarea className="w-full border p-2 rounded h-24 bg-white text-slate-900 resize-none" placeholder="Nội dung chi tiết..." value={recordForm.description || ''} onChange={e => setRecordForm({...recordForm, description: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                 <button onClick={() => setShowAddRecord(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Hủy</button>
                 <button onClick={handleSaveRecord} className={`text-white px-4 py-2 rounded ${recordForm.type === 'REWARD' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-red-500 hover:bg-red-600'}`}>Lưu</button>
              </div>
           </div>
        </div>
      )}

      {/* ADD TO WATCHLIST MODAL */}
      {showAddToWatchModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-[fadeIn_0.2s_ease-out]">
               <div className="px-5 py-4 border-b border-slate-100 font-bold text-lg">Thêm học sinh cần theo dõi</div>
               <div className="p-5 space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Chọn học sinh</label>
                     <select 
                        className="w-full border rounded px-3 py-2 text-sm bg-white text-slate-900 outline-none"
                        value={watchStudentId}
                        onChange={(e) => setWatchStudentId(e.target.value)}
                     >
                        <option value="">-- Chọn học sinh --</option>
                        {currentStudents
                           .filter(s => !watchList.some(w => w.studentId === s.id)) // Filter out already watched
                           .map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                           ))
                        }
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú (Lý do)</label>
                     <textarea 
                        className="w-full border rounded px-3 py-2 text-sm bg-white text-slate-900 outline-none h-24 resize-none"
                        placeholder="VD: Thường xuyên đi học muộn, cần nhắc nhở..."
                        value={watchNote}
                        onChange={(e) => setWatchNote(e.target.value)}
                     />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                     <button onClick={() => setShowAddToWatchModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                     <button onClick={handleAddToWatchList} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-medium">Thêm</button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* ACADEMIC SCORES MODAL */}
      {showAcademicModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-[fadeIn_0.2s_ease-out] flex flex-col max-h-[90vh]">
               <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-lg">
                     Nhập điểm: {currentStudents.find(s => s.id === academicStudentId)?.name}
                  </h3>
                  <button onClick={() => setShowAcademicModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
               </div>
               
               <div className="p-5 overflow-y-auto">
                  <div className="mb-4">
                     <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Đợt đánh giá</label>
                     <div className="flex bg-slate-100 rounded p-1 overflow-x-auto">
                        {WAVES.map(w => (
                           <button 
                             key={w.id}
                             onClick={() => setAcademicTerm(w.id)} 
                             className={`flex-1 py-1 rounded text-sm whitespace-nowrap ${academicTerm === w.id ? 'bg-white shadow text-primary font-bold' : 'text-slate-500'}`}
                           >
                              {w.label}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     {SUBJECTS.map(subject => (
                        <div key={subject}>
                           <label className="block text-sm font-medium text-slate-700 mb-1">{subject}</label>
                           <input 
                              type="number" 
                              step="0.1" 
                              min="0" 
                              max="10"
                              className="w-full border rounded px-3 py-2 text-sm bg-white text-slate-900 outline-none focus:ring-2 focus:ring-primary"
                              placeholder="0.0"
                              value={academicScores[subject] || ''}
                              onChange={(e) => setAcademicScores({...academicScores, [subject]: e.target.value})}
                           />
                        </div>
                     ))}
                  </div>
               </div>

               <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-xl">
                  <button onClick={() => setShowAcademicModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm">Hủy</button>
                  <button onClick={handleSaveAcademic} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 font-bold text-sm">Lưu Điểm</button>
               </div>
            </div>
         </div>
      )}

      {/* STUDENT DETAIL MODAL */}
      {activeStudent && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col md:flex-row animate-[fadeIn_0.2s_ease-out]">
               
               {/* Left Panel: Basic Info & Stats */}
               <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-200 p-6 flex flex-col">
                  <h3 className="font-bold text-xl text-slate-800 mb-1">{activeStudent.name}</h3>
                  <p className="text-sm text-slate-500 mb-6">{currentClass?.name} • {activeStudent.gender} • {activeStudent.dob}</p>
                  
                  {/* Stats */}
                  <div className="space-y-4 mb-6">
                     <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                        <div className="text-xs font-bold text-slate-400 uppercase">Khen thưởng</div>
                        <div className="text-2xl font-bold text-yellow-600">
                           {currentRecords.filter(r => r.studentId === activeStudent.id && r.type === 'REWARD').length}
                        </div>
                     </div>
                     <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                        <div className="text-xs font-bold text-slate-400 uppercase">Vi phạm</div>
                        <div className="text-2xl font-bold text-red-600">
                           {currentRecords.filter(r => r.studentId === activeStudent.id && r.type === 'VIOLATION').length}
                        </div>
                     </div>
                  </div>

                  {/* Violation Level */}
                  {(() => {
                     const vCount = currentRecords.filter(r => r.studentId === activeStudent.id && r.type === 'VIOLATION').length;
                     const step = getViolationStep(vCount);
                     if (step) return (
                        <div className={`mt-auto p-4 rounded-xl border ${step.color.replace('text', 'border').split(' ')[0]} bg-white shadow-sm`}>
                           <div className="flex items-center gap-2 mb-2 font-bold text-red-600 text-sm">
                              <Icons.Alert /> Vi phạm lần {step.step}
                           </div>
                           <p className="text-xs text-slate-600 font-bold mb-1">{step.action}</p>
                           <p className="text-xs text-slate-500 italic mb-2">{step.desc}</p>
                           <button
                              onClick={() => {
                                 setAdvisorQuery(`Học sinh ${activeStudent.name} đã vi phạm lần thứ ${step.step} (${step.action}). Hãy tư vấn cho tôi cách xử lý và trò chuyện với em ấy và phụ huynh.`);
                                 setAdvisorResponse('');
                                 setShowAIAdvisor(true);
                              }}
                              className="w-full py-1.5 text-xs bg-white border border-red-200 text-red-600 rounded hover:bg-red-50 font-medium flex items-center justify-center gap-1 transition-colors"
                           >
                              <Icons.Bot width={12} height={12} /> Tư vấn xử lý vi phạm này
                           </button>
                        </div>
                     );
                     return <div className="mt-auto text-center text-slate-400 text-sm italic">Hạnh kiểm tốt. Chưa có vi phạm.</div>;
                  })()}

                  {/* AI Advisor Button */}
                  <button 
                     onClick={() => { setAdvisorQuery(''); setAdvisorResponse(''); setShowAIAdvisor(true); }}
                     className="mt-4 w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                  >
                     <div className="bg-white/20 p-1 rounded-full group-hover:rotate-12 transition-transform"><Icons.Bot /></div>
                     Xin lời khuyên AI Cố vấn
                  </button>
               </div>

               {/* Right Panel: Tabs */}
               <div className="flex-1 flex flex-col bg-white overflow-hidden">
                  <div className="flex border-b border-slate-200">
                     <div className="flex-1 p-4 font-bold text-center border-b-2 border-primary text-primary bg-blue-50">Lịch sử & Hồ sơ</div>
                     <button onClick={() => setActiveStudent(null)} className="p-4 text-slate-400 hover:text-slate-600 md:hidden">
                        <Icons.Close />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                     
                     {/* Section 1: History Timeline */}
                     <div>
                        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Icons.List /> Nhật ký thi đua</h4>
                        <div className="space-y-3 pl-2 border-l-2 border-slate-100">
                           {currentRecords.filter(r => r.studentId === activeStudent.id).length === 0 && <p className="text-sm text-slate-400 pl-4">Chưa có dữ liệu.</p>}
                           {currentRecords.filter(r => r.studentId === activeStudent.id)
                              .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map(rec => (
                                 <div key={rec.id} className="relative pl-6 pb-2">
                                    <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${rec.type === 'REWARD' ? 'bg-yellow-400' : 'bg-red-500'}`}></div>
                                    <div className="text-xs text-slate-400 mb-0.5">{new Date(rec.date).toLocaleDateString('vi-VN')}</div>
                                    <div className="text-sm text-slate-800 font-medium">{rec.description}</div>
                                    <div className={`text-[10px] font-bold uppercase mt-1 ${rec.type === 'REWARD' ? 'text-yellow-600' : 'text-red-500'}`}>
                                       {rec.type === 'REWARD' ? 'Khen thưởng' : 'Vi phạm'}
                                    </div>
                                 </div>
                              ))
                           }
                        </div>
                     </div>

                     {/* Section 2: Evidence Archive */}
                     <div className="border-t border-slate-100 pt-6">
                        <div className="flex justify-between items-center mb-4">
                           <h4 className="font-bold text-slate-700 flex items-center gap-2"><Icons.Archive /> Hồ sơ lưu trữ (Bản kiểm điểm/Cam kết)</h4>
                           <button onClick={() => profileImageInputRef.current?.click()} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-100 font-bold transition-colors">
                              + Tải ảnh lên
                           </button>
                           <input type="file" hidden ref={profileImageInputRef} accept="image/*" onChange={handleUploadProfileImage} />
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                           {profiles.filter(p => p.studentId === activeStudent.id).map(profile => (
                              <div key={profile.id} className="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                 <img src={profile.url} className="w-full h-full object-cover cursor-pointer" alt="Evidence" onClick={() => {
                                    const w = window.open("");
                                    w?.document.write(`<img src="${profile.url}" style="max-width:100%"/>`);
                                 }}/>
                                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                    <p className="text-white text-xs truncate font-medium">{profile.description}</p>
                                    <p className="text-white/70 text-[10px]">{new Date(profile.date).toLocaleDateString('vi-VN')}</p>
                                    <button 
                                       onClick={() => {if(window.confirm('Xóa ảnh này?')) onDeleteProfile(profile.id)}} 
                                       className="absolute top-2 right-2 text-white bg-red-500 p-1 rounded hover:bg-red-600"
                                    >
                                       <div className="scale-75"><Icons.Trash /></div>
                                    </button>
                                 </div>
                              </div>
                           ))}
                           {profiles.filter(p => p.studentId === activeStudent.id).length === 0 && (
                              <div className="col-span-full text-center py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                                 Chưa có hồ sơ nào được tải lên.
                              </div>
                           )}
                        </div>
                     </div>

                  </div>
                  
                  <div className="p-4 border-t border-slate-200 flex justify-end">
                     <button onClick={() => setActiveStudent(null)} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm">Đóng</button>
                  </div>
               </div>
            </div>
         </div>
      )}
      {/* AI ADVISOR MODAL */}
      {showAIAdvisor && activeStudent && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] animate-[zoomIn_0.3s_ease-out]">
               {/* Header */}
               <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-violet-50 to-white rounded-t-2xl">
                  <div className="flex items-center gap-3">
                     <div className="bg-violet-100 p-2 rounded-full text-violet-600"><Icons.Bot /></div>
                     <div>
                        <h3 className="font-bold text-lg text-slate-800">AI Cố Vấn Chủ Nhiệm</h3>
                        <p className="text-xs text-slate-500">Đang tư vấn về học sinh: <span className="font-bold text-violet-600">{activeStudent.name}</span></p>
                     </div>
                  </div>
                  <button onClick={() => setShowAIAdvisor(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"><Icons.Close /></button>
               </div>

               {/* Body */}
               <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                  {!advisorResponse ? (
                     <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                           <p className="font-bold mb-1 flex items-center gap-2"><Icons.Info /> Gợi ý câu hỏi:</p>
                           <ul className="list-disc pl-5 space-y-1 opacity-80">
                              <li>Học sinh này dạo gần đây hay mất tập trung, tôi nên làm gì?</li>
                              <li>Em này có hoàn cảnh gia đình khó khăn, làm sao để tế nhị giúp đỡ?</li>
                              <li>Học lực sa sút đột ngột, xin lời khuyên để trò chuyện.</li>
                              <li>Em này rất thông minh nhưng hay quậy phá, làm sao để phát huy?</li>
                           </ul>
                        </div>
                        
                        <div>
                           <label className="block text-sm font-bold text-slate-700 mb-2">Vấn đề của bạn là gì?</label>
                           <textarea 
                              className="w-full border border-slate-300 rounded-xl p-4 text-sm focus:ring-2 focus:ring-violet-500 outline-none shadow-sm resize-none h-32"
                              placeholder="Mô tả cụ thể tình huống để AI tư vấn chính xác hơn..."
                              value={advisorQuery}
                              onChange={e => setAdvisorQuery(e.target.value)}
                              autoFocus
                           />
                        </div>
                     </div>
                  ) : (
                     <div className="prose prose-sm max-w-none prose-headings:text-violet-800 prose-p:text-slate-700 prose-li:text-slate-700">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                           {/* Simple Markdown Rendering Replacement since we don't have a library */}
                           {advisorResponse.split('\n').map((line, i) => {
                              if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-4 mb-2 text-violet-700">{line.replace('### ', '')}</h3>;
                              if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-6 mb-3 text-violet-800">{line.replace('## ', '')}</h2>;
                              if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold my-2">{line.replace(/\*\*/g, '')}</p>;
                              if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc my-1">{line.replace('- ', '')}</li>;
                              if (line.startsWith('1. ')) return <li key={i} className="ml-4 list-decimal my-1">{line.replace(/^\d+\.\s/, '')}</li>;
                              return <p key={i} className="my-2 leading-relaxed">{line}</p>;
                           })}
                        </div>
                     </div>
                  )}
               </div>

               {/* Footer */}
               <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl flex justify-end gap-3">
                  {!advisorResponse ? (
                     <button 
                        onClick={handleAskAIAdvisor} 
                        disabled={isAdvisorLoading}
                        className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                     >
                        {isAdvisorLoading ? (
                           <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Đang suy nghĩ...</>
                        ) : (
                           <><Icons.Bot /> Phân tích & Tư vấn</>
                        )}
                     </button>
                  ) : (
                     <>
                        <button onClick={() => setAdvisorResponse('')} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Hỏi lại</button>
                        <button onClick={() => setShowAIAdvisor(false)} className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-900">Đã hiểu</button>
                     </>
                  )}
               </div>
            </div>
         </div>
      )}

      {/* CLASS ANALYSIS MODAL */}
      {showClassAnalysis && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-[zoomIn_0.3s_ease-out]">
               {/* Header */}
               <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                     <div className="bg-purple-100 p-2 rounded-full text-purple-600"><Icons.Bot /></div>
                     <div>
                        <h3 className="font-bold text-lg text-slate-800">Phân tích & Cố vấn Lớp học AI</h3>
                        <p className="text-xs text-slate-500">Trợ lý ảo phân tích dữ liệu và đưa ra giải pháp quản lý lớp</p>
                     </div>
                  </div>
                  <button onClick={() => setShowClassAnalysis(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white rounded-full transition-colors"><Icons.Close /></button>
               </div>

               {/* Body */}
               <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                  {!classAnalysisResult ? (
                     <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                           <div className="text-blue-600 mt-1"><Icons.Info /></div>
                           <div>
                              <h4 className="font-bold text-blue-800 text-sm mb-1">AI sẽ làm gì?</h4>
                              <p className="text-xs text-blue-600 leading-relaxed">
                                 Hệ thống sẽ tổng hợp toàn bộ dữ liệu của lớp (hạnh kiểm, học tập, thi đua) để phân tích xu hướng, phát hiện học sinh cần quan tâm và đề xuất giải pháp quản lý cụ thể cho bạn.
                              </p>
                           </div>
                        </div>

                        <div>
                           <label className="block text-sm font-bold text-slate-700 mb-2">Bạn muốn AI tập trung phân tích vấn đề gì? (Tùy chọn)</label>
                           <textarea 
                              value={classAnalysisFocus}
                              onChange={(e) => setClassAnalysisFocus(e.target.value)}
                              placeholder="Ví dụ: Phân tích nguyên nhân nề nếp đi xuống tuần qua, hoặc đề xuất cách cải thiện phong trào học tập..."
                              className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none min-h-[120px] text-sm shadow-sm"
                           />
                        </div>
                     </div>
                  ) : (
                     <div className="prose prose-sm max-w-none">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                           {classAnalysisResult.split('\n').map((line, i) => {
                              if (line.trim() === '') return <br key={i} />;
                              if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-6 mb-3 text-purple-800 border-b border-purple-100 pb-2">{line.replace('### ', '')}</h3>;
                              if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-6 mb-3 text-indigo-800">{line.replace('## ', '')}</h2>;
                              if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold my-2 text-slate-800">{line.replace(/\*\*/g, '')}</p>;
                              if (line.includes('**')) {
                                 const parts = line.split('**');
                                 return (
                                    <p key={i} className="my-2 leading-relaxed">
                                       {parts.map((part, index) => index % 2 === 1 ? <span key={index} className="font-bold text-slate-800">{part}</span> : part)}
                                    </p>
                                 );
                              }
                              if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc my-1 text-slate-700">{line.replace('- ', '')}</li>;
                              if (line.match(/^\d+\.\s/)) return <li key={i} className="ml-4 list-decimal my-1 text-slate-700 font-medium">{line.replace(/^\d+\.\s/, '')}</li>;
                              return <p key={i} className="my-2 leading-relaxed text-slate-600">{line}</p>;
                           })}
                        </div>
                     </div>
                  )}
               </div>

               {/* Footer */}
               <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl flex justify-end gap-3">
                  {!classAnalysisResult ? (
                     <button 
                        onClick={handleAnalyzeClass} 
                        disabled={isClassAnalysisLoading}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                     >
                        {isClassAnalysisLoading ? (
                           <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Đang phân tích dữ liệu...</>
                        ) : (
                           <><Icons.Bot /> Bắt đầu Phân tích</>
                        )}
                     </button>
                  ) : (
                     <>
                        <button onClick={() => setClassAnalysisResult('')} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Phân tích lại</button>
                        <button onClick={() => setShowClassAnalysis(false)} className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-900">Đóng</button>
                     </>
                  )}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
