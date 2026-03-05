'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Loader2 } from 'lucide-react';
import { exercises as staticExercises } from '@/lib/exercises';

interface ExerciseSearchProps {
    value: string;
    onChange: (id: string | null, name: string) => void;
}

export function ExerciseSearch({ value, onChange }: ExerciseSearchProps) {
    const supabase = createClient();
    const [searchTerm, setSearchTerm] = useState(value);
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        setSearchTerm(value);
    }, [value]);

    useEffect(() => {
        const search = async () => {
            if (searchTerm.length < 2) {
                setResults([]);
                return;
            }
            // Se o termo atual for exatamente o value selecionado, não busca de novo
            if (searchTerm === value) return;

            setIsSearching(true);

            try {
                // 1. Busca Estática (Local)
                const localStatic = staticExercises
                    .filter(ex => ex.type === 'base' && ex.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .slice(0, 10)
                    .map(ex => ({
                        id: `static-${ex.name}`,
                        name: ex.name,
                        target_muscle: ex.description,
                        is_static: true
                    }));

                // 2. Busca o Tenant do usuário logado e exercícios do banco
                const { data: { user } } = await supabase.auth.getUser();
                const { data: profile } = await (supabase.from('profiles') as any).select('organization_id').eq('id', user?.id).single();

                const { data: dbData } = await (supabase
                    .from('exercises') as any)
                    .select('id, name, target_muscle')
                    .eq('organization_id', profile?.organization_id)
                    .ilike('name', `%${searchTerm}%`)
                    .limit(10);

                // 3. Combina resultados (Removendo duplicatas por nome)
                const combined = [...localStatic];
                if (dbData) {
                    dbData.forEach((dbEx: any) => {
                        if (!combined.some(c => c.name.toLowerCase() === dbEx.name.toLowerCase())) {
                            combined.push(dbEx);
                        }
                    });
                }

                setResults(combined.slice(0, 15));
            } catch (error) {
                console.error('Error searching exercises:', error);
            } finally {
                setIsSearching(false);
                setShowDropdown(true);
            }
        };

        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm, value, supabase]);

    return (
        <div className="relative flex-1">
            <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar exercício (ex: Supino)..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                />
                {isSearching && <Loader2 className="absolute right-3 w-4 h-4 animate-spin text-slate-400" />}
            </div>

            {showDropdown && results.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 shadow-lg rounded-xl z-50 max-h-48 overflow-y-auto">
                    {results.map((ex) => (
                        <div
                            key={ex.id}
                            className="px-4 py-2 hover:bg-amber-50 cursor-pointer flex flex-col border-b border-slate-50 last:border-0"
                            onClick={() => {
                                onChange(ex.id, ex.name);
                                setSearchTerm(ex.name);
                                setShowDropdown(false);
                            }}
                        >
                            <span className="text-sm font-bold text-slate-700">{ex.name}</span>
                            <span className="text-[11px] text-slate-400 font-medium">{ex.target_muscle || 'Geral'}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
