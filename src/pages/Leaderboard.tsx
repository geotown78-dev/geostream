import React from 'react';
import { motion } from 'motion/react';
import { Trophy, ChevronUp, ChevronDown, Minus } from 'lucide-react';

const LALIGA_LOGOS: Record<string, string> = {
  'Barcelona': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_logo.svg/1200px-FC_Barcelona_logo.svg.png',
  'Real Madrid': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/1200px-Real_Madrid_CF.svg.png',
  'Atletico Madrid': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f4/Atletico_madrid_2017_logo.svg/1200px-Atletico_madrid_2017_logo.svg.png',
  'Villarreal': 'https://upload.wikimedia.org/wikipedia/en/thumb/7/70/Villarreal_CF_logo.svg/1200px-Villarreal_CF_logo.svg.png',
  'Athletic Club': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/98/Club_Athletic_Bilbao_logo.svg/1200px-Club_Athletic_Bilbao_logo.svg.png',
  'Real Sociedad': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f1/Real_Sociedad_logo.svg/1200px-Real_Sociedad_logo.svg.png',
  'Girona': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/90/Girona_FC_logo.svg/1200px-Girona_FC_logo.svg.png',
  'Real Betis': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/11/Real_Betis_logo.svg/1200px-Real_Betis_logo.svg.png',
  'Osasuna': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/db/CA_Osasuna_logo.svg/1200px-CA_Osasuna_logo.svg.png',
  'Sevilla': 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3b/Sevilla_FC_logo.svg/1200px-Sevilla_FC_logo.svg.png',
};

const leaderboardData = [
  { rank: 1, name: 'Barcelona', played: 36, won: 28, drawn: 4, lost: 4, gf: 82, ga: 28, gd: 54, points: 88, status: 'up' },
  { rank: 2, name: 'Real Madrid', played: 36, won: 26, drawn: 6, lost: 4, gf: 75, ga: 24, gd: 51, points: 84, status: 'down' },
  { rank: 3, name: 'Atletico Madrid', played: 36, won: 22, drawn: 7, lost: 7, gf: 64, ga: 36, gd: 28, points: 73, status: 'same' },
  { rank: 4, name: 'Villarreal', played: 36, won: 19, drawn: 8, lost: 9, gf: 58, ga: 42, gd: 16, points: 65, status: 'up' },
  { rank: 5, name: 'Athletic Club', played: 36, won: 18, drawn: 9, lost: 9, gf: 55, ga: 34, gd: 21, points: 63, status: 'down' },
  { rank: 6, name: 'Real Sociedad', played: 36, won: 17, drawn: 10, lost: 9, gf: 48, ga: 38, gd: 10, points: 61, status: 'same' },
  { rank: 7, name: 'Girona', played: 36, won: 16, drawn: 8, lost: 12, gf: 52, ga: 45, gd: 7, points: 56, status: 'up' },
  { rank: 8, name: 'Real Betis', played: 36, won: 14, drawn: 11, lost: 11, gf: 44, ga: 41, gd: 3, points: 53, status: 'same' },
  { rank: 9, name: 'Osasuna', played: 36, won: 13, drawn: 9, lost: 14, gf: 39, ga: 46, gd: -7, points: 48, status: 'down' },
  { rank: 10, name: 'Sevilla', played: 36, won: 12, drawn: 10, lost: 14, gf: 42, ga: 50, gd: -8, points: 46, status: 'up' },
];

export default function Leaderboard() {
  return (
    <div className="min-h-screen pt-8 pb-20">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">განახლებულია 2 წუთის წინ</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter italic uppercase">La Liga <span className="text-brand-primary">ლიდერბორდი</span></h1>
            <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">ესპანეთის ჩემპიონატი • 2025/26 სეზონი</p>
          </div>
          
          <div className="flex items-center gap-4 bg-brand-surface border border-brand-border p-4 rounded-2xl">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
              <Trophy className="text-yellow-500" size={24} />
            </div>
            <div>
              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">მიმდინარე ლიდერი</div>
              <div className="text-lg font-black uppercase italic">Barcelona</div>
            </div>
          </div>
        </header>

        {/* Table */}
        <div className="bg-brand-surface border border-brand-border rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/40 border-b border-brand-border">
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 w-16">#</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">გუნდი</th>
                  <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">თ</th>
                  <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">მ</th>
                  <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">ფ</th>
                  <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">წ</th>
                  <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">გატ</th>
                  <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">გაშ</th>
                  <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">+/-</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-brand-primary text-center">ქულა</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {leaderboardData.map((team, i) => (
                  <motion.tr 
                    key={team.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-white/5 transition-colors group cursor-default"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-black italic ${team.rank <= 4 ? 'text-brand-primary' : 'text-zinc-600'}`}>
                          {team.rank.toString().padStart(2, '0')}
                        </span>
                        {team.status === 'up' && <ChevronUp size={12} className="text-green-500" />}
                        {team.status === 'down' && <ChevronDown size={12} className="text-red-500" />}
                        {team.status === 'same' && <Minus size={12} className="text-zinc-700" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-brand-border p-1.5 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <img 
                            src={LALIGA_LOGOS[team.name] || 'https://via.placeholder.com/40'} 
                            alt={team.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="font-black uppercase italic tracking-tight group-hover:text-brand-primary transition-colors">{team.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-xs font-bold text-zinc-400">{team.played}</td>
                    <td className="px-4 py-4 text-center text-xs font-bold text-zinc-300">{team.won}</td>
                    <td className="px-4 py-4 text-center text-xs font-bold text-zinc-300">{team.drawn}</td>
                    <td className="px-4 py-4 text-center text-xs font-bold text-zinc-300">{team.lost}</td>
                    <td className="px-4 py-4 text-center text-xs font-bold text-zinc-500">{team.gf}</td>
                    <td className="px-4 py-4 text-center text-xs font-bold text-zinc-500">{team.ga}</td>
                    <td className="px-4 py-4 text-center text-xs font-bold text-zinc-400">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-brand-primary text-white font-black italic rounded text-sm shadow-lg shadow-brand-primary/20">
                        {team.points}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-6 text-[9px] font-black uppercase tracking-widest text-zinc-500 px-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded bg-brand-primary" />
            <span>ჩემპიონთა ლიგა</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded bg-yellow-500" />
            <span>ევროპა ლიგა</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded bg-blue-500" />
            <span>კონფერენს ლიგა</span>
          </div>
        </div>
      </div>
    </div>
  );
}
