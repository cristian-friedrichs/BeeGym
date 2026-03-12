'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    MessageSquare, Dumbbell, Ruler,
    CreditCard, Power, Edit, Calendar,
    Mail, Phone, User, Target, Building2,
    Clock, Infinity, Package
} from "lucide-react";

import { format, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDate, formatNumber, formatCurrency } from "@/lib/formatters";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface StudentProfileMainSectionProps {
    student: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        created_at: string;
        email: string | null;
        phone: string | null;
        sex: string | null;
        birth_date: string | null;
        height: number | null;
        objective: string | null;
        unitName: string | null;
        credits_balance?: number;
        plan: {
            name: string;
            plan_type?: string;
            credits?: number;
            days_per_week?: number;
            recurrence?: string;
            price?: number;
        } | null;
        workouts?: any[];
    };
    attendancePercentage: number;
    completedCount: number;
    currentWeight: number | null;
    currentHeight: number | null;
    onEdit: () => void;
    onMessage: () => void;
    onWorkout: () => void;
    onMeasurement: () => void;
    onPlan: () => void;
    onInactivate: () => void;
}

export function StudentProfileMainSection({
    student,
    attendancePercentage,
    completedCount,
    currentWeight,
    currentHeight,
    onEdit,
    onMessage,
    onWorkout,
    onMeasurement,
    onPlan,
    onInactivate
}: StudentProfileMainSectionProps) {
    const initials = student.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const age = student.birth_date
        ? differenceInYears(new Date(), new Date(student.birth_date))
        : null;

    const getPlanDetails = () => {
        const plan = student.plan;
        if (!plan) return { label: 'Sem Plano', icon: CreditCard, subtitle: 'Nenhuma assinatura ativa' };
        if (plan.plan_type === 'pack') return { label: 'Plano de Créditos', icon: Package, subtitle: `${student.credits_balance ?? 0} créditos` };
        if (!plan.days_per_week) return { label: 'Mensalidade', icon: Infinity, subtitle: 'Acesso Ilimitado' };

        const workouts = student.workouts || [];
        const scheduledWorkouts = workouts
            .filter(w => w.status === 'Agendado' && w.scheduled_at)
            .filter(w => new Date(w.scheduled_at) >= new Date());

        if (scheduledWorkouts.length > 0) {
            const map: Record<number, string> = { 1: 'SEG', 2: 'TER', 3: 'QUA', 4: 'QUI', 5: 'SEX', 6: 'SAB', 0: 'DOM' };
            const uniqueDays = Array.from(new Set(scheduledWorkouts.map(w => new Date(w.scheduled_at).getDay())));
            const order = [1, 2, 3, 4, 5, 6, 0];
            uniqueDays.sort((a, b) => order.indexOf(a) - order.indexOf(b));
            return { label: 'Plano Semanal', icon: Clock, subtitle: uniqueDays.map(d => map[d]).join(' | ') };
        }
        return { label: 'Plano Semanal', icon: Clock, subtitle: `${plan.days_per_week}x / semana` };
    };

    const planInfo = getPlanDetails();

    const InfoItem = ({ icon: Icon, label, value, subValue }: any) => (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-deep-midnight leading-tight">{value || '-'}</span>
                {subValue && <span className="text-[11px] font-medium text-slate-400">({subValue})</span>}
            </div>
        </div>
    );

    const ActionButton = ({ icon: Icon, onClick, label, variant = "default" }: any) => (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={onClick}
                        variant="outline"
                        className={`h-10 w-10 rounded-[10px] p-0 transition-all shadow-sm ${variant === 'danger'
                            ? 'bg-red-50 border-red-100 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-600'
                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-bee-amber hover:bg-amber-50 hover:border-orange-100'
                            }`}
                    >
                        <Icon className="h-4.5 w-4.5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent className={`font-sans font-bold text-[10px] uppercase tracking-widest border-none py-2 px-3 ${variant === 'danger' ? 'bg-red-600 text-white' : 'bg-deep-midnight text-white'}`}>
                    {label}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

    return (
        <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden flex animate-in fade-in slide-in-from-top-4 duration-500">
            {/* COLUMN 1 (1/3 Width): Visual Identity */}
            <div className="w-[320px] p-6 border-r border-slate-50 flex flex-col items-center text-center shrink-0">
                <div className="relative mb-4 group">
                    <Avatar className="h-28 w-28 border-4 border-slate-50 shadow-md ring-1 ring-slate-100 transition-transform duration-500 group-hover:scale-105">
                        <AvatarImage src={student.avatar_url || ''} className="object-cover" />
                        <AvatarFallback className="text-4xl bg-orange-100 text-orange-600 font-black">{initials}</AvatarFallback>
                    </Avatar>
                    <button onClick={onEdit} className="absolute bottom-0 right-0 h-8 w-8 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-bee-amber transition-all hover:scale-110">
                        <Edit className="h-3.5 w-3.5" />
                    </button>
                </div>

                <div className="space-y-0.5 mb-4">
                    <h1 className="text-xl font-bold text-deep-midnight tracking-tight leading-tight font-display">{student.full_name}</h1>
                    <p className="text-[12px] font-medium text-slate-400 truncate max-w-[240px]">{student.email}</p>
                    <div className="flex items-center justify-center gap-2 mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">
                        <Calendar className="h-3 w-3 text-slate-300" />
                        <span>Aluno desde: {formatDate(student.created_at)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-auto">
                    <ActionButton icon={MessageSquare} onClick={onMessage} label="Conversas" />
                    <ActionButton icon={Dumbbell} onClick={onWorkout} label="Treinos" />
                    <ActionButton icon={Ruler} onClick={onMeasurement} label="Medidas" />
                    <ActionButton icon={CreditCard} onClick={onPlan} label="Planos" />
                    <ActionButton icon={Power} onClick={onInactivate} label="Inativar" variant="danger" />
                </div>
            </div>

            {/* COLUMN 2 & 3 (2/3 Width): Data Grid */}
            <div className="flex-1 p-6 bg-slate-50/20 grid grid-cols-3 gap-y-6 gap-x-10 content-start">
                {/* Row 1 - Performance KPIs (Moved to Top) */}
                <div className="col-span-3 pb-6 border-b border-slate-100 grid grid-cols-4 gap-8">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Frequência</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-emerald-600 leading-none">{attendancePercentage}%</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Treinos / Aulas</span>
                        <span className="text-2xl font-black text-bee-amber leading-none">{completedCount}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Altura</span>
                        <span className="text-2xl font-black text-slate-700 leading-none">{formatNumber(currentHeight, 2)} m</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Peso Atual</span>
                        <span className="text-2xl font-black text-blue-600 leading-none">{formatNumber(currentWeight, 1)} kg</span>
                    </div>
                </div>

                {/* Row 2 - Personal Identity (DOB and Age Swapped) */}
                <InfoItem icon={User} label="Sexo" value={student.sex || 'Não informado'} />
                <InfoItem icon={Calendar} label="Data de Nasc." value={formatDate(student.birth_date)} />
                <InfoItem icon={Calendar} label="Idade" value={age ? `${age} anos` : '-'} />

                {/* Row 3 - Contact & Goal */}
                <InfoItem icon={Phone} label="Telefone" value={student.phone} />
                <InfoItem icon={Target} label="Objetivo" value={student.objective} />
                <InfoItem icon={Building2} label="Unidade" value={student.unitName || 'Não vinculado'} />

                {/* Row 4 - Plan Sector */}
                <div className="col-span-3 pt-6 border-t border-slate-100 grid grid-cols-3 gap-12">
                    <InfoItem icon={planInfo.icon} label="Tipo de Plano" value={planInfo.label} />
                    <InfoItem icon={CreditCard} label="Detalhes" value={planInfo.subtitle} />
                    {student.plan?.plan_type === 'pack' ? (
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Saldo</span>
                            <span className="text-xl font-black text-deep-midnight leading-tight">{student.credits_balance ?? 0} <span className="text-[11px] text-slate-400 font-bold uppercase">Créditos</span></span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Valor</span>
                            <span className="text-xl font-black text-deep-midnight leading-tight">
                                {formatCurrency(student.plan?.price)}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
