'use client';

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Edit, MessageSquare, Power, Plus,
    Dumbbell, Ruler, CreditCard, ReceiptText, Home,
    Mail, Calendar, Target
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { QuickMessageModal } from "./quick-message-modal";

// Define os tipos de visualização
export type StudentViewType = 'dashboard' | 'workouts' | 'measurements' | 'plans' | 'invoices';

interface StudentProfileViewProps {
    student: {
        id: string;
        full_name: string;
        email: string | null;
        phone: string | null;
        avatar_url: string | null;
        date_of_birth: string | null;
        status: string;
        created_at: string;
        latest_assessment?: {
            weight: number | null;
            height: number | null;
        } | null;
        plan?: { name: string; plan_type?: string; credits?: number; days_per_week?: number } | null;
        plan_name?: string;
        credits_balance?: number;
        objective?: string | null;
        workouts?: any[];
    };
    currentView: StudentViewType;
    onChangeView: (view: StudentViewType) => void;
    onEditProfile: () => void;
    onRefresh: () => void;
    weeklyWorkoutCount?: number;
    attendancePercentage?: number;
}

export function StudentProfileView({
    student,
    currentView,
    onChangeView,
    onEditProfile,
    onRefresh,
    weeklyWorkoutCount = 0,
    attendancePercentage = 0
}: StudentProfileViewProps) {
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();
    const [messageModalOpen, setMessageModalOpen] = useState(false);

    const names = student.full_name.split(' ');
    const firstName = names[0];
    const lastName = names.length > 1 ? names.slice(1).join(' ') : '-';
    const displayPlan = student.plan?.name || student.plan_name || 'Sem Plano';

    // Dynamic Schedule Label Logic
    const getScheduleLabel = () => {
        const plan = student.plan;

        // If no plan, show fallback
        if (!plan) return student.plan_name || 'Sem Plano';

        // 1. Pack / Credits Plan
        if (plan.plan_type === 'pack') {
            return `Créditos Disponíveis: ${student.credits_balance ?? 0}`;
        }

        // 2. Continuous Membership (Unlimited)
        if (!plan.days_per_week) {
            return "Acesso Ilimitado";
        }

        // 3. Forced Schedule (Specific Weekdays)
        const workouts = student.workouts || [];
        const futureWorkouts = workouts
            .filter(w => w.status === 'Agendado' && w.scheduled_at)
            // Filter only those in the near future to get the pattern
            .filter(w => new Date(w.scheduled_at) >= new Date());

        if (futureWorkouts.length > 0) {
            const map: Record<number, string> = {
                1: 'SEG', 2: 'TER', 3: 'QUA', 4: 'QUI', 5: 'SEX', 6: 'SAB', 0: 'DOM'
            };
            const weekdays = futureWorkouts.map(w => new Date(w.scheduled_at).getDay());
            const uniqueDays = Array.from(new Set(weekdays));

            // Sort: SEG (1) to DOM (0)
            const order = [1, 2, 3, 4, 5, 6, 0];
            uniqueDays.sort((a, b) => order.indexOf(a) - order.indexOf(b));

            const dayLabels = uniqueDays.map(d => map[d]);
            return dayLabels.join(' | ');
        }

        // Fallback to plan name if we can't derive days
        return plan.name || `Frequência: ${plan.days_per_week}x`;
    };

    const scheduleLabel = getScheduleLabel();

    const handleInactivate = async () => {
        if (!confirm("Tem certeza que deseja INATIVAR este aluno?\nEle perderá acesso ao aplicativo imediatamente.")) return;

        const { error } = await (supabase.from('students') as any)
            .update({ status: 'INACTIVE' })
            .eq('id', student.id);

        if (error) {
            toast({ title: "Erro ao inativar", variant: "destructive" });
        } else {
            toast({ title: "Aluno inativado com sucesso" });
            onRefresh();
        }
    };

    return (
        <aside className="lg:h-full flex flex-col min-h-0">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-left-4 duration-500 h-full overflow-hidden">
                <div className="relative group shrink-0">
                    <Avatar className="h-24 w-24 border-4 border-slate-50 shadow-md ring-1 ring-slate-100 transition-transform duration-500 group-hover:scale-105">
                        <AvatarImage src={student.avatar_url || ''} className="object-cover" />
                        <AvatarFallback className="text-4xl bg-orange-100 text-orange-600 font-black">
                            {firstName[0]}{lastName !== '-' ? lastName[0] : ''}
                        </AvatarFallback>
                    </Avatar>
                    <button
                        onClick={onEditProfile}
                        className="absolute bottom-1 right-1 h-8 w-8 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center text-slate-500 hover:text-bee-amber transition-colors"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-1 shrink-0">
                    <h1 className="text-2xl font-bold text-deep-midnight tracking-tight leading-tight font-display">
                        {student.full_name}
                    </h1>
                    <div className="flex flex-col items-center gap-1.5">
                        <Badge variant="secondary" className="bg-[#FFF4E5] text-bee-amber border-orange-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded-full font-sans">
                            {displayPlan}
                        </Badge>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] font-sans">
                            {scheduleLabel}
                        </div>
                        <Badge variant="outline" className={`px-2 py-0.5 text-[11px] font-black uppercase tracking-tighter rounded-full font-sans ${student.status === 'ACTIVE' ? "text-emerald-600 border-emerald-100 bg-emerald-50" : "text-red-600 border-red-200 bg-red-50"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 inline-block ${student.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            {student.status === 'ACTIVE' ? 'Ativo' : student.status}
                        </Badge>
                    </div>
                </div>

                <div className="w-full pt-4 border-t border-slate-50 flex flex-col items-center gap-2 py-2">
                    {/* E-MAIL: Primary Metadata */}
                    <div className="flex items-center gap-2 text-slate-500 hover:text-bee-amber transition-colors group">
                        <Mail className="h-3.5 w-3.5 text-slate-300 group-hover:text-bee-amber" />
                        <span className="text-sm font-medium font-sans">{student.email || '-'}</span>
                    </div>

                    {/* ALUNO DESDE: Subtle Context */}
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] bg-slate-50/50 px-2 py-0.5 rounded-full">
                        <span>Aluno desde</span>
                        <span className="h-1 w-1 rounded-full bg-slate-200"></span>
                        <span className="text-slate-500">{student.created_at ? format(new Date(student.created_at), "dd/MM/yyyy") : '-'}</span>
                    </div>

                    {/* NASCIMENTO | OBJETIVO: Compact Pill */}
                    <div className="flex items-center gap-4 text-slate-400 font-bold text-[11px] uppercase tracking-[0.1em] px-3 py-1 bg-slate-50/50 rounded-full border border-slate-100/50 font-sans">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-300" />
                            <span>{student.date_of_birth ? format(new Date(student.date_of_birth), "dd/MM/yyyy") : '-'}</span>
                        </div>
                        <span className="w-px h-3 bg-slate-200"></span>
                        <div className="flex items-center gap-1.5">
                            <Target className="h-3.5 w-3.5 text-slate-300" />
                            <span>{student.objective || 'Manutenção'}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 pt-4 border-t border-slate-50 w-full shrink-0">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => onChangeView('dashboard')}
                                    className={`p-2.5 rounded-[8px] border transition-all flex items-center justify-center ${currentView === 'dashboard' ? 'bg-bee-amber text-bee-midnight border-orange-600 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-bee-amber hover:bg-amber-50'}`}
                                >
                                    <Home className="h-5 w-5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Início</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setMessageModalOpen(true)}
                                    className="p-2.5 bg-slate-50 text-slate-400 rounded-[8px] border border-slate-100 hover:text-bee-amber hover:bg-amber-50 transition-all flex items-center justify-center"
                                >
                                    <MessageSquare className="h-5 w-5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Conversas</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => onChangeView('workouts')}
                                    className={`p-2.5 rounded-[8px] border transition-all flex items-center justify-center ${currentView === 'workouts' ? 'bg-bee-amber text-bee-midnight border-orange-600 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-bee-amber hover:bg-amber-50'}`}
                                >
                                    <Dumbbell className="h-5 w-5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Treinos</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => onChangeView('measurements')}
                                    className={`p-2.5 rounded-[8px] border transition-all flex items-center justify-center ${currentView === 'measurements' ? 'bg-bee-amber text-bee-midnight border-orange-600 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-bee-amber hover:bg-amber-50'}`}
                                >
                                    <Ruler className="h-5 w-5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Medidas</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => onChangeView('plans')}
                                    className={`p-2.5 rounded-[8px] border transition-all flex items-center justify-center ${currentView === 'plans' ? 'bg-bee-amber text-bee-midnight border-orange-600 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-bee-amber hover:bg-amber-50'}`}
                                >
                                    <CreditCard className="h-5 w-5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Planos</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => onChangeView('invoices')}
                                    className={`p-2.5 rounded-[8px] border transition-all flex items-center justify-center ${currentView === 'invoices' ? 'bg-bee-amber text-bee-midnight border-orange-600 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-bee-amber hover:bg-amber-50'}`}
                                >
                                    <ReceiptText className="h-5 w-5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Faturas</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={handleInactivate}
                                    className="p-2.5 bg-red-50 text-red-500 rounded-[8px] border border-red-100 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                >
                                    <Power className="h-5 w-5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Inativar Aluno</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            <QuickMessageModal
                open={messageModalOpen}
                onOpenChange={setMessageModalOpen}
                studentId={student.id}
                studentName={student.full_name}
                studentEmail={student.email}
            />
        </aside>
    );
}
