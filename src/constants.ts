import { Event } from './lib/supabase';

export const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Football Clash',
    description: 'Tense rivalry match between top teams.',
    thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800',
    sport: 'Football',
    is_live: true,
    start_time: new Date().toISOString(),
    room_name: 'football-clash-2024'
  },
  {
    id: '2',
    title: 'Hoops Showdown',
    description: 'High-stakes basketball playoff action.',
    thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800',
    sport: 'Basketball',
    is_live: true,
    start_time: new Date().toISOString(),
    room_name: 'hoops-showdown'
  },
  {
    id: '3',
    title: 'MMA Championship',
    description: 'Ultimate fight for the title belt.',
    thumbnail: 'https://images.unsplash.com/photo-1552072805-2a9039d00e57?auto=format&fit=crop&q=80&w=800',
    sport: 'MMA',
    is_live: true,
    start_time: new Date().toISOString(),
    room_name: 'mma-champs'
  },
  {
    id: '4',
    title: 'Race Day Drama',
    description: 'Fast-paced street racing final.',
    thumbnail: 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&q=80&w=800',
    sport: 'Racing',
    is_live: false,
    start_time: new Date(Date.now() + 86400000).toISOString(),
    room_name: 'race-day'
  }
];

export const SCHEDULE = [
  { time: '18:00', team1: 'Chelsea', team2: 'Arsenal', sport: 'Football' },
  { time: '20:30', team1: 'Lakers', team2: 'Warriors', sport: 'Basketball' },
  { time: '22:00', team1: 'UFC 300', team2: 'Main Card', sport: 'MMA' },
];
