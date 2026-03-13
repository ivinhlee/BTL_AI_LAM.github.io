/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import RoomList from './pages/RoomList';
import RoomDetail from './pages/RoomDetail';
import Trips from './pages/Trips';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Placeholder Components
const Promotions = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-slate-900 mb-4">Khuyến Mãi</h1>
      <p className="text-slate-500">Các chương trình ưu đãi hấp dẫn.</p>
    </div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col font-sans bg-slate-50">
          <Header />
          
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/rooms" element={<RoomList />} />
              <Route path="/rooms/:id" element={<RoomDetail />} />
              <Route path="/promotions" element={<Promotions />} />
              <Route path="/trips" element={<Trips />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>

          <Footer />
          <Toaster position="top-center" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
