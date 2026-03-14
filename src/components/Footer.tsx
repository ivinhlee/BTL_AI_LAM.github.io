import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Cột 1: Giới thiệu */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-emerald-500" />
              spotbnb
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              Chúng tôi mang đến những trải nghiệm lưu trú tuyệt vời nhất, giúp bạn khám phá vẻ đẹp của Việt Nam và thế giới với dịch vụ chuyên nghiệp và tận tâm.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-emerald-500 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-emerald-500 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-emerald-500 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Cột 2: Liên kết nhanh */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-emerald-500 transition-colors">Trang chủ</Link>
              </li>
              <li>
                <Link to="/rooms" className="hover:text-emerald-500 transition-colors">Danh sách Phòng</Link>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-500 transition-colors">Khuyến mãi</a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-500 transition-colors">Cẩm nang du lịch</a>
              </li>
            </ul>
          </div>

          {/* Cột 3: Liên hệ */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Liên hệ</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>207 Giải Phóng, Hà Nội, Việt Nam</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>+84 1345308455</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>ivinhlee@spotbnb.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} spotbnb. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}
