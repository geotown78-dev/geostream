import { Event } from './lib/supabase';

export const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'ფეხბურთის დაპირისპირება',
    description: 'დაძაბული მატჩი ტოპ გუნდებს შორის.',
    thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800',
    sport: 'ფეხბურთი',
    is_live: true,
    start_time: new Date().toISOString(),
    room_name: 'football-clash-2024'
  },
  {
    id: '2',
    title: 'კალათბურთის შოუდაუნი',
    description: 'მაღალი ფსონების პლეი-ოფი.',
    thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800',
    sport: 'კალათბურთი',
    is_live: true,
    start_time: new Date().toISOString(),
    room_name: 'hoops-showdown'
  },
  {
    id: '3',
    title: 'MMA ჩემპიონატი',
    description: 'ბრძოლა ტიტულისთვის.',
    thumbnail: 'https://images.unsplash.com/photo-1552072805-2a9039d00e57?auto=format&fit=crop&q=80&w=800',
    sport: 'MMA',
    is_live: true,
    start_time: new Date().toISOString(),
    room_name: 'mma-champs'
  },
  {
    id: '4',
    title: 'რბოლის დრამა',
    description: 'სწრაფი ქუჩის რბოლის ფინალი.',
    thumbnail: 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&q=80&w=800',
    sport: 'რბოლა',
    is_live: false,
    start_time: new Date(Date.now() + 86400000).toISOString(),
    room_name: 'race-day'
  }
];

export const SCHEDULE = [
  { time: '18:00', team1: 'ჩელსი', team2: 'არსენალი', sport: 'ფეხბურთი' },
  { time: '20:30', team1: 'ლეიკერსი', team2: 'უორიორსი', sport: 'კალათბურთი' },
  { time: '22:00', team1: 'UFC 300', team2: 'მთავარი ქარდი', sport: 'MMA' },
];

export const ADMIN_EMAILS = ['georgetchedia74@gmail.com'];
