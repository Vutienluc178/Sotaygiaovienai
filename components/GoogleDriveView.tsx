import React, { useState } from 'react';
import { Book, UserSettings, DriveFile } from '../types';
import { Icons } from '../constants';

interface GoogleDriveViewProps {
  settings: UserSettings;
  onImportBook: (book: Book) => void;
  onOpenSettings: () => void;
}

// Helper to format bytes
const formatSize = (bytes?: number) => {
  if (!bytes) return '2.5 MB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const GoogleDriveView: React.FC<GoogleDriveViewProps> = ({ settings, onImportBook, onOpenSettings }) => {
  const [activeTab, setActiveTab] = useState<'single' | 'folder'>('folder');
  
  // Single File State
  const [driveLinkInput, setDriveLinkInput] = useState('');
  const [bookTitleInput, setBookTitleInput] = useState('');
  const [linkError, setLinkError] = useState('');

  // Folder Scan State
  const [folderLinkInput, setFolderLinkInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [folderResults, setFolderResults] = useState<DriveFile[]>([]);
  const [folderError, setFolderError] = useState('');
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

  // General Browse State
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // --- HELPERS ---

  const extractId = (url: string, type: 'file' | 'folder'): string | null => {
    const filePatterns = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/, 
      /id=([a-zA-Z0-9_-]+)/,         
      /\/open\?id=([a-zA-Z0-9_-]+)/ 
    ];

    const folderPatterns = [
      /\/folders\/([a-zA-Z0-9_-]+)/, 
      /id=([a-zA-Z0-9_-]+)/          
    ];

    const patterns = type === 'file' ? filePatterns : folderPatterns;

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }
    
    if (/^[a-zA-Z0-9_-]{10,}$/.test(url)) return url;
    return null;
  };

  // --- REAL API & SIMULATION HANDLERS ---

  const fetchRealDriveFiles = async (folderId: string, token: string) => {
    try {
      const cleanToken = token.trim();
      // Query: Inside folder, is PDF, not in trash
      const query = `'${folderId}' in parents and mimeType = 'application/pdf' and trashed = false`;
      const fields = 'files(id, name, mimeType, thumbnailLink, size, createdTime)';
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&pageSize=50`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
         throw new Error("Access Token không hợp lệ hoặc đã hết hạn. Vui lòng cập nhật lại trong phần Cài đặt.");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Lỗi kết nối Google Drive (Code: ${response.status})`);
      }

      const data = await response.json();
      return data.files || [];
    } catch (error: any) {
      console.error("Drive API Error:", error);
      throw error;
    }
  };

  const generateMockFiles = (folderId: string): DriveFile[] => {
    const subjects = ['Toán Học', 'Vật Lý', 'Hóa Học', 'Sinh Học', 'Ngữ Văn', 'Lịch Sử', 'Địa Lý', 'Tiếng Anh'];
    const types = ['Sách Giáo Khoa', 'Sách Bài Tập', 'Đề Thi Thử', 'Tài Liệu Ôn Tập'];
    const count = Math.floor(Math.random() * 8) + 3; // 3 to 10 files

    return Array.from({ length: count }).map((_, i) => {
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const grade = Math.floor(Math.random() * 3) + 10; // 10, 11, 12
      
      return {
        id: `mock-${folderId}-${i}`,
        name: `${type} ${subject} ${grade} - Bản PDF.pdf`,
        mimeType: 'application/pdf',
        thumbnailLink: `https://placehold.co/100x140?text=${subject}+${grade}`,
        iconLink: 'https://cdn-icons-png.flaticon.com/512/337/337946.png'
      };
    });
  };

  // --- ACTION HANDLERS ---

  const handleAddFromLink = () => {
    setLinkError('');
    if (!driveLinkInput.trim()) {
      setLinkError('Vui lòng nhập đường link.');
      return;
    }

    const fileId = extractId(driveLinkInput, 'file');
    if (!fileId) {
      setLinkError('Link không hợp lệ hoặc không tìm thấy ID file.');
      return;
    }

    const newBook: Book = {
      id: fileId,
      title: bookTitleInput.trim() || 'Tài liệu Drive Mới',
      author: 'Google Drive',
      coverUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo_%282020%29.svg',
      fileUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      fileType: 'pdf',
      source: 'DRIVE',
      uploadDate: new Date().toISOString()
    };

    onImportBook(newBook);
    setDriveLinkInput('');
    setBookTitleInput('');
    alert("Đã thêm sách thành công!");
  };

  const handleAnalyzeFolder = async () => {
    setFolderError('');
    setFolderResults([]);
    setSelectedFileIds(new Set());
    
    if (!folderLinkInput.trim()) {
      setFolderError('Vui lòng nhập Link hoặc ID Folder.');
      return;
    }

    const folderId = extractId(folderLinkInput, 'folder');
    if (!folderId) {
      setFolderError('Không tìm thấy ID Folder hợp lệ.');
      return;
    }

    setIsAnalyzing(true);

    try {
      if (settings.googleAccessToken) {
        // REAL MODE
        const realFiles = await fetchRealDriveFiles(folderId, settings.googleAccessToken);
        if (realFiles.length === 0) {
           setFolderError('Folder trống hoặc không chứa file PDF nào.');
        } else {
           setFolderResults(realFiles);
        }
      } else {
        // SIMULATION MODE
        await new Promise(resolve => setTimeout(resolve, 1500)); // Fake delay
        const mockFiles = generateMockFiles(folderId);
        setFolderResults(mockFiles);
      }
    } catch (err: any) {
      setFolderError(err.message || 'Có lỗi xảy ra khi đọc folder.');
      // If auth failed, we might want to suggest opening settings
      if (err.message && err.message.includes("Token")) {
        // Optional: Trigger a UI hint
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleFileSelection = (id: string) => {
    const newSet = new Set(selectedFileIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedFileIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedFileIds.size === folderResults.length) {
      setSelectedFileIds(new Set());
    } else {
      const allIds = new Set(folderResults.map(f => f.id));
      setSelectedFileIds(allIds);
    }
  };

  const handleBulkImport = () => {
    const filesToImport = folderResults.filter(f => selectedFileIds.has(f.id));
    
    filesToImport.forEach(file => {
      onImportBook({
        id: file.id,
        title: file.name.replace('.pdf', ''),
        author: 'Drive Import',
        coverUrl: file.thumbnailLink || 'https://placehold.co/300x400?text=PDF',
        fileUrl: `https://drive.google.com/file/d/${file.id}/preview`,
        fileType: 'pdf',
        source: 'DRIVE',
        uploadDate: new Date().toISOString()
      });
    });

    alert(`Đã nhập thành công ${filesToImport.length} tài liệu vào thư viện!`);
    setSelectedFileIds(new Set());
  };

  // --- LOCAL UPLOAD HANDLER ---

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const newBook: Book = {
        id: `local-${Date.now()}`,
        title: file.name.replace('.pdf', ''),
        author: 'Tài liệu tải lên',
        coverUrl: 'https://placehold.co/300x400?text=PDF',
        fileType: 'pdf',
        fileUrl: URL.createObjectURL(file),
        source: 'LOCAL',
        uploadDate: new Date().toISOString()
      };
      onImportBook(newBook);
    }
  };

  // --- BROWSE MOCK HANDLER ---

  const handleConnectDrive = async () => {
    setIsLoading(true);
    setTimeout(() => {
      // Just mock for the "Browse" tab which is separate from the Folder Analyzer
      const mockFiles = generateMockFiles('root');
      setFiles(mockFiles);
      setHasSearched(true);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-gray-50">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Icons.Drive /> Google Drive & Upload
        </h1>
        <p className="text-slate-500 mt-1">Kết nối, quét folder hoặc nhập link trực tiếp.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: IMPORT TOOLS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TABS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex border-b border-slate-100">
              <button 
                onClick={() => setActiveTab('folder')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'folder' ? 'bg-blue-50 text-primary border-b-2 border-primary' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Icons.Folder /> Quét Folder
              </button>
              <button 
                onClick={() => setActiveTab('single')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'single' ? 'bg-blue-50 text-primary border-b-2 border-primary' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Icons.Link /> Link File Lẻ
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'folder' ? (
                <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-slate-700">ID Folder hoặc Link Folder</label>
                      {!settings.googleAccessToken && (
                        <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded border border-yellow-200 cursor-help" title="Nhập Access Token trong Cài đặt để dùng API thật">Chế độ mô phỏng</span>
                      )}
                      {settings.googleAccessToken && (
                        <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded border border-green-200">API Connected</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={folderLinkInput}
                        onChange={(e) => setFolderLinkInput(e.target.value)}
                        placeholder="Ví dụ: https://drive.google.com/drive/folders/1A2b3C..."
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition-shadow"
                      />
                      <button 
                        onClick={handleAnalyzeFolder}
                        disabled={isAnalyzing}
                        className="bg-primary hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:bg-slate-300 whitespace-nowrap flex items-center gap-2"
                      >
                        {isAnalyzing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        {isAnalyzing ? 'Đang quét...' : 'Phân tích'}
                      </button>
                    </div>
                    {folderError && (
                       <div className="mt-2 text-red-600 bg-red-50 p-2 rounded text-xs border border-red-100 flex items-center gap-2 animate-[shake_0.5s_ease-in-out]">
                         <span className="font-bold flex-shrink-0">Lỗi:</span> 
                         <span>{folderError}</span>
                         {folderError.includes('Token') && (
                            <button onClick={onOpenSettings} className="ml-auto underline font-bold hover:text-red-800">Sửa Cài Đặt</button>
                         )}
                       </div>
                    )}
                  </div>

                  {/* FOLDER RESULTS AREA */}
                  {(folderResults.length > 0) && (
                    <div className="mt-6 border rounded-xl border-slate-200 overflow-hidden bg-white shadow-sm animate-[slideDown_0.3s_ease-out]">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                         <div className="flex items-center gap-3">
                           <input 
                              type="checkbox" 
                              checked={selectedFileIds.size === folderResults.length && folderResults.length > 0}
                              onChange={toggleSelectAll}
                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                           />
                           <span className="font-bold text-slate-700 text-sm">Chọn tất cả ({folderResults.length} file)</span>
                         </div>
                         
                         {selectedFileIds.size > 0 && (
                            <button 
                              onClick={handleBulkImport}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors shadow-sm"
                            >
                              Nhập {selectedFileIds.size} file vào thư viện
                            </button>
                         )}
                      </div>
                      
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                          {folderResults.map((file) => {
                            const isSelected = selectedFileIds.has(file.id);
                            return (
                              <div 
                                key={file.id} 
                                onClick={() => toggleFileSelection(file.id)}
                                className={`flex items-center justify-between p-3 hover:bg-blue-50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/50' : ''}`}
                              >
                                 <div className="flex items-center gap-3 overflow-hidden flex-1">
                                    <input 
                                      type="checkbox" 
                                      checked={isSelected}
                                      onChange={() => toggleFileSelection(file.id)}
                                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary pointer-events-none"
                                    />
                                    <div className="w-8 h-10 bg-slate-100 rounded border border-slate-200 flex-shrink-0 overflow-hidden">
                                       {file.thumbnailLink ? (
                                          <img src={file.thumbnailLink} alt="" className="w-full h-full object-cover" />
                                       ) : (
                                          <div className="flex items-center justify-center h-full text-slate-300 text-[8px]">PDF</div>
                                       )}
                                    </div>
                                    <div className="truncate min-w-0 flex-1">
                                      <div className="text-sm font-medium text-slate-800 truncate" title={file.name}>{file.name}</div>
                                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                        <span>ID: {file.id.substring(0, 10)}...</span>
                                        {/* Show size mock/real */}
                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                        <span>PDF</span>
                                      </div>
                                    </div>
                                 </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Đường dẫn file (Link chia sẻ)</label>
                    <input 
                      type="text" 
                      value={driveLinkInput}
                      onChange={(e) => setDriveLinkInput(e.target.value)}
                      placeholder="Ví dụ: https://drive.google.com/file/d/123abc.../view"
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                    {linkError && <p className="text-red-500 text-xs mt-1">{linkError}</p>}
                  </div>
                  
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tên sách (Tùy chọn)</label>
                      <input 
                        type="text" 
                        value={bookTitleInput}
                        onChange={(e) => setBookTitleInput(e.target.value)}
                        placeholder="Nhập tên sách..."
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                  </div>
                  <button 
                    onClick={handleAddFromLink}
                    className="bg-primary hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm w-full"
                  >
                    Thêm Sách
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* LOCAL UPLOAD */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <Icons.Plus /> Tải lên từ thiết bị
            </h2>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer relative h-32 group">
              <input 
                type="file" 
                accept=".pdf" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileUpload}
              />
              <div className="text-blue-500 mb-2 group-hover:scale-110 transition-transform">
                <Icons.FileText />
              </div>
              <p className="font-medium text-slate-700 text-sm">Chọn file PDF từ máy</p>
              <p className="text-xs text-slate-400 mt-1">Hỗ trợ PDF tối đa 50MB</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT / BROWSE MOCK */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold flex items-center gap-2">
              <Icons.Cloud /> Duyệt Drive Của Tôi
            </h2>
          </div>

          {!hasSearched ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 border-t border-slate-100 mt-4">
              <div className="p-3 bg-blue-50 rounded-full text-primary mb-2">
                <Icons.Drive />
              </div>
              <p className="text-slate-500 text-center text-xs px-4">
                Kết nối tài khoản để duyệt toàn bộ file của bạn trực quan.
              </p>
              <button 
                onClick={handleConnectDrive}
                disabled={isLoading}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 px-4 py-2 text-sm rounded-full font-medium transition-colors w-full"
              >
                {isLoading ? 'Đang kết nối...' : 'Kết nối Drive'}
              </button>
            </div>
          ) : (
            <div className="space-y-2 mt-4 animate-[fadeIn_0.3s_ease-out]">
              {files.map(file => (
                <div key={file.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg group border border-transparent hover:border-slate-100 transition-all">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="text-slate-400 scale-75"><Icons.FileText /></div>
                    <div className="truncate text-sm text-slate-700">{file.name}</div>
                  </div>
                  <button 
                    onClick={() => {
                       onImportBook({
                         id: file.id,
                         title: file.name.replace('.pdf', ''),
                         author: 'Drive',
                         coverUrl: 'https://placehold.co/300x400?text=File',
                         source: 'DRIVE',
                         fileType: 'pdf',
                         uploadDate: new Date().toISOString()
                       });
                    }}
                    className="opacity-0 group-hover:opacity-100 text-primary text-xs font-bold px-2 hover:bg-blue-50 rounded"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};