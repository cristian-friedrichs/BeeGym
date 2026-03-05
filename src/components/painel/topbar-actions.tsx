'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Bell, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function TopbarActions() {
    const supabase = createClient();
    const router = useRouter();

    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [unreadChats, setUnreadChats] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        fetchUser();
    }, [supabase]);

    useEffect(() => {
        if (!currentUser) return;

        const fetchData = async () => {
            // 1. Busca Notificações de Sistema
            const { data: notifs } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', currentUser.id)
                .eq('is_read', false)
                .order('created_at', { ascending: false })
                .limit(5);

            if (notifs) setNotifications(notifs);

            // 2. Busca Contagem de Chats e Detalhes
            const { data: list } = await supabase
                .from('vw_chat_list')
                .select('*')
                .eq('owner_id', currentUser.id)
                .gt('unread_count', 0)
                .order('updated_at', { ascending: false });

            if (list) {
                setUnreadChats(list);
                const totalUnread = list.reduce((acc: number, curr: any) => acc + (curr.unread_count || 0), 0);
                setUnreadChatCount(totalUnread);
            } else {
                setUnreadChats([]);
                setUnreadChatCount(0);
            }
        };

        fetchData();

        const channel = supabase.channel('topbar_alerts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, fetchData)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'chat_participants',
                filter: `participant_id=eq.${currentUser.id}`
            }, fetchData)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [supabase, currentUser]);

    // Função para ler notificação e navegar
    const handleReadNotification = async (id: string, link: string) => {
        await (supabase.from('notifications') as any).update({ is_read: true }).eq('id', id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (link) router.push(link);
    };

    return (
        <div className="flex items-center gap-2">

            {mounted && (
                <>
                    {/* 1. CHAT POPOVER */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="relative p-2 rounded-full text-slate-400 hover:text-bee-amber hover:bg-amber-50 transition-colors">
                                <MessageSquare className="h-5 w-5" />
                                {unreadChatCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-bee-amber border-2 border-white"></span>
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0 mr-4 mt-2 shadow-xl rounded-[8px] border-slate-100 bg-white" align="end">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <h4 className="text-sm font-bold text-deep-midnight font-display tracking-tight">Mensagens</h4>
                                <button onClick={() => router.push('/painel/conversas')} className="text-xs text-bee-amber hover:underline font-bold font-sans">Ver Chat</button>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {unreadChats.length === 0 ? (
                                    <div className="p-6 flex flex-col items-center justify-center text-center">
                                        <MessageSquare className="h-8 w-8 text-slate-200 mb-2" />
                                        <p className="text-sm text-slate-500 font-medium">Você não tem novas mensagens.</p>
                                    </div>
                                ) : (
                                    unreadChats.map((chat) => (
                                        <div
                                            key={chat.chat_id}
                                            onClick={() => {
                                                router.push('/conversas');
                                            }}
                                            className="p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors group flex items-center gap-3"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                                {chat.contact_avatar ? (
                                                    <img src={chat.contact_avatar} className="w-full h-full rounded-full object-cover" alt="" />
                                                ) : (
                                                    <span className="text-orange-600 font-bold text-sm">{(chat.contact_name || chat.other_name)?.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center">
                                                    <h5 className="text-sm font-bold text-deep-midnight truncate group-hover:text-bee-amber transition-colors font-sans lowercase first-letter:uppercase">
                                                        {chat.contact_name || chat.other_name}
                                                    </h5>
                                                    <span className="text-[11px] text-slate-400 font-sans">
                                                        {chat.updated_at ? formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true, locale: ptBR }) : ''}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5 truncate font-sans">{chat.last_message_content || 'Nova conversa'}</p>
                                            </div>
                                            {chat.unread_count > 0 && (
                                                <span className="bg-bee-amber text-bee-midnight text-[11px] font-bold px-1.5 py-0.5 rounded-full font-sans">
                                                    {chat.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* 2. NOTIFICATIONS POPOVER */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="relative p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                                <Bell className="h-5 w-5" />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-500 border-2 border-white animate-pulse"></span>
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0 mr-4 mt-2 shadow-xl rounded-[8px] border-slate-100 bg-white" align="end">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <h4 className="text-sm font-bold text-deep-midnight font-display tracking-tight">Notificações</h4>
                                {notifications.length > 0 && (
                                    <span className="text-[11px] font-bold bg-orange-100 text-bee-amber px-2 py-0.5 rounded-full font-sans">{notifications.length} novas</span>
                                )}
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-6 flex flex-col items-center justify-center text-center">
                                        <CheckCircle2 className="h-8 w-8 text-green-200 mb-2" />
                                        <p className="text-sm text-slate-500 font-medium">Tudo limpo por aqui!</p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            onClick={() => handleReadNotification(notif.id, notif.link)}
                                            className="p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors group"
                                        >
                                            <h5 className="text-sm font-bold text-deep-midnight group-hover:text-bee-amber transition-colors font-sans">{notif.title}</h5>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 font-sans">{notif.message}</p>
                                            <span className="text-[11px] text-slate-400 mt-2 block font-bold uppercase tracking-wider font-sans">
                                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </>
            )}

        </div>
    );
}
