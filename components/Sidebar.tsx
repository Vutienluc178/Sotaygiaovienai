import React from 'react';
import { ViewState } from '../types';
import { Icons } from '../constants';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onOpenSettings: () => void;
}

// Define configuration for menu items with specific colors
const MENU_ITEMS: { 
  id: ViewState; 
  label: string; 
  icon: React.FC<any>; 
  activeBg: string; 
  activeText: string;
  baseColor: string; // Color when inactive
}[] = [
  { 
    id: 'DASHBOARD', 
    label: 'Tổng quan', 
    icon: Icons.LayoutDashboard, 
    activeBg: 'bg-blue-600', 
    activeText: 'text-white',
    baseColor: 'text-blue-600'
  },
  { 
    id: 'SEARCH', 
    label: 'Tìm kiếm', 
    icon: Icons.Search, 
    activeBg: 'bg-purple-600', 
    activeText: 'text-white',
    baseColor: 'text-purple-600'
  },
  { 
    id: 'LIBRARY', 
    label: 'Thư viện', 
    icon: Icons.Library, 
    activeBg: 'bg-emerald-600', 
    activeText: 'text-white',
    baseColor: 'text-emerald-600'
  },
  { 
    id: 'TIMETABLE', 
    label: 'Lịch học', 
    icon: Icons.Calendar, 
    activeBg: 'bg-violet-600', 
    activeText: 'text-white',
    baseColor: 'text-violet-600'
  },
  { 
    id: 'LESSON_PLAN', 
    label: 'Báo giảng', 
    icon: Icons.Clipboard, 
    activeBg: 'bg-amber-500', 
    activeText: 'text-white',
    baseColor: 'text-amber-600'
  },
  { 
    id: 'WORK_SCHEDULE', 
    label: 'Công tác', 
    icon: Icons.Briefcase, 
    activeBg: 'bg-rose-500', 
    activeText: 'text-white',
    baseColor: 'text-rose-600'
  },
  { 
    id: 'HOMEROOM', 
    label: 'Chủ nhiệm', 
    icon: Icons.Users, 
    activeBg: 'bg-sky-500', 
    activeText: 'text-white',
    baseColor: 'text-sky-600'
  },
  { 
    id: 'TECH', 
    label: 'Sổ tay CN', 
    icon: Icons.Cpu, 
    activeBg: 'bg-indigo-600', 
    activeText: 'text-white',
    baseColor: 'text-indigo-600'
  },
  { 
    id: 'GUIDE', 
    label: 'Hướng dẫn', 
    icon: Icons.BookOpen, 
    activeBg: 'bg-slate-600', 
    activeText: 'text-white',
    baseColor: 'text-slate-600'
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onOpenSettings }) => {
  
  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-20 md:w-24 bg-white border-r border-slate-200 flex-col items-center py-6 h-full z-10 shadow-sm flex-shrink-0 overflow-y-auto custom-scrollbar">
        {/* VTL LOGO */}
        <div className="mb-6 flex flex-col items-center justify-center cursor-default select-none">
           <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg mb-2 ring-2 ring-blue-100">
              <span className="text-white font-extrabold text-sm tracking-tighter">VTL</span>
           </div>
           <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Giáo Viên AI</div>
        </div>
        
        <nav className="flex-1 w-full px-2 flex flex-col items-center gap-2">
           {MENU_ITEMS.map((item) => {
             const isActive = currentView === item.id;
             return (
               <button 
                  key={item.id}
                  onClick={() => onChangeView(item.id)}
                  className={`p-3 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer w-full group ${
                    isActive 
                      ? `${item.activeBg} ${item.activeText} shadow-md scale-105 ring-1 ring-black/5` 
                      : 'hover:bg-slate-50'
                  }`}
                  title={item.label}
                >
                  <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'} ${isActive ? '' : item.baseColor}`}>
                    <item.icon />
                  </div>
                  <span className={`text-[10px] font-bold text-center leading-none ${isActive ? '' : 'text-slate-500'}`}>{item.label}</span>
                </button>
             );
           })}
        </nav>

        <div className="w-full px-2 mt-4 pt-4 border-t border-slate-100">
          <button 
            className="p-3 rounded-xl mb-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer w-full text-slate-400 hover:bg-slate-100 hover:text-slate-700" 
            onClick={onOpenSettings}
            title="Cài đặt"
          >
            <Icons.Settings />
            <span className="text-[10px] font-medium text-center">Cài đặt</span>
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM BAR (Scrollable) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 h-20 pb-4 overflow-x-auto scrollbar-hide shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center h-full px-2 min-w-max gap-1">
          {MENU_ITEMS.map((item) => {
             const isActive = currentView === item.id;
             return (
               <button 
                  key={item.id}
                  className={`flex flex-col items-center justify-center gap-1 py-1 px-3 transition-all min-w-[70px] rounded-lg ${
                    isActive 
                      ? `${item.baseColor} bg-slate-50 font-bold scale-105` 
                      : 'text-slate-400'
                  }`} 
                  onClick={() => onChangeView(item.id)}
                >
                  <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''} ${!isActive ? item.baseColor : ''} opacity-90`}>
                    <div className="scale-90"><item.icon /></div>
                  </div>
                  <span className="text-[9px] whitespace-nowrap">{item.label}</span>
               </button>
             );
          })}

          <div className="w-[1px] h-8 bg-slate-200 mx-1"></div>

          <button 
            className="flex flex-col items-center justify-center gap-1 py-1 px-3 transition-colors min-w-[60px] text-slate-400" 
            onClick={onOpenSettings}
          >
             <div className="scale-90"><Icons.Settings /></div>
             <span className="text-[9px] font-medium whitespace-nowrap">Cài đặt</span>
          </button>
        </div>
      </div>
    </>
  );
};
