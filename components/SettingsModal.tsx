
import React, { useRef, useState } from 'react';
import { UserSettings } from '../types';
import { Icons } from '../constants';
import * as XLSX from 'xlsx';

interface SettingsModalProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onClose: () => void;
}

// Configuration for data keys and their human-readable labels
const DATA_CATEGORIES: { key: string; label: string; icon: React.FC<any> }[] = [
  { key: 'eduai_classes', label: 'Danh sách Lớp', icon: Icons.Users },
  { key: 'eduai_students', label: 'Danh sách Học sinh', icon: Icons.Users },
  { key: 'eduai_plans', label: 'Sổ Báo Giảng', icon: Icons.Clipboard },
  { key: 'eduai_timetable', label: 'Thời Khóa Biểu', icon: Icons.Calendar },
  { key: 'eduai_tasks', label: 'Lịch Công Tác', icon: Icons.Briefcase },
  { key: 'eduai_hrtasks', label: 'Phong trào Chủ nhiệm', icon: Icons.Flag }, // Assuming Flag or similar, using generic
  { key: 'eduai_records', label: 'Sổ Thi Đua (Kỷ luật/Khen thưởng)', icon: Icons.Award },
  { key: 'eduai_academic', label: 'Điểm số & Học tập', icon: Icons.Certificate },
  { key: 'eduai_books', label: 'Thư viện Sách', icon: Icons.Library },
  { key: 'eduai_folders', label: 'Cấu trúc Thư mục', icon: Icons.Folder },
  { key: 'eduai_prompts', label: 'Prompts AI', icon: Icons.Bot },
  { key: 'eduai_webs', label: 'Website yêu thích', icon: Icons.Globe },
  { key: 'eduai_watchlist', label: 'Danh sách theo dõi', icon: Icons.Alert },
  { key: 'eduai_profiles', label: 'Hồ sơ hình ảnh', icon: Icons.Archive },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state for form inputs
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);

  // State for Selective Restore
  const [pendingData, setPendingData] = useState<any>(null); // Stores the parsed JSON temporarily
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const handleSaveSettings = () => {
    onSave(localSettings);
    onClose();
  };

  // --- BACKUP & RESTORE LOGIC ---
  const getFullData = () => {
    const data: any = {};
    DATA_CATEGORIES.forEach(cat => {
       const val = localStorage.getItem(cat.key);
       if (val) data[cat.key] = JSON.parse(val);
    });
    // Also include subject colors which is separate
    const colors = localStorage.getItem('eduai_subject_colors');
    if (colors) data['eduai_subject_colors'] = JSON.parse(colors);
    
    return data;
  };

  const handleBackupJSON = () => {
    const data = getFullData();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SotayGV_Backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBackupExcel = () => {
     const wb = XLSX.utils.book_new();
     
     const addSheet = (key: string, sheetName: string) => {
        const raw = localStorage.getItem(key);
        if(raw) {
           try {
              const json = JSON.parse(raw);
              if(Array.isArray(json) && json.length > 0) {
                 const ws = XLSX.utils.json_to_sheet(json);
                 XLSX.utils.book_append_sheet(wb, ws, sheetName);
              } else if (typeof json === 'object' && sheetName === 'ThoiKhoaBieu') {
                 const flatData = Object.entries(json).map(([k, v]: [string, any]) => ({ Key: k, ...v }));
                 const ws = XLSX.utils.json_to_sheet(flatData);
                 XLSX.utils.book_append_sheet(wb, ws, sheetName);
              }
           } catch(e) {}
        }
     };

     addSheet('eduai_classes', 'Lop_Hoc');
     addSheet('eduai_students', 'Hoc_Sinh');
     addSheet('eduai_tasks', 'Cong_Viec');
     addSheet('eduai_plans', 'Bao_Giang');
     addSheet('eduai_hrtasks', 'Phong_Trao');
     addSheet('eduai_records', 'Thi_Dua');
     addSheet('eduai_academic', 'Diem_So');
     addSheet('eduai_books', 'Thu_Vien_Sach');
     addSheet('eduai_timetable', 'ThoiKhoaBieu');

     XLSX.writeFile(wb, `SotayGV_Excel_Data_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // Step 1: Read file and show selection UI
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = evt.target?.result as string;
        const data = JSON.parse(json);
        
        // Identify which keys exist in the uploaded file
        const availableKeys = new Set<string>();
        DATA_CATEGORIES.forEach(cat => {
           // Support both full key (eduai_x) and short key (x) for legacy compatibility
           const shortKey = cat.key.replace('eduai_', '');
           if (data[cat.key] || data[shortKey]) {
              availableKeys.add(cat.key);
           }
        });

        if (availableKeys.size === 0) {
           alert("File không chứa dữ liệu hợp lệ của Sổ Tay Giáo Viên.");
           return;
        }

        setPendingData(data);
        setSelectedKeys(availableKeys); // Default select all found
      } catch (err) {
        alert("File sao lưu không hợp lệ (Lỗi JSON).");
      }
    };
    reader.readAsText(file);
  };

  // Step 2: Perform the actual restore
  const confirmRestore = () => {
     if (!pendingData) return;

     let count = 0;
     selectedKeys.forEach(key => {
        const shortKey = key.replace('eduai_', '');
        // Prioritize full key, fallback to short key
        const content = pendingData[key] || pendingData[shortKey];
        
        if (content) {
           localStorage.setItem(key, JSON.stringify(content));
           count++;
        }
     });

     // Always restore subject colors if timetable is restored or if present
     if (pendingData['eduai_subject_colors'] || pendingData['subject_colors']) {
        const colors = pendingData['eduai_subject_colors'] || pendingData['subject_colors'];
        localStorage.setItem('eduai_subject_colors', JSON.stringify(colors));
     }

     alert(`Đã đồng bộ thành công ${count} mục dữ liệu! Ứng dụng sẽ tải lại.`);
     window.location.reload();
  };

  const toggleKey = (key: string) => {
     const newSet = new Set(selectedKeys);
     if (newSet.has(key)) newSet.delete(key);
     else newSet.add(key);
     setSelectedKeys(newSet);
  };

  const toggleSelectAll = () => {
     if (selectedKeys.size === 0) {
        const allFound = DATA_CATEGORIES.filter(cat => {
           const shortKey = cat.key.replace('eduai_', '');
           return pendingData[cat.key] || pendingData[shortKey];
        }).map(c => c.key);
        setSelectedKeys(new Set(allFound));
     } else {
        setSelectedKeys(new Set());
     }
  };

  // --- RENDER ---

  // RENDER: RESTORE SELECTION SCREEN
  if (pendingData) {
     return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-[slideUp_0.2s_ease-out] flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-100 bg-blue-50 flex justify-between items-center">
                 <div>
                    <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2">
                       <Icons.UploadCloud /> Chọn dữ liệu đồng bộ
                    </h2>
                    <p className="text-xs text-blue-600">File chứa {selectedKeys.size} danh mục dữ liệu hợp lệ.</p>
                 </div>
                 <button onClick={() => setPendingData(null)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                 <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-slate-600 italic">Chọn các mục bạn muốn ghi đè/khôi phục:</p>
                    <button onClick={toggleSelectAll} className="text-xs font-bold text-primary hover:underline">
                       {selectedKeys.size === 0 ? 'Chọn tất cả' : 'Bỏ chọn tất cả'}
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {DATA_CATEGORIES.map(cat => {
                       const shortKey = cat.key.replace('eduai_', '');
                       const hasData = pendingData[cat.key] || pendingData[shortKey];
                       
                       if (!hasData) return null; // Don't show missing categories

                       const isSelected = selectedKeys.has(cat.key);
                       
                       // Count items preview (naive check for array length)
                       let countLabel = '';
                       if (Array.isArray(hasData)) {
                          countLabel = `${hasData.length} mục`;
                       } else if (typeof hasData === 'object') {
                          countLabel = `${Object.keys(hasData).length} mục`;
                       }

                       return (
                          <div 
                             key={cat.key}
                             onClick={() => toggleKey(cat.key)}
                             className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${isSelected ? 'border-primary bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                          >
                             <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-primary border-primary' : 'bg-white border-slate-300'}`}>
                                {isSelected && <div className="text-white text-xs font-bold">✓</div>}
                             </div>
                             <div className={`p-2 rounded-full ${isSelected ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                <cat.icon />
                             </div>
                             <div className="flex-1">
                                <h4 className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-slate-700'}`}>{cat.label}</h4>
                                <span className="text-[10px] text-slate-500">{countLabel}</span>
                             </div>
                          </div>
                       )
                    })}
                 </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3">
                 <button onClick={() => setPendingData(null)} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold text-sm">Hủy bỏ</button>
                 <button 
                    onClick={confirmRestore}
                    disabled={selectedKeys.size === 0}
                    className="px-6 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-blue-700 shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
                 >
                    <Icons.UploadCloud /> Đồng bộ ({selectedKeys.size}) mục
                 </button>
              </div>
           </div>
        </div>
     );
  }

  // RENDER: MAIN SETTINGS SCREEN
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-[fadeIn_0.2s_ease-out]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Cài đặt hệ thống</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* API CONFIGURATION */}
          <div>
             <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                <Icons.Cpu /> Cấu hình AI & Cloud
             </h3>
             <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">Google Access Token (Drive & Classroom)</label>
                   <input 
                      type="password" 
                      value={localSettings.googleAccessToken || ''}
                      onChange={(e) => setLocalSettings({...localSettings, googleAccessToken: e.target.value})}
                      className="w-full border rounded px-3 py-2 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Nhập Access Token..."
                   />
                   <p className="text-[10px] text-slate-400 mt-1">Dùng để kết nối Google Drive và Classroom.</p>
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                      Gemini API Key (Google AI) <span className="text-red-500">*</span>
                   </label>
                   <input 
                      type="password" 
                      value={localSettings.geminiApiKey || ''}
                      onChange={(e) => setLocalSettings({...localSettings, geminiApiKey: e.target.value})}
                      className="w-full border rounded px-3 py-2 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="Nhập API Key Gemini..."
                   />
                   <p className="text-[10px] text-slate-400 mt-1">Cần thiết cho các tính năng: Chat AI, Phân tích hành vi học sinh.</p>
                   <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline">Lấy API Key tại đây</a>
                </div>
             </div>
          </div>

          <div className="border-t border-slate-100"></div>

          {/* BACKUP/RESTORE */}
          <div>
             <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Sao lưu & Đồng bộ</h3>
             <div className="grid grid-cols-1 gap-3">
                <button onClick={handleBackupJSON} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors text-blue-700">
                   <div className="flex items-center gap-3">
                      <Icons.Save />
                      <div className="text-left">
                         <span className="block text-sm font-bold">Sao lưu toàn bộ (JSON)</span>
                         <span className="block text-xs opacity-70">Chuyển dữ liệu sang máy khác</span>
                      </div>
                   </div>
                   <Icons.Download />
                </button>

                <button onClick={handleBackupExcel} className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-colors text-emerald-700">
                   <div className="flex items-center gap-3">
                      <Icons.Table />
                      <div className="text-left">
                         <span className="block text-sm font-bold">Xuất dữ liệu Excel</span>
                         <span className="block text-xs opacity-70">Xem (Chỉ đọc)</span>
                      </div>
                   </div>
                   <Icons.Download />
                </button>

                <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors text-slate-700 mt-2">
                   <div className="flex items-center gap-3">
                      <Icons.UploadCloud />
                      <div className="text-left">
                         <span className="block text-sm font-bold">Khôi phục / Đồng bộ từ file</span>
                         <span className="block text-xs opacity-70">Có tùy chọn dữ liệu cần nhập</span>
                      </div>
                   </div>
                   <Icons.Upload />
                </button>
                <input type="file" hidden ref={fileInputRef} accept=".json" onChange={handleFileSelect} />
             </div>
          </div>
          
          <div className="flex justify-end pt-4 gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-medium">Hủy</button>
            <button type="button" onClick={handleSaveSettings} className="px-6 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-blue-700 shadow-md transition-all">Lưu Cài Đặt</button>
          </div>
        </div>
      </div>
    </div>
  );
};
