
import React, { useMemo } from 'react';
import { Book, Task, Student, TimetableData, TimetableSlot, ViewState, LessonPlanItem, HomeroomTask, ClassGroup, Habit } from '../types';
import { Icons } from '../constants';

interface DashboardViewProps {
  books: Book[];
  tasks: Task[];
  students: Student[];
  timetable: TimetableData;
  lessonPlans: LessonPlanItem[];
  homeroomTasks: HomeroomTask[];
  classes: ClassGroup[];
  habits: Habit[];
  onNavigate: (view: ViewState) => void;
  quote: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  books,
  tasks,
  students,
  timetable,
  lessonPlans,
  homeroomTasks,
  classes,
  habits,
  onNavigate,
  quote
}) => {
  // --- STATS ---
  const stats = {
    books: books.length,
    students: students.length,
    tasks: tasks.filter(t => !t.isCompleted).length,
    plans: lessonPlans.length
  };

  // --- URGENT & IMPORTANT TASKS ---
  const urgentTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const twoDaysLater = new Date(today);
    twoDaysLater.setDate(today.getDate() + 2);

    return tasks.filter(t => {
      if (t.isCompleted) return false;
      const d = new Date(t.deadline);
      d.setHours(0,0,0,0);
      
      // Filter logic: Deadline within 2 days OR Marked as Important
      const isUrgent = d <= twoDaysLater;
      return isUrgent || t.isImportant;
    }).sort((a,b) => {
       // Sort by Importance first, then deadline
       if (a.isImportant && !b.isImportant) return -1;
       if (!a.isImportant && b.isImportant) return 1;
       return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [tasks]);

  // --- TODAY'S TIMETABLE (FIRST CLASS LOGIC) ---
  const todaySchedule = useMemo(() => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const currentDay = days[new Date().getDay()];
    if (currentDay === 'CN') return [];

    // Prioritize first class in the list
    const targetClassId = classes.length > 0 ? classes[0].id : 'DEFAULT';

    const schedule: (TimetableSlot & { period: number; session: string })[] = [];
    
    const checkSlot = (session: string, period: number) => {
       // Try class-specific key first
       const key = `${targetClassId}-${currentDay}-${session}-${period}`;
       // Fallback to legacy key only if we are using DEFAULT class (backward compatibility)
       const legacyKey = `${currentDay}-${session}-${period}`;
       
       let slot = timetable[key];
       if (!slot && targetClassId === 'DEFAULT') {
          slot = timetable[legacyKey];
       }

       if (slot && slot.subject) {
         schedule.push({ period: period, session: session === 'Morning' ? 'Sáng' : 'Chiều', ...slot });
       }
    }

    // Check morning 1-4
    for (let i = 1; i <= 4; i++) checkSlot('Morning', i);
    // Check afternoon 1-4
    for (let i = 1; i <= 4; i++) checkSlot('Afternoon', i);

    return schedule;
  }, [timetable, classes]);

  // --- HABIT CHECK ---
  const uncheckedHabitsCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return habits.filter(h => !h.completedDates.includes(todayStr)).length;
  }, [habits]);

  const activeClassName = useMemo(() => {
     return classes.length > 0 ? classes[0].name : 'Mặc định';
  }, [classes]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 md:p-10 text-white relative overflow-hidden shrink-0">
         <div className="absolute top-0 right-0 p-10 opacity-10 transform translate-x-10 -translate-y-10">
            <div className="scale-[5]"><Icons.LayoutDashboard /></div>
         </div>
         
         <div className="relative z-10">
            <p className="text-blue-100 font-medium text-sm mb-1">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{greeting}, Thầy/Cô!</h1>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 max-w-2xl">
               <p className="italic text-sm md:text-base opacity-90">"{quote}"</p>
            </div>
         </div>
      </div>

      <div className="p-4 md:p-8 space-y-6 pb-24">
         
         {/* STATS GRID */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div onClick={() => onNavigate('LIBRARY')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group">
               <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform"><Icons.Library /></div>
                  <span className="text-2xl font-bold text-slate-800">{stats.books}</span>
               </div>
               <p className="text-sm text-slate-500 font-medium">Tài liệu</p>
            </div>

            <div onClick={() => onNavigate('HOMEROOM')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group">
               <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-sky-100 text-sky-600 rounded-lg group-hover:scale-110 transition-transform"><Icons.Users /></div>
                  <span className="text-2xl font-bold text-slate-800">{stats.students}</span>
               </div>
               <p className="text-sm text-slate-500 font-medium">Học sinh</p>
            </div>

            <div onClick={() => onNavigate('WORK_SCHEDULE')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group">
               <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-rose-100 text-rose-600 rounded-lg group-hover:scale-110 transition-transform"><Icons.Briefcase /></div>
                  <span className="text-2xl font-bold text-slate-800">{stats.tasks}</span>
               </div>
               <p className="text-sm text-slate-500 font-medium">Việc cần làm</p>
            </div>

            <div onClick={() => onNavigate('LESSON_PLAN')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group">
               <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg group-hover:scale-110 transition-transform"><Icons.Clipboard /></div>
                  <span className="text-2xl font-bold text-slate-800">{stats.plans}</span>
               </div>
               <p className="text-sm text-slate-500 font-medium">Báo giảng</p>
            </div>
         </div>

         {/* HABIT REMINDER (New) */}
         {uncheckedHabitsCount > 0 && (
            <div onClick={() => onNavigate('TIMETABLE')} className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-green-100 transition-colors shadow-sm">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-200 text-green-700 rounded-full animate-pulse"><Icons.LeafOak /></div>
                  <div>
                     <h4 className="font-bold text-green-800 text-sm md:text-base">Nhắc nhở Thói quen tốt</h4>
                     <p className="text-xs text-green-700">Bạn còn <span className="font-bold">{uncheckedHabitsCount}</span> thói quen chưa hoàn thành hôm nay. Cố lên nhé! 💪</p>
                  </div>
               </div>
               <div className="text-green-500"><Icons.ChevronRight /></div>
            </div>
         )}

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COL: URGENT TASKS */}
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                     <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Icons.Alert /> Việc cần xử lý gấp & Quan trọng
                     </h3>
                     <button onClick={() => onNavigate('WORK_SCHEDULE')} className="text-xs text-blue-600 hover:underline font-medium">Xem tất cả</button>
                  </div>
                  <div className="p-2">
                     {urgentTasks.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                           <div className="scale-125 mb-2 opacity-50"><Icons.CheckCircle /></div>
                           <p className="text-sm">Tuyệt vời! Không có deadline gấp.</p>
                        </div>
                     ) : (
                        <div className="space-y-2">
                           {urgentTasks.map(t => {
                              const isToday = new Date(t.deadline).toDateString() === new Date().toDateString();
                              return (
                                 <div key={t.id} className="flex items-center gap-3 p-3 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all">
                                    <div className={`w-2 h-12 rounded-full ${t.isImportant ? 'bg-yellow-400' : (isToday ? 'bg-red-500' : 'bg-orange-400')}`}></div>
                                    <div className="flex-1">
                                       <h4 className="font-bold text-slate-800 text-sm">{t.title}</h4>
                                       <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                          <span className={`font-bold ${isToday ? 'text-red-600' : 'text-orange-600'}`}>
                                             {isToday ? 'Hôm nay' : `Hạn: ${new Date(t.deadline).toLocaleDateString('vi-VN')}`}
                                          </span>
                                          <span>•</span>
                                          <span>{t.tag}</span>
                                       </div>
                                    </div>
                                    {t.isImportant && <div className="text-yellow-400"><Icons.Star filled /></div>}
                                 </div>
                              )
                           })}
                        </div>
                     )}
                  </div>
               </div>

               {/* QUICK ACTIONS */}
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Icons.Bot /> Tác vụ nhanh</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <button onClick={() => onNavigate('WORK_SCHEDULE')} className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors text-center">
                        + Thêm công việc
                     </button>
                     <button onClick={() => onNavigate('LIBRARY')} className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium transition-colors text-center">
                        + Thêm tài liệu
                     </button>
                     <button onClick={() => onNavigate('HOMEROOM')} className="p-3 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-sm font-medium transition-colors text-center">
                        + Ghi nhận thi đua
                     </button>
                     <button onClick={() => onNavigate('SEARCH')} className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-sm font-medium transition-colors text-center">
                        + Tìm kiếm
                     </button>
                  </div>
               </div>
            </div>

            {/* RIGHT COL: TODAY TIMETABLE */}
            <div>
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                     <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                           <Icons.Calendar /> Lịch dạy hôm nay
                        </h3>
                        {activeClassName && <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded font-bold">{activeClassName}</span>}
                     </div>
                     <p className="text-xs text-slate-500">
                        {new Date().getDay() === 0 ? 'Chủ nhật - Nghỉ ngơi' : `Thứ ${new Date().getDay() + 1}`}
                     </p>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto max-h-[400px]">
                     {todaySchedule.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                           <p>Hôm nay không có tiết dạy (hoặc chưa nhập).</p>
                           <button onClick={() => onNavigate('TIMETABLE')} className="text-blue-500 text-sm mt-2 hover:underline">Vào nhập lịch</button>
                        </div>
                     ) : (
                        <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 py-2">
                           {todaySchedule.map((slot, idx) => (
                              <div key={idx} className="relative pl-6">
                                 <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${slot.session === 'Sáng' ? 'bg-yellow-400' : 'bg-indigo-400'}`}></div>
                                 <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{slot.session} • Tiết {slot.period}</span>
                                    <h4 className="font-bold text-slate-800 text-base mt-1">{slot.subject}</h4>
                                    <div className="flex gap-2 text-xs text-slate-600 mt-1">
                                       {slot.room && <span className="bg-slate-100 px-2 py-0.5 rounded">Phòng {slot.room}</span>}
                                       {slot.note && <span className="italic opacity-80">{slot.note}</span>}
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
