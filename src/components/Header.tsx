import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Menu, X, User, LogOut, Heart, Plane, MessageSquare, Settings, UserCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Danh sách Phòng', path: '/rooms' },
    { name: 'Khuyến mãi', path: '/promotions' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-emerald-500 p-2 rounded-xl group-hover:bg-emerald-600 transition-colors">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              sea<span className="text-emerald-500">bnb</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-emerald-500 ${
                  isActive(link.path) ? 'text-emerald-500' : 'text-slate-600'
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 border border-slate-200 rounded-full p-1.5 pl-3 hover:shadow-md transition-shadow bg-white"
                >
                  <Menu className="w-4 h-4 text-slate-500" />
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-slate-500 text-white rounded-full flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-slate-100 mb-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    
                    <Link to="/wishlist" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <Heart className="w-4 h-4 text-slate-400" />
                      Danh sách yêu thích
                    </Link>
                    <Link to="/trips" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <Plane className="w-4 h-4 text-slate-400" />
                      Chuyến đi
                    </Link>
                    <Link to="#" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      Tin nhắn
                    </Link>
                    
                    <div className="h-px bg-slate-100 my-2"></div>
                    
                    <Link to="/profile" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <UserCircle className="w-4 h-4 text-slate-400" />
                      Hồ sơ
                    </Link>
                    <Link to="#" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <Settings className="w-4 h-4 text-slate-400" />
                      Cài đặt
                    </Link>
                    
                    <div className="h-px bg-slate-100 my-2"></div>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-md"
              >
                Đăng nhập
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-slate-600 hover:text-emerald-500 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 pt-2 pb-6 space-y-1 shadow-lg absolute w-full">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-3 rounded-lg text-base font-medium ${
                isActive(link.path)
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-500'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 px-3 space-y-3">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl mb-4">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-slate-500 text-white rounded-full flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                
                <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg">
                  <Heart className="w-5 h-5 text-slate-400" /> Danh sách yêu thích
                </Link>
                <Link to="/trips" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg">
                  <Plane className="w-5 h-5 text-slate-400" /> Chuyến đi
                </Link>
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg">
                  <UserCircle className="w-5 h-5 text-slate-400" /> Hồ sơ
                </Link>
                
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 w-full text-center bg-red-50 hover:bg-red-100 text-red-600 px-5 py-3 rounded-xl text-base font-medium transition-colors mt-4"
                >
                  <LogOut className="w-5 h-5" />
                  Đăng xuất
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="block w-full text-center bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl text-base font-medium transition-colors"
              >
                Đăng nhập / Đăng ký
              </button>
            )}
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}
