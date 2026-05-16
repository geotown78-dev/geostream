import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ChevronUp, ChevronDown, Minus, Edit2, Check, X, Save, FormInput } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAILS } from '../constants';
import { supabase } from '../lib/supabase';

const LALIGA_LOGOS: Record<string, string> = {
  'Barcelona': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_logo.svg/1200px-FC_Barcelona_logo.svg.png',
  'Real Madrid': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/1200px-Real_Madrid_CF.svg.png',
  'Atletico Madrid': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f4/Atletico_madrid_2017_logo.svg/1200px-Atletico_madrid_2017_logo.svg.png',
  'Atlético Madrid': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f4/Atletico_madrid_2017_logo.svg/1200px-Atletico_madrid_2017_logo.svg.png',
  'Villarreal': 'https://upload.wikimedia.org/wikipedia/en/thumb/7/70/Villarreal_CF_logo.svg/1200px-Villarreal_CF_logo.svg.png',
  'Athletic Club': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/98/Club_Athletic_Bilbao_logo.svg/1200px-Club_Athletic_Bilbao_logo.svg.png',
  'Real Sociedad': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f1/Real_Sociedad_logo.svg/1200px-Real_Sociedad_logo.svg.png',
  'Girona': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/90/Girona_FC_logo.svg/1200px-Girona_FC_logo.svg.png',
  'Real Betis': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/11/Real_Betis_logo.svg/1200px-Real_Betis_logo.svg.png',
  'Osasuna': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/db/CA_Osasuna_logo.svg/1200px-CA_Osasuna_logo.svg.png',
  'Sevilla': 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3b/Sevilla_FC_logo.svg/1200px-Sevilla_FC_logo.svg.png',
  'Celta': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/12/RC_Celta_de_Vigo_logo.svg/1200px-RC_Celta_de_Vigo_logo.svg.png',
  'Getafe': 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7f/Getafe_logo.svg/1200px-Getafe_logo.svg.png',
  'Rayo Vallecano': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1b/Rayo_Vallecano_logo.svg/1200px-Rayo_Vallecano_logo.svg.png',
  'Valencia': 'https://upload.wikimedia.org/wikipedia/en/thumb/c/ce/Valenciacf.svg/1200px-Valenciacf.svg.png',
  'Espanyol': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d6/RCD_Espanyol_logo.svg/1200px-RCD_Espanyol_logo.svg.png',
  'Alavés': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f8/Deportivo_Alaves_logo.svg/1200px-Deportivo_Alaves_logo.svg.png',
  'Elche': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/Elche_CF_logo.svg/1200px-Elche_CF_logo.svg.png',
  'Mallorca': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/Rcd_mallorca.svg/1200px-Rcd_mallorca.svg.png',
  'Levante': 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/Levante_Uni%C3%B3n_Deportiva%2C_S.A.D._logo.svg/1200px-Levante_Uni%C3%B3n_Deportiva%2C_S.A.D._logo.svg.png',
  'Real Oviedo': 'https://upload.wikimedia.org/wikipedia/en/thumb/6/60/Real_Oviedo_logo.svg/1200px-Real_Oviedo_logo.svg.png',
};

interface TeamData {
  rank: number;
  name: string;
  logo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  status: 'up' | 'down' | 'same';
  form: ('W' | 'L' | 'D')[];
}

const INITIAL_BOARD_DATA: TeamData[] = [
  { rank: 1, name: 'Barcelona', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_logo.svg/200px-FC_Barcelona_logo.svg.png', played: 36, won: 30, drawn: 1, lost: 5, gf: 91, ga: 32, gd: 59, points: 91, status: 'same', form: ['W', 'W', 'W', 'W', 'L'] },
  { rank: 2, name: 'Real Madrid', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/200px-Real_Madrid_CF.svg.png', played: 36, won: 25, drawn: 5, lost: 6, gf: 72, ga: 33, gd: 39, points: 80, status: 'same', form: ['W', 'D', 'W', 'L', 'W'] },
  { rank: 3, name: 'Villarreal', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/70/Villarreal_CF_logo.svg/200px-Villarreal_CF_logo.svg.png', played: 36, won: 21, drawn: 6, lost: 9, gf: 67, ga: 43, gd: 24, points: 69, status: 'up', form: ['D', 'W', 'W', 'W', 'L'] },
  { rank: 4, name: 'Atlético Madrid', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f4/Atletico_madrid_2017_logo.svg/200px-Atletico_madrid_2017_logo.svg.png', played: 36, won: 20, drawn: 6, lost: 10, gf: 60, ga: 39, gd: 21, points: 66, status: 'down', form: ['L', 'W', 'W', 'W', 'W'] },
  { rank: 5, name: 'Real Betis', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/11/Real_Betis_logo.svg/200px-Real_Betis_logo.svg.png', played: 36, won: 14, drawn: 15, lost: 7, gf: 56, ga: 44, gd: 12, points: 57, status: 'same', form: ['W', 'D', 'W', 'D', 'W'] },
  { rank: 6, name: 'Celta', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/12/RC_Celta_de_Vigo_logo.svg/200px-RC_Celta_de_Vigo_logo.svg.png', played: 36, won: 13, drawn: 11, lost: 12, gf: 51, ga: 47, gd: 4, points: 50, status: 'up', form: ['L', 'L', 'W', 'W', 'L'] },
  { rank: 7, name: 'Getafe', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7f/Getafe_logo.svg/200px-Getafe_logo.svg.png', played: 36, won: 14, drawn: 6, lost: 16, gf: 31, ga: 37, gd: -6, points: 48, status: 'same', form: ['W', 'L', 'L', 'D', 'W'] },
  { rank: 8, name: 'Real Sociedad', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f1/Real_Sociedad_logo.svg/200px-Real_Sociedad_logo.svg.png', played: 36, won: 11, drawn: 12, lost: 13, gf: 55, ga: 56, gd: -1, points: 45, status: 'same', form: ['L', 'D', 'L', 'W', 'D'] },
  { rank: 9, name: 'Athletic Club', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/98/Club_Athletic_Bilbao_logo.svg/200px-Club_Athletic_Bilbao_logo.svg.png', played: 36, won: 13, drawn: 5, lost: 18, gf: 40, ga: 53, gd: -13, points: 44, status: 'down', form: ['W', 'D', 'W', 'L', 'L'] },
  { rank: 10, name: 'Rayo Vallecano', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1b/Rayo_Vallecano_logo.svg/200px-Rayo_Vallecano_logo.svg.png', played: 36, won: 10, drawn: 14, lost: 12, gf: 37, ga: 43, gd: -6, points: 44, status: 'up', form: ['W', 'D', 'W', 'D', 'D'] },
  { rank: 11, name: 'Valencia', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/ce/Valenciacf.svg/200px-Valenciacf.svg.png', played: 36, won: 11, drawn: 10, lost: 15, gf: 39, ga: 51, gd: -12, points: 43, status: 'same', form: ['D', 'W', 'L', 'W', 'D'] },
  { rank: 12, name: 'Sevilla', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3b/Sevilla_FC_logo.svg/200px-Sevilla_FC_logo.svg.png', played: 36, won: 12, drawn: 7, lost: 17, gf: 46, ga: 58, gd: -12, points: 43, status: 'down', form: ['L', 'L', 'W', 'W', 'W'] },
  { rank: 13, name: 'Osasuna', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/db/CA_Osasuna_logo.svg/200px-CA_Osasuna_logo.svg.png', played: 36, won: 11, drawn: 9, lost: 16, gf: 43, ga: 47, gd: -4, points: 42, status: 'same', form: ['L', 'W', 'L', 'L', 'L'] },
  { rank: 14, name: 'Espanyol', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d6/RCD_Espanyol_logo.svg/200px-RCD_Espanyol_logo.svg.png', played: 36, won: 11, drawn: 9, lost: 16, gf: 40, ga: 53, gd: -13, points: 42, status: 'up', form: ['L', 'D', 'L', 'L', 'W'] },
  { rank: 15, name: 'Girona', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/90/Girona_FC_logo.svg/200px-Girona_FC_logo.svg.png', played: 36, won: 9, drawn: 13, lost: 14, gf: 38, ga: 53, gd: -15, points: 40, status: 'same', form: ['L', 'L', 'L', 'D', 'D'] },
  { rank: 16, name: 'Alavés', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f8/Deportivo_Alaves_logo.svg/200px-Deportivo_Alaves_logo.svg.png', played: 36, won: 10, drawn: 10, lost: 16, gf: 42, ga: 54, gd: -12, points: 40, status: 'down', form: ['L', 'W', 'W', 'D', 'L'] },
  { rank: 17, name: 'Elche', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/Elche_CF_logo.svg/200px-Elche_CF_logo.svg.png', played: 36, won: 9, drawn: 12, lost: 15, gf: 47, ga: 56, gd: -9, points: 39, status: 'same', form: ['W', 'D', 'L', 'L', 'L'] },
  { rank: 18, name: 'Mallorca', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/Rcd_mallorca.svg/200px-Rcd_mallorca.svg.png', played: 36, won: 10, drawn: 9, lost: 17, gf: 44, ga: 55, gd: -11, points: 39, status: 'up', form: ['D', 'L', 'W', 'D', 'L'] },
  { rank: 19, name: 'Levante', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/Levante_Uni%C3%B3n_Deportiva%2C_S.A.D._logo.svg/200px-Levante_Uni%C3%B3n_Deportiva%2C_S.A.D._logo.svg.png', played: 36, won: 10, drawn: 9, lost: 17, gf: 44, ga: 59, gd: -15, points: 39, status: 'down', form: ['W', 'D', 'L', 'W', 'W'] },
  { rank: 20, name: 'Real Oviedo', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/60/Real_Oviedo_logo.svg/200px-Real_Oviedo_logo.svg.png', played: 36, won: 6, drawn: 11, lost: 19, gf: 26, ga: 56, gd: -30, points: 29, status: 'same', form: ['D', 'L', 'W', 'L', 'L'] },
];

export default function Leaderboard() {
  const { user } = useAuth();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');
  
  const [data, setData] = useState<TeamData[]>(() => {
    const saved = localStorage.getItem('laliga_leaderboard');
    return saved ? JSON.parse(saved) : INITIAL_BOARD_DATA;
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<TeamData[]>([]);

  const toggleEdit = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setEditData([...data]);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    setData(editData);
    localStorage.setItem('laliga_leaderboard', JSON.stringify(editData));
    setIsEditing(false);
    // Here you could also sync with Supabase if you have a table:
    // await supabase.from('leaderboard').upsert(editData);
  };

  const handleCellChange = (index: number, field: keyof TeamData, value: string | number) => {
    const newData = [...editData];
    (newData[index] as any)[field] = value;
    
    // Auto-calculate GD
    if (field === 'gf' || field === 'ga') {
      newData[index].gd = Number(newData[index].gf) - Number(newData[index].ga);
    }
    
    setEditData(newData);
  };

  const handleFormChange = (index: number, formIndex: number, type: 'W' | 'L' | 'D') => {
    const newData = [...editData];
    newData[index].form[formIndex] = type;
    setEditData(newData);
  };

  return (
    <div className="min-h-screen pt-8 pb-20">
      <div className="max-w-[1200px] mx-auto space-y-8 px-4 sm:px-6">
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
          
          <div className="flex items-center gap-4">
            {isAdmin && (
              <button 
                onClick={toggleEdit}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                  isEditing ? "bg-zinc-800 text-white" : "bg-brand-primary/10 text-brand-primary border border-brand-primary/20 hover:bg-brand-primary hover:text-white"
                )}
              >
                {isEditing ? <><X size={14} /> გაუქმება</> : <><Edit2 size={14} /> რედაქტირება</>}
              </button>
            )}
            {isEditing && (
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Save size={14} /> შენახვა
              </button>
            )}
            <div className="flex items-center gap-4 bg-brand-surface border border-brand-border p-4 rounded-2xl">
              <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                <Trophy className="text-yellow-500" size={20} />
              </div>
              <div>
                <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">ლიდერი</div>
                <div className="text-sm font-black uppercase italic leading-none">{data[0]?.name}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Table */}
        <div className="bg-brand-surface border border-brand-border rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
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
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-brand-primary text-center">ქ</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">ფორმა</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {(isEditing ? editData : data).map((team, i) => (
                  <motion.tr 
                    key={`${team.name}-${i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.4) }}
                    className="hover:bg-white/5 transition-colors group cursor-default"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "text-sm font-black italic",
                          team.rank <= 4 ? "text-brand-primary" : 
                          team.rank <= 6 ? "text-yellow-500" : 
                          team.rank === 7 ? "text-blue-500" : "text-zinc-600"
                        )}>
                          {team.rank.toString().padStart(2, '0')}
                        </span>
                        {!isEditing && (
                          <>
                            {team.status === 'up' && <ChevronUp size={12} className="text-green-500" />}
                            {team.status === 'down' && <ChevronDown size={12} className="text-red-500" />}
                            {team.status === 'same' && <Minus size={12} className="text-zinc-700" />}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-brand-border p-1 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <img 
                            src={team.logo || 'https://via.placeholder.com/40'} 
                            alt={team.name}
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        {isEditing ? (
                          <input 
                            value={team.name} 
                            onChange={(e) => handleCellChange(i, 'name', e.target.value)}
                            className="bg-black/50 border border-brand-border rounded px-2 py-1 text-xs font-black uppercase italic w-32 outline-none focus:border-brand-primary"
                          />
                        ) : (
                          <span className="font-black uppercase italic tracking-tight group-hover:text-brand-primary transition-colors text-sm">{team.name}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {isEditing ? (
                        <input 
                          type="number"
                          value={team.played} 
                          onChange={(e) => handleCellChange(i, 'played', parseInt(e.target.value) || 0)}
                          className="bg-black/50 border border-brand-border rounded px-1 py-1 text-[10px] font-bold w-12 text-center outline-none focus:border-brand-primary"
                        />
                      ) : (
                        <span className="text-xs font-bold text-zinc-400">{team.played}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {isEditing ? (
                        <input 
                          type="number"
                          value={team.won} 
                          onChange={(e) => handleCellChange(i, 'won', parseInt(e.target.value) || 0)}
                          className="bg-black/50 border border-brand-border rounded px-1 py-1 text-[10px] font-bold w-12 text-center outline-none focus:border-brand-primary"
                        />
                      ) : (
                        <span className="text-xs font-bold text-zinc-300">{team.won}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {isEditing ? (
                        <input 
                          type="number"
                          value={team.drawn} 
                          onChange={(e) => handleCellChange(i, 'drawn', parseInt(e.target.value) || 0)}
                          className="bg-black/50 border border-brand-border rounded px-1 py-1 text-[10px] font-bold w-12 text-center outline-none focus:border-brand-primary"
                        />
                      ) : (
                        <span className="text-xs font-bold text-zinc-300">{team.drawn}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {isEditing ? (
                        <input 
                          type="number"
                          value={team.lost} 
                          onChange={(e) => handleCellChange(i, 'lost', parseInt(e.target.value) || 0)}
                          className="bg-black/50 border border-brand-border rounded px-1 py-1 text-[10px] font-bold w-12 text-center outline-none focus:border-brand-primary"
                        />
                      ) : (
                        <span className="text-xs font-bold text-zinc-300">{team.lost}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {isEditing ? (
                        <input 
                          type="number"
                          value={team.gf} 
                          onChange={(e) => handleCellChange(i, 'gf', parseInt(e.target.value) || 0)}
                          className="bg-black/50 border border-brand-border rounded px-1 py-1 text-[10px] font-bold w-12 text-center outline-none focus:border-brand-primary"
                        />
                      ) : (
                        <span className="text-xs font-bold text-zinc-500">{team.gf}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {isEditing ? (
                        <input 
                          type="number"
                          value={team.ga} 
                          onChange={(e) => handleCellChange(i, 'ga', parseInt(e.target.value) || 0)}
                          className="bg-black/50 border border-brand-border rounded px-1 py-1 text-[10px] font-bold w-12 text-center outline-none focus:border-brand-primary"
                        />
                      ) : (
                        <span className="text-xs font-bold text-zinc-500">{team.ga}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={cn(
                        "text-[10px] font-bold",
                        team.gd > 0 ? "text-green-500/80" : team.gd < 0 ? "text-red-500/80" : "text-zinc-500"
                      )}>
                        {team.gd > 0 ? `+${team.gd}` : team.gd}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isEditing ? (
                        <input 
                          type="number"
                          value={team.points} 
                          onChange={(e) => handleCellChange(i, 'points', parseInt(e.target.value) || 0)}
                          className="bg-brand-primary/20 border border-brand-primary/40 rounded px-1 py-1 text-[10px] font-black text-brand-primary w-12 text-center outline-none focus:border-brand-primary"
                        />
                      ) : (
                        <span className="inline-flex px-2 py-0.5 bg-brand-primary/10 text-brand-primary font-black italic rounded text-xs">
                          {team.points}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {team.form.map((res, fi) => (
                          <div key={fi} className="relative group/form">
                            {isEditing ? (
                              <button 
                                onClick={() => {
                                  const next: Record<string, 'W'|'L'|'D'> = { 'W': 'D', 'D': 'L', 'L': 'W' };
                                  handleFormChange(i, fi, next[res]);
                                }}
                                className={cn(
                                  "w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white transition-all hover:scale-110",
                                  res === 'W' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : 
                                  res === 'L' ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]" : 
                                  "bg-zinc-600 shadow-[0_0_10px_rgba(82,82,82,0.4)]"
                                )}
                              >
                                {res}
                              </button>
                            ) : (
                              <div className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center transform hover:scale-110 transition-all",
                                res === 'W' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]" : 
                                res === 'L' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]" : 
                                "bg-zinc-600 shadow-[0_0_8px_rgba(82,82,82,0.3)]"
                              )}>
                                {res === 'W' ? <Check size={10} className="text-white" strokeWidth={4} /> : 
                                 res === 'L' ? <X size={10} className="text-white" strokeWidth={4} /> : 
                                 <Minus size={10} className="text-white" strokeWidth={4} />}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-between items-center gap-6 px-4">
          <div className="flex flex-wrap gap-6 text-[9px] font-black uppercase tracking-widest text-zinc-500">
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
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 border-t-2 border-red-500 border-dashed w-4" />
              <span>გავარდნის ზონა</span>
            </div>
          </div>
          
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest bg-brand-surface border border-brand-border px-4 py-2 rounded-full">
            ნაჩვენებია <span className="text-white">20</span> გუნდი
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

