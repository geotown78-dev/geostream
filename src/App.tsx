import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/UI';
import Home from './pages/Home';
import LiveRoom from './pages/LiveRoom';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/Auth';
import BroadcasterRoom from './pages/BroadcasterRoom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AnimatePresence } from 'motion/react';

import { ADMIN_EMAILS } from './constants';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  
  if (adminOnly && !ADMIN_EMAILS.includes(user.email || '')) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
}

function AppContent() {
  return (
    <div className="min-h-screen bg-brand-black text-zinc-100 font-sans selection:bg-brand-primary selection:text-white">
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/watch/:roomId" element={<LiveRoom />} />
          <Route path="/live" element={<Home />} />
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
      
      <footer className="border-t border-brand-border py-12 mt-20">
        <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-xl font-bold tracking-tight uppercase italic text-brand-primary">
            APEX <span className="text-white">STREAM</span>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-zinc-600">
            <a href="#" className="hover:text-brand-primary transition-colors">PRIVACY POLICY</a>
            <a href="#" className="hover:text-brand-primary transition-colors">TERMS OF SERVICE</a>
            <a href="#" className="hover:text-brand-primary transition-colors">CONTACT US</a>
          </div>
          <div className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest">
            © 2024 APEX NETWORK. CLOUD RUN DEPLOYED.
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
