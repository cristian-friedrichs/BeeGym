'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { Bell, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePendingWorkouts } from '@/context/PendingWorkoutContext';

function Badge({ count }: { count: number }) {
    if (count === 0) return null;
    return (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-bee-amber text-bee-midnight text-[10px] font-black flex items-center justify-center border-2 border-white leading-none">
            {count > 99 ? '99+' : count}
        </span>
    );
}

export function TopbarActions() {
    const supabase = createClient();
    const router = useRouter();
    const { pendingCount } = usePendingWorkouts();

    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [unreadChats, setUnreadChats] = useState<any[]>([]);
    const [expiringCreditsCount, setExpiringCreditsCount] = useState(0);
    const [pendingWorkoutsCount, setPendingWorkoutsCount] = useState(0);
    const { user: currentUser, organizationId } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!currentUser) return;

        const fetchData = async () => {
            // Notificações não lidas
            const { data: notifs } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', currentUser.id)
                .eq('is_read', false)
                .order('created_at', { ascending: false })
                .limit(5);

            if (notifs) setNotifications(notifs);

            // Conversas com mensagens não lidas (últimas 5)
            const { data: list } = await supabase
                .from('vw_chat_list')
                .select('*')
                .eq('owner_id', currentUser.id)
                .gt('unread_count', 0)
                .order('updated_at', { ascending: false })
                .limit(5);

            if (list) {
                setUnreadChats(list);
                setUnreadChatCount(list.reduce((acc: number, c: any) => acc + (c.unread_count || 0), 0));
            } else {
                setUnreadChats([]);
                setUnreadChatCount(0);
            }

            // Créditos extras expirando nos próximos 7 dias
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

            const { count: expiringCount } = await supabase
                .from('student_credits')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'Disponivel')
                .gte('expires_at', new Date().toISOString())
                .lte('expires_at', sevenDaysFromNow.toISOString());

            setExpiringCreditsCount(expiringCount || 0);

            // Treinos individuais pendentes (workouts table)
            if (organizationId) {
                const { count: wCount } = await supabase
                    .from('workouts')
                    .select('id', { count: 'exact', head: true })
                    .eq('organization_id', organizationId)
                    .in('status', ['Pendente', 'PENDENTE', 'Pendente de Ação']);
                setPendingWorkoutsCount(wCount || 0);
            } else {
                setPendingWorkoutsCount(0);
            }
        };

        fetchData();

        const channel = supabase.channel('topbar_alerts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_participants', filter: `participant_id=eq.${currentUser.id}` }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'student_credits' }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'workouts', filter: `organization_id=eq.${organizationId}` }, fetchData)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [supabase, currentUser, organizationId]);

    const handleReadNotification = async (id: string, link: string) => {
        await (supabase.from('notifications') as any).update({ is_read: true }).eq('id', id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (link) router.push(link);
    };

    const handleOpenChat = (chatId: string) => {
        router.push(`/app/conversas?chat=${chatId}`);
    };

    if (!mounted) return <div className="flex gap-1"><div className="w-9 h-9" /><div className="w-9 h-9" /></div>;

    return (
        <div className="flex items-center gap-1">

            {/* ── CONVERSAS ──────────────────────────────────────── */}
            <Popover>
                <PopoverTrigger asChild>
                    <button className="relative p-2 rounded-full text-slate-400 hover:text-bee-amber hover:-translate-y-0.5 active:scale-95 transition-all">
                        <MessageSquare className="h-5 w-5" />
                        <Badge count={unreadChatCount} />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 shadow-xl rounded-2xl border-slate-100 bg-white" align="end" sideOffset={8}>
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-800">Mensagens</h4>
                        <button onClick={() => router.push('/app/conversas')} className="text-xs text-bee-amber hover:underline font-bold">Ver todas</button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                        {unreadChats.length === 0 ? (
                            <div className="p-6 flex flex-col items-center text-center gap-2">
                                <MessageSquare className="h-8 w-8 text-slate-200" />
                                <p className="text-sm text-slate-400 font-medium">Nenhuma mensagem nova.</p>
                            </div>
                        ) : (
                            unreadChats.map((chat) => (
                                <button
                                    key={chat.chat_id}
                                    onClick={() => handleOpenChat(chat.chat_id)}
                                    className="w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-center gap-3 group"
                                >
                                    <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0 overflow-hidden">
                                        {chat.contact_avatar
                                            ? <img src={chat.contact_avatar} className="w-full h-full object-cover" alt="" />
                                            : <span className="text-orange-600 font-bold text-sm">{(chat.contact_name || chat.other_name || '?').charAt(0).toUpperCase()}</span>
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-bold text-slate-800 truncate group-hover:text-bee-amber transition-colors">
                                                {chat.contact_name || chat.other_name || 'Conversa'}
                                            </p>
                                            <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                                                {chat.updated_at ? formatDistanceToNow(new Date(chat.updated_at), { addSuffix: false, locale: ptBR }) : ''}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 truncate mt-0.5">{chat.last_message_content || 'Nova conversa'}</p>
                                    </div>
                                    {chat.unread_count > 0 && (
                                        <span className="bg-bee-amber text-bee-midnight text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0">
                                            {chat.unread_count}
                                        </span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            {/* ── NOTIFICAÇÕES ───────────────────────────────────── */}
            <Popover>
                <PopoverTrigger asChild>
                    <button className="relative p-2 rounded-full text-slate-400 hover:text-slate-600 hover:-translate-y-0.5 active:scale-95 transition-all">
                        <Bell className="h-5 w-5" />
                        <Badge count={notifications.length + pendingCount + expiringCreditsCount + pendingWorkoutsCount} />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 shadow-xl rounded-2xl border-slate-100 bg-white" align="end" sideOffset={8}>
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-800">Notificações</h4>
                        {(notifications.length + pendingCount + expiringCreditsCount + pendingWorkoutsCount) > 0 && (
                            <span className="text-[11px] font-bold bg-amber-50 text-bee-amber px-2 py-0.5 rounded-full border border-amber-200">
                                {notifications.length + pendingCount + expiringCreditsCount + pendingWorkoutsCount} nova{ (notifications.length + pendingCount + expiringCreditsCount + pendingWorkoutsCount) > 1 ? 's' : '' }
                            </span>
                        )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                        {pendingCount > 0 && (
                            <button
                                onClick={() => router.push('/app/aulas')}
                                className="w-full text-left px-4 py-3 border-b border-amber-100 bg-amber-50/40 hover:bg-amber-50 transition-colors group flex items-start gap-2.5"
                            >
                                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-bee-amber shrink-0 animate-pulse" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black uppercase tracking-wider text-bee-amber">Avaliação Pendente</p>
                                    <p className="text-sm font-bold text-slate-800 mt-0.5">Treinos Aguardando Avaliação</p>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        Você possui {pendingCount} treino{pendingCount > 1 ? 's' : ''} concluído{pendingCount > 1 ? 's' : ''} que necessita{pendingCount > 1 ? 'm' : ' de'} lançamento de presença/falta.
                                    </p>
                                    <span className="text-[10px] text-bee-midnight font-bold mt-2 inline-flex items-center gap-1 group-hover:underline">
                                        Avaliar Check-ins agora →
                                    </span>
                                </div>
                            </button>
                        )}

                        {pendingWorkoutsCount > 0 && (
                            <button
                                onClick={() => router.push('/app/treinos?status=Pendente')}
                                className="w-full text-left px-4 py-3 border-b border-orange-100 bg-orange-50/40 hover:bg-orange-50 transition-colors group flex items-start gap-2.5"
                            >
                                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-bee-amber shrink-0 animate-pulse" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black uppercase tracking-wider text-bee-amber">Avaliação Pendente</p>
                                    <p className="text-sm font-bold text-slate-800 mt-0.5">Treinos Individuais Pendentes</p>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        Você possui {pendingWorkoutsCount} treino{pendingWorkoutsCount > 1 ? 's' : ''} individual{pendingWorkoutsCount > 1 ? 's' : ''} aguardando validação de presença.
                                    </p>
                                    <span className="text-[10px] text-bee-midnight font-bold mt-2 inline-flex items-center gap-1 group-hover:underline">
                                        Validar treinos agora →
                                    </span>
                                </div>
                            </button>
                        )}

                        {expiringCreditsCount > 0 && (
                            <button
                                onClick={() => router.push('/app/alunos')}
                                className="w-full text-left px-4 py-3 border-b border-rose-100 bg-rose-50/40 hover:bg-rose-50 transition-colors group flex items-start gap-2.5"
                            >
                                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black uppercase tracking-wider text-rose-500">Crédito Vencendo</p>
                                    <p className="text-sm font-bold text-slate-800 mt-0.5">Créditos Extras a Expirar</p>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        Há {expiringCreditsCount} crédito{expiringCreditsCount > 1 ? 's' : ''} extra{expiringCreditsCount > 1 ? 's' : ''} com vencimento nos próximos 7 dias.
                                    </p>
                                    <span className="text-[10px] text-rose-600 font-bold mt-2 inline-flex items-center gap-1 group-hover:underline">
                                        Gerenciar Alunos agora →
                                    </span>
                                </div>
                            </button>
                        )}

                        {notifications.length === 0 && pendingCount === 0 && expiringCreditsCount === 0 && pendingWorkoutsCount === 0 ? (
                            <div className="p-6 flex flex-col items-center text-center gap-2">
                                <CheckCircle2 className="h-8 w-8 text-emerald-200" />
                                <p className="text-sm text-slate-400 font-medium">Tudo em dia!</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <button
                                    key={notif.id}
                                    onClick={() => handleReadNotification(notif.id, notif.link)}
                                    className="w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors group"
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="mt-1.5 h-2 w-2 rounded-full bg-bee-amber shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-800 group-hover:text-bee-amber transition-colors truncate">{notif.title}</p>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                            <span className="text-[10px] text-slate-400 mt-1 block font-semibold">
                                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
