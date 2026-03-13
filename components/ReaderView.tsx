import React, { useState, useEffect } from 'react';
import { Book, UserSettings } from '../types';
import { Icons } from '../constants';

interface ReaderViewProps {
  book: Book;
  onBack: () => void;
  settings: UserSettings;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ book, onBack }) => {
  // Page Navigation State
  const [pageInput, setPageInput] = useState('1');
  const [iframeSrc, setIframeSrc] = useState(book.fileUrl);

  // Reset state when book changes
  useEffect(() => {
    setIframeSrc(book.fileUrl);
    setPageInput('1');
  }, [book]);

  const handleJumpToPage = () => {
    if (!book.fileUrl) return;

    // Remove any existing hash
    const baseUrl = book.fileUrl.split('#')[0];
    
    // Check for Google Drive Preview links (which don't support #page=X param externally)
    if (baseUrl.includes('drive.google.com') && baseUrl.includes('/preview')) {
        alert("Lưu ý: Với link Xem trước của Google Drive, vui lòng sử dụng thanh cuộn hoặc ô nhập trang của chính Google Drive (bên trong khung hiển thị).");
        return;
    }

    // Update iframe src with #page=X
    setIframeSrc(`${baseUrl}#page=${pageInput}`);
  };

  const handleKeyDownPage = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleJumpToPage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Reader Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
            <Icons.Back />
          </button>
          <div className="max-w-[150px] md:max-w-xs">
             <h2 className="font-bold text-slate-800 text-sm md:text-base line-clamp-1" title={book.title}>{book.title}</h2>
          </div>
        </div>

        {/* Page Navigation Controls */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
            <span className="text-xs text-slate-500 pl-2 hidden sm:inline">Trang:</span>
            <input 
                type="number" 
                min="1"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onKeyDown={handleKeyDownPage}
                className="w-12 h-7 text-center text-sm border border-slate-300 rounded focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
            />
            <button 
                onClick={handleJumpToPage}
                className="h-7 w-7 flex items-center justify-center bg-white border border-slate-200 rounded hover:bg-primary hover:text-white hover:border-primary transition-colors text-slate-600"
                title="Đi đến trang"
            >
                <div className="scale-75"><Icons.ChevronRight /></div>
            </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF/Content Viewer */}
        <div className="flex-1 bg-slate-200 relative overflow-hidden flex items-center justify-center">
          {/* Using iframe for PDF viewing - robust native solution */}
          {book.fileType === 'pdf' ? (
             iframeSrc ? (
               <iframe 
                key={iframeSrc} // Force re-render on src change for some browsers
                src={iframeSrc} 
                className="w-full h-full border-none bg-white shadow-lg max-w-5xl mx-auto"
                title="PDF Viewer"
               />
             ) : (
                <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
                   <div className="text-6xl mb-4">📚</div>
                   <h3 className="text-xl font-bold mb-2">Chế độ Demo</h3>
                   <p className="text-slate-500 mb-4">Đây là sách mẫu được import từ Drive hoặc Mock.</p>
                   <p className="text-xs text-slate-400">Để xem file thực tế, vui lòng sử dụng chức năng "Tải lên từ thiết bị".</p>
                </div>
             )
          ) : (
            <img src={book.coverUrl} alt="Page" className="max-h-full max-w-full shadow-lg" />
          )}
        </div>
      </div>
    </div>
  );
};