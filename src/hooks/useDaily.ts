import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

const TZ_OFFSET = 8 * 60; // 台北 UTC+8

function todayTaipei() {
  const now = new Date();
  const taipei = new Date(now.getTime() + (TZ_OFFSET - now.getTimezoneOffset()) * 60000);
  return taipei.toISOString().slice(0, 10);
}

function todayStartUTC() {
  const today = todayTaipei();
  return new Date(`${today}T00:00:00+08:00`).toISOString();
}

export interface DailyTask {
  id: string;
  content: string;
  completed: boolean;
  date: string;
}

export interface HabitSummary {
  water: number;
  exercise: number;
  spending: number;
  sleep: number;
}

export function useDaily() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [habits, setHabits] = useState<HabitSummary>({ water: 0, exercise: 0, spending: 0, sleep: 0 });
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const today = todayTaipei();
    const { data } = await supabase
      .from('daily_tasks')
      .select('id, content, completed, date')
      .eq('date', today)
      .order('created_at');
    setTasks(data ?? []);
  }, []);

  const fetchHabits = useCallback(async () => {
    const since = todayStartUTC();
    const { data } = await supabase
      .from('habit_logs')
      .select('type, value')
      .gte('logged_at', since);
    const logs = data ?? [];
    setHabits({
      water:    logs.filter(l => l.type === 'water').reduce((s, l) => s + l.value, 0),
      exercise: logs.filter(l => l.type === 'exercise').reduce((s, l) => s + l.value, 0),
      spending: logs.filter(l => l.type === 'spending').reduce((s, l) => s + l.value, 0),
      sleep:    logs.filter(l => l.type === 'sleep').reduce((s, l) => s + l.value, 0),
    });
  }, []);

  useEffect(() => {
    Promise.all([fetchTasks(), fetchHabits()]).finally(() => setLoading(false));
  }, [fetchTasks, fetchHabits]);

  const addTask = useCallback(async (content: string) => {
    const today = todayTaipei();
    const { data } = await supabase
      .from('daily_tasks')
      .insert({ content: content.trim(), date: today })
      .select('id, content, completed, date')
      .single();
    if (data) setTasks(prev => [...prev, data]);
  }, []);

  const toggleTask = useCallback(async (id: string, completed: boolean) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed } : t));
    await supabase
      .from('daily_tasks')
      .update({ completed, completed_at: completed ? new Date().toISOString() : null })
      .eq('id', id);
  }, []);

  const logHabit = useCallback(async (type: string, value: number) => {
    await supabase.from('habit_logs').insert({ type, value, unit: unitOf(type) });
    setHabits(prev => ({ ...prev, [type]: prev[type as keyof HabitSummary] + value }));
  }, []);

  return { tasks, habits, loading, addTask, toggleTask, logHabit, today: todayTaipei() };
}

function unitOf(type: string) {
  const map: Record<string, string> = { water: 'ml', exercise: 'min', spending: 'twd', sleep: 'hr' };
  return map[type] ?? '';
}
