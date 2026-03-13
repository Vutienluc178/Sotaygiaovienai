
export type ViewState = 'DASHBOARD' | 'SEARCH' | 'LIBRARY' | 'READER' | 'TIMETABLE' | 'LESSON_PLAN' | 'WORK_SCHEDULE' | 'HOMEROOM' | 'TECH' | 'GUIDE';

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  level: number; // 0 for root (Grades), 1 for Categories
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  bookIds: string[];
  createdAt: string;
  color?: string; // Optional UI decoration
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string; // URL for cover image
  fileUrl?: string; // Blob URL or Remote URL for the PDF/Content
  fileType: 'pdf' | 'image';
  source: 'LOCAL' | 'LINK' | 'DRIVE' | 'ONEDRIVE' | 'DROPBOX'; 
  uploadDate: string;
  folderId?: string; // Link to a specific folder
}

export interface UserSettings {
  theme: 'light' | 'dark';
  googleAccessToken?: string;
  geminiApiKey?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// --- TIMETABLE TYPES ---
export type DayOfWeek = 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'CN';
export type Session = 'Morning' | 'Afternoon';
export type Period = 1 | 2 | 3 | 4;

export interface TimetableSlot {
  subject: string;
  room: string;
  note: string;
}

// Map key structure: "ClassID-T2-Morning-1" -> Slot
export type TimetableData = Record<string, TimetableSlot>;

// Store color preferences for subjects: "Math" -> "#blue"
export type SubjectColorConfig = Record<string, string>;

// --- HABIT TRACKER TYPES ---
export interface Habit {
  id: string;
  classId: string; // ID of the class this habit belongs to (or 'DEFAULT')
  name: string;
  completedDates: string[]; // Array of ISO Date Strings (YYYY-MM-DD)
}

// --- LESSON PLAN TYPES ---
export interface ClassGroup {
  id: string;
  name: string;
}

export interface LessonPlanItem {
  id: string;
  classId: string;
  title: string; // Legacy: Tuần/Tiết/Tên bài (Constructed string)
  fileUrl: string;
  note: string; // Ghi chú công việc
  createdAt: string;
  
  // New Structured Fields
  week?: number;
  period?: string; // Tiết số mấy (VD: 1, 1-2)
  lessonName?: string; // Tên bài dạy
  review?: string; // Rút kinh nghiệm (Text)
  reviewRating?: number; // 1-5 Stars
}

// --- WORK SCHEDULE TYPES ---
export interface TaskComment {
  id: string;
  content: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string; // Base64 or URL
  type: string;
  size: string;
}

export interface TaskHistory {
  id: string;
  action: string; // e.g., "Created", "Completed", "Commented"
  timestamp: string;
  detail?: string;
}

export type RecurrenceType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface TaskRecurrence {
  type: RecurrenceType;
  interval: number; // e.g., 1 (every day), 2 (every 2 weeks)
}

export interface Task {
  id: string;
  title: string;
  tag: string; // Thể loại: Hội họp, Chuyên môn, ...
  deadline: string; // ISO Date String (YYYY-MM-DD)
  note: string;
  isCompleted: boolean;
  isImportant: boolean; // Ưu tiên
  remindEmail: boolean; // Nhắc trước 1 ngày
  
  // New Extended Fields
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  history?: TaskHistory[];
  recurrence?: TaskRecurrence; // Cấu hình lặp lại
}

// --- HOMEROOM TYPES ---
export interface Student {
  id: string;
  classId: string;
  name: string;
  gender: 'Nam' | 'Nữ';
  dob: string; // Date string
  phone?: string;
  address?: string;
}

export interface HomeroomTask {
  id: string;
  classId: string;
  title: string; // Tên phong trào
  deadline: string;
  assignee?: string; // Người phân công
  note?: string; // Chú thích
  result?: string; // Đánh giá kết quả sau thực hiện
  completedDate?: string; // Ngày hoàn thành
  isImportant: boolean;
  isCompleted: boolean;
}

export interface BehaviorRecord {
  id: string;
  studentId: string;
  classId: string;
  type: 'REWARD' | 'VIOLATION'; // Khen thưởng / Vi phạm
  description: string;
  date: string;
}

export interface StudentProfileImage {
  id: string;
  studentId: string;
  url: string; // Base64 or URL
  description: string; // E.g., "Bản kiểm điểm lần 1"
  date: string;
}

export interface StudentWatchRecord {
  id: string;
  studentId: string;
  classId: string;
  note: string; // Ghi chú đặc biệt cho việc theo dõi
  createdAt: string;
}

export type AssessmentWave = 'DOT1' | 'DOT2' | 'DOT3' | 'DOT4' | 'DOT5';

export interface AcademicRecord {
  id: string;
  studentId: string;
  classId: string;
  term: AssessmentWave;
  subjects: { [key: string]: string }; // Subject Name -> Score (String to allow empty)
  average: number;
  ranking: 'Giỏi' | 'Khá' | 'TB' | 'Yếu' | 'Kém';
  updatedAt: string;
}

// --- TECH NOTEBOOK TYPES ---
export interface TechPrompt {
  id: string;
  title: string; // Tên prompt/Nội dung chính
  content: string; // Nội dung prompt
  tag: string;
  note: string;
}

export interface FavoriteWeb {
  id: string;
  title: string;
  link: string;
  tag: string;
  note: string;
}

// --- GOOGLE DRIVE TYPES ---
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  iconLink?: string;
  size?: string;
  createdTime?: string;
}
