
import React, { useState, useRef, useMemo } from 'react';
import { TimetableData, TimetableSlot, DayOfWeek, Session, Period, ClassGroup, SubjectColorConfig, Habit } from '../types';
import { Icons } from '../constants';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

interface TimetableViewProps {
  data: TimetableData;
  classes: ClassGroup[];
  subjectColors: SubjectColorConfig;
  habits: Habit[];
  onUpdateSlot: (key: string, slot: TimetableSlot) => void;
  onUpdateSubjectColor: (subject: string, color: string) => void;
  onResetTimetable: () => void;
  onAddClass: (name: string) => void;
  onAddHabit: (name: string, classId: string) => void;
  onDeleteHabit: (id: string) => void;
  onToggleHabit: (id: string, date: string) => void;
}

const DAYS: { id: DayOfWeek; label: string }[] = [
  { id: 'T2', label: 'Thứ 2' },
  { id: 'T3', label: 'Thứ 3' },
  { id: 'T4', label: 'Thứ 4' },
  { id: 'T5', label: 'Thứ 5' },
  { id: 'T6', label: 'Thứ 6' },
  { id: 'T7', label: 'Thứ 7' },
  { id: 'CN', label: 'C.Nhật' },
];

const PERIODS: Period[] = [1, 2, 3, 4];

// Predefined modern pastel colors
const PRESET_COLORS = [
  '#fca5a5', // Red
  '#fdba74', // Orange
  '#fcd34d', // Amber
  '#bef264', // Lime
  '#86efac', // Green
  '#6ee7b7', // Emerald
  '#5eead4', // Teal
  '#67e8f9', // Cyan
  '#93c5fd', // Blue
  '#a5b4fc', // Indigo
  '#c4b5fd', // Violet
  '#f0abfc', // Fuchsia
  '#f9a8d4', // Pink
  '#e2e8f0', // Slate (Default/Light)
];

// Helper to get dates for the current week (Monday to Sunday)
const getCurrentWeekDates = () => {
  const today = new Date();
  const day = today.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  
  const monday = new Date(today.setDate(diff));
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(monday);
    nextDate.setDate(monday.getDate() + i);
    weekDates.push(nextDate.toISOString().split('T')[0]);
  }
  return weekDates; // Returns array of YYYY-MM-DD
};

export const TimetableView: React.FC<TimetableViewProps> = ({ 
  data, 
  classes, 
  subjectColors, 
  habits,
  onUpdateSlot, 
  onUpdateSubjectColor, 
  onResetTimetable,
  onAddClass,
  onAddHabit,
  onDeleteHabit,
  onToggleHabit
}) => {
  const [activeDay, setActiveDay] = useState<DayOfWeek>('T2');
  const [mobileViewMode, setMobileViewMode] = useState<'LIST' | 'GRID'>('GRID');
  const [isZoomed, setIsZoomed] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{key: string, day: DayOfWeek, session: Session, period: Period, data: TimetableSlot} | null>(null);
  
  // Default to first class if available, else 'DEFAULT'
  const [activeClassId, setActiveClassId] = useState<string>(classes.length > 0 ? classes[0].id : 'DEFAULT');

  // Add Class Modal State
  const [showClassModal, setShowClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  // Add Habit Modal State
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');

  const excelInputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const weekDates = useMemo(() => getCurrentWeekDates(), []);

  // Filter habits for current active class AND Default habits
  // This ensures the 10 default habits are always visible
  const classHabits = habits.filter(h => h.classId === activeClassId || h.classId === 'DEFAULT');

  // Generate a key for map lookup (including classId)
  const getKey = (day: DayOfWeek, session: Session, period: Period) => `${activeClassId}-${day}-${session}-${period}`;

  // Fallback key generator for legacy data (without class prefix)
  // Logic: If new key doesn't exist, try old key (for DEFAULT class mainly)
  const getSlot = (day: DayOfWeek, session: Session, period: Period): TimetableSlot => {
    const key = getKey(day, session, period);
    const legacyKey = `${day}-${session}-${period}`; // Legacy format
    
    // If active class is DEFAULT, we might want to show legacy data
    if (activeClassId === 'DEFAULT' && data[legacyKey] && !data[key]) {
       return data[legacyKey];
    }
    return data[key] || { subject: '', room: '', note: '' };
  };

  const handleEdit = (day: DayOfWeek, session: Session, period: Period) => {
    setEditingSlot({
      key: getKey(day, session, period),
      day,
      session,
      period,
      data: getSlot(day, session, period)
    });
  };

  const handleSave = () => {
    if (editingSlot) {
      onUpdateSlot(editingSlot.key, editingSlot.data);
      setEditingSlot(null);
    }
  };

  const handleCreateClass = () => {
    if (newClassName.trim()) {
      onAddClass(newClassName);
      setNewClassName('');
      setShowClassModal(false);
    }
  };

  const handleCreateHabit = () => {
    if (newHabitName.trim()) {
      onAddHabit(newHabitName, activeClassId);
      setNewHabitName('');
      setShowHabitModal(false);
    }
  };

  // --- COLOR LOGIC ---
  const getSubjectColor = (subject: string) => {
    if (!subject) return '#ffffff';
    // Return saved preference or generate default based on simple hash
    if (subjectColors[subject]) return subjectColors[subject];
    
    const len = subject.length;
    return PRESET_COLORS[len % PRESET_COLORS.length];
  };

  const handleColorChange = (color: string) => {
     if (editingSlot && editingSlot.data.subject) {
        onUpdateSubjectColor(editingSlot.data.subject, color);
     }
  };

  // --- EXPORT / IMPORT HANDLERS ---
  
  const handleExportImage = async () => {
    if (gridRef.current) {
      try {
        const canvas = await html2canvas(gridRef.current, { scale: 2 });
        const link = document.createElement('a');
        link.download = `TKB_${activeClassId}_${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        alert("Lỗi khi xuất ảnh");
      }
    }
  };

  const handleExportExcel = () => {
    // Flatten data for current class
    const exportData: Record<string, string | number>[] = [];
    const sessions: Session[] = ['Morning', 'Afternoon'];
    
    sessions.forEach(session => {
       PERIODS.forEach(period => {
          const row: any = { 'Buổi': session === 'Morning' ? 'Sáng' : 'Chiều', 'Tiết': period };
          DAYS.forEach(day => {
             const slot = getSlot(day.id, session, period);
             row[day.label] = slot.subject ? `${slot.subject}${slot.room ? ` (P.${slot.room})` : ''}` : '';
          });
          exportData.push(row);
       });
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TKB");
    XLSX.writeFile(wb, `TKB_${activeClassId}.xlsx`);
  };

  const handleExportICS = () => {
     let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//SotayGV//TKB//EN\n";
     
     // Simple recurring event generation for "Next Week" based on current schedule
     const today = new Date();
     // Find distance to next Monday
     const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
     const distanceToMonday = (dayOfWeek === 0 ? 1 : 8 - dayOfWeek) % 7 || 7; // if today is Sun(0), next Mon is +1. If Mon(1), next Mon is +7.
     
     const nextMonday = new Date(today);
     nextMonday.setDate(today.getDate() + distanceToMonday);
     nextMonday.setHours(0,0,0,0);

     const dayMap: Record<string, number> = { 'T2': 0, 'T3': 1, 'T4': 2, 'T5': 3, 'T6': 4, 'T7': 5, 'CN': 6 };
     
     DAYS.forEach(day => {
        const dayOffset = dayMap[day.id];
        const eventDate = new Date(nextMonday);
        eventDate.setDate(nextMonday.getDate() + dayOffset);
        
        ['Morning', 'Afternoon'].forEach(session => {
           PERIODS.forEach(period => {
              const slot = getSlot(day.id, session as Session, period);
              if (slot.subject) {
                 // Calculate time roughly
                 // Morning starts 7:00. Periods 45m. Breaks 5m.
                 let startHour = session === 'Morning' ? 7 : 13;
                 let startMin = 0;
                 const pIndex = period - 1;
                 const totalMinOffset = pIndex * 50; 
                 
                 const startTime = new Date(eventDate);
                 startTime.setHours(startHour, startMin + totalMinOffset);
                 
                 const endTime = new Date(startTime);
                 endTime.setMinutes(endTime.getMinutes() + 45);

                 const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

                 icsContent += "BEGIN:VEVENT\n";
                 icsContent += `DTSTART:${formatDate(startTime)}\n`;
                 icsContent += `DTEND:${formatDate(endTime)}\n`;
                 icsContent += `SUMMARY:${slot.subject}\n`;
                 if (slot.room) icsContent += `LOCATION:${slot.room}\n`;
                 if (slot.note) icsContent += `DESCRIPTION:${slot.note}\n`;
                 icsContent += `RRULE:FREQ=WEEKLY\n`; // Recurring weekly
                 icsContent += "END:VEVENT\n";
              }
           });
        });
     });

     icsContent += "END:VCALENDAR";
     const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
     const link = document.createElement('a');
     link.href = URL.createObjectURL(blob);
     link.download = `Lich_Hoc_${activeClassId}.ics`;
     link.click();
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
      
      // Heuristic Import: Look for header row with Day names
      let headerRowIndex = -1;
      const dayColMap: Record<string, number> = {};
      
      for(let i=0; i<data.length; i++) {
         const row = data[i];
         row.forEach((cell, colIdx) => {
            const str = String(cell).toUpperCase();
            DAYS.forEach(d => {
               if (str.includes(d.label.toUpperCase()) || str === d.id) {
                  dayColMap[d.id] = colIdx;
                  headerRowIndex = i;
               }
            });
         });
         if (headerRowIndex !== -1) break;
      }

      if (headerRowIndex === -1) {
         alert("Không tìm thấy tiêu đề ngày (Thứ 2, Thứ 3...) trong file.");
         return;
      }

      let count = 0;
      // Scan rows below header
      let currentSession: Session = 'Morning';
      
      for (let i = headerRowIndex + 1; i < data.length; i++) {
         const row = data[i];
         const firstCell = String(row[0] || '').toLowerCase();
         if (firstCell.includes('chiều') || firstCell.includes('afternoon')) currentSession = 'Afternoon';
         if (firstCell.includes('sáng') || firstCell.includes('morning')) currentSession = 'Morning';

         // Try to find period number
         let period: Period | null = null;
         row.forEach(cell => {
            const val = parseInt(String(cell));
            if ([1,2,3,4].includes(val)) period = val as Period;
         });

         if (period) {
            DAYS.forEach(day => {
               const colIdx = dayColMap[day.id];
               if (colIdx !== undefined && row[colIdx]) {
                  const content = String(row[colIdx]);
                  // Parse simple "Math (A1)"
                  const parts = content.split('(');
                  const subject = parts[0].trim();
                  const room = parts[1] ? parts[1].replace(')', '').trim() : '';
                  
                  const key = getKey(day.id, currentSession, period as Period);
                  onUpdateSlot(key, { subject, room, note: '' });
                  count++;
               }
            });
         }
      }
      alert(`Đã nhập ${count} tiết học cho lớp ${classes.find(c => c.id === activeClassId)?.name || 'Default'}`);
      if (excelInputRef.current) excelInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  // --- RENDER HELPERS ---

  const renderGridContent = (day: DayOfWeek, session: Session, period: Period) => {
    const slot = getSlot(day, session, period);
    const bgColor = getSubjectColor(slot.subject);
    
    // Determine text color based on background brightness (simple heuristic)
    // For pastel colors, dark text is usually best.
    const textColor = '#1e293b'; 

    return (
      <div 
        className={`h-full flex flex-col justify-center p-0.5 md:p-1 cursor-pointer transition-transform hover:scale-[1.02] rounded border border-transparent hover:border-slate-300 shadow-sm`}
        style={{ backgroundColor: slot.subject ? bgColor : 'transparent' }}
        onClick={() => handleEdit(day, session, period)}
      >
        {slot.subject ? (
          <>
            <div className="font-bold text-[8px] md:text-sm text-center leading-tight break-words line-clamp-2" style={{ color: textColor }}>
              {slot.subject}
            </div>
            {/* Notes & Room visible */}
            {(slot.room || slot.note) && (
              <div className="mt-0.5 text-[7px] md:text-[10px] text-center opacity-80 leading-tight" style={{ color: textColor }}>
                 {slot.room && <span className="block font-medium">{slot.room}</span>}
                 {slot.note && <span className="block italic text-[6px] md:text-[9px] truncate">{slot.note}</span>}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-10 md:opacity-0 hover:opacity-100">
            <span className="text-[10px] text-slate-300">+</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      <header className="px-4 py-3 md:px-6 md:py-4 bg-white border-b border-slate-200 shadow-sm shrink-0 flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-violet-50 text-violet-600 p-2 rounded-lg">
             <Icons.Calendar />
          </div>
          <div>
             <h1 className="text-xl font-bold text-slate-800">Thời Khóa Biểu</h1>
             {/* Class Switcher */}
             <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500">Đang xem:</span>
                <select 
                   value={activeClassId}
                   onChange={(e) => setActiveClassId(e.target.value)}
                   className="text-xs font-bold bg-slate-100 border-none rounded px-2 py-1 text-slate-800 cursor-pointer focus:ring-2 focus:ring-violet-200 outline-none max-w-[150px] truncate"
                >
                   <option value="DEFAULT">Lịch Cá Nhân (Chung)</option>
                   {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button 
                  onClick={() => setShowClassModal(true)}
                  className="bg-primary text-white w-5 h-5 rounded flex items-center justify-center text-xs hover:bg-blue-600 shadow-sm"
                  title="Thêm lớp học mới"
                >
                  +
                </button>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-hide pb-1">
           {/* Desktop Toolbar */}
           <button onClick={() => excelInputRef.current?.click()} className="text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors border border-green-100 whitespace-nowrap">
              <Icons.Upload /> Nhập Excel
           </button>
           <input type="file" hidden ref={excelInputRef} onChange={handleImportExcel} accept=".xlsx,.xls,.csv" />

           <button onClick={handleExportExcel} className="text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors whitespace-nowrap">
              <Icons.Download /> Xuất Excel
           </button>

           <button onClick={handleExportImage} className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors border border-blue-100 whitespace-nowrap">
              <Icons.Download /> Xuất Ảnh
           </button>

           <button onClick={handleExportICS} className="text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors border border-purple-100 whitespace-nowrap">
              <Icons.Calendar /> Sync Lịch
           </button>

           <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>

           <button 
             onClick={onResetTimetable}
             className="text-red-500 hover:bg-red-50 p-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
             title="Xóa hết dữ liệu"
           >
              <Icons.Trash />
           </button>

           {/* Mobile Toggle Button */}
           <div className="flex gap-2 md:hidden">
              {mobileViewMode === 'GRID' && (
                <button 
                   onClick={() => setIsZoomed(!isZoomed)}
                   className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm transition-colors ${isZoomed ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200'}`}
                >
                  {isZoomed ? <Icons.Close /> : <Icons.Search />}
                </button>
              )}
              <button 
               onClick={() => setMobileViewMode(prev => prev === 'LIST' ? 'GRID' : 'LIST')}
               className="flex items-center gap-2 bg-slate-100 text-primary px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 shadow-sm"
             >
               {mobileViewMode === 'LIST' ? <Icons.Table /> : <Icons.List />}
             </button>
           </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-slate-50 relative p-4 md:p-6 pb-24 md:pb-6">
        
        {/* --- MOBILE VIEW --- */}
        <div className="md:hidden">
          
          {mobileViewMode === 'LIST' ? (
            // === MOBILE LIST VIEW ===
            <div>
              {/* Sticky Day Selector */}
              <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm py-2 px-2 overflow-x-auto scrollbar-hide flex gap-2 shrink-0 mb-4">
                {DAYS.map(day => (
                  <button
                    key={day.id}
                    onClick={() => setActiveDay(day.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                      activeDay === day.id 
                        ? 'bg-primary text-white shadow-md transform scale-105' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {['Morning', 'Afternoon'].map((session) => (
                  <div key={session} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className={`px-4 py-2 border-b font-bold text-xs uppercase tracking-wide flex justify-between ${
                      session === 'Morning' ? 'bg-yellow-50 text-yellow-800 border-yellow-100' : 'bg-indigo-50 text-indigo-800 border-indigo-100'
                    }`}>
                      <span>{session === 'Morning' ? 'Buổi Sáng' : 'Buổi Chiều'}</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {PERIODS.map(period => {
                         const slot = getSlot(activeDay, session as Session, period);
                         return (
                           <div key={period} onClick={() => handleEdit(activeDay, session as Session, period)} className="p-3 flex items-center gap-3 active:bg-slate-50 cursor-pointer">
                              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs shrink-0">
                                {period}
                              </div>
                              <div className="flex-1 min-w-0 flex items-center justify-between">
                                 <div className="flex flex-col">
                                   <span className={`font-bold text-sm ${slot.subject ? 'text-slate-800' : 'text-slate-300 italic'}`}>
                                     {slot.subject || 'Trống'}
                                   </span>
                                   {(slot.room || slot.note) && (
                                     <span className="text-[10px] text-slate-500 truncate max-w-[150px]">
                                       {slot.room ? `P.${slot.room}` : ''} {slot.note ? `• ${slot.note}` : ''}
                                     </span>
                                   )}
                                 </div>
                                 <div className="text-slate-200"><Icons.Edit /></div>
                              </div>
                           </div>
                         );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // === MOBILE GRID VIEW (ALL DAYS) ===
            <div className={`w-full overflow-auto bg-white mb-6 border border-slate-200 rounded-xl shadow-sm ${isZoomed ? 'touch-pan-x touch-pan-y' : ''}`}>
               <div className={`bg-white transition-all duration-300 origin-top-left ${isZoomed ? 'w-[250%]' : 'w-full'}`}>
                  
                  {/* Grid Header */}
                  <div className="grid grid-cols-[20px_repeat(7,1fr)] bg-slate-100 border-b border-slate-200 sticky top-0 z-10">
                    <div className="p-1 text-[8px] font-bold text-center text-slate-500 flex items-center justify-center bg-slate-100">Tiết</div>
                    {DAYS.map(day => (
                      <div key={day.id} className="p-1 text-[9px] font-bold text-center text-slate-700 bg-slate-100 border-l border-slate-200">
                        {day.label}
                      </div>
                    ))}
                  </div>
                  
                  <div className="divide-y divide-slate-100">
                    {/* Morning Rows */}
                    <div className="bg-yellow-50/50 p-0.5 text-[8px] font-bold text-yellow-800 text-center border-b border-yellow-100">SÁNG</div>
                    {PERIODS.map(period => (
                      <div key={`m-${period}`} className="grid grid-cols-[20px_repeat(7,1fr)] border-b border-slate-100 last:border-b-0 min-h-[50px]">
                         <div className="flex items-center justify-center font-bold text-slate-400 text-[8px] bg-slate-50">{period}</div>
                         {DAYS.map(day => (
                           <div key={`${day.id}-m-${period}`} className="border-l border-slate-100 relative">
                              {renderGridContent(day.id, 'Morning', period)}
                           </div>
                         ))}
                      </div>
                    ))}

                    {/* Afternoon Rows */}
                    <div className="bg-indigo-50/50 p-0.5 text-[8px] font-bold text-indigo-800 text-center border-y border-indigo-100">CHIỀU</div>
                    {PERIODS.map(period => (
                      <div key={`a-${period}`} className="grid grid-cols-[20px_repeat(7,1fr)] border-b border-slate-100 last:border-b-0 min-h-[50px]">
                         <div className="flex items-center justify-center font-bold text-slate-400 text-[8px] bg-slate-50">{period}</div>
                         {DAYS.map(day => (
                           <div key={`${day.id}-a-${period}`} className="border-l border-slate-100 relative">
                              {renderGridContent(day.id, 'Afternoon', period)}
                           </div>
                         ))}
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* --- DESKTOP VIEW (Table with HTML2Canvas Ref) --- */}
        <div className="hidden md:block mb-8">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" ref={gridRef}>
             <div className="bg-violet-50 p-3 text-center border-b border-violet-100">
               <h2 className="text-sm font-bold text-violet-800 uppercase tracking-widest">
                 Thời Khóa Biểu - {classes.find(c => c.id === activeClassId)?.name || 'Lịch Cá Nhân'}
               </h2>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full min-w-[800px] border-collapse">
                 <thead>
                   <tr>
                     <th className="p-3 bg-slate-50 border-b border-r border-slate-200 w-16 text-center text-xs font-bold text-slate-500 uppercase">Tiết</th>
                     {DAYS.map(day => (
                       <th key={day.id} className="p-3 bg-slate-50 border-b border-slate-200 text-center text-xs font-bold text-slate-500 uppercase min-w-[100px]">
                         {day.label}
                       </th>
                     ))}
                   </tr>
                 </thead>
                 <tbody>
                   {/* Morning Rows */}
                   <tr><td colSpan={8} className="p-2 bg-yellow-50 text-yellow-800 text-xs font-bold text-center border-b border-slate-100">BUỔI SÁNG</td></tr>
                   {PERIODS.map(period => (
                     <tr key={`m-${period}`}>
                       <td className="p-3 border-b border-r border-slate-100 text-center font-bold text-slate-400">
                         {period}
                       </td>
                       {DAYS.map(day => (
                           <td 
                              key={`${day.id}-m-${period}`} 
                              className={`p-1 border-b border-slate-100 transition-colors cursor-pointer align-top h-20 border-r last:border-r-0`}
                           >
                              {renderGridContent(day.id, 'Morning', period)}
                           </td>
                       ))}
                     </tr>
                   ))}

                   {/* Afternoon Rows */}
                   <tr><td colSpan={8} className="p-2 bg-indigo-50 text-indigo-800 text-xs font-bold text-center border-b border-slate-100">BUỔI CHIỀU</td></tr>
                   {PERIODS.map(period => (
                     <tr key={`a-${period}`}>
                       <td className="p-3 border-b border-r border-slate-100 text-center font-bold text-slate-400">
                         {period}
                       </td>
                       {DAYS.map(day => (
                            <td 
                                key={`${day.id}-a-${period}`} 
                                className={`p-1 border-b border-slate-100 transition-colors cursor-pointer align-top h-20 border-r last:border-r-0`}
                            >
                                {renderGridContent(day.id, 'Afternoon', period)}
                            </td>
                        ))}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        </div>

        {/* --- HABIT TRACKER SECTION --- */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-12">
           <div className="px-6 py-4 bg-green-50 border-b border-green-100 flex justify-between items-center">
              <div>
                 <h3 className="font-bold text-green-800 flex items-center gap-2 text-lg">
                    <Icons.LeafOak /> Theo dõi Thói quen Tốt - {classes.find(c => c.id === activeClassId)?.name || 'Chung'}
                 </h3>
                 <p className="text-xs text-green-600 mt-1">Xây dựng lối sống lành mạnh & tích cực</p>
              </div>
              <button 
                 onClick={() => setShowHabitModal(true)}
                 className="bg-white text-green-600 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-100 flex items-center gap-1 shadow-sm"
              >
                 <Icons.Plus /> Thêm
              </button>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                 <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase">
                    <tr>
                       <th className="p-3 w-48 sticky left-0 bg-slate-50 z-10">Thói quen</th>
                       {DAYS.map((day, index) => {
                          const date = new Date(weekDates[index]);
                          return (
                             <th key={day.id} className="p-3 text-center min-w-[50px]">
                                {day.label} <br/> 
                                <span className="text-[10px] font-normal text-slate-400">{date.getDate()}/{date.getMonth()+1}</span>
                             </th>
                          );
                       })}
                       <th className="p-3 text-center w-24">Tổng kết</th>
                       <th className="p-3 text-right w-12"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {classHabits.map(habit => {
                       const weeklyCount = weekDates.filter(d => habit.completedDates.includes(d)).length;
                       const progress = (weeklyCount / 7) * 100;
                       
                       return (
                          <tr key={habit.id} className="hover:bg-slate-50 group">
                             <td className="p-3 font-medium text-slate-800 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-transparent group-hover:border-slate-200 transition-colors truncate max-w-[200px]" title={habit.name}>
                                {habit.name}
                             </td>
                             {weekDates.map((dateStr) => {
                                const isCompleted = habit.completedDates.includes(dateStr);
                                const isToday = dateStr === new Date().toISOString().split('T')[0];
                                return (
                                   <td key={dateStr} className={`p-2 text-center border-l border-slate-50 ${isToday ? 'bg-blue-50/30' : ''}`}>
                                      <button 
                                         onClick={() => onToggleHabit(habit.id, dateStr)}
                                         className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                                            isCompleted 
                                               ? 'bg-green-500 border-green-600 text-white shadow-sm scale-110' 
                                               : 'bg-white border-slate-300 text-transparent hover:border-green-400'
                                         }`}
                                      >
                                         <Icons.CheckCircle />
                                      </button>
                                   </td>
                                );
                             })}
                             <td className="p-3 text-center">
                                <div className="flex flex-col items-center gap-1">
                                   <span className="text-xs font-bold text-slate-700">{weeklyCount}/7</span>
                                   <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${progress}%` }}></div>
                                   </div>
                                </div>
                             </td>
                             <td className="p-3 text-right">
                                <button 
                                   onClick={() => onDeleteHabit(habit.id)}
                                   className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                   <Icons.Trash />
                                </button>
                             </td>
                          </tr>
                       );
                    })}
                    {classHabits.length === 0 && (
                       <tr>
                          <td colSpan={10} className="p-8 text-center text-slate-400 italic">Chưa có thói quen nào. Hãy thêm mới để theo dõi!</td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>

      </div>

      {/* EDIT MODAL */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-[slideUp_0.3s_ease-out]">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-slate-800">
                   {DAYS.find(d => d.id === editingSlot.day)?.label} - {editingSlot.session === 'Morning' ? 'Sáng' : 'Chiều'}
                </h3>
                <p className="text-xs text-slate-500">Tiết {editingSlot.period}</p>
              </div>
              <button onClick={() => setEditingSlot(null)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Môn học / Nội dung</label>
                <input 
                  type="text" 
                  autoFocus
                  value={editingSlot.data.subject}
                  onChange={(e) => setEditingSlot({...editingSlot, data: {...editingSlot.data, subject: e.target.value}})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                  placeholder="Ví dụ: Toán Học"
                />
              </div>
              
              {/* Color Picker */}
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">Màu sắc hiển thị</label>
                 <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map(color => {
                       // Check if this is the current subject's color
                       const isActive = editingSlot.data.subject && subjectColors[editingSlot.data.subject] === color;
                       return (
                          <button 
                             key={color}
                             onClick={() => handleColorChange(color)}
                             style={{ backgroundColor: color }}
                             className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${isActive ? 'border-slate-600 scale-110 shadow' : 'border-transparent'}`}
                             title={color}
                          />
                       )
                    })}
                 </div>
                 <p className="text-[10px] text-slate-400 mt-1 italic">Màu này sẽ áp dụng cho tất cả các tiết "{editingSlot.data.subject}"</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phòng học (Tùy chọn)</label>
                <input 
                  type="text" 
                  value={editingSlot.data.room}
                  onChange={(e) => setEditingSlot({...editingSlot, data: {...editingSlot.data, room: e.target.value}})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                  placeholder="Ví dụ: A101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú (Tùy chọn)</label>
                <textarea 
                  value={editingSlot.data.note}
                  onChange={(e) => setEditingSlot({...editingSlot, data: {...editingSlot.data, note: e.target.value}})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none h-20 resize-none bg-white text-slate-900"
                  placeholder="Ví dụ: Nhớ mang máy tính..."
                />
              </div>

              <div className="pt-2 flex gap-2">
                 <button 
                  onClick={() => setEditingSlot(null)}
                  className="flex-1 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                 >
                   Hủy
                 </button>
                 <button 
                  onClick={handleSave}
                  className="flex-1 py-2 rounded-lg bg-primary text-white hover:bg-blue-700 font-medium shadow-md"
                 >
                   Lưu
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD CLASS MODAL */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-[slideUp_0.3s_ease-out]">
            <div className="px-5 py-4 border-b border-slate-100 font-bold text-lg flex justify-between items-center">
              <span>Thêm Lớp Mới</span>
              <button onClick={() => setShowClassModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">Tên lớp học</label>
              <input 
                autoFocus
                type="text" 
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                placeholder="Ví dụ: 10A1, 11B2..."
                onKeyDown={(e) => e.key === 'Enter' && handleCreateClass()}
              />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowClassModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                <button onClick={handleCreateClass} className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-blue-600 font-bold">Thêm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD HABIT MODAL */}
      {showHabitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-[slideUp_0.3s_ease-out]">
            <div className="px-5 py-4 border-b border-slate-100 font-bold text-lg flex justify-between items-center">
              <span>Thêm Thói Quen Mới</span>
              <button onClick={() => setShowHabitModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">Tên thói quen</label>
              <input 
                autoFocus
                type="text" 
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                placeholder="Ví dụ: Đi bộ 15 phút..."
                onKeyDown={(e) => e.key === 'Enter' && handleCreateHabit()}
              />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowHabitModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                <button onClick={handleCreateHabit} className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-blue-600 font-bold">Thêm</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
