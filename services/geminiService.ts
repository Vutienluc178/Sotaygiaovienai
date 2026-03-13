import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from '../types';

export const generateAIResponse = async (
  apiKey: string, 
  history: ChatMessage[], 
  currentContext: string,
  question: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key chưa được cấu hình. Vui lòng vào Cài đặt.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Construct the prompt context
    const contextPrompt = `
      Bạn là một gia sư AI thông minh và kiên nhẫn, chuyên hỗ trợ học sinh đọc sách giáo khoa.
      
      NGỮ CẢNH TRANG SÁCH ĐANG ĐỌC (Tóm tắt):
      "${currentContext || 'Người dùng đang đọc sách nhưng chưa cung cấp nội dung cụ thể.'}"
      
      Câu hỏi của người dùng: "${question}"
      
      Hãy trả lời ngắn gọn, dễ hiểu, phù hợp với học sinh. Sử dụng định dạng Markdown nếu cần thiết.
    `;

    // Use Gemini 2.5 Flash for speed
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest', // Following specific guidelines for model names
      contents: contextPrompt,
      config: {
        systemInstruction: "You are a helpful education assistant. Reply in Vietnamese.",
      }
    });

    return response.text || "Xin lỗi, tôi không thể tạo câu trả lời lúc này.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Lỗi kết nối đến Gemini AI. Vui lòng kiểm tra API Key.");
  }
};

export const generateHomeroomAdvice = async (
  apiKey: string,
  studentName: string,
  studentInfo: string,
  teacherQuery: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key chưa được cấu hình. Vui lòng vào Cài đặt.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Bạn là một chuyên gia tâm lý học đường và cố vấn giáo dục với 20 năm kinh nghiệm.
      Bạn đang tư vấn cho một Giáo viên chủ nhiệm về trường hợp của học sinh: ${studentName}.

      THÔNG TIN HỌC SINH:
      ${studentInfo}

      VẤN ĐỀ/CÂU HỎI CỦA GIÁO VIÊN:
      "${teacherQuery}"

      HÃY ĐƯA RA LỜI KHUYÊN:
      1. Phân tích nguyên nhân tiềm ẩn (tâm lý, hoàn cảnh, áp lực...).
      2. Đề xuất giải pháp cụ thể, từng bước (ngắn hạn và dài hạn).
      3. Gợi ý cách trò chuyện/đối thoại với học sinh (kịch bản mẫu).
      4. Gợi ý cách phối hợp với gia đình (nếu cần).

      Văn phong: Chân thành, thấu hiểu, chuyên nghiệp, mang tính sư phạm cao.
      Định dạng: Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert educational consultant and school psychologist. Reply in Vietnamese.",
      }
    });

    return response.text || "Xin lỗi, tôi không thể đưa ra lời khuyên lúc này.";
  } catch (error) {
    console.error("Gemini Homeroom Advice Error:", error);
    throw new Error("Lỗi kết nối đến Gemini AI. Vui lòng kiểm tra API Key.");
  }
};

export const analyzeHomeroomClass = async (
  apiKey: string,
  className: string,
  classData: string,
  teacherFocus: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key chưa được cấu hình. Vui lòng vào Cài đặt.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Bạn là một chuyên gia phân tích dữ liệu giáo dục và cố vấn quản lý lớp học.
      Bạn đang hỗ trợ Giáo viên chủ nhiệm phân tích tình hình lớp: ${className}.

      DỮ LIỆU LỚP HỌC (Tóm tắt):
      ${classData}

      MỐI QUAN TÂM CỦA GIÁO VIÊN:
      "${teacherFocus || 'Phân tích tổng quan tình hình lớp học để tìm ra điểm mạnh, điểm yếu và giải pháp.'}"

      HÃY CUNG CẤP BÁO CÁO PHÂN TÍCH CHI TIẾT:
      1. **Tổng quan tình hình lớp:** Đánh giá chung về nề nếp, học tập.
      2. **Phân tích xu hướng:** Có dấu hiệu đi xuống hay tiến bộ ở nhóm nào không?
      3. **Nhóm học sinh cần quan tâm đặc biệt (At-risk):** Chỉ ra những em có nguy cơ (về hạnh kiểm hoặc học lực) dựa trên dữ liệu.
      4. **Nhóm học sinh tích cực (Role models):** Những em có thể làm nòng cốt.
      5. **Khuyến nghị hành động:** Đề xuất 3-5 biện pháp cụ thể cho GVCN trong tuần/tháng tới.

      Văn phong: Khách quan, dựa trên dữ liệu, mang tính xây dựng.
      Định dạng: Markdown, sử dụng bullet points và bold text để dễ đọc.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert educational data analyst. Reply in Vietnamese.",
      }
    });

    return response.text || "Xin lỗi, tôi không thể phân tích dữ liệu lúc này.";
  } catch (error) {
    console.error("Gemini Class Analysis Error:", error);
    throw new Error("Lỗi kết nối đến Gemini AI. Vui lòng kiểm tra API Key.");
  }
};
