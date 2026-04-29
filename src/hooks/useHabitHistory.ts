import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export interface HabitDay {
  date: string;
  water: number;
  exercise: number;
  spending: number;
  sleep: number;
}

export function useHabitHistory(days = 14) {
  const [history, setHistory] = useState<HabitDay[]>([]);

  useEffect(() => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    supabase
      .from('habit_logs')
      .select('type, value, logged_at')
      .gte('logged_at', since)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, HabitDay> = {};
        data.forEach(log => {
          const taipei = new Date(new Date(log.logged_at).getTime() + 8 * 3600000);
          const date = taipei.toISOString().slice(0, 10);
          if (!map[date]) map[date] = { date, water: 0, exercise: 0, spending: 0, sleep: 0 };
          const key = log.type as keyof Omit<HabitDay, 'date'>;
          if (key in map[date]) map[date][key] += log.value;
        });
        const result: HabitDay[] = [];
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000 + 8 * 3600000);
          const date = d.toISOString().slice(0, 10);
          result.push(map[date] ?? { date, water: 0, exercise: 0, spending: 0, sleep: 0 });
        }
        setHistory(result);
      });
  }, [days]);

  return history;
}
