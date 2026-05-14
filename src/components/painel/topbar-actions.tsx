'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { Bell, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [unreadChats, setUnreadChats] = useState<any[]>([]);
    const { user: currentUser } = useAuth();
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
        };

        fetchData();

        const channel = supabase.channel('topbar_alerts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_participants', filter: `participant_id=eq.${currentUser.id}` }, fetchData)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [supabase, currentUser]);

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
                        <Badge count={notifications.length} />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 shadow-xl rounded-2xl border-slate-100 bg-white" align="end" sideOffset={8}>
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-800">Notificações</h4>
                        {notifications.length > 0 && (
                            <span className="text-[11px] font-bold bg-amber-50 text-bee-amber px-2 py-0.5 rounded-full border border-amber-200">
                                {notifications.length} nova{notifications.length > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
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
