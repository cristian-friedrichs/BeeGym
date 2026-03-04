'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, MoreVertical, Paperclip, Smile, Mic, Send, Archive, Image as ImageIcon, FileText, Check, CheckCheck, MessageSquareOff, Trash2, X, Play, Pause } from 'lucide-react';
import { format } from 'date-fns';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';

export default function ConversasPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [activeChat, setActiveChat] = useState<any>(null);
    const [chats, setChats] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const activeChatRef = useRef<any>(null);

    // Audio Recorder Hook
    const {
        isRecording,
        recordingTime,
        audioBlob,
        startRecording,
        stopRecording,
        cancelRecording,
        clearAudio
    } = useAudioRecorder();

    // Estados de Busca
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initChat = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setCurrentUser(user);
            fetchChats(user.id);

            // Subscription Real-time para Mensagens
            const subscription = supabase
                .channel('chat_messages_changes')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages'
                }, async (payload) => {
                    const currentActiveChat = activeChatRef.current;
                    if (currentActiveChat && payload.new.chat_id === currentActiveChat.id) {
                        // Só adiciona se não for minha (que já adicionei de forma otimista)
                        if (payload.new.sender_id !== user.id) {
                            setMessages(prev => [...prev, payload.new]);
                            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                        }
                    }
                    fetchChats(user.id);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        };
        initChat();
    }, [activeChat?.id]);

    // 1. CARREGAR LISTA LATERAL DE CONVERSAS ATIVAS
    const fetchChats = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('vw_chat_list')
                .select('*')
                .eq('owner_id', userId)
                .eq('is_archived', false)
                .order('updated_at', { ascending: false });

            if (data) setChats(data);
            if (error) console.error("Erro ao buscar lista de chats:", error);
        } catch (err) {
            console.error("Erro ao buscar lista de chats:", err);
        }
    };

    // 2. BUSCA DE CONTATOS
    useEffect(() => {
        const searchContacts = async () => {
            if (searchQuery.length < 2) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }
            setIsSearching(true);
            const { data } = await supabase
                .from('vw_chat_contacts')
                .select('*')
                .ilike('display_name', `%${searchQuery}%`)
                .limit(10);

            if (data) setSearchResults(data);
            setIsSearching(false);
        };
        const debounce = setTimeout(searchContacts, 400);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    // Função para Abrir ou Criar Conversa a partir da Busca
    const handleContactSelect = async (contact: any) => {
        setIsSearching(false);
        setSearchQuery(''); // Limpa a barra de busca

        // 1. Trava: Impede o usuário de abrir um chat consigo mesmo
        if (currentUser.id === contact.contact_id) {
            toast({ title: "Aviso", description: "Você não pode iniciar uma conversa consigo mesmo.", variant: "default" });
            return;
        }

        try {
            const { data: profile } = await (supabase as any).from('profiles').select('organization_id').eq('id', currentUser.id).single();

            // 2. Busca os chats onde o usuário logado participa
            const { data: myChats } = await (supabase as any).from('chat_participants').select('chat_id').eq('participant_id', currentUser.id);
            const myChatIds = myChats?.map((c: any) => c.chat_id) || [];

            let chatId = null;

            if (myChatIds.length > 0) {
                // 3. Verifica se O CONTATO também participa de algum desses mesmos chats
                const { data: sharedChats } = await (supabase as any)
                    .from('chat_participants')
                    .select('chat_id')
                    .in('chat_id', myChatIds)
                    .eq('participant_id', contact.contact_id);

                if (sharedChats && sharedChats.length > 0) {
                    chatId = sharedChats[0].chat_id; // Achou a sala que os dois dividem
                }
            }

            if (!profile?.organization_id) {
                toast({ title: "Erro", description: "Sua conta não está vinculada a uma organização.", variant: "destructive" });
                return;
            }

            // 4. Se a sala não existe, cria do zero
            if (!chatId) {
                const { data: newChat, error: chatError } = await (supabase as any)
                    .from('chats')
                    .insert({ organization_id: profile.organization_id })
                    .select('id').single();

                if (chatError) throw chatError;
                chatId = newChat.id;

                await (supabase as any).from('chat_participants').insert([
                    { chat_id: chatId, participant_id: currentUser.id, participant_type: 'USER' },
                    { chat_id: chatId, participant_id: contact.contact_id, participant_type: contact.contact_type }
                ]);
            }

            // 5. Carrega as mensagens e atualiza a barra lateral
            openChat(chatId, contact);
            fetchChats(currentUser.id);

        } catch (error: any) {
            console.error(error);
            toast({ title: "Erro ao iniciar conversa", description: error.message, variant: "destructive" });
        }
    };

    // 3. ABRIR CONVERSA E CARREGAR MENSAGENS
    const openChat = async (chatId: string, contactData: any) => {
        const chatObj = { id: chatId, contact: contactData };
        setActiveChat(chatObj);
        activeChatRef.current = chatObj;
        setMessages([]); // Limpa enquanto carrega

        // Zera mensagens não lidas
        await (supabase as any).from('chat_participants').update({ unread_count: 0 }).eq('chat_id', chatId).eq('participant_id', currentUser.id);

        // Carrega Histórico
        const { data } = await (supabase as any)
            .from('chat_messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

        if (data) {
            setMessages(data);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    };

    // 4. ENVIAR MENSAGEM (TEXTO OU ÁUDIO)
    const handleSendMessage = async (blob?: Blob) => {
        if (!newMessage.trim() && !blob) return;
        if (!activeChat) return;

        try {
            let mediaUrl = null;
            let messageType: 'TEXT' | 'AUDIO' | 'IMAGE' | 'FILE' = blob ? 'AUDIO' : 'TEXT';
            const content = newMessage.trim() || (blob ? 'Mensagem de voz' : '');

            if (blob) {
                const fileName = `audio_${Date.now()}.webm`;
                const { data, error: uploadError } = await supabase.storage
                    .from('chat_media')
                    .upload(`audio/${activeChat.id}/${fileName}`, blob);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('chat_media').getPublicUrl(data.path);
                mediaUrl = publicUrl;
            }

            const { data: newMsg, error: msgError } = await (supabase as any).from('chat_messages').insert({
                chat_id: activeChat.id,
                sender_id: currentUser.id,
                sender_type: 'USER',
                content: content,
                message_type: messageType,
                media_url: mediaUrl
            }).select().single();

            if (msgError) throw msgError;

            if (newMsg) {
                setMessages(prev => [...prev, newMsg]);
                setNewMessage('');
                if (blob) clearAudio();
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }

            // Atualiza sidebar
            await (supabase as any).from('chats').update({
                updated_at: new Date().toISOString(),
                last_message_content: content
            }).eq('id', activeChat.id);

            fetchChats(currentUser.id);

        } catch (error: any) {
            console.error(error);
            toast({
                title: "Erro ao enviar mensagem",
                description: error.message || "Verifique sua conexão e tente novamente.",
                variant: "destructive"
            });
        }
    };

    // 5. ENVIAR MIDIA (IMAGEM OU ARQUIVO)
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'IMAGE' | 'FILE') => {
        const file = e.target.files?.[0];
        if (!file || !activeChat) return;

        const toastId = toast({ title: "Enviando arquivo...", description: "Aguarde o processamento." });

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${type.toLowerCase()}_${Date.now()}.${fileExt}`;
            const folder = type === 'IMAGE' ? 'images' : 'documents';

            const { data, error: uploadError } = await supabase.storage
                .from('chat_media')
                .upload(`${folder}/${activeChat.id}/${fileName}`, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('chat_media').getPublicUrl(data.path);

            const { data: newMsg, error: msgError } = await (supabase as any).from('chat_messages').insert({
                chat_id: activeChat.id,
                sender_id: currentUser.id,
                sender_type: 'USER',
                content: file.name,
                message_type: type,
                media_url: publicUrl
            }).select().single();

            if (msgError) throw msgError;

            if (newMsg) {
                setMessages(prev => [...prev, newMsg]);
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }

            // Atualiza sidebar
            await (supabase as any).from('chats').update({
                updated_at: new Date().toISOString(),
                last_message_content: type === 'IMAGE' ? '📷 Foto' : `📁 ${file.name}`
            }).eq('id', activeChat.id);

            fetchChats(currentUser.id);
        } catch (error: any) {
            console.error(error);
            toast({ title: "Erro ao enviar arquivo", description: error.message, variant: "destructive" });
        }
    };

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    // Renderizador de Mensagem
    const renderMessage = (msg: any) => {
        const isMine = msg.sender_id === currentUser?.id;
        return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm relative ${isMine ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                    {msg.message_type === 'AUDIO' ? (
                        <div className="flex items-center gap-3 py-1 min-w-[220px]">
                            <audio id={`audio-${msg.id}`} src={msg.media_url} preload="metadata" />
                            <button
                                onClick={() => {
                                    const audio = document.getElementById(`audio-${msg.id}`) as HTMLAudioElement;
                                    if (audio.paused) audio.play(); else audio.pause();
                                }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isMine ? 'bg-orange-400' : 'bg-slate-100'}`}
                            >
                                <Play className={`w-5 h-5 fill-current ${isMine ? 'text-white' : 'text-slate-600'}`} />
                            </button>
                            <div className="flex-1 flex flex-col gap-1">
                                <div className="h-1 bg-current opacity-20 rounded-full relative w-full">
                                    {/* Placeholder para barra de progresso */}
                                    <div className="absolute left-0 top-0 h-full w-0 bg-current rounded-full"></div>
                                </div>
                                <div className="flex justify-between items-center px-0.5">
                                    <span className="text-[11px] font-medium opacity-70">Voz</span>
                                    <span className="text-[11px] font-medium opacity-70">0:00</span>
                                </div>
                            </div>
                        </div>
                    ) : msg.message_type === 'IMAGE' ? (
                        <div className="py-1">
                            <img
                                src={msg.media_url}
                                alt="Imagem"
                                className="max-w-full rounded-lg cursor-pointer hover:opacity-95 transition shadow-sm"
                                onClick={() => window.open(msg.media_url, '_blank')}
                            />
                        </div>
                    ) : msg.message_type === 'FILE' ? (
                        <div className="py-1 flex items-center gap-3 bg-black/5 p-3 rounded-lg border border-black/5">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isMine ? 'bg-orange-400' : 'bg-slate-100'}`}>
                                <FileText className={`w-5 h-5 ${isMine ? 'text-white' : 'text-slate-600'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate">{msg.content}</p>
                                <a
                                    href={msg.media_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-[11px] font-medium hover:underline ${isMine ? 'text-orange-100' : 'text-orange-600'}`}
                                >
                                    Fazer download
                                </a>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                    )}
                    <div className={`flex items-center justify-end gap-1 mt-1 ${isMine ? 'text-orange-200' : 'text-slate-400'}`}>
                        <span className="text-[11px]">{format(new Date(msg.created_at), 'HH:mm')}</span>
                        {isMine && <CheckCheck className="w-3 h-3 text-white" />}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* Cabeçalho da Página */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Conversas</h1>
                <p className="text-muted-foreground text-sm">Gerencie suas conversas e atendimentos em tempo real</p>
            </div>

            <div className="flex-1 min-h-0 flex bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">

                {/* PAINEL ESQUERDO: SIDEBAR */}
                <div className="w-1/3 min-w-[300px] max-w-[400px] flex flex-col border-r border-slate-200 bg-slate-50">

                    {/* Busca e Ações */}
                    <div className="p-3 bg-white border-b border-slate-100 flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar ou começar uma conversa"
                                className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-1 text-slate-500 shrink-0">
                            <button className="p-2 hover:bg-slate-100 rounded-lg transition" title="Arquivadas"><Archive className="w-5 h-5" /></button>
                            <button className="p-2 hover:bg-slate-100 rounded-lg transition"><MoreVertical className="w-5 h-5" /></button>
                        </div>
                    </div>

                    {/* Lista de Contatos/Chats */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                        {searchQuery.length > 0 ? (
                            // Exibe Resultados da Busca
                            <div>
                                <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">Resultados da Busca</div>
                                {searchResults.map(contact => (
                                    <div key={contact.contact_id} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50" onClick={() => handleContactSelect(contact)}>
                                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600 shrink-0">
                                            {contact.display_name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-slate-800 truncate">{contact.display_name}</h4>
                                            <p className="text-xs text-slate-500 truncate">{contact.contact_type === 'USER' ? 'Equipe' : 'Aluno'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Exibe Chats Ativos
                            chats.length > 0 ? (
                                chats.map(item => (
                                    <div key={item.chat_id} className={`flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 ${activeChat?.id === item.chat_id ? 'bg-orange-50' : ''}`} onClick={() => openChat(item.chat_id, { display_name: item.contact_name || item.other_name, avatar_url: item.contact_avatar || item.other_avatar })}>
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                            {(item.contact_avatar || item.other_avatar) ? (
                                                <img src={item.contact_avatar || item.other_avatar} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full bg-orange-100 flex items-center justify-center font-bold text-orange-100">
                                                    <div className="w-full h-full bg-orange-500 flex items-center justify-center font-bold text-white text-lg">
                                                        {(item.contact_name || item.other_name)?.charAt(0) || 'U'}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className="text-sm font-bold text-slate-800 truncate">{item.contact_name || item.other_name}</h4>
                                                <span className="text-[11px] text-slate-400">
                                                    {item.updated_at ? format(new Date(item.updated_at), 'HH:mm') : ''}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs text-slate-500 truncate">{item.last_message_content || 'Nenhuma mensagem'}</p>
                                                {item.unread_count > 0 && (
                                                    <span className="bg-orange-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ml-2">
                                                        {item.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                                    <MessageSquareOff className="w-10 h-10 mb-3 text-slate-200" />
                                    <p className="text-sm font-medium">Suas conversas ativas aparecerão aqui.</p>
                                    <p className="text-xs mt-1">Busque um aluno ou membro da equipe acima para iniciar.</p>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* PAINEL DIREITO: JANELA DE CHAT */}
                <div className="flex-1 flex flex-col bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover bg-center relative">
                    <div className="absolute inset-0 bg-white/80 z-0"></div>

                    {activeChat ? (
                        <div className="relative z-10 flex flex-col h-full">
                            {/* Header do Chat Ativo */}
                            <div className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 shadow-sm shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                                        {activeChat.contact?.display_name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{activeChat.contact?.display_name || 'Usuário'}</h3>
                                        <p className="text-xs text-green-500 font-medium">Online</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 text-slate-400">
                                    <button className="hover:text-slate-600 transition" title="Buscar Mensagem"><Search className="w-5 h-5" /></button>
                                    <button className="hover:text-slate-600 transition" title="Opções"><MoreVertical className="w-5 h-5" /></button>
                                </div>
                            </div>

                            {/* Área de Mensagens */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {messages.map(msg => renderMessage(msg))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area (Rodapé) */}
                            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3 shrink-0">
                                {isRecording ? (
                                    <div className="flex-1 flex items-center justify-between bg-white rounded-xl px-4 py-2 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                                <span className="text-sm font-bold text-slate-600">{formatTime(recordingTime)}</span>
                                            </div>
                                            <span className="text-sm text-slate-400">Gravando áudio...</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={cancelRecording} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"><Trash2 className="w-5 h-5" /></button>
                                            <button onClick={stopRecording} className="p-2 text-green-500 hover:bg-green-50 rounded-full transition"><Check className="w-5 h-5" /></button>
                                        </div>
                                    </div>
                                ) : audioBlob ? (
                                    <div className="flex-1 flex items-center justify-between bg-white rounded-xl px-4 py-2 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <Play className="w-4 h-4 text-orange-500" />
                                            <span className="text-sm font-bold text-slate-600">Áudio pronto ({formatTime(recordingTime)})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={clearAudio} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition"><X className="w-5 h-5" /></button>
                                            <button onClick={() => handleSendMessage(audioBlob)} className="p-3 bg-orange-500 text-white rounded-full"><Send className="w-5 h-5" /></button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition"><Smile className="w-6 h-6" /></button>

                                        {/* Dropdown de Anexos */}
                                        <div className="relative group">
                                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition">
                                                <Paperclip className="w-6 h-6" />
                                            </button>
                                            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 hidden group-hover:flex flex-col gap-1 animate-in slide-in-from-bottom-2 duration-200 z-50">
                                                <button
                                                    onClick={() => document.getElementById('image-upload')?.click()}
                                                    className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-lg text-sm text-slate-600 transition"
                                                >
                                                    <ImageIcon className="w-4 h-4 text-blue-500" /> Fotos e Vídeos
                                                </button>
                                                <button
                                                    onClick={() => document.getElementById('file-upload')?.click()}
                                                    className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-lg text-sm text-slate-600 transition"
                                                >
                                                    <FileText className="w-4 h-4 text-orange-500" /> Documento
                                                </button>
                                            </div>
                                        </div>

                                        {/* Inputs Ocultos */}
                                        <input
                                            type="file"
                                            id="image-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e, 'IMAGE')}
                                        />
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            onChange={(e) => handleFileUpload(e, 'FILE')}
                                        />

                                        <input
                                            type="text"
                                            placeholder="Digite uma mensagem..."
                                            className="flex-1 bg-white border-none py-3 px-4 rounded-xl shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        />

                                        {newMessage.trim() ? (
                                            <button onClick={() => handleSendMessage()} className="p-3 bg-orange-500 text-white hover:bg-orange-600 rounded-full shadow-md transition-transform active:scale-95"><Send className="w-5 h-5" /></button>
                                        ) : (
                                            <button onClick={startRecording} className="p-3 bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-full transition"><Mic className="w-5 h-5" /></button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Tela Vazia (Nenhum chat selecionado)
                        <div className="relative z-10 flex flex-col items-center justify-center h-full text-slate-500">
                            <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <MessageSquareOff className="w-12 h-12 text-slate-300" />
                            </div>
                            <h2 className="text-2xl font-light text-slate-800 mb-2">BeeGym Conversas</h2>
                            <p className="text-sm font-medium">Selecione um contato ao lado para iniciar uma conversa.</p>
                            <div className="mt-8 flex items-center gap-2 text-xs text-slate-400 bg-white/50 px-4 py-2 rounded-full border border-slate-200">
                                <Check className="w-3 h-3" /> End-to-end com suporte a anexos
                            </div>
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
}
