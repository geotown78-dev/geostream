import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCw, TrendingUp, TrendingDown, Minus, Search, Radio, Calendar } from 'lucide-react';

interface Standing {
  rank: number;
  team: string;
  logo?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  gd?: number;
}

export default function Leaderboard() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStandings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setStandings(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandings();
    
    // Auto update every 5 minutes
    const interval = setInterval(fetchStandings, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredStandings = standings.filter(s => 
    s.team.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-brand-black">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center border border-brand-primary/20">
                <Trophy size={20} className="text-brand-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary">LALIGA EA SPORTS 2025/26</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter uppercase leading-none">
              ლიდერბორდი
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-primary transition-colors" size={16} />
              <input 
                type="text"
                placeholder="მოძებნე გუნდი..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-brand-surface border border-brand-border rounded-xl pl-12 pr-6 py-3 text-xs font-bold focus:outline-none focus:border-brand-primary/50 transition-all w-[240px]"
              />
            </div>
            <button 
              onClick={fetchStandings}
              disabled={loading}
              className="p-3 bg-brand-surface border border-brand-border rounded-xl hover:border-brand-primary/30 transition-all disabled:opacity-50 group"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin text-brand-primary' : 'text-zinc-400 group-hover:text-brand-primary transition-colors'} />
            </button>
          </div>
        </div>

        {/* Info Bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500">ბოლოს განახლდა</div>
              <div className="text-sm font-black text-white">{lastUpdated.toLocaleTimeString('ka-GE')}</div>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center border border-brand-primary/20">
              <Radio className="text-brand-primary animate-pulse" size={20} />
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500">სტატუსი</div>
              <div className="text-sm font-black text-white">პირდაპირი განახლება</div>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
              <Calendar className="text-blue-500" size={20} />
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500">სეზონი</div>
              <div className="text-sm font-black text-white">2025/2026 Season</div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="glass-card overflow-hidden border border-brand-border rounded-[2rem] shadow-2xl">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-brand-surface/50 border-bottom border-brand-border">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">POS</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">TEAM</th>
                  <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">P</th>
                  <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">W</th>
                  <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">D</th>
                  <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">L</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-brand-primary text-center">PTS</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">FORM</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {loading && standings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                        <div className="mt-4 text-zinc-500 font-bold uppercase text-[10px] tracking-widest">იტვირთება მონაცემები...</div>
                      </td>
                    </tr>
                  ) : filteredStandings.map((team, idx) => (
                    <motion.tr 
                      key={team.team}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group hover:bg-white/5 transition-colors border-b border-brand-border/50 last:border-0"
                    >
                      <td className="px-8 py-5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black italic text-sm ${
                          team.rank <= 4 ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30' :
                          team.rank >= 18 ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                          'bg-white/5 text-zinc-400 border border-white/10'
                        }`}>
                          {team.rank}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 overflow-hidden group-hover:border-brand-primary/50 transition-all p-1">
                            <img 
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${team.team}&backgroundColor=transparent&fontFamily=Arial&fontWeight=900&fontSize=40`} 
                              className="w-full h-full"
                              alt=""
                            />
                          </div>
                          <div>
                            <div className="text-sm font-black uppercase tracking-tight group-hover:text-brand-primary transition-colors">{team.team}</div>
                            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">LALIGA Santander</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-center font-mono font-bold text-sm text-zinc-400">{team.played}</td>
                      <td className="px-4 py-5 text-center font-mono font-bold text-sm text-zinc-300">{team.won}</td>
                      <td className="px-4 py-5 text-center font-mono font-bold text-sm text-zinc-400">{team.drawn}</td>
                      <td className="px-4 py-5 text-center font-mono font-bold text-sm text-zinc-500">{team.lost}</td>
                      <td className="px-8 py-5 text-center font-mono font-black text-xl text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                        {team.points}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center gap-1.5">
                          {team.rank <= 3 ? (
                            <>
                              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                              <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                              <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-8 py-6 border-t border-brand-border/30">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded bg-brand-primary/30 border border-brand-primary"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Champions League Qualification</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded bg-white/5 border border-white/10"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Mid Table</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Relegation Zone</span>
          </div>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
