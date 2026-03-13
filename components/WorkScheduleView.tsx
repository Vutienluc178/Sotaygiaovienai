
import React, { useState, useMemo, useRef } from 'react';
import { Task, TaskAttachment, TaskComment, TaskHistory, RecurrenceType } from '../types';
import { Icons } from '../constants';
import * as XLSX from 'xlsx';

interface WorkScheduleViewProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onResetTasks: () => void;
}

// Simple microphone icon
const MicIcon = ({ active }: { active: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-red-500 animate-pulse" : "text-slate-400"}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="23"></line>
    <line x1="8" y1="23" x2="16" y2="23"></line>
  </svg>
);

export const WorkScheduleView: React.FC<WorkScheduleViewProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onResetTasks
}) => {
  // View Modes
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');
  
  // List View State
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVE'>('ACTIVE');
  const [filterTag, setFilterTag] = useState<string>('Tất cả');
  
  // Calendar View State
  const [calendarType, setCalendarType] = useState<'MONTH' | 'WEEK'>('MONTH');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal & Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null); // For Detail View
  const [detailTab, setDetailTab] = useState<'INFO' | 'COMMENTS' | 'FILES' | 'HISTORY'>('INFO');

  // Input States
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');
  const [deadline, setDeadline] = useState('');
  const [note, setNote] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [remindEmail, setRemindEmail] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Recurrence State
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('WEEKLY');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);

  // Comment Input
  const [newComment, setNewComment] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Extract Unique Tags
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    tasks.forEach(t => {
      if (t.tag && t.tag.trim()) tags.add(t.tag.trim());
    });
    return ['Tất cả', ...Array.from(tags)];
  }, [tasks]);

  // --- CALENDAR LOGIC ---
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  const getCalendarDays = () => {
    const days = [];
    const startOfWeek = getStartOfWeek(currentDate);

    if (calendarType === 'WEEK') {
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        days.push(d);
      }
    } else {
      // Month View
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      
      // Pad start
      const startPadding = (firstDayOfMonth.getDay() + 6) % 7; // Mon=0, Sun=6
      for (let i = 0; i < startPadding; i++) {
        days.push(null);
      }
      
      // Actual days
      for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        days.push(new Date(year, month, i));
      }
    }
    return days;
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      // Adjust date to preserve timezone issues when converting to YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const newDeadline = `${year}-${month}-${day}`;
      
      if (task.deadline !== newDeadline) {
        const historyEntry: TaskHistory = {
           id: `hist-${Date.now()}`,
           action: 'Dời lịch',
           timestamp: new Date().toISOString(),
           detail: `Từ ${task.deadline} sang ${newDeadline}`
        };
        onUpdateTask({ 
           ...task, 
           deadline: newDeadline,
           history: [historyEntry, ...(task.history || [])]
        });
      }
    }
  };

  const navigateCalendar = (direction: 'PREV' | 'NEXT' | 'TODAY') => {
    const newDate = new Date(currentDate);
    if (direction === 'TODAY') {
      setCurrentDate(new Date());
      return;
    }
    const step = direction === 'NEXT' ? 1 : -1;
    if (calendarType === 'MONTH') {
      newDate.setMonth(newDate.getMonth() + step);
    } else {
      newDate.setDate(newDate.getDate() + (step * 7));
    }
    setCurrentDate(newDate);
  };

  // --- LIST VIEW LOGIC ---
  const filteredTasks = tasks.filter(t => {
    const matchesTab = activeTab === 'ACTIVE' ? !t.isCompleted : t.isCompleted;
    const matchesTag = filterTag === 'Tất cả' || t.tag === filterTag;
    return matchesTab && matchesTag;
  });
  
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (activeTab === 'ACTIVE') {
      if (a.isImportant && !b.isImportant) return -1;
      if (!a.isImportant && b.isImportant) return 1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    } else {
      return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
    }
  });

  // --- COMMON HANDLERS ---
  const handleAddTask = () => {
    if (title.trim()) {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title,
        tag: tag || 'Chung',
        deadline: deadline || new Date().toISOString().split('T')[0],
        note,
        isCompleted: false,
        isImportant,
        remindEmail,
        comments: [],
        attachments: [],
        recurrence: isRecurring ? { type: recurrenceType, interval: recurrenceInterval } : undefined,
        history: [{
           id: `hist-${Date.now()}`,
           action: 'Tạo mới',
           timestamp: new Date().toISOString(),
           detail: 'Khởi tạo công việc'
        }]
      };
      onAddTask(newTask);
      setTitle(''); setTag(''); setDeadline(''); setNote('');
      setIsImportant(false); setRemindEmail(false);
      setIsRecurring(false); setRecurrenceInterval(1);
      setShowAddModal(false);
    }
  };

  const calculateNextRecurrenceDate = (dateStr: string, type: RecurrenceType, interval: number): string => {
    const date = new Date(dateStr);
    if (type === 'DAILY') {
      date.setDate(date.getDate() + interval);
    } else if (type === 'WEEKLY') {
      date.setDate(date.getDate() + (interval * 7));
    } else if (type === 'MONTHLY') {
      date.setMonth(date.getMonth() + interval);
    }
    return date.toISOString().split('T')[0];
  };

  const toggleComplete = (task: Task) => {
     const newStatus = !task.isCompleted;
     const historyEntry: TaskHistory = {
        id: `hist-${Date.now()}`,
        action: newStatus ? 'Hoàn thành' : 'Mở lại',
        timestamp: new Date().toISOString(),
        detail: newStatus ? 'Đánh dấu đã xong' : 'Đánh dấu chưa xong'
     };

     // Update current task
     onUpdateTask({ 
        ...task, 
        isCompleted: newStatus,
        history: [historyEntry, ...(task.history || [])]
     });

     // Auto-create next recurring task logic
     if (newStatus === true && task.recurrence) {
        if (window.confirm('Đây là công việc định kỳ. Bạn có muốn tạo tự động công việc tiếp theo không?')) {
           const nextDate = calculateNextRecurrenceDate(task.deadline, task.recurrence.type, task.recurrence.interval);
           const nextTask: Task = {
              ...task,
              id: `task-${Date.now()}-rec`,
              deadline: nextDate,
              isCompleted: false,
              history: [{
                 id: `hist-${Date.now()}-next`,
                 action: 'Tự động tạo',
                 timestamp: new Date().toISOString(),
                 detail: `Lặp lại từ công việc: ${task.title}`
              }]
           };
           onAddTask(nextTask);
        }
     }
  };

  const toggleImportant = (task: Task) => {
     onUpdateTask({ ...task, isImportant: !task.isImportant });
  };

  // --- CALENDAR INTEGRATIONS ---
  const addToGoogleCalendar = (task: Task) => {
    const dateStr = task.deadline.replace(/-/g, '');
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(task.title)}&details=${encodeURIComponent(task.note || '')}&dates=${dateStr}/${dateStr}`;
    window.open(calendarUrl, '_blank');
  };

  const addToAppleCalendar = (task: Task) => {
    const dateStr = task.deadline.replace(/-/g, '');
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GiaoVienAI//WorkSchedule//EN
BEGIN:VEVENT
UID:${task.id}@giaovienai.app
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART;VALUE=DATE:${dateStr}
SUMMARY:${task.title}
DESCRIPTION:${task.note || ''}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${task.title.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- EXPORT / IMPORT ---
  const handleExportExcel = () => {
    const data = tasks.map(t => ({
      'Tiêu đề': t.title,
      'Hạn chót': t.deadline,
      'Thẻ (Tag)': t.tag,
      'Quan trọng': t.isImportant ? 'Có' : 'Không',
      'Trạng thái': t.isCompleted ? 'Hoàn thành' : 'Chưa xong',
      'Ghi chú': t.note,
      'Lặp lại': t.recurrence ? `${t.recurrence.type} (Mỗi ${t.recurrence.interval})` : 'Không'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CongViec");
    XLSX.writeFile(wb, `Lich_Cong_Tac_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      
      // Skip header, assuming format: Title | Deadline | Tag | Note
      let count = 0;
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[0]) continue;
        const newTask: Task = {
          id: `task-imp-${Date.now()}-${i}`,
          title: String(row[0]),
          deadline: row[1] ? String(row[1]) : new Date().toISOString().split('T')[0],
          tag: row[2] ? String(row[2]) : 'Chung',
          note: row[3] ? String(row[3]) : '',
          isImportant: false,
          isCompleted: false,
          remindEmail: false,
          history: [{
             id: `hist-imp-${i}`,
             action: 'Import Excel',
             timestamp: new Date().toISOString(),
             detail: 'Nhập từ file Excel'
          }]
        };
        onAddTask(newTask);
        count++;
      }
      alert(`Đã nhập thành công ${count} công việc.`);
      if (importInputRef.current) importInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  // --- DETAIL VIEW HANDLERS ---
  const handleAddComment = () => {
     if (!selectedTask || !newComment.trim()) return;
     
     const comment: TaskComment = {
        id: `cmt-${Date.now()}`,
        content: newComment,
        createdAt: new Date().toISOString()
     };

     const updatedTask = {
        ...selectedTask,
        comments: [comment, ...(selectedTask.comments || [])]
     };

     onUpdateTask(updatedTask);
     setSelectedTask(updatedTask); // Keep modal sync
     setNewComment('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (!selectedTask || !e.target.files?.[0]) return;
     const file = e.target.files[0];
     
     // Limit file size to 2MB for localStorage safety
     if (file.size > 2 * 1024 * 1024) {
        alert("Vui lòng chọn file nhỏ hơn 2MB để đảm bảo hiệu năng.");
        return;
     }

     const reader = new FileReader();
     reader.onload = (evt) => {
        const base64 = evt.target?.result as string;
        const attachment: TaskAttachment = {
           id: `file-${Date.now()}`,
           name: file.name,
           type: file.type,
           size: (file.size / 1024).toFixed(1) + ' KB',
           url: base64
        };

        const historyEntry: TaskHistory = {
           id: `hist-${Date.now()}`,
           action: 'Đính kèm file',
           timestamp: new Date().toISOString(),
           detail: `Thêm file: ${file.name}`
        };

        const updatedTask = {
           ...selectedTask,
           attachments: [attachment, ...(selectedTask.attachments || [])],
           history: [historyEntry, ...(selectedTask.history || [])]
        };

        onUpdateTask(updatedTask);
        setSelectedTask(updatedTask);
     };
     reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = (fileId: string) => {
     if (!selectedTask) return;
     if (!window.confirm("Xóa file này?")) return;

     const updatedTask = {
        ...selectedTask,
        attachments: selectedTask.attachments?.filter(f => f.id !== fileId) || []
     };
     onUpdateTask(updatedTask);
     setSelectedTask(updatedTask);
  };

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Trình duyệt không hỗ trợ.");
      return;
    }
    if (isListening) { setIsListening(false); return; }
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = false;
    setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNote(prev => prev ? prev + ' ' + transcript : transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const formatDeadline = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    date.setHours(0,0,0,0);
    const diff = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    let colorClass = 'text-slate-500';
    let text = date.toLocaleDateString('vi-VN');
    if (diff < 0) { colorClass = 'text-red-500 font-bold'; text = `Quá hạn (${text})`; }
    else if (diff === 0) { colorClass = 'text-orange-500 font-bold'; text = 'Hôm nay'; }
    else if (diff === 1) { colorClass = 'text-blue-500 font-bold'; text = 'Ngày mai'; }
    return <span className={`text-xs ${colorClass}`}>{text}</span>;
  };

  return (
    <div className="flex h-full flex-col bg-gray-50 relative">
      <header className="px-6 py-5 bg-white border-b border-slate-200 shadow-sm shrink-0 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Icons.Briefcase /> Lịch Công Tác
          </h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý nhiệm vụ, hạn chót và nhắc nhở.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
           {/* IMPORT/EXPORT BUTTONS */}
           <div className="hidden md:flex gap-2">
              <button 
                onClick={handleExportExcel}
                className="px-3 py-1.5 rounded-md text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200 flex items-center gap-1 transition-colors"
                title="Xuất Excel"
              >
                 <Icons.Download /> Xuất
              </button>
              <button 
                onClick={() => importInputRef.current?.click()}
                className="px-3 py-1.5 rounded-md text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 flex items-center gap-1 transition-colors"
                title="Nhập Excel"
              >
                 <Icons.Upload /> Nhập
              </button>
              <input type="file" hidden ref={importInputRef} accept=".xlsx, .xls, .csv" onChange={handleImportExcel} />
           </div>

           <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('LIST')} 
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'LIST' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                 <Icons.List /> Danh sách
              </button>
              <button 
                onClick={() => setViewMode('CALENDAR')} 
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'CALENDAR' ? 'bg-white shadow text-primary' : 'text-slate-500 hover:text-slate-700'}`}
              >
                 <Icons.Calendar /> Lịch
              </button>
           </div>

           <button 
             onClick={onResetTasks}
             className="text-red-500 hover:bg-red-50 p-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors border border-transparent hover:border-red-100"
             title="Xóa hết dữ liệu"
           >
              <Icons.Trash />
           </button>

           <button 
             onClick={() => setShowAddModal(true)}
             className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm"
           >
             <Icons.Plus /> <span className="hidden md:inline">Thêm mới</span>
           </button>
        </div>
      </header>

      {/* VIEW CONTENT */}
      {viewMode === 'LIST' ? (
        <>
          {/* Tabs */}
          <div className="px-6 pt-3 flex gap-4 border-b border-slate-200 bg-white">
            <button 
              onClick={() => setActiveTab('ACTIVE')}
              className={`pb-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                 activeTab === 'ACTIVE' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Việc cần làm
            </button>
            <button 
              onClick={() => setActiveTab('ARCHIVE')}
              className={`pb-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                 activeTab === 'ARCHIVE' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icons.Archive /> Lưu trữ
            </button>
          </div>

          {/* Tag Filters */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-hide flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase mr-2"><Icons.Search /> Lọc:</span>
            {uniqueTags.map(t => (
              <button
                key={t}
                onClick={() => setFilterTag(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                  filterTag === t 
                    ? 'bg-primary text-white border-primary shadow-sm' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
            {activeTab === 'ACTIVE' ? (
              <div className="space-y-3">
                 {sortedTasks.length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                      <div className="scale-125 mb-3 opacity-50"><Icons.CheckCircle /></div>
                      <p>Không có công việc nào.</p>
                    </div>
                 )}
                 {sortedTasks.map(task => (
                   <div 
                     key={task.id} 
                     onClick={() => setSelectedTask(task)}
                     className={`rounded-xl p-4 border shadow-sm transition-all hover:shadow-md flex items-start gap-4 cursor-pointer ${
                       task.isImportant 
                         ? 'bg-amber-50 border-l-4 border-l-amber-400 border-y-amber-200 border-r-amber-200' 
                         : 'bg-white border-slate-200'
                     }`}
                   >
                     <button 
                       onClick={(e) => { e.stopPropagation(); toggleComplete(task); }}
                       className="mt-1 w-6 h-6 rounded border-2 border-slate-300 text-transparent hover:border-primary hover:text-primary/20 flex items-center justify-center transition-all bg-white"
                       title="Đánh dấu đã xong"
                     >
                       <Icons.CheckCircle />
                     </button>
                     
                     <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                           <h3 className={`font-bold text-base ${task.isImportant ? 'text-amber-900' : 'text-slate-800'}`}>
                             {task.title}
                           </h3>
                           <div className="flex gap-2">
                              {/* Calendar Dropdown Group */}
                              <div className="relative group">
                                 <button 
                                    className="text-slate-300 hover:text-blue-500 transition-colors"
                                    title="Thêm vào Lịch"
                                    onClick={(e) => e.stopPropagation()}
                                 >
                                    <Icons.Calendar />
                                 </button>
                                 <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded shadow-lg border border-slate-100 hidden group-hover:block z-10">
                                    <button 
                                       className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2"
                                       onClick={(e) => { e.stopPropagation(); addToGoogleCalendar(task); }}
                                    >
                                       <span>Google</span>
                                    </button>
                                    <button 
                                       className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2"
                                       onClick={(e) => { e.stopPropagation(); addToAppleCalendar(task); }}
                                    >
                                       <span>Apple/Outlook (.ics)</span>
                                    </button>
                                 </div>
                              </div>

                              <button onClick={(e) => { e.stopPropagation(); toggleImportant(task); }} className={`${task.isImportant ? 'text-amber-500' : 'text-slate-300'} hover:text-amber-400 transition-colors`}>
                                 <Icons.Star filled={task.isImportant} />
                              </button>
                           </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-1 mb-2">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${task.isImportant ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                              {task.tag}
                           </span>
                           <div className="flex items-center gap-1 text-xs">
                              <Icons.Calendar />
                              Hạn chót: {formatDeadline(task.deadline)}
                           </div>
                           {(task.attachments?.length || 0) > 0 && (
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                 <Icons.Link /> {task.attachments?.length} file
                              </div>
                           )}
                           {task.recurrence && (
                              <div className="flex items-center gap-1 text-xs text-purple-600 font-bold" title={`Lặp lại ${task.recurrence.type}`}>
                                 <div className="scale-75"><Icons.Clipboard /></div> Lặp lại
                              </div>
                           )}
                        </div>
                        
                        {task.note && (
                           <div className={`text-sm p-2 rounded border italic ${task.isImportant ? 'bg-amber-100/50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                              "{task.note}"
                           </div>
                        )}
                     </div>

                     <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="text-slate-300 hover:text-red-500 self-center">
                        <Icons.Trash />
                     </button>
                   </div>
                 ))}
              </div>
            ) : (
              <div className="space-y-3 opacity-75">
                 {sortedTasks.length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                      <p>Chưa có công việc nào trong mục này.</p>
                    </div>
                 )}
                 {sortedTasks.map(task => (
                   <div key={task.id} onClick={() => setSelectedTask(task)} className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center gap-4 cursor-pointer hover:bg-slate-100">
                      <button 
                         onClick={(e) => { e.stopPropagation(); toggleComplete(task); }}
                         className="w-6 h-6 rounded border border-green-500 bg-green-500 text-white flex items-center justify-center"
                         title="Hoàn tác (Chưa xong)"
                       >
                         <Icons.CheckCircle />
                       </button>
                       <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-500 line-through decoration-slate-400">{task.title}</h3>
                          <div className="text-xs text-slate-400 mt-1">Đã xong • {task.tag}</div>
                       </div>
                       <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="text-slate-300 hover:text-red-500">
                          <Icons.Trash />
                       </button>
                   </div>
                 ))}
              </div>
            )}
          </div>
        </>
      ) : (
        // === CALENDAR VIEW ===
        <div className="flex-1 flex flex-col overflow-hidden">
           {/* Calendar Controls */}
           <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                 <button onClick={() => navigateCalendar('PREV')} className="p-1 hover:bg-slate-200 rounded text-slate-600"><Icons.Back /></button>
                 <button onClick={() => navigateCalendar('TODAY')} className="text-xs font-bold px-2 py-1 bg-white border rounded hover:bg-slate-50">Hôm nay</button>
                 <button onClick={() => navigateCalendar('NEXT')} className="p-1 hover:bg-slate-200 rounded text-slate-600 rotate-180"><Icons.Back /></button>
                 <span className="font-bold text-slate-800 ml-2 text-sm md:text-base">
                    {calendarType === 'MONTH' 
                       ? `Tháng ${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`
                       : `Tuần từ ${getStartOfWeek(currentDate).toLocaleDateString('vi-VN')}`
                    }
                 </span>
              </div>
              <div className="flex bg-white rounded-lg border border-slate-200 p-0.5">
                 <button onClick={() => setCalendarType('WEEK')} className={`px-3 py-1 rounded text-xs font-bold ${calendarType === 'WEEK' ? 'bg-primary text-white' : 'text-slate-500'}`}>Tuần</button>
                 <button onClick={() => setCalendarType('MONTH')} className={`px-3 py-1 rounded text-xs font-bold ${calendarType === 'MONTH' ? 'bg-primary text-white' : 'text-slate-500'}`}>Tháng</button>
              </div>
           </div>

           {/* Calendar Grid */}
           <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-7 border-b border-slate-200 mb-2">
                 {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                    <div key={d} className="text-center text-xs font-bold text-slate-500 pb-2">{d}</div>
                 ))}
              </div>
              <div className="grid grid-cols-7 gap-2 auto-rows-fr">
                 {getCalendarDays().map((day, idx) => {
                    if (!day) return <div key={idx} className="bg-transparent" />; // Empty cell for month offset
                    
                    const dayTasks = tasks.filter(t => !t.isCompleted && new Date(t.deadline).toDateString() === day.toDateString());
                    const isToday = new Date().toDateString() === day.toDateString();

                    return (
                       <div 
                          key={idx} 
                          className={`min-h-[100px] border rounded-lg p-1 flex flex-col gap-1 transition-colors ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'} hover:border-blue-300`}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, day)}
                       >
                          <div className={`text-right text-xs font-medium p-1 ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                             {day.getDate()}
                          </div>
                          {dayTasks.map(t => (
                             <div 
                                key={t.id}
                                draggable
                                onClick={() => setSelectedTask(t)}
                                onDragStart={(e) => handleDragStart(e, t.id)}
                                className={`text-[10px] p-1.5 rounded border shadow-sm cursor-move truncate ${t.isImportant ? 'bg-amber-100 text-amber-900 border-amber-200' : 'bg-white text-slate-700 border-slate-100'}`}
                                title={t.title}
                             >
                                {t.title}
                             </div>
                          ))}
                       </div>
                    );
                 })}
              </div>
           </div>
        </div>
      )}

      {/* MOBILE ADD BUTTON */}
      {viewMode === 'LIST' && (
        <button 
          onClick={() => setShowAddModal(true)}
          className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-40 hover:scale-105 transition-transform"
        >
          <Icons.Plus />
        </button>
      )}

      {/* MODAL ADD TASK */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm md:p-4">
          <div className="bg-white w-full md:w-full md:max-w-md rounded-t-2xl md:rounded-xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] md:animate-[fadeIn_0.2s_ease-out] max-h-[90vh] flex flex-col">
             <div className="px-5 py-4 border-b border-slate-100 font-bold text-lg flex justify-between items-center shrink-0">
               <span>Thêm Công Việc Mới</span>
               <button onClick={() => setShowAddModal(false)} className="md:hidden p-1 bg-slate-100 rounded-full">
                 <Icons.ChevronDown />
               </button>
             </div>
             
             <div className="p-5 space-y-4 overflow-y-auto">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên nội dung công việc</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                    placeholder="Ví dụ: Nộp báo cáo chuyên môn..."
                    autoFocus
                  />
               </div>
               
               <div className="flex gap-4">
                 <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Thể loại (Tag)</label>
                    <input 
                      type="text" 
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                      placeholder="Họp, Chuyên môn..."
                    />
                 </div>
                 <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Hạn chót</label>
                    <input 
                      type="date" 
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                    />
                 </div>
               </div>

               {/* RECURRENCE OPTIONS */}
               <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <label className="flex items-center gap-2 cursor-pointer select-none mb-2">
                     <input 
                        type="checkbox" 
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                     />
                     <span className="text-sm font-bold text-purple-800">🔁 Lặp lại định kỳ (Template)</span>
                  </label>
                  
                  {isRecurring && (
                     <div className="flex gap-2 animate-[fadeIn_0.2s_ease-out]">
                        <div className="flex-1">
                           <select 
                              value={recurrenceType}
                              onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
                              className="w-full text-sm border rounded px-2 py-1 bg-white"
                           >
                              <option value="DAILY">Hàng ngày</option>
                              <option value="WEEKLY">Hàng tuần</option>
                              <option value="MONTHLY">Hàng tháng</option>
                           </select>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-slate-500">Mỗi</span>
                           <input 
                              type="number" 
                              min="1"
                              max="99"
                              value={recurrenceInterval}
                              onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                              className="w-12 text-sm border rounded px-2 py-1 bg-white text-center"
                           />
                           <span className="text-xs text-slate-500">
                              {recurrenceType === 'DAILY' ? 'ngày' : recurrenceType === 'WEEKLY' ? 'tuần' : 'tháng'}
                           </span>
                        </div>
                     </div>
                  )}
               </div>

               <div>
                  <div className="flex justify-between items-center mb-1">
                     <label className="block text-sm font-medium text-slate-700">Ghi chú</label>
                     <button 
                        onClick={toggleVoiceInput}
                        className={`text-xs flex items-center gap-1 px-2 py-1 rounded border transition-colors ${isListening ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                     >
                        <MicIcon active={isListening} />
                        {isListening ? 'Đang nghe...' : 'Nói để nhập'}
                     </button>
                  </div>
                  <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none h-20 resize-none bg-white text-slate-900"
                    placeholder="Chi tiết nội dung..."
                  />
               </div>

               <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                 <label className="flex items-center gap-2 cursor-pointer select-none bg-yellow-50 p-2 rounded border border-yellow-100">
                    <input 
                      type="checkbox" 
                      checked={isImportant}
                      onChange={(e) => setIsImportant(e.target.checked)}
                      className="w-4 h-4 text-yellow-500 rounded focus:ring-yellow-500"
                    />
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-1"><Icons.Star filled /> Quan trọng</span>
                 </label>

                 <label className="flex items-center gap-2 cursor-pointer select-none bg-blue-50 p-2 rounded border border-blue-100">
                    <input 
                      type="checkbox" 
                      checked={remindEmail}
                      onChange={(e) => setRemindEmail(e.target.checked)}
                      className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-1"><Icons.Bell active /> Nhắc mail</span>
                 </label>
               </div>

               <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-2 pb-safe">
                 <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                 <button onClick={handleAddTask} className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-blue-600 w-full sm:w-auto">Lưu công việc</button>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* --- MODAL TASK DETAIL (NEW) --- */}
      {selectedTask && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-[fadeIn_0.2s_ease-out]">
               {/* Detail Header */}
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                  <div className="flex-1 mr-4">
                     <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${selectedTask.isImportant ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>
                           {selectedTask.tag}
                        </span>
                        {selectedTask.recurrence && (
                           <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">
                              Lặp lại {selectedTask.recurrence.type}
                           </span>
                        )}
                        {selectedTask.isCompleted && <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">Đã hoàn thành</span>}
                     </div>
                     <h2 className="text-xl font-bold text-slate-800 leading-tight">{selectedTask.title}</h2>
                  </div>
                  <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
               </div>

               {/* Tabs */}
               <div className="flex border-b border-slate-200 px-6 gap-6 bg-white shrink-0">
                  <button onClick={() => setDetailTab('INFO')} className={`py-3 text-sm font-bold border-b-2 transition-colors ${detailTab === 'INFO' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>Thông tin</button>
                  <button onClick={() => setDetailTab('COMMENTS')} className={`py-3 text-sm font-bold border-b-2 transition-colors ${detailTab === 'COMMENTS' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>Trao đổi ({selectedTask.comments?.length || 0})</button>
                  <button onClick={() => setDetailTab('FILES')} className={`py-3 text-sm font-bold border-b-2 transition-colors ${detailTab === 'FILES' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>Tài liệu ({selectedTask.attachments?.length || 0})</button>
                  <button onClick={() => setDetailTab('HISTORY')} className={`py-3 text-sm font-bold border-b-2 transition-colors ${detailTab === 'HISTORY' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>Lịch sử</button>
               </div>

               {/* Detail Content */}
               <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                  {detailTab === 'INFO' && (
                     <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-white p-3 rounded-lg border border-slate-100">
                              <label className="text-xs text-slate-400 block mb-1">Hạn chót</label>
                              <div className="font-bold text-slate-800">{new Date(selectedTask.deadline).toLocaleDateString('vi-VN')}</div>
                           </div>
                           <div className="bg-white p-3 rounded-lg border border-slate-100">
                              <label className="text-xs text-slate-400 block mb-1">Trạng thái</label>
                              <div className={`font-bold ${selectedTask.isCompleted ? 'text-green-600' : 'text-orange-500'}`}>
                                 {selectedTask.isCompleted ? 'Đã xong' : 'Đang thực hiện'}
                              </div>
                           </div>
                        </div>
                        
                        <div>
                           <label className="text-sm font-bold text-slate-700 block mb-2">Ghi chú chi tiết</label>
                           <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm text-slate-700 min-h-[100px] whitespace-pre-wrap">
                              {selectedTask.note || 'Không có ghi chú.'}
                           </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-4">
                           <button onClick={() => toggleComplete(selectedTask)} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${selectedTask.isCompleted ? 'bg-slate-200 text-slate-600' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                              <Icons.CheckCircle /> {selectedTask.isCompleted ? 'Mở lại' : 'Hoàn thành'}
                           </button>
                        </div>
                     </div>
                  )}

                  {detailTab === 'COMMENTS' && (
                     <div className="flex flex-col h-full">
                        <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
                           {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                              <div className="text-center text-slate-400 py-8 italic">Chưa có ghi chú/trao đổi nào.</div>
                           )}
                           {selectedTask.comments?.map(cmt => (
                              <div key={cmt.id} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                 <div className="text-xs text-slate-400 mb-1">{new Date(cmt.createdAt).toLocaleString('vi-VN')}</div>
                                 <div className="text-sm text-slate-800 whitespace-pre-wrap">{cmt.content}</div>
                              </div>
                           ))}
                        </div>
                        <div className="flex gap-2">
                           <input 
                              className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary bg-white text-slate-900"
                              placeholder="Thêm ghi chú/tiến độ..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                           />
                           <button onClick={handleAddComment} className="bg-primary text-white p-2 rounded-lg hover:bg-blue-600"><Icons.Send /></button>
                        </div>
                     </div>
                  )}

                  {detailTab === 'FILES' && (
                     <div className="space-y-4">
                        <button 
                           onClick={() => fileInputRef.current?.click()}
                           className="w-full border-2 border-dashed border-slate-300 rounded-lg p-4 text-slate-500 hover:bg-slate-50 hover:border-primary hover:text-primary transition-colors flex flex-col items-center gap-2"
                        >
                           <Icons.UploadCloud />
                           <span className="text-sm font-medium">Nhấn để tải file lên (Max 2MB)</span>
                        </button>
                        <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} />

                        <div className="space-y-2">
                           {selectedTask.attachments?.map(file => (
                              <div key={file.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                                 <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="bg-blue-100 text-blue-600 p-2 rounded"><Icons.FileText /></div>
                                    <div className="min-w-0">
                                       <a href={file.url} download={file.name} className="block text-sm font-bold text-slate-800 truncate hover:text-primary hover:underline">{file.name}</a>
                                       <span className="text-xs text-slate-500">{file.size} • {file.type.split('/')[1] || 'File'}</span>
                                    </div>
                                 </div>
                                 <button onClick={() => handleRemoveAttachment(file.id)} className="text-slate-300 hover:text-red-500 p-2"><Icons.Trash /></button>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {detailTab === 'HISTORY' && (
                     <div className="space-y-4">
                        <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 py-2">
                           {selectedTask.history?.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(hist => (
                              <div key={hist.id} className="relative pl-6">
                                 <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 border border-white shadow-sm"></div>
                                 <div className="text-xs text-slate-400 mb-0.5">{new Date(hist.timestamp).toLocaleString('vi-VN')}</div>
                                 <div className="text-sm font-bold text-slate-700">{hist.action}</div>
                                 {hist.detail && <div className="text-xs text-slate-500 italic mt-0.5">{hist.detail}</div>}
                              </div>
                           ))}
                           {(!selectedTask.history || selectedTask.history.length === 0) && (
                              <p className="pl-6 text-sm text-slate-400 italic">Chưa có lịch sử ghi nhận.</p>
                           )}
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
