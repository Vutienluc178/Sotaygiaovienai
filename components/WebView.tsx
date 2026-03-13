import React, { useState } from 'react';
import { Icons } from '../constants';

export const WebView: React.FC = () => {
  const [url, setUrl] = useState('https://www.google.com/search?igu=1'); // Google embeddable version
  const [inputUrl, setInputUrl] = useState('');

  const handleGo = () => {
    if (!inputUrl) return;
    let target = inputUrl.trim();
    if (!target.startsWith('http')) {
        target = 'https://' + target;
    }
    setUrl(target);
  };

  const handleQuickLink = (link: string) => {
    setUrl(link);
    setInputUrl(link);
  };

  const QUICK_LINKS = [
    { name: 'Google', url: 'https://www.google.com/search?igu=1', color: 'bg-blue-100 text-blue-600' },
    { name: 'Wikipedia', url: 'https://vi.wikipedia.org', color: 'bg-gray-100 text-gray-800' },
    { name: 'Bing', url: 'https://www.bing.com', color: 'bg-teal-100 text-teal-700' },
    { name: 'Violet.vn', url: 'https://violet.vn', color: 'bg-purple-100 text-purple-700' }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
       <header className="px-4 py-3 md:px-6 md:py-4 bg-white border-b border-slate-200 flex flex-col md:flex-row gap-3 items-center shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="bg-cyan-50 text-cyan-600 p-2 rounded-lg"><Icons.Globe /></div>
             <h1 className="font-bold text-slate-800 text-lg hidden md:block">Duyệt Web</h1>
          </div>
          
          <div className="flex-1 flex gap-2 w-full">
             <input 
               className="flex-1 bg-slate-100 border border-transparent focus:bg-white focus:border-cyan-500 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-cyan-100 outline-none transition-all text-slate-800"
               value={inputUrl}
               onChange={(e) => setInputUrl(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleGo()}
               placeholder="Nhập địa chỉ web (URL) hoặc tìm kiếm..."
             />
             <button onClick={handleGo} className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-full font-bold text-sm shadow-sm transition-colors">
               Đi
             </button>
          </div>
       </header>

       {/* Quick Links Toolbar */}
       <div className="bg-white border-b border-slate-200 px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
          {QUICK_LINKS.map(link => (
             <button 
               key={link.name}
               onClick={() => handleQuickLink(link.url)}
               className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-transform hover:scale-105 ${link.color}`}
             >
               {link.name}
             </button>
          ))}
       </div>

       <div className="flex-1 relative bg-slate-100 overflow-hidden">
          <iframe 
            src={url} 
            className="w-full h-full border-none bg-white" 
            title="Web Browser"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
          <div className="absolute top-0 left-0 right-0 bg-yellow-50 p-2 text-[10px] text-center text-yellow-800 opacity-90 border-b border-yellow-200">
             Lưu ý: Một số trang web (Facebook, Youtube...) chặn hiển thị trong ứng dụng này do chính sách bảo mật.
          </div>
       </div>
    </div>
  );
}