'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { Search, Users, CalendarDays, Dumbbell, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SearchResult {
    id: string;
    title: string;
    subtitle?: string;
    type: 'student' | 'class' | 'workout';
    href: string;
}

export function GlobalSearch() {
    const supabase = createClient();
    const { organizationId } = useAuth();
    const router = useRouter();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const search = useCallback(async (q: string) => {
        if (!q.trim() || !organizationId) { setResults([]); return; }
        setLoading(true);
        try {
            const [studentsRes, classesRes, workoutsRes] = await Promise.all([
                supabase.from('students').select('id, full_name, status').eq('organization_id', organizationId).ilike('full_name', `%${q}%`).limit(4),
                supabase.from('calendar_events').select('id, title, start_datetime').eq('organization_id', organizationId).ilike('title', `%${q}%`).order('start_datetime', { ascending: false }).limit(3),
                (supabase as any).from('workouts').select('id, title, scheduled_at').eq('organization_id', organizationId).ilike('title', `%${q}%`).order('scheduled_at', { ascending: false }).limit(3),
            ]);

            const combined: SearchResult[] = [
                ...(studentsRes.data || []).map((s: any) => ({
                    id: s.id, type: 'student' as const,
                    title: s.full_name,
                    subtitle: s.status === 'ACTIVE' ? 'Aluno ativo' : 'Aluno inativo',
                    href: `/app/alunos/${s.id}`,
                })),
                ...(classesRes.data || []).map((c: any) => ({
                    id: c.id, type: 'class' as const,
                    title: c.title,
                    subtitle: c.start_datetime ? format(new Date(c.start_datetime), 'dd/MM/yyyy HH:mm') : '',
                    href: `/app/aulas`,
                })),
                ...(workoutsRes.data || []).map((w: any) => ({
                    id: w.id, type: 'workout' as const,
                    title: w.title,
                    subtitle: w.scheduled_at ? format(new Date(w.scheduled_at), 'dd/MM/yyyy HH:mm') : '',
                    href: `/app/treinos`,
                })),
            ];
            setResults(combined);
        } finally {
            setLoading(false);
        }
    }, [organizationId, supabase]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!query.trim()) { setResults([]); return; }
        debounceRef.current = setTimeout(() => search(query), 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query, search]);

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const typeIcon = { student: Users, class: CalendarDays, workout: Dumbbell };
    const typeLabel = { student: 'Aluno', class: 'Aula', workout: 'Treino' };
    const typeColor = { student: 'text-blue-500', class: 'text-orange-500', workout: 'text-indigo-500' };

    const grouped = results.reduce((acc, r) => {
        if (!acc[r.type]) acc[r.type] = [];
        acc[r.type].push(r);
        return acc;
    }, {} as Record<string, SearchResult[]>);

    return (
        <div ref={containerRef} className="relative hidden md:block w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 animate-spin" />}
            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onKeyDown={e => e.key === 'Escape' && setOpen(false)}
                placeholder="Buscar alunos, aulas ou treinos..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#0B0F1A] transition-all placeholder:text-slate-400 font-medium font-sans focus:bg-white"
            />

            {open && query.trim() && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden max-h-[400px] overflow-y-auto">
                    {results.length === 0 && !loading && (
                        <div className="p-6 text-center text-sm text-slate-400">Nenhum resultado para &quot;<span className="font-semibold text-slate-600">{query}</span>&quot;</div>
                    )}
                    {(['student', 'class', 'workout'] as const).map(type => {
                        const items = grouped[type];
                        if (!items?.length) return null;
                        const Icon = typeIcon[type];
                        return (
                            <div key={type}>
                                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                                    <Icon className={cn('h-3.5 w-3.5', typeColor[type])} />
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{typeLabel[type]}s</span>
                                </div>
                                {items.map(r => (
                                    <button
                                        key={r.id}
                                        onClick={() => { setOpen(false); setQuery(''); router.push(r.href); }}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex items-center gap-3 group"
                                    >
                                        <div className={cn('h-7 w-7 rounded-full flex items-center justify-center shrink-0 bg-slate-100', typeColor[type])}>
                                            <Icon className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-bee-amber transition-colors">{r.title}</p>
                                            {r.subtitle && <p className="text-xs text-slate-400 truncate">{r.subtitle}</p>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
