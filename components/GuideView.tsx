import React, { useState } from 'react';
import { Icons } from '../constants';

interface GuideSection {
  id: string;
  title: string;
  icon: React.FC<any>;
  content: React.ReactNode;
}

export const GuideView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('intro');
  const [showDonation, setShowDonation] = useState(false);

  const SECTIONS: GuideSection[] = [
    {
      id: 'intro',
      title: 'Giới thiệu & Lưu ý',
      icon: Icons.BookOpen,
      content: (
        <div className="space-y-6">
          {/* DONATION SECTION */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-100 rounded-xl overflow-hidden shadow-sm">
             <button 
               onClick={() => setShowDonation(!showDonation)}
               className="w-full flex items-center justify-between p-4 hover:bg-orange-100/50 transition-colors text-left"
             >
                <div className="flex items-center gap-3">
                   <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white p-2 rounded-full shadow-md animate-bounce">
                      <Icons.Coffee />
                   </div>
                   <div>
                      <h4 className="font-bold text-slate-800 text-sm md:text-base">Mời tác giả một ly Cafe</h4>
                      <p className="text-xs text-slate-500">Tiếp thêm động lực phát triển tính năng mới ❤️</p>
                   </div>
                </div>
                <div className="text-orange-400">
                   {showDonation ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
                </div>
             </button>
             
             {showDonation && (
                <div className="p-6 bg-white border-t border-orange-100 animate-[fadeIn_0.3s_ease-out]">
                   <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="shrink-0">
                         <div className="w-40 h-40 bg-white p-2 rounded-xl shadow-lg border border-slate-100">
                            <img 
                              src="https://i.ibb.co/M5kNKhwY/0db040db0f14.png" 
                              alt="QR Code Momo/Bank" 
                              className="w-full h-full object-contain rounded-lg"
                            />
                         </div>
                      </div>
                      <div className="text-center md:text-left space-y-3">
                         <p className="text-slate-700 font-medium italic">
                           "Tiếp thêm động lực để mình ra mắt tính năng mới! 👉 [Mời 1 ly Cafe 30k]"
                         </p>
                         <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm space-y-1 inline-block text-left min-w-[250px]">
                            <p className="flex justify-between gap-4"><span className="text-slate-500">Ngân hàng:</span> <span className="font-bold text-green-700">VietcomBank</span></p>
                            <p className="flex justify-between gap-4"><span className="text-slate-500">Số tài khoản:</span> <span className="font-mono font-bold text-slate-900 select-all">9969068849</span></p>
                            <p className="flex justify-between gap-4"><span className="text-slate-500">Chủ tài khoản:</span> <span className="font-bold uppercase text-slate-800">Vu Tien Luc</span></p>
                         </div>
                         <p className="text-[10px] text-slate-400">Cảm ơn Thầy/Cô đã đồng hành cùng Sổ Tay Giáo Viên AI!</p>
                      </div>
                   </div>
                </div>
             )}
          </div>

          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h3 className="text-lg font-bold text-blue-800 mb-2">👋 Chào mừng Thầy/Cô!</h3>
            <p className="text-slate-700">
              Sổ Tay Giáo Viên AI là ứng dụng web hỗ trợ toàn diện cho công tác giảng dạy, chủ nhiệm và quản lý cá nhân. 
              Ứng dụng hoạt động trực tiếp trên trình duyệt (Chrome, Safari, Edge) và tối ưu cho cả máy tính, máy tính bảng và điện thoại.
            </p>
          </div>

          <div className="bg-red-50 p-6 rounded-xl border border-red-100">
            <h3 className="text-lg font-bold text-red-800 mb-2 flex items-center gap-2"><Icons.Alert /> QUAN TRỌNG: Dữ liệu</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-800 text-sm">
              <li><strong>Lưu trữ cục bộ:</strong> Toàn bộ dữ liệu được lưu trên trình duyệt của thiết bị (Local Storage). Không có máy chủ lưu trữ trung gian.</li>
              <li><strong>Rủi ro:</strong> Nếu Thầy/Cô xóa lịch sử duyệt web hoặc cài lại máy, dữ liệu có thể bị mất.</li>
              <li><strong>Giải pháp:</strong> Hãy thường xuyên sử dụng tính năng <strong>Cài đặt &rarr; Sao lưu (Backup)</strong> để tải file dữ liệu về máy hoặc Google Drive cá nhân.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'library',
      title: 'Thư viện & Giáo án',
      icon: Icons.Library,
      content: (
        <div className="space-y-6">
          <section>
            <h3 className="text-xl font-bold text-slate-800 mb-3">1. Cấu trúc thư mục</h3>
            <p className="text-sm text-slate-600 mb-2">Thư viện được tổ chức dạng cây 2 cấp: Thư mục cha (VD: Khối lớp) và Thư mục con (VD: Môn học/Loại sách).</p>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
              <li>Bấm <span className="inline-block px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300 font-mono text-xs">+</span> ở góc cây thư mục để tạo mới.</li>
              <li>Bấm chuột phải (hoặc nhấn giữ trên điện thoại) vào tên thư mục để hiện tùy chọn Xóa.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-800 mb-3">2. Thêm tài liệu</h3>
            <div className="grid md:grid-cols-2 gap-4">
               <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-primary mb-2">Cách 1: Nhập Link</h4>
                  <p className="text-xs text-slate-500">Dùng cho tài liệu online hoặc Google Drive.</p>
                  <ul className="list-disc pl-4 mt-2 text-xs text-slate-600">
                     <li>Hỗ trợ link Google Drive (tự động chuyển sang chế độ Preview).</li>
                     <li>Link file PDF trực tiếp từ website.</li>
                  </ul>
               </div>
               <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-primary mb-2">Cách 2: Tải lên (Local)</h4>
                  <p className="text-xs text-slate-500">Dùng cho file có sẵn trong máy.</p>
                  <ul className="list-disc pl-4 mt-2 text-xs text-slate-600">
                     <li>File được lưu tạm vào bộ nhớ trình duyệt.</li>
                     <li>Nên dùng cho file nhỏ (&lt;10MB) để tránh làm chậm ứng dụng.</li>
                  </ul>
               </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-800 mb-3">3. Nhập từ Excel (Hàng loạt)</h3>
            <p className="text-sm text-slate-600 mb-2">Tải file mẫu trong mục Thư viện để xem cấu trúc. Các cột bắt buộc:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border p-2">Cột A</th>
                    <th className="border p-2">Cột B</th>
                    <th className="border p-2">Cột C</th>
                    <th className="border p-2">Cột D</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Tên Sách</td>
                    <td className="border p-2">Tác Giả</td>
                    <td className="border p-2">Link File</td>
                    <td className="border p-2">Tên Thư Mục (Để tự phân loại)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )
    },
    {
      id: 'teaching',
      title: 'Báo giảng & Lịch dạy',
      icon: Icons.Clipboard,
      content: (
        <div className="space-y-6">
          <section>
            <h3 className="text-xl font-bold text-slate-800 mb-3">1. Quy trình soạn Báo giảng</h3>
            <ol className="list-decimal pl-5 space-y-3 text-sm text-slate-700">
              <li>
                <strong>Bước 1: Tạo Danh sách Lớp</strong><br/>
                Vào mục "Báo Giảng", bấm nút "Quản lý Lớp" ở cột bên trái để thêm các lớp mình giảng dạy (VD: 10A1, 11B2).
              </li>
              <li>
                <strong>Bước 2: Chọn Tuần</strong><br/>
                Chọn tuần học tương ứng trên thanh bên trái.
              </li>
              <li>
                <strong>Bước 3: Thêm Báo Giảng</strong><br/>
                Bấm "Thêm Báo Giảng", điền thông tin: Lớp, Tiết, Tên bài dạy. Quan trọng nhất là dán <strong>Link Giáo Án</strong> (File PDF trên Drive) để có thể xem lại nhanh khi lên lớp.
              </li>
            </ol>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-800 mb-3">2. Nhập Báo giảng từ Excel</h3>
            <p className="text-sm text-slate-600 mb-2">Thầy/Cô có thể soạn sẵn trên Excel rồi nhập vào. Thứ tự cột:</p>
            <code className="block bg-slate-800 text-white p-3 rounded-lg text-xs font-mono mb-2">
              [Lớp] - [Tuần] - [Tiết] - [Nội dung bài dạy] - [Link Giáo án] - [Ghi chú] - [Rút kinh nghiệm]
            </code>
            <p className="text-xs text-red-500 italic">Lưu ý: Tên lớp trong file Excel phải khớp hoặc sẽ được tự động tạo mới nếu chưa có.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-800 mb-3">3. Thời khóa biểu</h3>
            <p className="text-sm text-slate-700">
              TKB hỗ trợ hiển thị cả Chủ nhật. Bấm trực tiếp vào ô trống để thêm/sửa môn học. Dữ liệu TKB sẽ được dùng để hiển thị trên Dashboard (Lịch dạy hôm nay).
            </p>
          </section>
        </div>
      )
    },
    {
      id: 'homeroom',
      title: 'Công tác Chủ nhiệm',
      icon: Icons.Users,
      content: (
        <div className="space-y-6">
          <section>
            <h3 className="text-xl font-bold text-slate-800 mb-3">1. Quản lý Học sinh</h3>
            <p className="text-sm text-slate-700 mb-2">
              Nên sử dụng tính năng <strong>Nhập Excel</strong> để thêm nhanh danh sách lớp.
            </p>
            <div className="bg-white border border-slate-200 rounded p-3 text-xs">
               <strong>Cấu trúc Excel:</strong> Cột A: Họ tên | Cột B: Giới tính (Nam/Nữ) | Cột C: Ngày sinh | Cột D: SĐT | Cột E: Địa chỉ.
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-800 mb-3">2. Chấm Thi đua</h3>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
              <li>Chọn học sinh và loại ghi nhận (Khen thưởng / Vi phạm).</li>
              <li>Có thể chọn "Tất cả học sinh" để ghi nhận tập thể.</li>
              <li>Dữ liệu thi đua sẽ được tổng hợp để xuất báo cáo cuối tuần.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-800 mb-3">3. Tạo Giấy Khen (Vinh Danh)</h3>
            <p className="text-sm text-slate-700 mb-3">Tính năng giúp tạo ảnh vinh danh đẹp mắt để gửi nhóm Zalo phụ huynh.</p>
            <div className="space-y-2 text-sm text-slate-700">
               <p>✨ <strong>Cách dùng:</strong></p>
               <ul className="list-disc pl-5">
                  <li>Chọn tab "Vinh Danh" trong Sổ Chủ Nhiệm.</li>
                  <li>Điền thông tin trường, lớp, chọn học sinh tiêu biểu.</li>
                  <li>Kéo thả các <strong>Sticker</strong> (Sao, Cup, Hoa...) vào khung hình.</li>
                  <li>Bấm "Xuất ảnh PNG" để tải về máy.</li>
                  <li>Dùng nút "Xuất hàng loạt" nếu muốn tạo giấy khen cho cả lớp.</li>
               </ul>
            </div>
          </section>
        </div>
      )
    },
    {
      id: 'tools',
      title: 'Lịch & Tiện ích',
      icon: Icons.Briefcase,
      content: (
        <div className="space-y-6">
          <section>
            <h3 className="text-xl font-bold text-slate-800 mb-3">1. Lịch Công Tác & Nhắc Nhở</h3>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
              <li>Thêm các đầu việc quan trọng (Họp tổ, Nộp hồ sơ, Chấm bài...).</li>
              <li>Tích vào ô <strong>"Bật nhắc nhở"</strong> và chọn hạn chót. Hệ thống sẽ hiển thị thông báo (Notification) trên trình duyệt trước 1 ngày.</li>
              <li>
                 <strong>Mới:</strong> Bấm vào biểu tượng <Icons.Download className="inline w-3 h-3"/> ở mỗi công việc để tải file <code>.ics</code>. 
                 Mở file này để thêm lịch vào Calendar của điện thoại/máy tính.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-800 mb-3">2. Sổ tay Công nghệ (Tech)</h3>
            <p className="text-sm text-slate-700">
              Nơi lưu trữ các câu lệnh (Prompts) hay dùng cho ChatGPT/Gemini hoặc lưu bookmark các trang web hay dùng trong dạy học (Canvas, Padlet, Kahoot...).
            </p>
          </section>
        </div>
      )
    },
    {
      id: 'settings',
      title: 'Sao lưu & Phục hồi',
      icon: Icons.Settings,
      content: (
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
             <h4 className="font-bold text-yellow-800 mb-2">Nguyên tắc sống còn:</h4>
             <p className="text-sm text-yellow-700">
               Vì ứng dụng offline-first (lưu trên máy), việc sao lưu là trách nhiệm của người dùng.
               Hãy sao lưu <strong>ít nhất 1 tuần/lần</strong>.
             </p>
          </div>

          <section>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Cách Sao Lưu (Backup)</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700">
               <li>Vào <strong>Cài đặt</strong> (Góc dưới menu trái).</li>
               <li>Chọn <strong>"Sao lưu toàn bộ (JSON)"</strong>. File này chứa tất cả dữ liệu (Sách, điểm, lịch...).</li>
               <li>Lưu file tải về vào Google Drive hoặc USB để an toàn.</li>
            </ol>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Cách Phục Hồi (Restore)</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700">
               <li>Khi sang máy mới hoặc lỡ xóa dữ liệu.</li>
               <li>Vào <strong>Cài đặt</strong> &rarr; <strong>Khôi phục từ file JSON</strong>.</li>
               <li>Chọn file backup đã lưu trước đó. Hệ thống sẽ khôi phục lại nguyên trạng.</li>
            </ol>
          </section>
        </div>
      )
    },
    {
      id: 'faq',
      title: 'Hỏi đáp (FAQ)',
      icon: Icons.Bot,
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
             {[
               { q: "Tôi đổi máy tính/điện thoại thì dữ liệu có còn không?", a: "KHÔNG. Dữ liệu được lưu trực tiếp trên trình duyệt của máy hiện tại. Để chuyển dữ liệu sang máy mới, Thầy/Cô cần vào Cài đặt -> Sao lưu file JSON, gửi file đó sang máy mới và chọn Khôi phục." },
               { q: "Ứng dụng có cần mạng internet không?", a: "Ứng dụng có thể hoạt động OFFLINE (không cần mạng) với các dữ liệu đã nhập. Tuy nhiên, để xem file sách từ Google Drive hoặc đồng bộ Classroom, Thầy/Cô cần có kết nối mạng." },
               { q: "Tại sao tôi không xem được sách trên Drive?", a: "Hãy đảm bảo file trên Google Drive đã được mở quyền chia sẻ (Bất kỳ ai có đường liên kết). Ngoài ra, một số trình duyệt chặn cookie bên thứ 3 có thể ảnh hưởng đến việc hiển thị." },
               { q: "Làm sao để in báo cáo?", a: "Hệ thống hỗ trợ xuất file Excel (Báo giảng, Điểm thi đua, Lịch công tác). Thầy/Cô hãy tải file Excel về, căn chỉnh trang in theo ý muốn và in từ Excel để có kết quả đẹp nhất." },
               { q: "Giấy khen tải về bị lỗi phông chữ hoặc bị lệch?", a: "Tính năng tạo ảnh phụ thuộc vào trình duyệt. Hãy thử dùng Google Chrome trên máy tính để có chất lượng ảnh tốt nhất." }
             ].map((faq, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                   <h4 className="font-bold text-slate-800 mb-2 flex items-start gap-2">
                      <span className="text-primary mt-0.5"><Icons.Bot /></span>
                      {faq.q}
                   </h4>
                   <p className="text-sm text-slate-600 pl-8">{faq.a}</p>
                </div>
             ))}
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      {/* SIDEBAR NAVIGATION */}
      <div className="w-20 md:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-slate-200">
           <h1 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
             <Icons.BookOpen /> <span className="hidden md:inline">Hướng Dẫn</span>
           </h1>
        </div>
        <div className="flex-1 py-2">
           {SECTIONS.map(section => (
             <button
               key={section.id}
               onClick={() => setActiveSection(section.id)}
               className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                 activeSection === section.id 
                   ? 'bg-blue-50 text-primary border-r-4 border-primary' 
                   : 'text-slate-600 hover:bg-slate-50'
               }`}
             >
               <div className={`${activeSection === section.id ? 'text-primary' : 'text-slate-400'}`}>
                 <section.icon />
               </div>
               <span className="hidden md:inline font-medium text-sm text-left">{section.title}</span>
             </button>
           ))}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
         {/* Header */}
         <header className="px-6 py-5 bg-white border-b border-slate-200 shrink-0">
            <h2 className="text-2xl font-bold text-slate-800">
               {SECTIONS.find(s => s.id === activeSection)?.title}
            </h2>
         </header>

         {/* Scrollable Content */}
         <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-24 md:pb-10">
            
            {/* AUTHOR HEADER (Green Style) */}
            <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-lg mb-8 flex flex-col md:flex-row items-center justify-between gap-4 border border-emerald-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <div className="scale-[3]"><Icons.Award /></div>
                </div>
                
                <div className="relative z-10 text-center md:text-left">
                   <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">Tác giả & Phát triển</p>
                   <h2 className="text-2xl md:text-3xl font-extrabold mb-1">Thầy Vũ Tiến Lực</h2>
                   <p className="text-emerald-50 font-medium">Trường THPT Nguyễn Hữu Cảnh - TP. Hồ Chí Minh</p>
                </div>

                <div className="relative z-10 flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg border border-white/30">
                   <Icons.Bot />
                   <div className="text-left">
                      <span className="block text-[10px] text-emerald-100 font-bold uppercase">Liên hệ / Zalo</span>
                      <span className="block text-lg font-mono font-bold">0969 068 849</span>
                   </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto">
               {SECTIONS.find(s => s.id === activeSection)?.content}
            </div>
            
            {/* Footer Credit (Subtle) */}
            <div className="mt-12 pt-6 border-t border-slate-200 text-center">
               <p className="text-xs text-slate-400">
                  Ứng dụng Sổ Tay Giáo Viên AI - Phiên bản 2.1 <br/>
                  Sản phẩm vì cộng đồng giáo viên Việt Nam.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};
