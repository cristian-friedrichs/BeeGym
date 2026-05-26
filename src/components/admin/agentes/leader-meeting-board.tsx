import { Bot, CheckCircle2, CircleAlert, MessageSquareText, MoveRight } from 'lucide-react';
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
                                {meeting.cadence === 'daily' ? 'Rotina diaria' : 'Rotina semanal'} - {formatMockDate(meeting.startedAt)}
                            </p>
                        </div>
                        <Badge className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700 hover:bg-amber-50">
                            Reuniao mockada
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <Tabs defaultValue="thread" className="space-y-5">
                        <TabsList className="rounded-2xl bg-slate-50 p-1">
                            <TabsTrigger value="thread" className="rounded-xl text-xs font-black">Thread</TabsTrigger>
                            <TabsTrigger value="decisions" className="rounded-xl text-xs font-black">Decisoes</TabsTrigger>
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
                                                    <p className="text-sm font-black text-bee-midnight">{agent?.name ?? 'Agente mockado'}</p>
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
                                <div key={decision} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-bee-amber" />
                                    <p className="text-sm font-bold text-slate-700">{decision}</p>
                                </div>
                            ))}
                        </TabsContent>

                        <TabsContent value="blockers" className="mt-0 space-y-3">
                            {meeting.blockers.map((blocker) => (
                                <div key={blocker} className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50/40 p-4">
                                    <CircleAlert className="mt-0.5 h-4 w-4 text-red-600" />
                                    <p className="text-sm font-bold text-red-700">{blocker}</p>
                                </div>
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
                                        <p className="truncate text-sm font-black text-slate-700">{agent?.name ?? 'Agente mockado'}</p>
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
                            Proximos passos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-5 pt-0">
                        {meeting.nextSteps.map((step) => (
                            <div key={step} className="rounded-2xl border border-slate-100 bg-slate-50/40 p-3 text-sm font-bold text-slate-600">
                                {step}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
