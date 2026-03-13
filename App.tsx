
import React, { useState, useEffect } from 'react';
import { ViewState, Book, UserSettings, Folder, TimetableData, DayOfWeek, Session, Period, TimetableSlot, ClassGroup, LessonPlanItem, Task, Student, HomeroomTask, BehaviorRecord, TechPrompt, FavoriteWeb, StudentProfileImage, StudentWatchRecord, AcademicRecord, Collection, SubjectColorConfig, Habit } from './types';
import { LibraryView } from './components/LibraryView';
import { ReaderView } from './components/ReaderView';
import { TimetableView } from './components/TimetableView';
import { LessonPlanView } from './components/LessonPlanView';
import { WorkScheduleView } from './components/WorkScheduleView';
import { HomeroomView } from './components/HomeroomView';
import { TechNotebookView } from './components/TechNotebookView';
import { GuideView } from './components/GuideView';
import { DashboardView } from './components/DashboardView';
import { SearchView } from './components/SearchView';
import { Sidebar } from './components/Sidebar';
import { SettingsModal } from './components/SettingsModal';
import { AlertBanner } from './components/AlertBanner';
import { Icons } from './constants';

// --- DATA: 100 CÂU DANH NGÔN ---
const QUOTES = [
  // Giáo dục & Dạy học
  "Người thầy trung bình chỉ biết nói, người thầy giỏi biết giải thích, người thầy xuất chúng biết minh họa, người thầy vĩ đại biết cách truyền cảm hứng.",
  "Giáo dục không phải là việc đổ đầy một cái bình, mà là thắp sáng một ngọn lửa.",
  "Dạy học là đặt vết tích của một người vào sự phát triển của một người khác.",
  "Nghệ thuật dạy học chính là nghệ thuật giúp ai đó khám phá.",
  "Một đứa trẻ, một người thầy, một quyển sách và một cái bút có thể thay đổi cả thế giới.",
  "Đừng xấu hổ khi không biết, chỉ xấu hổ khi không học.",
  "Nhân cách của người thầy là sức mạnh có ảnh hưởng to lớn đối với học sinh.",
  "Thầy giáo là đường tinh, học sinh là đường đã lọc.",
  "Muốn sang thì bắc cầu Kiều, muốn con hay chữ thì yêu lấy thầy.",
  "Học không chơi đánh rơi tuổi trẻ, chơi không học bán rẻ tương lai.",
  "Tri thức là sức mạnh.",
  "Học tập là hạt giống của kiến thức, kiến thức là hạt giống của hạnh phúc.",
  "Đầu tư vào tri thức mang lại lợi nhuận cao nhất.",
  "Giáo dục là vũ khí mạnh nhất mà bạn có thể dùng để thay đổi thế giới.",
  "Thầy cô là người gieo mầm tri thức.",
  "Sự gương mẫu của người thầy là bài học thuyết phục nhất.",
  "Nhiệm vụ của người thầy xuất sắc là kích thích học trò dốc hết sức mình.",
  "Dạy là học hai lần.",
  "Không có học sinh dốt, chỉ có phương pháp chưa phù hợp.",
  "Sự kiên nhẫn là đức tính quan trọng nhất của người thầy.",
  "Hãy dạy học sinh cách tư duy, đừng chỉ dạy chúng kiến thức.",
  "Tình yêu thương là chìa khóa mở cửa trái tim học trò.",
  "Mỗi học sinh là một cá thể duy nhất cần được tôn trọng.",
  "Giáo dục là làm cho con người tìm thấy chính mình.",
  "Học để biết, học để làm, học để chung sống, học để tự khẳng định mình.",
  "Người thầy cầm tay, mở ra trí óc và chạm đến trái tim.",
  "Một gánh sách không bằng một người thầy giỏi.",
  "Trọng thầy mới được làm thầy.",
  "Nhất tự vi sư, bán tự vi sư.",
  "Dưới ánh mặt trời, không có nghề nào cao quý hơn nghề dạy học.",
  
  // Phong cách làm việc & Phát triển bản thân
  "Cách bạn làm một việc là cách bạn làm mọi việc.",
  "Thành công không đến từ những gì bạn làm tuỳ hứng, mà đến từ những gì bạn làm liên tục.",
  "Kỷ luật là cầu nối giữa mục tiêu và thành tựu.",
  "Đừng để ngày hôm qua chiếm quá nhiều thời gian của ngày hôm nay.",
  "Thất bại là mẹ thành công.",
  "Hãy làm việc trong im lặng và để thành công lên tiếng.",
  "Sự chuẩn bị tốt nhất cho ngày mai là làm tốt nhất việc của ngày hôm nay.",
  "Đừng đếm ngày tháng, hãy làm ngày tháng trở nên đáng nhớ.",
  "Không quan trọng bạn đi chậm thế nào, miễn là đừng bao giờ dừng lại.",
  "Thái độ quyết định trình độ.",
  "Muốn đi nhanh hãy đi một mình, muốn đi xa hãy đi cùng nhau.",
  "Cơ hội thường ngụy trang dưới lốt của sự làm việc chăm chỉ.",
  "Đừng đợi cơ hội, hãy tạo ra nó.",
  "Làm việc thông minh quan trọng hơn làm việc chăm chỉ.",
  "Sự chuyên nghiệp bắt đầu từ việc đúng giờ.",
  "Hãy sống như thể bạn sẽ chết ngày mai. Hãy học như thể bạn sẽ sống mãi mãi.",
  "Khó khăn không trường tồn, chỉ có con người bản lĩnh mới trường tồn.",
  "Chi tiết nhỏ tạo nên sự hoàn hảo, và sự hoàn hảo không phải là chi tiết nhỏ.",
  "Tập trung là bí mật của sức mạnh.",
  "Hãy là phiên bản tốt nhất của chính mình.",
  "Áp lực tạo nên kim cương.",
  "Đam mê tạo ra năng lượng.",
  "Kế hoạch không có hành động chỉ là giấc mơ.",
  "Hành trình vạn dặm bắt đầu từ một bước chân.",
  "Sự trì hoãn là kẻ cắp thời gian.",
  "Thời gian là vàng bạc.",
  "Sức khỏe là tài sản quý giá nhất.",
  "Một tinh thần minh mẫn trong một cơ thể tráng kiện.",
  "Hãy biết ơn những gì bạn đang có.",
  "Hạnh phúc là hành trình, không phải đích đến.",
  
  // Lẽ sống & Đối nhân xử thế
  "Tiên học lễ, hậu học văn.",
  "Lời nói chẳng mất tiền mua, lựa lời mà nói cho vừa lòng nhau.",
  "Tôn sư trọng đạo.",
  "Uống nước nhớ nguồn.",
  "Gieo nhân nào gặp quả nấy.",
  "Cho đi là còn mãi.",
  "Sống là phải biết sẻ chia.",
  "Lòng nhân ái là ngôn ngữ mà người điếc có thể nghe và người mù có thể thấy.",
  "Sự tử tế không bao giờ là lãng phí.",
  "Hãy đối xử với người khác như cách bạn muốn được đối xử.",
  "Chân thành là đỉnh cao của sự khôn ngoan.",
  "Khiêm tốn bao nhiêu vẫn chưa đủ, tự kiêu một chút cũng là thừa.",
  "Bông lúa chín là bông lúa cúi đầu.",
  "Im lặng đôi khi là câu trả lời tốt nhất.",
  "Nhẫn một chút sóng yên biển lặng, lùi một bước biển rộng trời cao.",
  "Tha thứ là cách tốt nhất để giải thoát bản thân.",
  "Nụ cười là liều thuốc bổ.",
  "Lạc quan là niềm tin dẫn tới thành tựu.",
  "Đừng đánh giá người khác qua vẻ bề ngoài.",
  "Giá trị của con người nằm ở việc họ cho đi chứ không phải nhận về.",
  "Cuộc sống không phải là chờ đợi bão tố qua đi, mà là học cách nhảy múa dưới mưa.",
  "Hãy sống đơn giản để người khác có thể đơn giản sống.",
  "Bình yên đến từ bên trong, đừng tìm nó bên ngoài.",
  "Giận dữ là trừng phạt bản thân vì lỗi lầm của người khác.",
  "Hạnh phúc không phải là có tất cả, mà là trân trọng những gì mình có.",
  "Gia đình là tế bào của xã hội.",
  "Trung thực là chương đầu tiên trong cuốn sách của sự khôn ngoan.",
  "Trách nhiệm làm nên người trưởng thành.",
  "Biết đủ là hạnh phúc.",
  "Tâm an vạn sự an."
];

// --- 10 DEFAULT HABITS ---
// Updated to include 'DEFAULT' classId
const DEFAULT_HABITS: Habit[] = [
  { id: 'h1', classId: 'DEFAULT', name: '📖 Đọc sách 30 phút', completedDates: [] },
  { id: 'h2', classId: 'DEFAULT', name: '🏃‍♂️ Tập thể dục', completedDates: [] },
  { id: 'h3', classId: 'DEFAULT', name: '🧘‍♂️ Thiền / Tĩnh tâm', completedDates: [] },
  { id: 'h4', classId: 'DEFAULT', name: '💧 Uống đủ 2L nước', completedDates: [] },
  { id: 'h5', classId: 'DEFAULT', name: '🧹 Sống tối giản / Dọn dẹp', completedDates: [] },
  { id: 'h6', classId: 'DEFAULT', name: '🍎 Ăn nhiều rau xanh', completedDates: [] },
  { id: 'h7', classId: 'DEFAULT', name: '😴 Ngủ trước 23h', completedDates: [] },
  { id: 'h8', classId: 'DEFAULT', name: '📝 Viết nhật ký / Kế hoạch', completedDates: [] },
  { id: 'h9', classId: 'DEFAULT', name: '🌍 Học ngoại ngữ', completedDates: [] },
  { id: 'h10', classId: 'DEFAULT', name: '💖 Quan tâm người thân', completedDates: [] },
];

// --- INTRO COMPONENT ---
const IntroScreen = ({ quote }: { quote: string }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center animate-zoom-in w-full max-w-2xl">
        {/* Logo Icon Animated - Replaced with VTL Logo concept */}
        <div className="mb-6 p-1 rounded-full shadow-2xl animate-[spin_10s_linear_infinite]">
           <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center border-4 border-white shadow-inner">
             <span className="text-white font-black text-3xl tracking-tighter">VTL</span>
           </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-center mb-2 intro-gradient-text animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          SỔ TAY KỸ THUẬT SỐ
        </h1>
        <h2 className="text-2xl md:text-4xl font-bold tracking-widest text-slate-800 text-center mb-6 uppercase animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          TÍCH HỢP AI
        </h2>

        {/* Divider */}
        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full mb-6 animate-fade-in" style={{animationDelay: '0.6s'}}></div>

        {/* Random Quote Section */}
        <div className="mb-8 px-4 py-4 md:px-8 bg-slate-50 rounded-xl border border-slate-100 shadow-sm animate-fade-in-up w-full" style={{animationDelay: '0.8s'}}>
           <div className="flex justify-center mb-2 text-primary opacity-50"><Icons.Quote /></div>
           <p className="text-center text-slate-700 italic font-medium text-sm md:text-lg leading-relaxed font-serif">
             "{quote}"
           </p>
        </div>

        {/* Author Info */}
        <div className="text-center space-y-1 animate-fade-in-up opacity-80" style={{animationDelay: '1s'}}>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Tác giả</p>
          <p className="text-lg font-bold text-slate-800">Vũ Tiến Lực</p>
          <p className="text-primary text-sm font-mono font-medium">0969 068 849</p>
          <p className="text-slate-600 text-xs font-medium">Trường THPT Nguyễn Hữu Cảnh</p>
        </div>
      </div>

      {/* Loading Indicator */}
      <div className="absolute bottom-0 w-full h-1.5 bg-slate-100 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-blue-500 animate-[fadeIn_2.5s_ease-out] w-full origin-left"></div>
      </div>
    </div>
  );
};

// Helper to generate initial structure
const generateMathStructure = (): Folder[] => {
  const folders: Folder[] = [];
  const grades = [6, 7, 8, 9, 10, 11, 12];
  const categories = [
    'Sách giáo khoa',
    'Sách bài tập',
    'Sách giáo viên',
    'Sách tham khảo',
    'Đề cương'
  ];

  grades.forEach(grade => {
    const gradeId = `grade-${grade}`;
    folders.push({
      id: gradeId,
      name: `Toán Lớp ${grade}`,
      parentId: null,
      level: 0
    });

    categories.forEach((cat, index) => {
      folders.push({
        id: `${gradeId}-${index}`,
        name: cat,
        parentId: gradeId,
        level: 1
      });
    });
  });

  return folders;
};

// Initialize empty timetable
const initialTimetable: TimetableData = {};

// DATA IMPORTED FROM USER REQUEST
const PRELOADED_BOOKS: Book[] = [
  // Lớp 12
  {
    id: 'kntt-12-t2',
    title: 'Sách giáo khoa Toán 12 Tập 2',
    author: 'KNTT',
    coverUrl: 'https://placehold.co/300x400/e2e8f0/1e293b?text=Toan+12+T2',
    fileType: 'pdf',
    source: 'DRIVE',
    folderId: 'grade-12',
    uploadDate: new Date().toISOString(),
    fileUrl: 'https://drive.google.com/file/d/1aMZ0NeWqtlhdto-zvXw0xhYrtTjnQcqy/preview'
  },
  {
    id: 'kntt-12-t1',
    title: 'Sách giáo khoa Toán 12 Tập 1',
    author: 'KNTT',
    coverUrl: 'https://placehold.co/300x400/e2e8f0/1e293b?text=Toan+12+T1',
    fileType: 'pdf',
    source: 'DRIVE',
    folderId: 'grade-12',
    uploadDate: new Date().toISOString(),
    fileUrl: 'https://drive.google.com/file/d/1J26VqUGVEnyij1mLFEk25I5ijliTmWf4/preview'
  },
  // Lớp 11
  {
    id: 'kntt-11-t2',
    title: 'Sách giáo khoa Toán 11 Tập 2',
    author: 'KNTT',
    coverUrl: 'https://placehold.co/300x400/dbeafe/1e40af?text=Toan+11+T2',
    fileType: 'pdf',
    source: 'DRIVE',
    folderId: 'grade-11',
    uploadDate: new Date().toISOString(),
    fileUrl: 'https://drive.google.com/file/d/12lrTlb1upOf07k1FTgklLbcY318fOC86/preview'
  },
  {
    id: 'kntt-11-t1',
    title: 'Sách giáo khoa Toán 11 Tập 1',
    author: 'KNTT',
    coverUrl: 'https://placehold.co/300x400/dbeafe/1e40af?text=Toan+11+T1',
    fileType: 'pdf',
    source: 'DRIVE',
    folderId: 'grade-11',
    uploadDate: new Date().toISOString(),
    fileUrl: 'https://drive.google.com/file/d/1K4nqmI9hSnt31iue3GuKFNSd1x4a41zo/preview'
  },
  {
    id: 'kntt-11-sbt-t1',
    title: 'Sách bài tập Toán 11 Tập 1',
    author: 'KNTT',
    coverUrl: 'https://placehold.co/300x400/fef3c7/92400e?text=SBT+11+T1',
    fileType: 'pdf',
    source: 'DRIVE',
    folderId: 'grade-11',
    uploadDate: new Date().toISOString(),
    fileUrl: 'https://drive.google.com/file/d/1u-DbWJN_k4msq4jmhlT-GoVtozF1EpT1/preview'
  },
  {
    id: 'kntt-11-sbt-t2',
    title: 'Sách bài tập Toán 11 Tập 2',
    author: 'KNTT',
    coverUrl: 'https://placehold.co/300x400/fef3c7/92400e?text=SBT+11+T2',
    fileType: 'pdf',
    source: 'DRIVE',
    folderId: 'grade-11',
    uploadDate: new Date().toISOString(),
    fileUrl: 'https://drive.google.com/file/d/1vOms3ITnKQ82YDMLlXnf92ESUxGHAdlg/preview'
  },
  // Lớp 10
  {
    id: 'kntt-10-t2',
    title: 'Sách giáo khoa Toán 10 Tập 2',
    author: 'KNTT',
    coverUrl: 'https://placehold.co/300x400/dcfce7/166534?text=Toan+10+T2',
    fileType: 'pdf',
    source: 'DRIVE',
    folderId: 'grade-10',
    uploadDate: new Date().toISOString(),
    fileUrl: 'https://drive.google.com/file/d/1b8oj03IYAYimM5-GiaRcEWHn1z5NbjbZ/preview'
  },
  {
    id: 'kntt-10-t1',
    title: 'Sách giáo khoa Toán 10 Tập 1',
    author: 'KNTT',
    coverUrl: 'https://placehold.co/300x400/dcfce7/166534?text=Toan+10+T1',
    fileType: 'pdf',
    source: 'DRIVE',
    folderId: 'grade-10',
    uploadDate: new Date().toISOString(),
    fileUrl: 'https://drive.google.com/file/d/1ZzCWB62LcJ7qvT1hLy88h-iLE6ah4uHN/preview'
  },
  {
    id: 'kntt-10-sbt-t1',
    title: 'Sách bài tập Toán 10 Tập 1',
    author: 'KNTT',
    coverUrl: 'https://placehold.co/300x400/fef3c7/92400e?text=SBT+10+T1',
    fileType: 'pdf',
    source: 'DRIVE',
    folderId: 'grade-10',
    uploadDate: new Date().toISOString(),
    fileUrl: 'https://drive.google.com/file/d/1KpwELfWKwlvN2AEweUp2UVbrYS_4GGel/preview'
  },
  {
    id: 'kntt-10-sbt-t2',
    title: 'Sách bài tập Toán 10 Tập 2',
    author: 'KNTT',
    coverUrl: 'https://placehold.co/300x400/fef3c7/92400e?text=SBT+10+T2',
    fileType: 'pdf',
    source: 'DRIVE',
    folderId: 'grade-10',
    uploadDate: new Date().toISOString(),
    fileUrl: 'https://drive.google.com/file/d/1H0sraOmrpPKDn-lJqL47QaX2xvgg-669/preview'
  }
];

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [quoteOfTheDay, setQuoteOfTheDay] = useState("");
  const [viewState, setViewState] = useState<ViewState>('DASHBOARD'); // Default to Dashboard
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  
  // --- LIBRARY STATE ---
  const [folders, setFolders] = useState<Folder[]>(generateMathStructure());
  const [books, setBooks] = useState<Book[]>(PRELOADED_BOOKS);
  const [collections, setCollections] = useState<Collection[]>([]);

  // --- TIMETABLE STATE ---
  const [timetableData, setTimetableData] = useState<TimetableData>(initialTimetable);
  const [subjectColors, setSubjectColors] = useState<SubjectColorConfig>({});
  const [habits, setHabits] = useState<Habit[]>([]);

  // --- LESSON PLAN STATE ---
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlanItem[]>([]);

  // --- WORK SCHEDULE STATE ---
  const [tasks, setTasks] = useState<Task[]>([]);

  // --- HOMEROOM STATE ---
  const [students, setStudents] = useState<Student[]>([]);
  const [homeroomTasks, setHomeroomTasks] = useState<HomeroomTask[]>([]);
  const [behaviorRecords, setBehaviorRecords] = useState<BehaviorRecord[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<StudentProfileImage[]>([]);
  const [watchList, setWatchList] = useState<StudentWatchRecord[]>([]);
  const [academicRecords, setAcademicRecords] = useState<AcademicRecord[]>([]);

  // --- TECH NOTEBOOK STATE ---
  const [techPrompts, setTechPrompts] = useState<TechPrompt[]>([]);
  const [favoriteWebs, setFavoriteWebs] = useState<FavoriteWeb[]>([]);
  
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'light'
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // --- INTRO LOGIC ---
  useEffect(() => {
    // Select random quote
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setQuoteOfTheDay(randomQuote);

    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 3500); // Increased to 3.5s to give time to read the quote
    return () => clearTimeout(timer);
  }, []);

  // --- LOAD DATA ---
  useEffect(() => {
    const load = (key: string, setter: (val: any) => void, isArray: boolean = true) => {
        const saved = localStorage.getItem(key);
        if (saved) {
            try { 
                const parsed = JSON.parse(saved);
                if (isArray && !Array.isArray(parsed)) {
                    console.warn(`Expected array for ${key} but got`, parsed);
                    setter([]);
                } else {
                    setter(parsed); 
                }
            } catch (e) { console.error(`Error loading ${key}`, e)}
        }
    };
    
    // Check if books are in local storage, if not, use PRELOADED_BOOKS. 
    const savedBooks = localStorage.getItem('eduai_books');
    if (savedBooks) {
        try { 
            const parsedBooks = JSON.parse(savedBooks);
            if (Array.isArray(parsedBooks)) {
                setBooks(parsedBooks);
            } else {
                setBooks(PRELOADED_BOOKS); // Fallback if data corrupted
            }
        } catch (e) { console.error("Error loading books", e); setBooks(PRELOADED_BOOKS); }
    } else {
        // First run or cleared data, use preloaded
        setBooks(PRELOADED_BOOKS);
    }

    // Load custom folders if any, but ensure structure is valid.
    const savedFolders = localStorage.getItem('eduai_folders');
    if (savedFolders) {
        try { 
            const parsedFolders = JSON.parse(savedFolders);
            if (Array.isArray(parsedFolders)) {
                setFolders(parsedFolders);
            }
        } catch (e) { console.error("Error loading folders", e); }
    }

    // Load Habits specifically with default data check and backward compatibility
    const savedHabits = localStorage.getItem('eduai_habits');
    if (savedHabits) {
        try {
            const parsedHabits = JSON.parse(savedHabits);
            if (Array.isArray(parsedHabits) && parsedHabits.length > 0) {
                // Ensure classId exists for migration
                const migratedHabits = parsedHabits.map((h: any) => ({
                    ...h,
                    classId: h.classId || 'DEFAULT'
                }));
                setHabits(migratedHabits);
            } else {
                setHabits(DEFAULT_HABITS);
            }
        } catch (e) { setHabits(DEFAULT_HABITS); }
    } else {
        setHabits(DEFAULT_HABITS);
    }

    load('eduai_collections', setCollections);
    load('eduai_timetable', setTimetableData, false);
    load('eduai_subject_colors', setSubjectColors, false);
    load('eduai_classes', setClasses);
    load('eduai_plans', setLessonPlans);
    load('eduai_tasks', setTasks);
    load('eduai_students', setStudents); // THIS FIXES THE TypeError
    load('eduai_hrtasks', setHomeroomTasks);
    load('eduai_records', setBehaviorRecords);
    load('eduai_profiles', setStudentProfiles);
    load('eduai_watchlist', setWatchList);
    load('eduai_academic', setAcademicRecords);
    load('eduai_prompts', setTechPrompts);
    load('eduai_webs', setFavoriteWebs);

  }, []);

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem('eduai_books', JSON.stringify(books)); }, [books]);
  useEffect(() => { localStorage.setItem('eduai_folders', JSON.stringify(folders)); }, [folders]);
  useEffect(() => { localStorage.setItem('eduai_collections', JSON.stringify(collections)); }, [collections]);
  useEffect(() => { localStorage.setItem('eduai_timetable', JSON.stringify(timetableData)); }, [timetableData]);
  useEffect(() => { localStorage.setItem('eduai_subject_colors', JSON.stringify(subjectColors)); }, [subjectColors]);
  useEffect(() => { localStorage.setItem('eduai_habits', JSON.stringify(habits)); }, [habits]);
  useEffect(() => { localStorage.setItem('eduai_classes', JSON.stringify(classes)); }, [classes]);
  useEffect(() => { localStorage.setItem('eduai_plans', JSON.stringify(lessonPlans)); }, [lessonPlans]);
  useEffect(() => { localStorage.setItem('eduai_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('eduai_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('eduai_hrtasks', JSON.stringify(homeroomTasks)); }, [homeroomTasks]);
  useEffect(() => { localStorage.setItem('eduai_records', JSON.stringify(behaviorRecords)); }, [behaviorRecords]);
  useEffect(() => { localStorage.setItem('eduai_profiles', JSON.stringify(studentProfiles)); }, [studentProfiles]);
  useEffect(() => { localStorage.setItem('eduai_watchlist', JSON.stringify(watchList)); }, [watchList]);
  useEffect(() => { localStorage.setItem('eduai_academic', JSON.stringify(academicRecords)); }, [academicRecords]);
  useEffect(() => { localStorage.setItem('eduai_prompts', JSON.stringify(techPrompts)); }, [techPrompts]);
  useEffect(() => { localStorage.setItem('eduai_webs', JSON.stringify(favoriteWebs)); }, [favoriteWebs]);

  // SIMULATE EMAIL REMINDER CHECK
  const checkReminders = (taskList: Task[]) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const upcomingTasks = taskList.filter(t => 
      !t.isCompleted && 
      t.remindEmail && 
      t.deadline === tomorrowStr
    );

    if (upcomingTasks.length > 0) {
      setTimeout(() => {
        setNotification({
           message: `📧 Email nhắc nhở: Bạn có ${upcomingTasks.length} công việc hạn chót vào ngày mai!`,
           type: 'success'
        });
      }, 2000);
    }
  };

  useEffect(() => {
      checkReminders(tasks);
  }, [tasks]); 

  // --- ACTION HANDLERS ---

  const handleOpenBook = (book: Book) => {
    setCurrentBook(book);
    setViewState('READER');
  };

  const handleAddBook = (newBook: Book) => {
    setBooks(prev => [newBook, ...prev]);
    setNotification({ message: 'Đã thêm sách vào thư viện', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleEditBook = (updatedBook: Book) => {
    setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
    setNotification({ message: 'Đã cập nhật thông tin sách', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddFolder = (name: string, parentId: string | null) => {
    const newFolder: Folder = {
      id: `custom-${Date.now()}`,
      name,
      parentId,
      level: parentId ? 1 : 0 
    };
    setFolders(prev => [...prev, newFolder]);
    setNotification({ message: 'Đã tạo thư mục mới', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteFolder = (folderId: string) => {
     if (window.confirm('CẢNH BÁO: Bạn có chắc muốn xóa thư mục này? Toàn bộ thư mục con và sách bên trong sẽ bị xóa vĩnh viễn!')) {
        const getAllChildIds = (pId: string): string[] => {
            const children = folders.filter(f => f.parentId === pId);
            let ids = children.map(c => c.id);
            children.forEach(c => {
                ids = [...ids, ...getAllChildIds(c.id)];
            });
            return ids;
        };

        const idsToDelete = [folderId, ...getAllChildIds(folderId)];
        
        setFolders(prev => prev.filter(f => !idsToDelete.includes(f.id)));
        setBooks(prev => prev.filter(b => !b.folderId || !idsToDelete.includes(b.folderId)));
        
        setNotification({ message: 'Đã xóa thư mục và nội dung bên trong', type: 'success' });
        setTimeout(() => setNotification(null), 3000);
     }
  };

  // --- COLLECTION HANDLERS ---
  const handleAddCollection = (collection: Collection) => {
    setCollections(prev => [...prev, collection]);
    setNotification({ message: 'Đã tạo bộ sưu tập mới', type: 'success' });
    setTimeout(() => setNotification(null), 2000);
  };

  const handleDeleteCollection = (id: string) => {
    if (window.confirm('Xóa bộ sưu tập này? (Sách sẽ không bị xóa)')) {
      setCollections(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleUpdateCollection = (updatedCollection: Collection) => {
    setCollections(prev => prev.map(c => c.id === updatedCollection.id ? updatedCollection : c));
  };

  const handleUpdateTimetable = (key: string, slot: TimetableSlot) => {
    setTimetableData(prev => ({
      ...prev,
      [key]: slot
    }));
  };

  const handleUpdateSubjectColor = (subject: string, color: string) => {
    setSubjectColors(prev => ({
      ...prev,
      [subject]: color
    }));
  };

  // --- HABIT HANDLERS ---
  const handleAddHabit = (name: string, classId: string) => {
    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      classId, // Associate with specific class
      name,
      completedDates: []
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const handleDeleteHabit = (id: string) => {
    if(window.confirm('Xóa thói quen này?')) {
      setHabits(prev => prev.filter(h => h.id !== id));
    }
  };

  const handleToggleHabit = (id: string, date: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const dates = new Set(h.completedDates);
        if (dates.has(date)) dates.delete(date);
        else dates.add(date);
        return { ...h, completedDates: Array.from(dates) };
      }
      return h;
    }));
  };

  const handleAddClass = (name: string) => {
    const newClass: ClassGroup = { id: `class-${Date.now()}`, name };
    setClasses(prev => [...prev, newClass]);
  };

  const handleUpdateClass = (id: string, newName: string) => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
  };

  const handleDeleteClass = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa lớp này và toàn bộ dữ liệu liên quan?')) {
       setClasses(prev => prev.filter(c => c.id !== id));
       setLessonPlans(prev => prev.filter(p => p.classId !== id));
       setStudents(prev => prev.filter(s => s.classId !== id));
       setHomeroomTasks(prev => prev.filter(t => t.classId !== id));
       setBehaviorRecords(prev => prev.filter(r => r.classId !== id));
       setStudentProfiles(prev => prev.filter(p => !students.find(s => s.id === p.studentId && s.classId === id)));
       setWatchList(prev => prev.filter(w => !students.find(s => s.id === w.studentId && s.classId === id)));
       setAcademicRecords(prev => prev.filter(a => !students.find(s => s.id === a.studentId && s.classId === id)));
    }
  };

  const handleAddPlan = (plan: LessonPlanItem) => {
    setLessonPlans(prev => [plan, ...prev]);
  };

  const handleUpdatePlan = (updatedPlan: LessonPlanItem) => {
    setLessonPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
    setNotification({ message: 'Đã cập nhật báo giảng', type: 'success' });
    setTimeout(() => setNotification(null), 2000);
  };

  const handleDeletePlan = (id: string) => {
    setLessonPlans(prev => prev.filter(p => p.id !== id));
  };

  const handleAddTask = (task: Task) => {
    setTasks(prev => [task, ...prev]);
    setNotification({ message: 'Đã thêm công việc mới', type: 'success' });
    setTimeout(() => setNotification(null), 2000);
  };

  const handleUpdateTask = (updatedTask: Task) => {
     setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleDeleteTask = (id: string) => {
    if (window.confirm('Xóa công việc này?')) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleImportLessonData = (newClasses: ClassGroup[], newPlans: LessonPlanItem[]) => {
    setClasses(prev => {
       const existingNames = new Set(prev.map(c => c.name.toLowerCase()));
       const uniqueNewClasses = newClasses.filter(c => !existingNames.has(c.name.toLowerCase()));
       return [...prev, ...uniqueNewClasses];
    });
    setLessonPlans(prev => [...newPlans, ...prev]);
    setNotification({ 
      message: `Đã nhập dữ liệu thành công!`, 
      type: 'success' 
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- HOMEROOM HANDLERS ---
  const handleAddWatch = (record: StudentWatchRecord) => {
    setWatchList(prev => [...prev, record]);
    setNotification({ message: 'Đã thêm vào danh sách theo dõi', type: 'success' });
    setTimeout(() => setNotification(null), 2000);
  };

  const handleRemoveWatch = (id: string) => {
    if (window.confirm('Xóa học sinh khỏi danh sách theo dõi?')) {
      setWatchList(prev => prev.filter(w => w.id !== id));
    }
  };

  const handleUpdateWatchNote = (id: string, note: string) => {
    setWatchList(prev => prev.map(w => w.id === id ? { ...w, note } : w));
  };

  const handleUpdateAcademic = (record: AcademicRecord) => {
    setAcademicRecords(prev => {
      const existing = prev.findIndex(r => r.studentId === record.studentId && r.term === record.term);
      if (existing >= 0) {
        const newRecords = [...prev];
        newRecords[existing] = record;
        return newRecords;
      }
      return [...prev, record];
    });
  };

  // --- RESET HANDLERS ---
  
  const handleResetLibrary = () => {
    if(window.confirm('CẢNH BÁO: Thao tác này sẽ xóa toàn bộ Sách và Thư mục tùy chỉnh. Dữ liệu mặc định sẽ được khôi phục. Bạn có chắc chắn?')) {
      setBooks(PRELOADED_BOOKS); // Reset to preloaded state
      setFolders(generateMathStructure());
      setCollections([]);
      setNotification({ message: 'Đã làm mới thư viện.', type: 'success' });
    }
  };

  const handleResetTimetable = () => {
    if(window.confirm('Xóa toàn bộ thời khóa biểu hiện tại?')) {
      setTimetableData({});
      setSubjectColors({});
      setNotification({ message: 'Đã làm mới thời khóa biểu.', type: 'success' });
    }
  };

  const handleResetLessonPlans = () => {
    if(window.confirm('Xóa toàn bộ dữ liệu báo giảng và danh sách lớp giảng dạy?')) {
      setLessonPlans([]);
      setClasses([]);
      setNotification({ message: 'Đã làm mới sổ báo giảng.', type: 'success' });
    }
  };

  const handleResetTasks = () => {
    if(window.confirm('Xóa toàn bộ danh sách công việc?')) {
      setTasks([]);
      setNotification({ message: 'Đã làm mới lịch công tác.', type: 'success' });
    }
  };

  const handleResetHomeroom = () => {
    if(window.confirm('Xóa toàn bộ dữ liệu chủ nhiệm (Học sinh, Thi đua, Lớp)?')) {
      setStudents([]);
      setBehaviorRecords([]);
      setHomeroomTasks([]);
      setStudentProfiles([]);
      setWatchList([]);
      setAcademicRecords([]);
      setNotification({ message: 'Đã làm mới sổ chủ nhiệm.', type: 'success' });
    }
  };

  const handleResetTech = () => {
    if(window.confirm('Xóa toàn bộ Prompts và Web đã lưu?')) {
      setTechPrompts([]);
      setFavoriteWebs([]);
      setNotification({ message: 'Đã làm mới sổ tay công nghệ.', type: 'success' });
    }
  };

  const renderContent = () => {
    switch (viewState) {
      case 'DASHBOARD':
        return (
          <DashboardView 
            books={books}
            tasks={tasks}
            students={students}
            timetable={timetableData}
            lessonPlans={lessonPlans}
            homeroomTasks={homeroomTasks}
            classes={classes} // Pass classes to Dashboard for schedule lookup
            habits={habits}
            onNavigate={setViewState}
            quote={quoteOfTheDay}
          />
        );
      case 'SEARCH':
        return (
          <SearchView
            books={books}
            students={students}
            tasks={tasks}
            lessonPlans={lessonPlans}
            onNavigateToBook={(book) => {
               setCurrentBook(book);
               setViewState('READER');
            }}
          />
        );
      case 'LIBRARY':
        return (
          <LibraryView 
            books={books} 
            folders={folders}
            collections={collections}
            onOpenBook={handleOpenBook} 
            onDeleteBook={(id) => setBooks(b => b.filter(x => x.id !== id))}
            onAddFolder={handleAddFolder}
            onDeleteFolder={handleDeleteFolder}
            onAddBook={handleAddBook}
            onEditBook={handleEditBook}
            onResetLibrary={handleResetLibrary}
            onAddCollection={handleAddCollection}
            onDeleteCollection={handleDeleteCollection}
            onUpdateCollection={handleUpdateCollection}
          />
        );
      case 'TIMETABLE':
        return (
          <TimetableView 
            data={timetableData}
            classes={classes}
            subjectColors={subjectColors}
            habits={habits}
            onUpdateSlot={handleUpdateTimetable} 
            onUpdateSubjectColor={handleUpdateSubjectColor}
            onResetTimetable={handleResetTimetable}
            onAddClass={handleAddClass}
            onAddHabit={handleAddHabit}
            onDeleteHabit={handleDeleteHabit}
            onToggleHabit={handleToggleHabit}
          />
        );
      case 'LESSON_PLAN':
        return (
          <LessonPlanView 
            classes={classes}
            lessonPlans={lessonPlans}
            onAddClass={handleAddClass}
            onDeleteClass={handleDeleteClass}
            onUpdateClass={handleUpdateClass}
            onAddPlan={handleAddPlan}
            onUpdatePlan={handleUpdatePlan}
            onDeletePlan={handleDeletePlan}
            onImportData={handleImportLessonData}
            onOpenBook={(book) => {
              setCurrentBook(book);
              setViewState('READER');
            }}
            onResetPlans={handleResetLessonPlans}
          />
        );
      case 'WORK_SCHEDULE':
        return (
          <WorkScheduleView 
            tasks={tasks}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onResetTasks={handleResetTasks}
          />
        );
      case 'HOMEROOM':
        return (
          <HomeroomView 
            classes={classes}
            students={students}
            tasks={homeroomTasks}
            records={behaviorRecords}
            profiles={studentProfiles}
            watchList={watchList}
            academicRecords={academicRecords}
            onAddClass={handleAddClass}
            onDeleteClass={handleDeleteClass}
            onAddStudent={(s) => setStudents(prev => [...prev, s])}
            onUpdateStudent={(s) => setStudents(prev => prev.map(old => old.id === s.id ? s : old))}
            onDeleteStudent={(id) => setStudents(prev => prev.filter(s => s.id !== id))}
            onAddTask={(t) => setHomeroomTasks(prev => [...prev, t])}
            onUpdateTask={(t) => setHomeroomTasks(prev => prev.map(old => old.id === t.id ? t : old))}
            onDeleteTask={(id) => setHomeroomTasks(prev => prev.filter(t => t.id !== id))}
            onAddRecord={(r) => setBehaviorRecords(prev => [...prev, r])}
            onDeleteRecord={(id) => setBehaviorRecords(prev => prev.filter(r => r.id !== id))}
            onAddProfile={(p) => setStudentProfiles(prev => [...prev, p])}
            onDeleteProfile={(id) => setStudentProfiles(prev => prev.filter(p => p.id !== id))}
            onAddWatch={handleAddWatch}
            onRemoveWatch={handleRemoveWatch}
            onUpdateWatchNote={handleUpdateWatchNote}
            onUpdateAcademic={handleUpdateAcademic}
            onResetHomeroom={handleResetHomeroom}
            settings={settings}
          />
        );
      case 'TECH':
        return (
          <TechNotebookView 
            prompts={techPrompts}
            webs={favoriteWebs}
            onAddPrompt={(p) => setTechPrompts(prev => [...prev, p])}
            onDeletePrompt={(id) => setTechPrompts(prev => prev.filter(p => p.id !== id))}
            onAddWeb={(w) => setFavoriteWebs(prev => [...prev, w])}
            onDeleteWeb={(id) => setFavoriteWebs(prev => prev.filter(w => w.id !== id))}
            onResetTech={handleResetTech}
          />
        );
      case 'GUIDE':
        return <GuideView />;
      case 'READER':
        return currentBook ? (
          <ReaderView 
            book={currentBook} 
            onBack={() => setViewState(currentBook.author === 'Giáo Án' ? 'LESSON_PLAN' : 'LIBRARY')} 
            settings={settings} 
          />
        ) : (
          <div className="flex items-center justify-center h-full">Không tìm thấy sách</div>
        );
      default:
        return <DashboardView 
            books={books}
            tasks={tasks}
            students={students}
            timetable={timetableData}
            lessonPlans={lessonPlans}
            homeroomTasks={homeroomTasks}
            classes={classes}
            habits={habits}
            onNavigate={setViewState}
            quote={quoteOfTheDay}
          />;
    }
  };

  if (showIntro) {
    return <IntroScreen quote={quoteOfTheDay} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      <Sidebar 
        currentView={viewState} 
        onChangeView={setViewState} 
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <main className="flex-1 flex flex-col relative h-full overflow-hidden pb-16 md:pb-0">
        {notification && (
          <AlertBanner 
            message={notification.message} 
            type={notification.type} 
            onClose={() => setNotification(null)} 
          />
        )}
        {renderContent()}
        
        {/* Author Credit Footer - Hidden on Dashboard as it has its own header style */}
        {viewState !== 'DASHBOARD' && (
           <div className="absolute bottom-2 right-4 z-50 pointer-events-none opacity-50 text-[10px] text-slate-500 bg-white/50 px-2 py-1 rounded-full backdrop-blur-sm hidden md:block">
              Thầy Vũ Tiến Lực - Trường THPT Nguyễn Hữu Cảnh - TP. Hồ Chí Minh
           </div>
        )}
      </main>
      {isSettingsOpen && (
        <SettingsModal 
          settings={settings} 
          onSave={setSettings} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}
    </div>
  );
}
