
import React, { useState, useRef, useMemo } from 'react';
import { ClassGroup, LessonPlanItem, Book } from '../types';
import { Icons } from '../constants';
import * as XLSX from 'xlsx';

interface LessonPlanViewProps {
  classes: ClassGroup[];
  lessonPlans: LessonPlanItem[];
  onAddClass: (name: string) => void;
  onDeleteClass: (id: string) => void;
  onUpdateClass: (id: string, name: string) => void;
  onAddPlan: (plan: LessonPlanItem) => void;
  onUpdatePlan: (plan: LessonPlanItem) => void;
  onDeletePlan: (id: string) => void;
  onImportData: (classes: ClassGroup[], plans: LessonPlanItem[]) => void;
  onOpenBook: (book: Book) => void; 
  onResetPlans: () => void;
}

const WEEKS = Array.from({ length: 37 }, (_, i) => i + 1); // 37 Tuần học

const CLASS_COLORS = [
  'bg-blue-50 border-blue-200 text-blue-800',
  'bg-emerald-50 border-emerald-200 text-emerald-800',
  'bg-amber-50 border-amber-200 text-amber-800',
  'bg-purple-50 border-purple-200 text-purple-800',
  'bg-rose-50 border-rose-200 text-rose-800',
  'bg-cyan-50 border-cyan-200 text-cyan-800',
  'bg-indigo-50 border-indigo-200 text-indigo-800',
  'bg-orange-50 border-orange-200 text-orange-800',
];

const getClassColor = (index: number) => CLASS_COLORS[index % CLASS_COLORS.length];

// Templates for Review
const REVIEW_TEMPLATES = [
  { label: '👍 Tốt', text: 'Ưu điểm: Học sinh tham gia bài sôi nổi, hiểu bài.\nHạn chế: Không.\nĐiều chỉnh: Phát huy phương pháp hiện tại.' },
  { label: '⚠️ Cháy giáo án', text: 'Ưu điểm: Nội dung chi tiết.\nHạn chế: Thời gian luyện tập ít, bị cháy giáo án.\nĐiều chỉnh: Cần phân bố thời gian hợp lý hơn.' },
  { label: '💤 Trầm', text: 'Ưu điểm: Lớp trật tự.\nHạn chế: Ít học sinh xung phong.\nĐiều chỉnh: Cần thêm hoạt động nhóm để khuấy động.' },
];

export const LessonPlanView: React.FC<LessonPlanViewProps> = ({
  classes,
  lessonPlans,
  onAddClass,
  onDeleteClass,
  onUpdateClass,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  onImportData,
  onOpenBook,
  onResetPlans
}) => {
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  
  // Modals
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [showClassManager, setShowClassManager] = useState(false);
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);
  
  // Bulk Actions State
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<string>>(new Set());
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyTargetWeek, setCopyTargetWeek] = useState<number>(selectedWeek + 1);

  // Edit Class State
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingClassName, setEditingClassName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Forms
  const [newClassName, setNewClassName] = useState('');
  
  // Add/Edit Plan Form State
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [planWeek, setPlanWeek] = useState<number>(1);
  const [planPeriod, setPlanPeriod] = useState<string>(''); // Tiết (1, 2, 1-2)
  const [planLessonName, setPlanLessonName] = useState(''); // Tên bài
  const [planLink, setPlanLink] = useState('');
  const [planNote, setPlanNote] = useState('');
  const [planReview, setPlanReview] = useState(''); // Rút kinh nghiệm
  const [planRating, setPlanRating] = useState<number>(0);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // -- LOGIC --

  // Filter plans based on the selected week
  // Support both legacy title parsing and new 'week' field
  const getPlansForWeek = (week: number) => {
    return lessonPlans.filter(p => {
       if (p.week) return p.week === week;
       // Legacy fallback
       const titleLower = p.title.toLowerCase();
       return titleLower.includes(`tuần ${week}`) || titleLower.includes(`tuần ${week < 10 ? '0'+week : week}`);
    });
  };

  const currentWeekPlans = useMemo(() => getPlansForWeek(selectedWeek), [selectedWeek, lessonPlans]);

  const handleAddClass = () => {
    if (newClassName.trim()) {
      onAddClass(newClassName);
      setNewClassName('');
    }
  };

  const startEditingClass = (cls: ClassGroup) => {
    setEditingClassId(cls.id);
    setEditingClassName(cls.name);
  };

  const saveEditingClass = () => {
    if (editingClassId && editingClassName.trim()) {
      onUpdateClass(editingClassId, editingClassName);
      setEditingClassId(null);
      setEditingClassName('');
    }
  };

  // --- BULK SELECTION HANDLERS ---
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedPlanIds(new Set());
  };

  const toggleSelectPlan = (id: string) => {
    const newSet = new Set(selectedPlanIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedPlanIds(newSet);
  };

  const selectAllInWeek = () => {
    if (selectedPlanIds.size === currentWeekPlans.length) {
      setSelectedPlanIds(new Set());
    } else {
      setSelectedPlanIds(new Set(currentWeekPlans.map(p => p.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedPlanIds.size === 0) return;
    if (window.confirm(`Bạn có chắc muốn xóa ${selectedPlanIds.size} mục đã chọn?`)) {
      selectedPlanIds.forEach(id => onDeletePlan(id));
      setSelectedPlanIds(new Set());
      setIsSelectMode(false);
    }
  };

  const handleBulkCopy = () => {
    if (selectedPlanIds.size === 0) return;
    // Copy logic: Clone items, update week, generate new IDs
    const plansToCopy = lessonPlans.filter(p => selectedPlanIds.has(p.id));
    let copiedCount = 0;
    
    plansToCopy.forEach(plan => {
       const newPlan: LessonPlanItem = {
         ...plan,
         id: `copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
         week: copyTargetWeek,
         // Update title for legacy compatibility if it exists
         title: plan.title.replace(/Tuần \d+/, `Tuần ${copyTargetWeek}`),
         createdAt: new Date().toISOString()
       };
       onAddPlan(newPlan);
       copiedCount++;
    });

    alert(`Đã sao chép ${copiedCount} báo giảng sang Tuần ${copyTargetWeek}`);
    setShowCopyModal(false);
    setSelectedPlanIds(new Set());
    setIsSelectMode(false);
    setSelectedWeek(copyTargetWeek); // Jump to target week
  };

  // --- MODAL HANDLERS ---

  const resetPlanForm = () => {
    setTargetClassId(classes[0]?.id || '');
    setPlanWeek(selectedWeek);
    setPlanPeriod('');
    setPlanLessonName('');
    setPlanLink('');
    setPlanNote('');
    setPlanReview('');
    setPlanRating(0);
    setEditingPlanId(null);
  };

  const handleOpenAddModal = () => {
    if (classes.length === 0) {
      alert("Vui lòng thêm lớp giảng dạy trước khi thêm báo giảng.");
      setShowClassManager(true);
      return;
    }
    resetPlanForm();
    setShowAddPlanModal(true);
  };

  const handleOpenEditModal = (plan: LessonPlanItem) => {
    setEditingPlanId(plan.id);
    setTargetClassId(plan.classId);
    setPlanWeek(plan.week || selectedWeek);
    setPlanPeriod(plan.period || '');
    setPlanLessonName(plan.lessonName || plan.title.replace(/Tuần \d+ - (Tiết \d+ - )?/, ''));
    setPlanLink(plan.fileUrl);
    setPlanNote(plan.note);
    setPlanReview(plan.review || '');
    setPlanRating(plan.reviewRating || 0);
    setShowEditPlanModal(true);
  };

  const handleSavePlan = (isEdit: boolean) => {
    if (planLessonName.trim() && targetClassId) {
      let fileUrl = planLink;
      if (fileUrl.includes('drive.google.com') && !fileUrl.includes('/preview')) {
        const match = fileUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          fileUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
        }
      }

      // Construct Title for Legacy Display / Fallback
      const periodPrefix = planPeriod ? `Tiết ${planPeriod} - ` : '';
      const finalTitle = `Tuần ${planWeek} - ${periodPrefix}${planLessonName}`;

      const planData: LessonPlanItem = {
        id: isEdit && editingPlanId ? editingPlanId : `plan-${Date.now()}`,
        classId: targetClassId,
        title: finalTitle,
        week: planWeek,
        period: planPeriod,
        lessonName: planLessonName,
        fileUrl: fileUrl,
        note: planNote,
        review: planReview,
        reviewRating: planRating,
        createdAt: new Date().toISOString()
      };

      if (isEdit) {
        onUpdatePlan(planData);
        setShowEditPlanModal(false);
      } else {
        onAddPlan(planData);
        setShowAddPlanModal(false);
      }
    }
  };

  const handleViewPdf = (plan: LessonPlanItem) => {
    if (!plan.fileUrl) {
      alert("Chưa có link giáo án!");
      return;
    }
    const mockBook: Book = {
      id: plan.id,
      title: plan.title,
      author: 'Giáo Án',
      coverUrl: '',
      fileUrl: plan.fileUrl,
      fileType: 'pdf',
      source: plan.fileUrl.includes('drive') ? 'DRIVE' : 'LINK',
      uploadDate: plan.createdAt
    };
    onOpenBook(mockBook);
  };

  const handleDownload = (url: string) => {
    if (!url) {
      alert("Chưa có link tải!");
      return;
    }
    window.open(url, '_blank');
  };

  // --- EXPORT FUNCTIONS ---
  const downloadTemplate = () => {
    // UPDATED TEMPLATE STRUCTURE
    const headers = [['Lớp', 'Tuần', 'Tiết', 'Nội dung bài dạy', 'Link Giáo Án (Drive)', 'Ghi chú', 'Rút kinh nghiệm']];
    const data = [['12A1', 1, '1', 'Khảo sát hàm số', 'https://drive.google.com/...', '', '']];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Bao_Giang_Moi");
    XLSX.writeFile(wb, "EduDrive_Mau_Bao_Giang_V2.xlsx");
  };

  const exportExcel = () => {
    const data = currentWeekPlans.map(p => {
       const className = classes.find(c => c.id === p.classId)?.name || 'Unknown';
       return {
         'Lớp': className,
         'Tuần': p.week || selectedWeek,
         'Tiết': p.period || '',
         'Nội dung': p.lessonName || p.title,
         'Link': p.fileUrl,
         'Ghi Chú': p.note,
         'Rút kinh nghiệm': p.review || ''
       };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Bao_Giang_Tuan_${selectedWeek}`);
    XLSX.writeFile(wb, `Bao_Giang_Tuan_${selectedWeek}.xlsx`);
  };

  const exportWord = () => {
    if (currentWeekPlans.length === 0) { alert("Không có dữ liệu để xuất."); return; }
    
    // Construct HTML Table for Word
    let tableRows = '';
    currentWeekPlans.sort((a,b) => (a.classId > b.classId ? 1 : -1)).forEach(p => {
       const className = classes.find(c => c.id === p.classId)?.name || '';
       tableRows += `
         <tr>
           <td>${p.week}</td>
           <td>${className}</td>
           <td>${p.period}</td>
           <td>${p.lessonName}</td>
           <td>${p.note}</td>
           <td>${p.review || ''}</td>
         </tr>
       `;
    });

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Báo Giảng</title>
      <style>table{border-collapse:collapse;width:100%;} th,td{border:1px solid #000;padding:8px;font-family:'Times New Roman',serif;} th{background:#eee;}</style>
      </head><body>
      <h2 style="text-align:center;font-family:'Times New Roman'">KẾ HOẠCH BÁO GIẢNG TUẦN ${selectedWeek}</h2>
      <table>
        <thead><tr><th>Tuần</th><th>Lớp</th><th>Tiết</th><th>Tên Bài Dạy</th><th>Ghi Chú</th><th>Rút Kinh Nghiệm</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      </body></html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bao_Giang_Tuan_${selectedWeek}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
     // Create a print window
     const printWindow = window.open('', '', 'width=900,height=600');
     if (!printWindow) return;

     let tableRows = '';
     currentWeekPlans.sort((a,b) => (a.classId > b.classId ? 1 : -1)).forEach(p => {
       const className = classes.find(c => c.id === p.classId)?.name || '';
       tableRows += `<tr><td>${p.week}</td><td>${className}</td><td>${p.period}</td><td>${p.lessonName}</td><td>${p.note}</td><td>${p.review || ''}</td></tr>`;
     });

     printWindow.document.write(`
       <html><head><title>In Báo Giảng</title>
       <style>
         body{font-family:sans-serif;padding:20px;}
         h2{text-align:center;}
         table{width:100%;border-collapse:collapse;margin-top:20px;}
         th,td{border:1px solid #333;padding:8px;text-align:left;font-size:14px;}
         th{background-color:#f0f0f0;}
         @media print { button { display: none; } }
       </style>
       </head><body>
         <h2>KẾ HOẠCH BÁO GIẢNG TUẦN ${selectedWeek}</h2>
         <p>Giáo viên: _________________________</p>
         <table>
           <thead><tr><th width="50">Tuần</th><th width="80">Lớp</th><th width="50">Tiết</th><th>Tên Bài Dạy</th><th>Ghi Chú</th><th>Rút Kinh Nghiệm</th></tr></thead>
           <tbody>${tableRows}</tbody>
         </table>
         <script>window.print();</script>
       </body></html>
     `);
     printWindow.document.close();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      
      const importedClasses: ClassGroup[] = [];
      const importedPlans: LessonPlanItem[] = [];
      const classMap = new Map<string, string>();
      classes.forEach(c => classMap.set(c.name.toLowerCase(), c.id));
      const newClassMap = new Map<string, string>();

      // Start from row 1 (skip header)
      // MAPPING: [0]Lớp, [1]Tuần, [2]Tiết, [3]Nội dung, [4]Link, [5]Ghi chú, [6]Rút kinh nghiệm
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[0]) continue; 
        
        const className = String(row[0]).trim();
        const week = parseInt(row[1]) || selectedWeek;
        const period = row[2] ? String(row[2]) : '';
        const lessonName = row[3] ? String(row[3]) : 'Bài học';
        let link = row[4] ? String(row[4]) : '';
        const note = row[5] ? String(row[5]) : '';
        const review = row[6] ? String(row[6]) : '';

        // Drive Link fix
        if (link.includes('drive.google.com') && !link.includes('/preview')) {
           const match = link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
           if (match && match[1]) link = `https://drive.google.com/file/d/${match[1]}/preview`;
        }

        const lowerName = className.toLowerCase();
        let classId = classMap.get(lowerName) || newClassMap.get(lowerName);

        if (!classId) {
          classId = `class-excel-${Date.now()}-${i}`;
          newClassMap.set(lowerName, classId);
          importedClasses.push({ id: classId, name: className });
        }

        const title = `Tuần ${week} - Tiết ${period} - ${lessonName}`;

        importedPlans.push({
          id: `plan-excel-${Date.now()}-${i}`,
          classId: classId,
          title: title,
          week: week,
          period: period,
          lessonName: lessonName,
          fileUrl: link,
          note: note,
          review: review,
          createdAt: new Date().toISOString()
        });
      }
      onImportData(importedClasses, importedPlans);
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert("Đã nhập dữ liệu thành công!");
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-white relative">
      {/* SIDEBAR: WEEKS LIST */}
      <div className="w-full md:w-64 md:border-r border-slate-200 flex flex-col bg-slate-50 shrink-0 md:h-full">
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
               <Icons.Calendar /> Tuần Học
            </h2>
            <div className="flex gap-2">
               <button 
                  onClick={onResetPlans}
                  className="p-1.5 hover:bg-red-50 text-red-500 rounded-md transition-colors"
                  title="Xóa toàn bộ dữ liệu"
               >
                 <Icons.Trash />
               </button>
            </div>
          </div>
          <button 
            onClick={() => setShowClassManager(true)}
            className="w-full bg-white border border-slate-200 text-slate-700 py-1.5 rounded text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-2 shadow-sm"
          >
             <Icons.Users /> Quản lý Lớp
          </button>
        </div>
        
        {/* Week List */}
        <div className="flex-1 overflow-x-auto md:overflow-y-auto p-2 gap-2 flex md:flex-col scrollbar-hide border-b md:border-b-0 border-slate-100">
          {WEEKS.map(week => (
            <button 
              key={week}
              onClick={() => setSelectedWeek(week)}
              className={`flex items-center justify-center md:justify-start px-4 py-3 rounded-lg transition-all shrink-0 font-medium text-sm ${
                selectedWeek === week
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-transparent'
              }`}
            >
              <span className="whitespace-nowrap">Tuần {week}</span>
            </button>
          ))}
        </div>

        {/* TOOLS */}
        <div className="border-t border-slate-200 bg-blue-50 transition-all">
           <button 
             onClick={() => setIsToolsExpanded(!isToolsExpanded)}
             className="w-full p-4 flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider hover:bg-blue-100 transition-colors"
           >
             <span className="flex items-center gap-2"><Icons.Settings /> Nhập / Xuất</span>
             <div className={`transform transition-transform ${isToolsExpanded ? 'rotate-180' : ''}`}>
               <Icons.ChevronDown />
             </div>
           </button>
           
           {isToolsExpanded && (
             <div className="px-4 pb-4 space-y-2 animate-[fadeIn_0.2s_ease-out]">
                <button onClick={downloadTemplate} className="w-full flex items-center gap-2 text-xs bg-white border border-slate-200 p-2 rounded hover:bg-slate-50 transition-colors text-slate-900"><Icons.Download /> Tải mẫu Excel</button>
                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-2 text-xs bg-white border border-slate-200 p-2 rounded hover:bg-slate-50 transition-colors text-slate-900"><Icons.Upload /> Nhập Excel</button>
                <input type="file" hidden ref={fileInputRef} accept=".xlsx, .xls" onChange={handleFileUpload} />
                
                <div className="h-[1px] bg-slate-200 my-1"></div>
                
                <button onClick={exportExcel} className="w-full flex items-center gap-2 text-xs bg-emerald-600 text-white border border-transparent p-2 rounded hover:bg-emerald-700 transition-colors"><Icons.Table /> Xuất Excel</button>
                <button onClick={exportWord} className="w-full flex items-center gap-2 text-xs bg-blue-600 text-white border border-transparent p-2 rounded hover:bg-blue-700 transition-colors"><Icons.FileText /> Xuất Word (.doc)</button>
                <button onClick={handlePrint} className="w-full flex items-center gap-2 text-xs bg-slate-700 text-white border border-transparent p-2 rounded hover:bg-slate-800 transition-colors"><div className="scale-75"><Icons.Search /></div> Xem & In (PDF)</button>
             </div>
           )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
        <header className="px-4 py-3 md:px-6 md:py-4 bg-white border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 shadow-sm z-10 gap-2">
          <div className="flex-1">
            <h1 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
               <span className="bg-primary text-white text-xs px-2 py-1 rounded">Tuần {selectedWeek}</span>
               <span>Báo Giảng</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 hidden md:block">
               {currentWeekPlans.length} tiết dạy trong tuần.
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
             {/* Bulk Action Controls */}
             {isSelectMode ? (
                <div className="flex items-center gap-2 animate-[fadeIn_0.2s_ease-out] bg-slate-100 p-1 rounded-lg">
                   <button onClick={selectAllInWeek} className="px-3 py-1.5 text-xs font-bold bg-white rounded border hover:bg-slate-50">Tất cả</button>
                   {selectedPlanIds.size > 0 && (
                      <>
                        <button onClick={() => setShowCopyModal(true)} className="px-3 py-1.5 text-xs font-bold bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-1"><Icons.Clipboard /> Copy</button>
                        <button onClick={handleBulkDelete} className="px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1"><Icons.Trash /> Xóa ({selectedPlanIds.size})</button>
                      </>
                   )}
                   <button onClick={toggleSelectMode} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800">Hủy</button>
                </div>
             ) : (
               <button 
                  onClick={toggleSelectMode}
                  className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2"
               >
                  <Icons.List /> Chọn nhiều
               </button>
             )}

             <button 
               onClick={handleOpenAddModal}
               className="bg-primary hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm whitespace-nowrap"
             >
               <Icons.Plus /> <span className="hidden md:inline">Thêm Báo Giảng</span>
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-24 md:pb-6">
          {classes.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                <div className="p-6 bg-white rounded-full shadow-lg border border-slate-100">
                   <div className="scale-150 text-slate-300"><Icons.Users /></div>
                </div>
                <div className="text-center">
                   <h3 className="text-lg font-bold text-slate-600">Chưa có lớp giảng dạy</h3>
                   <p className="text-sm text-slate-400 mt-1">Vui lòng thêm danh sách lớp để bắt đầu soạn báo giảng.</p>
                </div>
                <button 
                  onClick={() => setShowClassManager(true)}
                  className="bg-primary text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-blue-600 transition-transform hover:scale-105 flex items-center gap-2"
                >
                   <Icons.Plus /> Thêm lớp tự chọn
                </button>
             </div>
          ) : (
             <div className="space-y-6">
                {classes.map((cls, idx) => {
                   const plans = currentWeekPlans.filter(p => p.classId === cls.id);
                   const colorClass = getClassColor(idx);
                   // Show class section even if empty? Better to show it so user knows they have a class.
                   return (
                      <div key={cls.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${colorClass.split(' ')[1]}`}>
                         <div className={`px-4 py-2 border-b flex justify-between items-center ${colorClass}`}>
                            <h3 className="font-bold flex items-center gap-2">
                               <Icons.Users /> Lớp {cls.name}
                            </h3>
                            <span className="text-xs font-medium bg-white/50 px-2 py-1 rounded border border-white/20">
                               {plans.length} mục
                            </span>
                         </div>
                         
                         <div className="p-3">
                            {plans.length === 0 ? (
                               <div className="text-center py-4 text-xs text-slate-400 italic">
                                  Chưa có báo giảng cho lớp này trong tuần {selectedWeek}.
                               </div>
                            ) : (
                               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                  {plans.map(plan => {
                                     const isSelected = selectedPlanIds.has(plan.id);
                                     return (
                                       <div 
                                          key={plan.id} 
                                          className={`group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border overflow-hidden flex flex-col h-full ${
                                             isSelected ? 'border-primary ring-2 ring-primary ring-opacity-50' : 'border-slate-200'
                                          }`}
                                          onClick={() => isSelectMode && toggleSelectPlan(plan.id)}
                                       >
                                          {/* Selection Checkbox Overlay */}
                                          {isSelectMode && (
                                             <div className="absolute top-2 left-2 z-20">
                                                <input 
                                                   type="checkbox" 
                                                   checked={isSelected}
                                                   readOnly
                                                   className="w-5 h-5 accent-primary cursor-pointer shadow-sm"
                                                />
                                             </div>
                                          )}

                                          {/* Cover Area */}
                                          <div 
                                            className="aspect-[3/2] bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden flex items-center justify-center cursor-pointer border-b border-slate-100" 
                                            onClick={(e) => { if(!isSelectMode) handleViewPdf(plan); }}
                                          >
                                              <div className="text-4xl opacity-50">📄</div>
                                              
                                              {/* Period Badge */}
                                              {plan.period && (
                                                 <div className="absolute top-2 left-2 bg-slate-800/80 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm backdrop-blur-sm">
                                                    Tiết: {plan.period}
                                                 </div>
                                              )}

                                              {/* PDF Badge */}
                                              <div className="absolute top-2 right-2 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                                                  PDF
                                              </div>
                                              
                                              {/* Overlay Actions (Hidden in select mode) */}
                                              {!isSelectMode && (
                                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                      <button 
                                                          onClick={(e) => { e.stopPropagation(); handleViewPdf(plan); }}
                                                          className="bg-white text-slate-800 p-2 rounded-full hover:scale-110 transition-transform shadow-lg"
                                                          title="Đọc ngay"
                                                      >
                                                          <div className="scale-90"><Icons.BookOpen /></div>
                                                      </button>
                                                      <button 
                                                          onClick={(e) => { e.stopPropagation(); handleOpenEditModal(plan); }}
                                                          className="bg-white text-blue-600 p-2 rounded-full hover:scale-110 transition-transform shadow-lg"
                                                          title="Chỉnh sửa & Rút kinh nghiệm"
                                                      >
                                                          <div className="scale-90"><Icons.Edit /></div>
                                                      </button>
                                                 </div>
                                              )}
                                          </div>

                                          {/* Info Area */}
                                          <div className="p-3 flex-1 flex flex-col">
                                              <h4 className="font-bold text-slate-800 text-sm line-clamp-2 mb-1" title={plan.lessonName || plan.title}>
                                                  {plan.lessonName || plan.title.replace(`Tuần ${selectedWeek} - `, '')}
                                              </h4>
                                              <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-2">
                                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded">Tuần {selectedWeek}</span>
                                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded">{cls.name}</span>
                                              </div>
                                              
                                              {plan.note && (
                                                  <p className="text-[11px] text-slate-500 italic bg-yellow-50 p-1.5 rounded border border-yellow-100 line-clamp-2 mt-auto mb-1">
                                                      Note: {plan.note}
                                                  </p>
                                              )}

                                              {/* Review Preview */}
                                              {plan.review ? (
                                                  <div className="mt-auto">
                                                     <div className="flex items-center gap-1 mb-1">
                                                        {Array.from({length: 5}).map((_, i) => (
                                                           <span key={i} className={`text-[10px] ${i < (plan.reviewRating || 0) ? 'text-yellow-400' : 'text-slate-200'}`}>★</span>
                                                        ))}
                                                     </div>
                                                     <p className="text-[11px] text-green-700 italic bg-green-50 p-1.5 rounded border border-green-100 line-clamp-2">
                                                         <span className="font-bold">RKN:</span> {plan.review}
                                                     </p>
                                                  </div>
                                              ) : (
                                                  <div className="mt-auto text-[10px] text-slate-300 italic flex items-center gap-1">
                                                     <Icons.Edit /> Chưa rút kinh nghiệm
                                                  </div>
                                              )}
                                          </div>
                                          
                                          {/* Footer Actions */}
                                          {!isSelectMode && (
                                             <div className="px-3 py-2 border-t border-slate-50 flex justify-between items-center bg-slate-50/50">
                                                 <span className="text-[10px] text-slate-400">
                                                     {new Date(plan.createdAt).toLocaleDateString('vi-VN')}
                                                 </span>
                                                 <button 
                                                     onClick={(e) => { e.stopPropagation(); onDeletePlan(plan.id); }}
                                                     className="text-slate-300 hover:text-red-500 transition-colors"
                                                     title="Xóa"
                                                 >
                                                     <div className="scale-75"><Icons.Trash /></div>
                                                 </button>
                                             </div>
                                          )}
                                       </div>
                                     )
                                  })}
                               </div>
                            )}
                         </div>
                      </div>
                   )
                })}
             </div>
          )}
        </div>
      </div>

      {/* --- MODAL: CLASS MANAGER --- */}
      {showClassManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-[fadeIn_0.2s_ease-out]">
              <div className="px-5 py-4 border-b border-slate-100 font-bold text-lg flex justify-between items-center">
                 <span>Quản lý Danh Sách Lớp</span>
                 <button onClick={() => setShowClassManager(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
              </div>
              <div className="p-5">
                 <div className="flex gap-2 mb-4">
                    <input 
                       className="flex-1 border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary bg-white text-slate-900"
                       placeholder="Nhập tên lớp mới (VD: 10A2)..."
                       value={newClassName}
                       onChange={(e) => setNewClassName(e.target.value)}
                    />
                    <button 
                       onClick={handleAddClass}
                       className="bg-primary text-white px-4 rounded font-bold hover:bg-blue-600 text-xl"
                    >+</button>
                 </div>
                 <div className="max-h-60 overflow-y-auto space-y-2 border-t border-slate-100 pt-2">
                    {classes.map(cls => (
                       <div key={cls.id} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                          {editingClassId === cls.id ? (
                             <div className="flex flex-1 gap-2 mr-2">
                                <input 
                                  value={editingClassName}
                                  onChange={(e) => setEditingClassName(e.target.value)}
                                  className="flex-1 border rounded px-2 py-1 text-sm bg-white text-slate-900"
                                  autoFocus
                                />
                                <button onClick={saveEditingClass} className="text-green-500 hover:text-green-700 font-bold">Lưu</button>
                             </div>
                          ) : (
                             <span className="font-medium text-slate-800 flex-1">{cls.name}</span>
                          )}
                          
                          <div className="flex gap-2">
                             <button onClick={() => startEditingClass(cls)} className="text-slate-300 hover:text-blue-500">
                                <Icons.Edit />
                             </button>
                             <button onClick={() => onDeleteClass(cls.id)} className="text-slate-300 hover:text-red-500">
                                <Icons.Trash />
                             </button>
                          </div>
                       </div>
                    ))}
                    {classes.length === 0 && <p className="text-center text-xs text-slate-400 italic">Danh sách trống</p>}
                 </div>
                 <div className="mt-4 pt-2 border-t border-slate-100 flex justify-end">
                    <button onClick={() => setShowClassManager(false)} className="text-sm text-slate-600 hover:bg-slate-100 px-4 py-2 rounded">Đóng</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- MODAL: COPY PLANS --- */}
      {showCopyModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-[fadeIn_0.2s_ease-out]">
               <div className="px-5 py-4 border-b border-slate-100 font-bold text-lg">Sao Chép Báo Giảng</div>
               <div className="p-5 space-y-4">
                  <p className="text-sm text-slate-600">Bạn đang chọn <strong>{selectedPlanIds.size}</strong> mục. Hãy chọn tuần muốn sao chép đến:</p>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Tuần Đích</label>
                     <select 
                        value={copyTargetWeek}
                        onChange={(e) => setCopyTargetWeek(parseInt(e.target.value))}
                        className="w-full border rounded-lg px-3 py-2 bg-white text-slate-900"
                     >
                        {WEEKS.map(w => <option key={w} value={w}>Tuần {w}</option>)}
                     </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                     <button onClick={() => setShowCopyModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                     <button onClick={handleBulkCopy} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold">Sao Chép Ngay</button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* --- MODAL: ADD/EDIT PLAN --- */}
      {(showAddPlanModal || showEditPlanModal) && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4">
          <div className="bg-white w-full md:w-full md:max-w-xl rounded-t-2xl md:rounded-xl shadow-xl overflow-hidden animate-[slideUp_0.3s_ease-out] md:animate-[fadeIn_0.2s_ease-out] flex flex-col max-h-[90vh]">
             <div className="px-5 py-4 border-b border-slate-100 font-bold text-lg flex justify-between items-center shrink-0">
                <span>{showEditPlanModal ? 'Cập nhật & Rút kinh nghiệm' : 'Thêm Báo Giảng Mới'}</span>
                <button onClick={() => { setShowAddPlanModal(false); setShowEditPlanModal(false); }} className="text-slate-400 hover:text-slate-600 md:hidden">&times;</button>
             </div>
             
             <div className="p-5 space-y-4 overflow-y-auto">
               <div className="flex gap-4">
                  <div className="flex-1">
                     <label className="block text-sm font-medium text-slate-700 mb-1">Tuần</label>
                     <select 
                       value={planWeek} 
                       onChange={(e) => setPlanWeek(Number(e.target.value))}
                       className="w-full border rounded-lg px-3 py-2 text-sm outline-none bg-white text-slate-900"
                     >
                        {WEEKS.map(w => <option key={w} value={w}>Tuần {w}</option>)}
                     </select>
                  </div>
                  <div className="flex-[2]">
                     <label className="block text-sm font-medium text-slate-700 mb-1">Lớp</label>
                     <select 
                       value={targetClassId} 
                       onChange={(e) => setTargetClassId(e.target.value)}
                       className="w-full border rounded-lg px-3 py-2 text-sm outline-none bg-white text-slate-900"
                     >
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                  </div>
               </div>
               
               <div className="flex gap-4">
                  <div className="w-1/3">
                     <label className="block text-sm font-medium text-slate-700 mb-1">Tiết (Số)</label>
                     <input 
                        type="text" 
                        value={planPeriod}
                        onChange={(e) => setPlanPeriod(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none bg-white text-slate-900"
                        placeholder="VD: 5"
                     />
                  </div>
                  <div className="flex-1">
                     <label className="block text-sm font-medium text-slate-700 mb-1">Tên bài dạy</label>
                     <input 
                        type="text" 
                        value={planLessonName}
                        onChange={(e) => setPlanLessonName(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                        placeholder="VD: Đạo hàm"
                     />
                  </div>
               </div>
               
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Link Giáo Án (Drive/PDF)</label>
                  <input 
                    type="text" 
                    value={planLink}
                    onChange={(e) => setPlanLink(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                    placeholder="https://drive.google.com/..."
                  />
               </div>

               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                  <input 
                    type="text" 
                    value={planNote}
                    onChange={(e) => setPlanNote(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                    placeholder="Chuẩn bị đồ dùng..."
                  />
               </div>

               {/* Advanced Review Section */}
               <div className={`pt-2 ${showEditPlanModal ? 'bg-green-50 -mx-5 px-5 py-4 border-t border-green-100' : 'border-t border-slate-100 mt-2'}`}>
                  <div className="flex justify-between items-center mb-2">
                     <label className="block text-sm font-bold text-green-800 flex items-center gap-2">
                        <Icons.Edit /> Rút kinh nghiệm (Sau tiết dạy)
                     </label>
                     
                     {/* Star Rating */}
                     <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                           <button 
                              key={star}
                              onClick={() => setPlanRating(star)}
                              className={`text-xl transition-transform hover:scale-125 ${star <= planRating ? 'text-yellow-400' : 'text-slate-300'}`}
                           >
                              ★
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Templates */}
                  <div className="flex flex-wrap gap-2 mb-2">
                     {REVIEW_TEMPLATES.map((tmpl, idx) => (
                        <button
                           key={idx}
                           onClick={() => setPlanReview(prev => (prev ? prev + '\n' : '') + tmpl.text)}
                           className="text-[10px] bg-white border border-green-200 text-green-700 px-2 py-1 rounded hover:bg-green-100 transition-colors"
                        >
                           {tmpl.label}
                        </button>
                     ))}
                  </div>

                  <textarea 
                    value={planReview}
                    onChange={(e) => setPlanReview(e.target.value)}
                    className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white text-slate-900 h-24 resize-none"
                    placeholder="Ghi lại những điều cần điều chỉnh, ưu điểm, hạn chế..."
                  />
               </div>

               <div className="flex justify-end gap-2 pt-2 pb-safe">
                 <button 
                    onClick={() => { setShowAddPlanModal(false); setShowEditPlanModal(false); }} 
                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                 >
                    Hủy
                 </button>
                 <button 
                    onClick={() => handleSavePlan(showEditPlanModal)} 
                    className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-blue-600 font-bold shadow-sm"
                 >
                    {showEditPlanModal ? 'Cập nhật' : 'Lưu Báo Giảng'}
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
