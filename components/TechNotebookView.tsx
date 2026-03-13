import React, { useState, useMemo } from 'react';
import { TechPrompt, FavoriteWeb } from '../types';
import { Icons } from '../constants';

interface TechNotebookViewProps {
  prompts: TechPrompt[];
  webs: FavoriteWeb[];
  onAddPrompt: (prompt: TechPrompt) => void;
  onDeletePrompt: (id: string) => void;
  onAddWeb: (web: FavoriteWeb) => void;
  onDeleteWeb: (id: string) => void;
  onResetTech: () => void;
}

export const TechNotebookView: React.FC<TechNotebookViewProps> = ({
  prompts, webs, onAddPrompt, onDeletePrompt, onAddWeb, onDeleteWeb, onResetTech
}) => {
  const [activeTab, setActiveTab] = useState<'PROMPTS' | 'WEBS'>('PROMPTS');
  const [filterTag, setFilterTag] = useState<string>('Tất cả');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState('');
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');

  // Extract Unique Tags based on active tab
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    const source = activeTab === 'PROMPTS' ? prompts : webs;
    source.forEach(item => {
      if (item.tag && item.tag.trim()) tags.add(item.tag.trim());
    });
    return ['Tất cả', ...Array.from(tags)];
  }, [activeTab, prompts, webs]);

  // Handle Tab Switch (Reset filter)
  const handleSwitchTab = (tab: 'PROMPTS' | 'WEBS') => {
    setActiveTab(tab);
    setFilterTag('Tất cả');
  };

  // Filter Logic
  const filteredPrompts = prompts.filter(p => filterTag === 'Tất cả' || p.tag === filterTag);
  const filteredWebs = webs.filter(w => filterTag === 'Tất cả' || w.tag === filterTag);

  const handleSave = () => {
    if (activeTab === 'PROMPTS') {
      if (title && content) {
        onAddPrompt({
          id: `prompt-${Date.now()}`,
          title,
          content,
          tag,
          note
        });
        resetForm();
      }
    } else {
      if (title && link) {
        onAddWeb({
          id: `web-${Date.now()}`,
          title,
          link,
          tag,
          note
        });
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTag('');
    setNote('');
    setLink('');
    setShowModal(false);
  };

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <header className="px-6 py-5 bg-white border-b border-slate-200 shadow-sm shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Icons.Cpu /> Sổ Tay Công Nghệ
          </h1>
          <p className="text-sm text-slate-500 mt-1">Lưu trữ Prompts AI và Website hữu ích.</p>
        </div>
        
        <div className="flex gap-2">
           <button 
             onClick={onResetTech}
             className="text-red-500 hover:bg-red-50 p-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors border border-transparent hover:border-red-100"
             title="Xóa hết dữ liệu"
           >
              <Icons.Trash /> <span className="hidden md:inline">Làm mới</span>
           </button>
           <button 
             onClick={() => setShowModal(true)}
             className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm"
           >
             <Icons.Plus /> <span className="hidden md:inline">Thêm mới</span>
           </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 pt-3 flex gap-4 border-b border-slate-200 bg-white sticky top-0 z-10">
        <button 
          onClick={() => handleSwitchTab('PROMPTS')}
          className={`pb-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
             activeTab === 'PROMPTS' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Icons.Bot /> Prompts AI
        </button>
        <button 
          onClick={() => handleSwitchTab('WEBS')}
          className={`pb-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
             activeTab === 'WEBS' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Icons.Link /> Web Yêu Thích
        </button>
      </div>

      {/* Tag Filters */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-hide flex items-center gap-2 sticky top-[49px] z-10">
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
        {activeTab === 'PROMPTS' ? (
          <div className="grid gap-4 md:grid-cols-2">
             {filteredPrompts.length === 0 && <div className="text-slate-400 col-span-full text-center py-10">Không tìm thấy prompt nào.</div>}
             {filteredPrompts.map(p => (
               <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                     <h3 className="font-bold text-slate-800">{p.title}</h3>
                     <button onClick={() => onDeletePrompt(p.id)} className="text-slate-300 hover:text-red-500"><Icons.Trash /></button>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg text-sm font-mono text-slate-700 mb-3 whitespace-pre-wrap border border-slate-100 max-h-32 overflow-y-auto">
                     {p.content}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                     {p.tag && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{p.tag}</span>}
                     {p.note && <span className="text-slate-500 italic flex-1 text-right truncate">{p.note}</span>}
                  </div>
               </div>
             ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {filteredWebs.length === 0 && <div className="text-slate-400 col-span-full text-center py-10">Không tìm thấy website nào.</div>}
             {filteredWebs.map(w => (
               <div key={w.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                     <h3 className="font-bold text-slate-800 truncate pr-2" title={w.title}>{w.title}</h3>
                     <button onClick={() => onDeleteWeb(w.id)} className="text-slate-300 hover:text-red-500 shrink-0"><Icons.Trash /></button>
                  </div>
                  <a href={w.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm hover:underline truncate mb-2 block">
                     {w.link}
                  </a>
                  {w.note && <p className="text-sm text-slate-600 mb-3 line-clamp-2 bg-slate-50 p-2 rounded">{w.note}</p>}
                  <div className="mt-auto pt-2 border-t border-slate-50">
                     {w.tag && <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">{w.tag}</span>}
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-[fadeIn_0.2s_ease-out]">
             <div className="px-5 py-4 border-b border-slate-100 font-bold text-lg">
                {activeTab === 'PROMPTS' ? 'Thêm Prompt Mới' : 'Thêm Website Mới'}
             </div>
             <div className="p-5 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề / Nội dung chính</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                    placeholder={activeTab === 'PROMPTS' ? 'Ví dụ: Prompt soạn giáo án...' : 'Ví dụ: Cổng thông tin đào tạo...'}
                    autoFocus
                  />
               </div>

               {activeTab === 'PROMPTS' ? (
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung Prompt</label>
                    <textarea 
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none h-32 resize-none bg-white text-slate-900 font-mono"
                      placeholder="Nhập prompt chi tiết..."
                    />
                 </div>
               ) : (
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Đường dẫn (Link)</label>
                    <input 
                      type="text" 
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                      placeholder="https://..."
                    />
                 </div>
               )}

               <div className="flex gap-4">
                 <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Thẻ (Tag)</label>
                    <input 
                      type="text" 
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                      placeholder="VD: AI, Tools..."
                    />
                 </div>
               </div>

               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                  <input 
                    type="text" 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                    placeholder="Ghi chú thêm..."
                  />
               </div>

               <div className="flex justify-end gap-2 pt-2">
                 <button onClick={resetForm} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                 <button onClick={handleSave} className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-blue-600">Lưu</button>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};