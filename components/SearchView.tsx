import React, { useState, useMemo } from 'react';
import { Book, Student, Task, LessonPlanItem } from '../types';
import { Icons } from '../constants';

interface SearchViewProps {
  books: Book[];
  students: Student[];
  tasks: Task[];
  lessonPlans: LessonPlanItem[];
  onNavigateToBook: (book: Book) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ 
  books, students, tasks, lessonPlans, onNavigateToBook 
}) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'BOOKS' | 'STUDENTS' | 'TASKS' | 'PLANS'>('ALL');

  const results = useMemo(() => {
    if (!query.trim()) return null;
    const lowerQuery = query.toLowerCase();

    const filteredBooks = books.filter(b => b.title.toLowerCase().includes(lowerQuery) || b.author.toLowerCase().includes(lowerQuery));
    const filteredStudents = students.filter(s => s.name.toLowerCase().includes(lowerQuery));
    const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(lowerQuery) || t.note.toLowerCase().includes(lowerQuery));
    const filteredPlans = lessonPlans.filter(p => p.title.toLowerCase().includes(lowerQuery) || p.lessonName?.toLowerCase().includes(lowerQuery));

    return {
      books: filteredBooks,
      students: filteredStudents,
      tasks: filteredTasks,
      plans: filteredPlans,
      total: filteredBooks.length + filteredStudents.length + filteredTasks.length + filteredPlans.length
    };
  }, [query, books, students, tasks, lessonPlans]);

  const hasResults = results && results.total > 0;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="px-6 py-6 bg-white border-b border-slate-200 shadow-sm shrink-0">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Icons.Search /> Tìm kiếm nâng cao
        </h1>
        
        <div className="relative">
           <input 
             autoFocus
             type="text" 
             className="w-full border rounded-xl pl-12 pr-4 py-3 text-base focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none shadow-sm"
             placeholder="Nhập từ khóa (Tên sách, học sinh, công việc...)"
             value={query}
             onChange={e => setQuery(e.target.value)}
           />
           <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Icons.Search />
           </div>
           {query && (
             <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <Icons.Close />
             </button>
           )}
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide">
           {['ALL', 'BOOKS', 'STUDENTS', 'TASKS', 'PLANS'].map(f => (
             <button 
               key={f}
               onClick={() => setFilter(f as any)}
               className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                 filter === f 
                   ? 'bg-purple-600 text-white border-purple-600' 
                   : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
               }`}
             >
               {f === 'ALL' ? 'Tất cả' : f === 'BOOKS' ? 'Tài liệu' : f === 'STUDENTS' ? 'Học sinh' : f === 'TASKS' ? 'Công việc' : 'Báo giảng'}
             </button>
           ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
         {!query ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
               <div className="scale-[2] mb-4"><Icons.Search /></div>
               <p>Nhập từ khóa để bắt đầu tìm kiếm trên toàn bộ dữ liệu.</p>
            </div>
         ) : !hasResults ? (
            <div className="flex flex-col items-center justify-center pt-20 text-slate-400">
               <p>Không tìm thấy kết quả nào cho "{query}".</p>
            </div>
         ) : (
            <div className="space-y-8 max-w-4xl mx-auto">
               
               {/* BOOKS RESULTS */}
               {(filter === 'ALL' || filter === 'BOOKS') && results.books.length > 0 && (
                 <section>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                       <Icons.Library /> Tài liệu ({results.books.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {results.books.map(b => (
                          <div key={b.id} onClick={() => onNavigateToBook(b)} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex gap-3 cursor-pointer hover:border-purple-300 transition-colors">
                             <div className="w-10 h-14 bg-slate-100 rounded flex-shrink-0 overflow-hidden">
                                <img src={b.coverUrl} className="w-full h-full object-cover" alt="" />
                             </div>
                             <div className="overflow-hidden">
                                <div className="font-bold text-slate-800 truncate">{b.title}</div>
                                <div className="text-xs text-slate-500">{b.author}</div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </section>
               )}

               {/* STUDENTS RESULTS */}
               {(filter === 'ALL' || filter === 'STUDENTS') && results.students.length > 0 && (
                 <section>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                       <Icons.Users /> Học sinh ({results.students.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                       {results.students.map(s => (
                          <div key={s.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                             <div className="font-bold text-slate-800">{s.name}</div>
                             <div className="text-xs text-slate-500 flex justify-between mt-1">
                                <span>{s.gender}</span>
                                <span>{s.dob || 'N/A'}</span>
                             </div>
                          </div>
                       ))}
                    </div>
                 </section>
               )}

               {/* TASKS RESULTS */}
               {(filter === 'ALL' || filter === 'TASKS') && results.tasks.length > 0 && (
                 <section>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                       <Icons.Briefcase /> Công việc ({results.tasks.length})
                    </h3>
                    <div className="space-y-2">
                       {results.tasks.map(t => (
                          <div key={t.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-start gap-3">
                             <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${t.isCompleted ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                             <div>
                                <div className={`font-bold text-sm ${t.isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{t.title}</div>
                                <div className="text-xs text-slate-500 mt-1">{t.deadline} • {t.tag}</div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </section>
               )}

               {/* PLANS RESULTS */}
               {(filter === 'ALL' || filter === 'PLANS') && results.plans.length > 0 && (
                 <section>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                       <Icons.Clipboard /> Báo giảng ({results.plans.length})
                    </h3>
                    <div className="space-y-2">
                       {results.plans.map(p => (
                          <div key={p.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                             <div className="font-bold text-sm text-slate-800">{p.lessonName || p.title}</div>
                             <div className="text-xs text-slate-500 mt-1">Tuần {p.week} • Tiết {p.period}</div>
                          </div>
                       ))}
                    </div>
                 </section>
               )}
            </div>
         )}
      </div>
    </div>
  );
};
