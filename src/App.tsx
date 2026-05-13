import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/UI';
import Home from './pages/Home';
import LiveRoom from './pages/LiveRoom';
import AdminDashboard from './pages/AdminDashboard';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-brand-black text-white font-sans selection:bg-brand-cyan selection:text-brand-black">
        <Navbar />
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/watch/:roomId" element={<LiveRoom />} />
            <Route path="/live" element={<Home />} /> {/* For now, redirect to home to see events */}
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </AnimatePresence>
        
        <footer className="border-t border-white/5 py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-xl font-extrabold tracking-tighter text-brand-cyan">
              APEX <span className="text-white">SPORTS STREAM</span>
            </div>
            <div className="flex gap-8 text-xs font-bold text-white/40">
              <a href="#" className="hover:text-brand-cyan">PRIVACY POLICY</a>
              <a href="#" className="hover:text-brand-cyan">TERMS OF SERVICE</a>
              <a href="#" className="hover:text-brand-cyan">CONTACT US</a>
            </div>
            <div className="text-xs text-white/20">
              © 2024 APEX NETWORK. ALL RIGHTS RESERVED.
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
