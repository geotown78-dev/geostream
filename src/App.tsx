import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar, Sidebar } from './components/UI';
import Home from './pages/Home';
import LiveRoom from './pages/LiveRoom';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/Auth';
import BroadcasterRoom from './pages/BroadcasterRoom';
import Leaderboard from './pages/Leaderboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AnimatePresence } from 'motion/react';

import { ADMIN_EMAILS } from './constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

function ProtectedRoute({ children, adminOnly }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  const userEmail = user.email || '';
  const isAdmin = ADMIN_EMAILS.includes(userEmail);

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function AppContent() {
  return (
    <div className="min-h-screen bg-brand-black text-white font-sans selection:bg-brand-primary selection:text-white transition-colors duration-500">
      <Sidebar />
      <Navbar />
      
      <main className="sm:pl-20 pt-20 pb-20 sm:pb-0">
        <div className="max-w-[1700px] mx-auto p-4 sm:p-8 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/watch/:roomId" element={<LiveRoom />} />
              <Route path="/live" element={<Home />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/register" element={<AuthPage mode="register" />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/broadcast/:roomId" 
                element={
                  <ProtectedRoute adminOnly={true}>
                    <BroadcasterRoom />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </AnimatePresence>
        </div>
      </main>
      
      <footer className="sm:pl-20 border-t border-brand-border py-12 pb-32 sm:pb-12 text-center sm:text-left">
        <div className="max-w-[1700px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-xl font-bold tracking-tight uppercase italic text-brand-primary">
            GEO <span className="text-white">STREAM</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-600">
            <a href="#" className="hover:text-brand-primary transition-colors">კონფიდენციალურობის პოლიტიკა</a>
            <a href="#" className="hover:text-brand-primary transition-colors">წესები და პირობები</a>
            <a href="#" className="hover:text-brand-primary transition-colors">კონტაქტი</a>
          </div>
          <div className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest">
            © 2024 GEOSTREAM ქსელი.
          </div>
        </div>
      </footer>
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
