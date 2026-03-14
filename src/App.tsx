/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import RoomList from './pages/RoomList';
import RoomDetail from './pages/RoomDetail';
import Trips from './pages/Trips';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import AdminAddRoom from './pages/AdminAddRoom';
import AdminDashboard from './pages/AdminDashboard';
import AdminManageReviews from './pages/AdminManageReviews';
import LoginSignupPage from './pages/LoginSignupPage';
import Checkout from './pages/Checkout';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';

// Placeholder Components
const Promotions = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-slate-900 mb-4">Khuyến Mãi</h1>
      <p className="text-slate-500">Các chương trình ưu đãi hấp dẫn.</p>
    </div>
  </div>
);

function AppContent() {
  const location = useLocation();
  const hideChrome = location.pathname === '/login';
  const isRoomDetailPage = /^\/rooms\/[^/]+$/.test(location.pathname);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      {!hideChrome && <Header />}

      <main className={`flex-grow ${isRoomDetailPage ? 'pt-0' : 'pt-24 md:pt-28'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<RoomList />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/admin"
            element={(
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/add-room"
            element={(
              <ProtectedRoute adminOnly>
                <AdminAddRoom />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/reviews"
            element={(
              <ProtectedRoute adminOnly>
                <AdminManageReviews />
              </ProtectedRoute>
            )}
          />
          <Route path="/login" element={<LoginSignupPage />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </main>

      {!hideChrome && <Footer />}
      <Toaster position="top-center" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
