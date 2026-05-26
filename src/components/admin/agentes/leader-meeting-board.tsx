import { Bot, CalendarClock, CheckCircle2, CircleAlert, MoveRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    agents,
    departments,
    formatMockDate,
    meetingMessages,
    type LeaderMeeting,
    type LeaderMeetingItem,
} from '@/lib/admin/agent-command-center-data';

function getAgent(agentId: string) {
    return agents.find((agent) => agent.id === agentId);
}

function getDepartment(departmentId: string) {
    return departments.find((department) => department.id === departmentId);
}

function initials(name: string) {
    return name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function getItemStatusConfig(status: LeaderMeetingItem['status']) {
    return {
        open: { label: 'Aberta', className: 'border-amber-100 bg-amber-50 text-amber-700' },
        blocked: { label: 'Bloqueada', className: 'border-red-100 bg-red-50 text-red-700' },
        planned: { label: 'Planejada', className: 'border-blue-100 bg-blue-50 text-blue-700' },
        reviewing: { label: 'Em revisão', className: 'border-orange-100 bg-orange-50 text-orange-700' },
        done: { label: 'Concluída', className: 'border-green-100 bg-green-50 text-green-700' },
    }[status];
}

function MeetingItemCard({
    item,
    tone,
    icon,
}: {
    item: LeaderMeetingItem;
    tone: 'amber' | 'red' | 'blue';
    icon: React.ReactNode;
}) {
    const owner = getAgent(item.ownerAgentId);
    const department = owner ? getDepartment(owner.departmentId) : null;
    const status = getItemStatusConfig(item.status);
    const toneClassName = {
        amber: 'border-amber-100 bg-amber-50/30 text-amber-700',
        red: 'border-red-100 bg-red-50/40 text-red-700',
        blue: 'border-blue-100 bg-blue-50/30 text-blue-700',
    }[tone];

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${toneClassName}`}>
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${status.className}`}>
                            {status.label}
                        </Badge>
                        {department && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{department.shortName}</span>
                        )}
                    </div>
                    <p className="mt-2 text-sm font-black leading-snug text-bee-midnight">{item.title}</p>
                    <div className="mt-3 grid gap-2 text-[11px] font-bold text-slate-400 sm:grid-cols-2">
                        <span>Responsável: <strong className="text-slate-600">{owner?.name ?? 'Agente simulado'}</strong></span>
                        <span className="inline-flex items-center gap-1">
                            <CalendarClock className="h-3.5 w-3.5 text-bee-amber" />
                            {formatMockDate(item.dueAt)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function LeaderMeetingBoard({ meeting }: { meeting: LeaderMeeting }) {
    const messages = meetingMessages.filter((message) => message.meetingId === meeting.id);

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <Card className="rounded-[2rem] border-slate-100 bg-white shadow-sm xl:col-span-8">
                <CardHeader className="border-b border-slate-50 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg font-black text-bee-midnight">{meeting.title}</CardTitle>
                            <p className="mt-1 text-xs font-bold text-slate-400">
                                {meeting.cadence === 'daily' ? 'Rotina diária' : 'Rotina semanal'} · {formatMockDate(meeting.startedAt)}
                            </p>
                        </div>
                        <Badge className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700 hover:bg-amber-50">
                            Reunião simulada
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <Tabs defaultValue="thread" className="space-y-5">
                        <TabsList className="rounded-2xl bg-slate-50 p-1">
                            <TabsTrigger value="thread" className="rounded-xl text-xs font-black">Thread</TabsTrigger>
                            <TabsTrigger value="decisions" className="rounded-xl text-xs font-black">Decisões</TabsTrigger>
                            <TabsTrigger value="blockers" className="rounded-xl text-xs font-black">Bloqueios</TabsTrigger>
                        </TabsList>

                        <TabsContent value="thread" className="mt-0 space-y-3">
                            {messages.map((message) => {
                                const agent = getAgent(message.senderAgentId);
                                const department = getDepartment(message.departmentId);
                                return (
                                    <div key={message.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-10 w-10 border-2 border-amber-100">
                                                <AvatarFallback className="bg-amber-50 text-xs font-black text-amber-700">
                                                    {initials(agent?.name ?? 'Agente')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-sm font-black text-bee-midnight">{agent?.name ?? 'Agente simulado'}</p>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{department?.shortName}</span>
                                                    <Badge variant="outline" className="rounded-full border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        {message.type.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{message.body}</p>
                                                <p className="mt-2 text-[11px] font-bold text-slate-400">{formatMockDate(message.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </TabsContent>

                        <TabsContent value="decisions" className="mt-0 space-y-3">
                            {meeting.openDecisions.map((decision) => (
                                <MeetingItemCard
                                    key={decision.id}
                                    item={decision}
                                    tone="amber"
                                    icon={<CheckCircle2 className="h-4 w-4" />}
                                />
                            ))}
                        </TabsContent>

                        <TabsContent value="blockers" className="mt-0 space-y-3">
                            {meeting.blockers.map((blocker) => (
                                <MeetingItemCard
                                    key={blocker.id}
                                    item={blocker}
                                    tone="red"
                                    icon={<CircleAlert className="h-4 w-4" />}
                                />
                            ))}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <div className="space-y-6 xl:col-span-4">
                <Card className="rounded-[2rem] border-slate-100 bg-white shadow-sm">
                    <CardHeader className="p-5">
                        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
                            <Bot className="h-4 w-4 text-bee-amber" />
                            Participantes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-5 pt-0">
                        {meeting.participants.map((agentId) => {
                            const agent = getAgent(agentId);
                            const department = agent ? getDepartment(agent.departmentId) : null;
                            return (
                                <div key={agentId} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/40 p-3">
                                    <Avatar className="h-9 w-9 border border-white">
                                        <AvatarFallback className="bg-white text-[11px] font-black text-bee-midnight">
                                            {initials(agent?.name ?? 'Agente')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-black text-slate-700">{agent?.name ?? 'Agente simulado'}</p>
                                        <p className="text-[11px] font-bold text-slate-400">{department?.shortName}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-slate-100 bg-white shadow-sm">
                    <CardHeader className="p-5">
                        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
                            <MoveRight className="h-4 w-4 text-bee-amber" />
                            Próximos passos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-5 pt-0">
                        {meeting.nextSteps.map((step) => (
                            <MeetingItemCard
                                key={step.id}
                                item={step}
                                tone="blue"
                                icon={<MoveRight className="h-4 w-4" />}
                            />
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
