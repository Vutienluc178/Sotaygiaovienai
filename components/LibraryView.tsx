import React, { useState, useMemo, useRef } from 'react';
import { Book, Folder, Collection } from '../types';
import { Icons } from '../constants';
import * as XLSX from 'xlsx';

interface LibraryViewProps {
  books: Book[];
  folders: Folder[];
  collections: Collection[];
  onOpenBook: (book: Book) => void;
  onDeleteBook: (id: string) => void;
  onAddFolder: (name: string, parentId: string | null) => void;
  onDeleteFolder: (id: string) => void;
  onAddBook: (book: Book) => void;
  onEditBook: (book: Book) => void;
  onResetLibrary: () => void;
  onAddCollection: (collection: Collection) => void;
  onDeleteCollection: (id: string) => void;
  onUpdateCollection: (collection: Collection) => void;
}

interface FolderNodeProps {
  folder: Folder;
  allFolders: Folder[];
  expandedFolders: Set<string>;
  selectedFolderId: string | null;
  onToggleExpand: (folderId: string) => void;
  onSelectFolder: (folderId: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

const FolderNode: React.FC<FolderNodeProps> = ({ 
  folder, 
  allFolders, 
  expandedFolders, 
  selectedFolderId, 
  onToggleExpand, 
  onSelectFolder,
  onDeleteFolder
}) => {
  const isExpanded = expandedFolders.has(folder.id);
  const isSelected = selectedFolderId === folder.id;
  const children = allFolders.filter(f => f.parentId === folder.id);
  const hasChildren = children.length > 0;

  return (
    <div className="select-none">
      <div 
        className={`group flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors ${
          isSelected ? 'bg-blue-100 text-primary' : 'hover:bg-slate-100 text-slate-700'
        }`}
        onClick={() => {
          onSelectFolder(folder.id);
          if(hasChildren && !isExpanded) onToggleExpand(folder.id);
        }}
      >
        <div 
          className="p-1 rounded hover:bg-black/5 text-slate-400"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(folder.id);
          }}
        >
          {hasChildren ? (
            isExpanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />
          ) : <div className="w-4 h-4" />}
        </div>
        <div className={isSelected ? 'text-yellow-500' : 'text-yellow-400'}>
           <Icons.Folder />
        </div>
        <span className="text-sm font-medium truncate flex-1">{folder.name}</span>
        
        {/* Delete Button */}
        <button 
          className={`p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ${isSelected ? 'opacity-50' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteFolder(folder.id);
          }}
          title="Xóa thư mục"
        >
           <div className="scale-75"><Icons.Trash /></div>
        </button>
      </div>
      
      {isExpanded && hasChildren && (
        <div className="pl-6 border-l border-slate-200 ml-3">
          {children.map(child => (
            <FolderNode 
              key={child.id} 
              folder={child} 
              allFolders={allFolders}
              expandedFolders={expandedFolders}
              selectedFolderId={selectedFolderId}
              onToggleExpand={onToggleExpand}
              onSelectFolder={onSelectFolder}
              onDeleteFolder={onDeleteFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const LibraryView: React.FC<LibraryViewProps> = ({ 
  books, 
  folders,
  collections,
  onOpenBook, 
  onDeleteBook,
  onAddFolder,
  onDeleteFolder,
  onAddBook,
  onEditBook,
  onResetLibrary,
  onAddCollection,
  onDeleteCollection,
  onUpdateCollection
}) => {
  const [viewMode, setViewMode] = useState<'FOLDERS' | 'COLLECTIONS'>('FOLDERS');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sorting & Filtering State
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'az'>('newest');
  const [filterSource, setFilterSource] = useState<'ALL' | 'DRIVE' | 'LINK' | 'LOCAL' | 'ONEDRIVE' | 'DROPBOX'>('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals state
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showAddCollectionModal, setShowAddCollectionModal] = useState(false);
  const [showAddToCollectionModal, setShowAddToCollectionModal] = useState<string | null>(null); // Book ID
  
  // Form state
  const [newFolderName, setNewFolderName] = useState('');
  const [targetParentId, setTargetParentId] = useState<string>('');
  
  // Collection Form State
  const [collectionName, setCollectionName] = useState('');
  const [collectionDesc, setCollectionDesc] = useState('');

  // Book Form State
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookLink, setBookLink] = useState('');
  const [bookCover, setBookCover] = useState('');
  const [targetFolderId, setTargetFolderId] = useState('');
  const [bookSource, setBookSource] = useState<'LINK' | 'DRIVE' | 'ONEDRIVE' | 'DROPBOX'>('LINK');

  // Derived state
  const rootFolders = useMemo(() => folders.filter(f => f.parentId === null), [folders]);
  
  const filteredBooks = useMemo(() => {
    let result = books;

    // View Mode Logic
    if (viewMode === 'FOLDERS') {
       if (selectedFolderId) {
         result = result.filter(b => b.folderId === selectedFolderId);
       }
    } else if (viewMode === 'COLLECTIONS') {
       if (selectedCollectionId) {
          const collection = collections.find(c => c.id === selectedCollectionId);
          if (collection) {
             result = result.filter(b => collection.bookIds.includes(b.id));
          } else {
             result = [];
          }
       } else {
          // If no collection selected in collection view, maybe show all or none? 
          // Let's show all for now or handled by render
       }
    }

    // Common Filters
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.title.toLowerCase().includes(query) || 
        b.author.toLowerCase().includes(query)
      );
    }

    if (filterSource !== 'ALL') {
      result = result.filter(b => b.source === filterSource);
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      } else if (sortOrder === 'oldest') {
        return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
      } else if (sortOrder === 'az') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [books, selectedFolderId, selectedCollectionId, viewMode, searchQuery, sortOrder, filterSource, collections]);

  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return folders.filter(f => f.name.toLowerCase().includes(query));
  }, [folders, searchQuery]);

  const toggleExpand = (folderId: string) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(folderId)) {
      newSet.delete(folderId);
    } else {
      newSet.add(folderId);
    }
    setExpandedFolders(newSet);
  };

  const openAddFolderModal = () => {
    setNewFolderName('');
    setTargetParentId(selectedFolderId || '');
    setShowAddFolderModal(true);
    setIsMobileMenuOpen(false); // Close mobile menu if open
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onAddFolder(newFolderName, targetParentId || null);
      setNewFolderName('');
      setShowAddFolderModal(false);
    }
  };

  // --- COLLECTION LOGIC ---
  const handleCreateCollection = () => {
     if (collectionName.trim()) {
        onAddCollection({
           id: `col-${Date.now()}`,
           name: collectionName,
           description: collectionDesc,
           bookIds: [],
           createdAt: new Date().toISOString()
        });
        setCollectionName('');
        setCollectionDesc('');
        setShowAddCollectionModal(false);
     }
  };

  const handleAddBookToCollection = (collectionId: string) => {
     if (!showAddToCollectionModal) return;
     const collection = collections.find(c => c.id === collectionId);
     if (collection && !collection.bookIds.includes(showAddToCollectionModal)) {
        onUpdateCollection({
           ...collection,
           bookIds: [...collection.bookIds, showAddToCollectionModal]
        });
        alert(`Đã thêm vào bộ sưu tập: ${collection.name}`);
     } else {
        alert("Sách đã có trong bộ sưu tập này!");
     }
     setShowAddToCollectionModal(null);
  };

  const handleRemoveBookFromCollection = (bookId: string) => {
     if (selectedCollectionId) {
        const collection = collections.find(c => c.id === selectedCollectionId);
        if (collection) {
           if(window.confirm(`Xóa sách khỏi bộ sưu tập ${collection.name}?`)) {
              onUpdateCollection({
                 ...collection,
                 bookIds: collection.bookIds.filter(id => id !== bookId)
              });
           }
        }
     }
  };

  const handleShareCollection = (collection: Collection) => {
     const booksInCol = books.filter(b => collection.bookIds.includes(b.id));
     const text = booksInCol.map(b => `- ${b.title} (${b.fileUrl})`).join('\n');
     navigator.clipboard.writeText(`Bộ sưu tập: ${collection.name}\n${text}`);
     alert("Đã sao chép danh sách sách vào bộ nhớ tạm!");
  };

  // --- BOOK FORM LOGIC ---
  const openAddBookModal = () => {
    setEditingBookId(null);
    setBookTitle('');
    setBookAuthor('');
    setBookLink('');
    setBookCover('');
    setBookSource('LINK');
    setTargetFolderId(selectedFolderId || folders[0]?.id || '');
    setShowBookModal(true);
  };

  const openEditBookModal = (book: Book) => {
    setEditingBookId(book.id);
    setBookTitle(book.title);
    setBookAuthor(book.author);
    setBookLink(book.fileUrl || '');
    setBookCover(book.coverUrl);
    // Cast strict type or fallback
    setBookSource((['LINK', 'DRIVE', 'ONEDRIVE', 'DROPBOX'].includes(book.source) ? book.source : 'LINK') as any);
    setTargetFolderId(book.folderId || folders[0]?.id || '');
    setShowBookModal(true);
  };

  const handleSaveBook = () => {
    if (bookLink.trim() && targetFolderId && bookTitle.trim()) {
      let fileUrl = bookLink;
      
      // Auto-detect drive link if user didn't switch source manually but pasted a drive link
      let source = bookSource;
      if (bookLink.includes('drive.google.com')) {
         source = 'DRIVE';
         if (!bookLink.includes('/preview')) {
            const match = bookLink.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) fileUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
         }
      } else if (bookLink.includes('dropbox.com')) {
         source = 'DROPBOX';
      } else if (bookLink.includes('onedrive') || bookLink.includes('sharepoint')) {
         source = 'ONEDRIVE';
      }

      const bookData: Book = {
        id: editingBookId || `link-${Date.now()}`,
        title: bookTitle,
        author: bookAuthor || 'Tác giả',
        coverUrl: bookCover || 'https://placehold.co/300x400?text=PDF',
        fileUrl: fileUrl,
        fileType: 'pdf',
        source: source,
        folderId: targetFolderId,
        uploadDate: new Date().toISOString()
      };

      if (editingBookId) {
        onEditBook(bookData);
      } else {
        onAddBook(bookData);
      }
      
      setShowBookModal(false);
    }
  };

  // --- EXCEL HANDLING ---
  const downloadTemplate = () => {
    const headers = [
      ['Tên Sách (Bắt buộc)', 'Tác Giả', 'Link File (Drive/Web)', 'Tên Thư Mục (Để phân loại)', 'Link Ảnh Bìa (Tùy chọn)']
    ];
    const data = [
      ['Toán Học 10', 'Bộ Giáo Dục', 'https://drive.google.com/file/d/xxxx/view', 'Toán Lớp 10', ''],
      ['Văn Học 11', 'Nguyễn Văn A', 'https://example.com/book.pdf', 'Ngữ Văn', '']
    ];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Nhap_Sach");
    XLSX.writeFile(wb, "EduDrive_Mau_Nhap_Sach.xlsx");
  };

  const exportLibrary = () => {
    const exportData = books.map(b => {
      const folderName = folders.find(f => f.id === b.folderId)?.name || 'Chưa phân loại';
      return {
        'Tên Sách': b.title,
        'Tác Giả': b.author,
        'Link File': b.fileUrl,
        'Tên Thư Mục': folderName,
        'Link Ảnh Bìa': b.coverUrl
      };
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Thu_Vien_Cua_Toi");
    XLSX.writeFile(wb, `EduDrive_Library_Export_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      let importedCount = 0;
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[0]) continue;
        const title = row[0];
        const author = row[1] || 'Unknown';
        let link = row[2] || '';
        const folderName = row[3];
        const cover = row[4] || 'https://placehold.co/300x400?text=Imported';
        if (link.includes('drive.google.com') && !link.includes('/preview')) {
           const match = link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
           if (match && match[1]) link = `https://drive.google.com/file/d/${match[1]}/preview`;
        }
        let targetFId = rootFolders[0]?.id;
        if (folderName) {
           const existingFolder = folders.find(f => f.name.toLowerCase() === folderName.toLowerCase());
           if (existingFolder) targetFId = existingFolder.id;
        }
        const newBook: Book = {
          id: `excel-${Date.now()}-${i}`,
          title: title,
          author: author,
          fileUrl: link,
          coverUrl: cover,
          fileType: 'pdf',
          source: link.includes('drive') ? 'DRIVE' : 'LINK',
          folderId: targetFId,
          uploadDate: new Date().toISOString()
        };
        onAddBook(newBook);
        importedCount++;
      }
      alert(`Đã nhập thành công ${importedCount} sách từ Excel!`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  // Reusable Tree Content
  const renderSidebarContent = () => (
    <>
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10">
        <h2 className="font-bold text-slate-800">Quản Lý</h2>
        <div className="flex gap-2">
           <button 
              onClick={onResetLibrary}
              className="p-1.5 hover:bg-red-50 text-red-500 rounded-md transition-colors"
              title="Xóa toàn bộ dữ liệu"
           >
             <Icons.Trash />
           </button>
        </div>
      </div>
      
      {/* TABS IN SIDEBAR */}
      <div className="flex border-b border-slate-100">
         <button 
            onClick={() => setViewMode('FOLDERS')}
            className={`flex-1 py-2 text-xs font-bold ${viewMode === 'FOLDERS' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}
         >
            Thư Mục
         </button>
         <button 
            onClick={() => setViewMode('COLLECTIONS')}
            className={`flex-1 py-2 text-xs font-bold ${viewMode === 'COLLECTIONS' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}
         >
            Bộ Sưu Tập
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {viewMode === 'FOLDERS' ? (
           <>
              <div className="flex justify-end mb-2">
                 <button onClick={openAddFolderModal} className="text-xs text-primary flex items-center gap-1 hover:underline"><Icons.Plus /> Tạo thư mục</button>
              </div>
              <div 
                className={`group flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors ${
                  selectedFolderId === null ? 'bg-blue-100 text-primary' : 'hover:bg-slate-100 text-slate-700'
                }`}
                onClick={() => {
                  setSelectedFolderId(null);
                  setSearchQuery('');
                  setIsMobileMenuOpen(false);
                }}
              >
                 <div className="p-1 text-slate-400 group-hover:text-primary transition-colors"><Icons.Library /></div>
                 <span className="text-sm font-medium truncate flex-1">Tất cả tài liệu</span>
                 <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full font-bold">{books.length}</span>
              </div>

              {rootFolders.map(f => (
                <FolderNode 
                  key={f.id} 
                  folder={f} 
                  allFolders={folders}
                  expandedFolders={expandedFolders}
                  selectedFolderId={selectedFolderId}
                  onToggleExpand={toggleExpand}
                  onSelectFolder={(id) => {
                    setSelectedFolderId(id);
                    setSearchQuery('');
                    setIsMobileMenuOpen(false);
                  }}
                  onDeleteFolder={onDeleteFolder}
                />
              ))}
           </>
        ) : (
           <>
              <div className="flex justify-end mb-2">
                 <button onClick={() => setShowAddCollectionModal(true)} className="text-xs text-primary flex items-center gap-1 hover:underline"><Icons.Plus /> Tạo BST</button>
              </div>
              {collections.map(col => (
                 <div 
                   key={col.id}
                   className={`group flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors ${
                     selectedCollectionId === col.id ? 'bg-purple-100 text-purple-700' : 'hover:bg-slate-100 text-slate-700'
                   }`}
                   onClick={() => {
                      setSelectedCollectionId(col.id);
                      setIsMobileMenuOpen(false);
                   }}
                 >
                    <div className="text-purple-400"><Icons.Collection /></div>
                    <div className="flex-1 min-w-0">
                       <div className="text-sm font-medium truncate">{col.name}</div>
                       <div className="text-[10px] text-slate-400">{col.bookIds.length} cuốn</div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={(e) => { e.stopPropagation(); handleShareCollection(col); }} className="p-1 hover:bg-white rounded text-blue-500" title="Copy danh sách"><Icons.Share /></button>
                       <button onClick={(e) => { e.stopPropagation(); onDeleteCollection(col.id); }} className="p-1 hover:bg-white rounded text-red-500"><Icons.Trash /></button>
                    </div>
                 </div>
              ))}
              {collections.length === 0 && <p className="text-center text-xs text-slate-400 mt-4 italic">Chưa có bộ sưu tập nào.</p>}
           </>
        )}
      </div>
      
      {/* EXCEL TOOLS AREA */}
      <div className="p-4 border-t border-slate-200 bg-blue-50">
         <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Đồng bộ & Dữ liệu</h3>
         <div className="space-y-2">
            <button 
              onClick={downloadTemplate}
              className="w-full flex items-center gap-2 text-xs bg-white border border-slate-200 p-2 rounded hover:bg-slate-50 transition-colors text-slate-900"
            >
              <Icons.Download /> Tải file mẫu (.xlsx)
            </button>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-2 text-xs bg-white border border-slate-200 p-2 rounded hover:bg-slate-50 transition-colors text-slate-900"
            >
              <Icons.Upload /> Nhập từ Excel
            </button>
            <input 
              type="file" 
              hidden 
              ref={fileInputRef} 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileUpload} 
            />

            <button 
              onClick={exportLibrary}
              className="w-full flex items-center gap-2 text-xs bg-primary text-white border border-transparent p-2 rounded hover:bg-blue-700 transition-colors"
            >
               <Icons.Table /> Xuất dữ liệu (Sync)
            </button>
         </div>
      </div>
    </>
  );

  return (
    <div className="flex h-full bg-white relative">
      {/* DESKTOP LEFT SIDEBAR */}
      <div className="w-72 border-r border-slate-200 flex-col bg-slate-50 shrink-0 hidden md:flex h-full">
         {renderSidebarContent()}
      </div>

      {/* MOBILE DRAWER (SLIDE-OVER) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col animate-[slideRight_0.3s_ease-out]">
             {renderSidebarContent()}
             <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-2 right-2 p-2 text-slate-400"
             >
               <Icons.Close />
             </button>
          </div>
        </div>
      )}

      {/* RIGHT CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 h-full">
        <header className="px-4 py-3 md:px-6 md:py-4 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            {/* Mobile Menu Button */}
            <button 
               onClick={() => setIsMobileMenuOpen(true)}
               className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
               <Icons.List />
            </button>

            <div className="flex-1 relative group max-w-lg">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                 <Icons.Search />
               </div>
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full border-none rounded-full py-2 pl-10 pr-10 text-sm focus:ring-2 focus:ring-primary/20 bg-slate-100 focus:bg-white text-slate-900 transition-all outline-none"
                 placeholder="Tìm kiếm..."
               />
               {searchQuery && (
                 <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                   <Icons.Close />
                 </button>
               )}
            </div>
            
            <button 
              onClick={openAddBookModal}
              className="bg-primary hover:bg-blue-700 text-white p-2 md:px-4 md:py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
              title="Thêm Sách"
            >
              <Icons.Plus /> <span className="hidden md:inline">Thêm Sách</span>
            </button>
          </div>

          {/* FILTERS & SORTING BAR */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
             {/* Sort Options */}
             <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs py-1.5 px-3 font-medium text-slate-700 outline-none focus:border-primary"
             >
                <option value="newest">Ngày gần nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="az">Tên A-Z</option>
             </select>

             {/* Source/Tag Filters */}
             {['ALL', 'DRIVE', 'LINK', 'LOCAL', 'ONEDRIVE', 'DROPBOX'].map(src => {
                let icon = <Icons.List />;
                if(src === 'DRIVE') icon = <Icons.Drive />;
                if(src === 'LINK') icon = <Icons.Link />;
                if(src === 'LOCAL') icon = <Icons.FileText />;
                if(src === 'ONEDRIVE') icon = <Icons.OneDrive />;
                if(src === 'DROPBOX') icon = <Icons.Dropbox />;
                
                let colorClass = 'bg-white text-slate-600 border-slate-200';
                if (filterSource === src) {
                   if(src === 'ALL') colorClass = 'bg-slate-800 text-white border-slate-800';
                   if(src === 'DRIVE') colorClass = 'bg-blue-600 text-white border-blue-600';
                   if(src === 'LINK') colorClass = 'bg-green-600 text-white border-green-600';
                   if(src === 'LOCAL') colorClass = 'bg-orange-500 text-white border-orange-500';
                   if(src === 'ONEDRIVE') colorClass = 'bg-blue-500 text-white border-blue-500';
                   if(src === 'DROPBOX') colorClass = 'bg-blue-700 text-white border-blue-700';
                }

                return (
                   <button 
                     key={src}
                     onClick={() => setFilterSource(src as any)}
                     className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors whitespace-nowrap flex items-center gap-1 ${colorClass}`}
                   >
                      <span className="scale-75">{icon}</span> {src === 'ALL' ? 'Tất cả' : src}
                   </button>
                )
             })}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          <div className="mb-6">
             {viewMode === 'COLLECTIONS' && selectedCollectionId ? (
                <div>
                   <h1 className="text-xl md:text-2xl font-bold text-slate-900 truncate flex items-center gap-2">
                      <Icons.Collection /> {collections.find(c => c.id === selectedCollectionId)?.name}
                   </h1>
                   <p className="text-slate-500 text-xs md:text-sm mt-1">{filteredBooks.length} tài liệu trong bộ sưu tập này</p>
                </div>
             ) : (
                <>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 truncate">
                    {folders.find(f => f.id === selectedFolderId)?.name || (viewMode === 'COLLECTIONS' ? 'Tất cả Bộ Sưu Tập' : 'Thư viện của tôi')}
                  </h1>
                  <p className="text-slate-500 text-xs md:text-sm mt-1">
                    {selectedFolderId 
                      ? `${filteredBooks.length} tài liệu trong thư mục` 
                      : (viewMode === 'COLLECTIONS' ? 'Chọn một bộ sưu tập để xem' : `Hiển thị toàn bộ ${books.length} tài liệu đã tải lên`)
                    }
                  </p>
                </>
             )}
          </div>

          {searchQuery && filteredFolders.length > 0 && viewMode === 'FOLDERS' && (
            <div className="mb-8">
              <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide">Thư mục tìm thấy</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {filteredFolders.map(folder => (
                  <div 
                    key={folder.id}
                    onClick={() => {
                      setSelectedFolderId(folder.id);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm cursor-pointer"
                  >
                    <div className="text-yellow-400"><Icons.Folder /></div>
                    <span className="text-sm font-medium truncate text-slate-900">{folder.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'COLLECTIONS' && !selectedCollectionId ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collections.map(col => (
                   <div 
                     key={col.id} 
                     onClick={() => setSelectedCollectionId(col.id)}
                     className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md border border-slate-200 cursor-pointer transition-all flex flex-col items-center text-center gap-3"
                   >
                      <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center">
                         <div className="scale-150"><Icons.Collection /></div>
                      </div>
                      <div>
                         <h3 className="font-bold text-lg text-slate-800">{col.name}</h3>
                         <p className="text-sm text-slate-500">{col.bookIds.length} sách</p>
                      </div>
                      {col.description && <p className="text-xs text-slate-400 italic line-clamp-2">"{col.description}"</p>}
                   </div>
                ))}
                {collections.length === 0 && <p className="col-span-full text-center text-slate-400">Chưa có bộ sưu tập nào.</p>}
             </div>
          ) : (
            <>
              {filteredBooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                     <Icons.Library />
                  </div>
                  <p className="text-center">{searchQuery ? 'Không tìm thấy tài liệu.' : 'Chưa có tài liệu nào.'}</p>
                  {!searchQuery && viewMode === 'FOLDERS' && <p className="text-xs mt-1 text-center px-4">Bấm "Thêm Sách" để tải lên tài liệu mới.</p>}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {filteredBooks.map((book) => (
                    <div 
                      key={book.id} 
                      className="group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all border border-slate-100 overflow-hidden flex flex-col"
                    >
                      <div 
                        className="aspect-[3/4] bg-slate-100 relative overflow-hidden cursor-pointer"
                        onClick={() => onOpenBook(book)}
                      >
                        <img 
                          src={book.coverUrl} 
                          alt={book.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/300x400?text=S%C3%A1ch';
                          }}
                        />
                        
                        {/* Source Icon Badge */}
                        <div className="absolute top-2 right-2 bg-white text-slate-700 p-1 rounded-full shadow-sm scale-75">
                           {book.source === 'LINK' && <Icons.Link />}
                           {book.source === 'DRIVE' && <span className="text-blue-500"><Icons.Drive /></span>}
                           {book.source === 'ONEDRIVE' && <span className="text-blue-400"><Icons.OneDrive /></span>}
                           {book.source === 'DROPBOX' && <span className="text-blue-700"><Icons.Dropbox /></span>}
                           {book.source === 'LOCAL' && <span className="text-orange-500"><Icons.FileText /></span>}
                        </div>
                        
                        {/* EDIT & ADD TO COLLECTION OVERLAY */}
                        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                              onClick={(e) => { e.stopPropagation(); setShowAddToCollectionModal(book.id); }}
                              className="bg-white/90 p-1.5 rounded-full shadow-md text-slate-600 hover:text-purple-500"
                              title="Thêm vào BST"
                           >
                              <div className="scale-75"><Icons.Collection /></div>
                           </button>
                           {viewMode === 'COLLECTIONS' && selectedCollectionId ? (
                              <button 
                                 onClick={(e) => { e.stopPropagation(); handleRemoveBookFromCollection(book.id); }}
                                 className="bg-white/90 p-1.5 rounded-full shadow-md text-slate-600 hover:text-red-500"
                                 title="Xóa khỏi BST"
                              >
                                 <div className="scale-75"><Icons.Close /></div>
                              </button>
                           ) : (
                              <button 
                                 onClick={(e) => { e.stopPropagation(); openEditBookModal(book); }}
                                 className="bg-white/90 p-1.5 rounded-full shadow-md text-slate-600 hover:text-primary"
                                 title="Chỉnh sửa"
                              >
                                 <div className="scale-75"><Icons.Edit /></div>
                              </button>
                           )}
                        </div>
                      </div>
                      <div className="p-3 md:p-4 flex-1 flex flex-col">
                        <h3 
                          className="font-bold text-slate-800 line-clamp-2 leading-tight mb-1 cursor-pointer text-sm"
                          onClick={() => onOpenBook(book)}
                        >
                          {book.title}
                        </h3>
                        <p className="text-xs text-slate-500 mb-2">{book.author}</p>
                        
                        <div className="mt-auto pt-2 border-t border-slate-50">
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-full max-w-[70%] truncate">
                                {folders.find(f => f.id === book.folderId)?.name}
                             </span>
                             <button 
                               onClick={(e) => { e.stopPropagation(); onDeleteBook(book.id); }}
                               className="text-slate-300 hover:text-red-500"
                             >
                               <div className="scale-75"><Icons.Trash /></div>
                             </button>
                          </div>
                          <div className="text-[9px] text-slate-400 text-right italic">
                             {new Date(book.uploadDate).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODAL: ADD FOLDER */}
      {showAddFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="px-5 py-4 border-b border-slate-100 font-bold text-lg">Tạo thư mục mới</div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên thư mục</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                  placeholder="Ví dụ: Đề thi học kỳ 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Thư mục cha</label>
                <select 
                  value={targetParentId}
                  onChange={(e) => setTargetParentId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                >
                  <option value="">-- Thư mục gốc (Root) --</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>
                       {f.level > 0 ? '--- ' : ''}{f.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAddFolderModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                <button onClick={handleCreateFolder} className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-blue-600">Tạo</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD COLLECTION */}
      {showAddCollectionModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-[fadeIn_0.2s_ease-out]">
               <div className="px-5 py-4 border-b border-slate-100 font-bold text-lg">Tạo Bộ Sưu Tập</div>
               <div className="p-5 space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Tên bộ sưu tập</label>
                     <input 
                        autoFocus
                        value={collectionName}
                        onChange={(e) => setCollectionName(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                        placeholder="VD: Sách hay tháng 10"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả (Tùy chọn)</label>
                     <textarea 
                        value={collectionDesc}
                        onChange={(e) => setCollectionDesc(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none h-20 resize-none bg-white text-slate-900"
                     />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                     <button onClick={() => setShowAddCollectionModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                     <button onClick={handleCreateCollection} className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-blue-600">Tạo</button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* MODAL: ADD TO COLLECTION */}
      {showAddToCollectionModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-[fadeIn_0.2s_ease-out]">
               <div className="px-5 py-4 border-b border-slate-100 font-bold text-lg">Thêm vào Bộ Sưu Tập</div>
               <div className="p-5">
                  <p className="text-sm text-slate-500 mb-3">Chọn bộ sưu tập để thêm sách:</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                     {collections.map(col => (
                        <button 
                           key={col.id}
                           onClick={() => handleAddBookToCollection(col.id)}
                           className="w-full text-left p-3 rounded border border-slate-200 hover:bg-purple-50 hover:border-purple-200 flex justify-between items-center transition-colors"
                        >
                           <span className="font-bold text-slate-700">{col.name}</span>
                           <span className="text-xs text-slate-400">{col.bookIds.length} sách</span>
                        </button>
                     ))}
                     {collections.length === 0 && <p className="text-center text-xs text-slate-400 italic">Bạn chưa tạo bộ sưu tập nào.</p>}
                  </div>
                  <div className="flex justify-end pt-4">
                     <button onClick={() => setShowAddToCollectionModal(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Đóng</button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* MODAL: ADD/EDIT BOOK */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-[fadeIn_0.2s_ease-out]">
             <div className="px-5 py-4 border-b border-slate-100 font-bold text-lg">
               {editingBookId ? 'Chỉnh sửa thông tin sách' : 'Thêm sách mới'}
             </div>
             <div className="p-5 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên sách (*)</label>
                  <input 
                    type="text" 
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                    placeholder="Nhập tên sách..."
                  />
               </div>
               
               <div className="flex gap-4">
                 <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tác giả</label>
                    <input 
                      type="text" 
                      value={bookAuthor}
                      onChange={(e) => setBookAuthor(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                      placeholder="VD: Bộ GD&ĐT"
                    />
                 </div>
                 <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nguồn (Source)</label>
                    <select 
                       value={bookSource} 
                       onChange={(e) => setBookSource(e.target.value as any)}
                       className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                    >
                       <option value="LINK">Web Link</option>
                       <option value="DRIVE">Google Drive</option>
                       <option value="ONEDRIVE">OneDrive</option>
                       <option value="DROPBOX">Dropbox</option>
                    </select>
                 </div>
               </div>

               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Link File (URL/Share Link) (*)</label>
                  <input 
                    type="text" 
                    value={bookLink}
                    onChange={(e) => setBookLink(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                    placeholder="https://..."
                  />
                  <p className="text-[10px] text-slate-400 mt-1 italic">Hỗ trợ link xem trước Google Drive, OneDrive, Dropbox.</p>
               </div>

               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Link Ảnh Bìa (URL)</label>
                  <input 
                    type="text" 
                    value={bookCover}
                    onChange={(e) => setBookCover(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                    placeholder="https://..."
                  />
               </div>

               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chọn thư mục (*)</label>
                  <select 
                    value={targetFolderId} 
                    onChange={(e) => setTargetFolderId(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white text-slate-900"
                  >
                    <option value="" disabled>-- Chọn thư mục --</option>
                    {folders.map(f => (
                      <option key={f.id} value={f.id}>
                         {f.level > 0 ? '--- ' : ''}{f.name}
                      </option>
                    ))}
                  </select>
               </div>
               
               <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-2">
                 <button onClick={() => setShowBookModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                 <button onClick={handleSaveBook} className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-blue-600">
                   {editingBookId ? 'Lưu thay đổi' : 'Thêm sách'}
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};