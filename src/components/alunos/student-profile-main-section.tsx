'use client';

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MessageSquare, Dumbbell, Ruler, CreditCard, Power, Edit2,
    Calendar, MoreVertical,
} from "lucide-react";
import { differenceInYears } from "date-fns";
import { formatDate, formatNumber, formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { StudentCreditHistoryModal } from "./student-credit-history-modal";

interface StudentProfileMainSectionProps {
    student: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        created_at: string;
        email: string | null;
        phone: string | null;
        gender: string | null;
        birth_date: string | null;
        objective: string | null;
        unitName: string | null;
        status?: string;
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

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
    ACTIVE:   { label: 'Ativo',              cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    INACTIVE: { label: 'Inativo',            cls: 'bg-slate-100 text-slate-500 border-slate-200' },
    OVERDUE:  { label: 'Pagamento Pendente', cls: 'bg-orange-50 text-orange-600 border-orange-100' },
};

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
    onInactivate,
}: StudentProfileMainSectionProps) {
    const [creditHistoryOpen, setCreditHistoryOpen] = useState(false);
    const initials = student.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const age = student.birth_date ? differenceInYears(new Date(), new Date(student.birth_date)) : null;
    const statusInfo = STATUS_BADGE[student.status || 'ACTIVE'] || STATUS_BADGE.ACTIVE;

    const planLabel = (() => {
        const p = student.plan;
        if (!p) return { name: 'Sem plano', detail: null, isCredits: false };
        if (p.plan_type === 'pack') return {
            name: p.name,
            detail: `${student.credits_balance ?? 0} créditos disponíveis`,
            isCredits: true,
        };
        if (p.days_per_week) return { name: p.name, detail: `${p.days_per_week}× / semana`, isCredits: false };
        return { name: p.name, detail: 'Acesso ilimitado', isCredits: false };
    })();

    return (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            {/* ── Top: Identity + Actions ─────────────────────────────── */}
            {/* Mobile: stack avatar/name centered + kebab menu in corner.
                Desktop (sm+): horizontal with inline action buttons. */}
            <div className="relative px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5">
                {/* Mobile-only kebab in top-right corner */}
                <div className="sm:hidden absolute top-3 right-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-400 hover:bg-slate-100">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 rounded-xl border-slate-100 shadow-xl">
                            <DropdownMenuItem onClick={onMessage} className="cursor-pointer py-2.5">
                                <MessageSquare className="h-4 w-4 mr-2 text-slate-400" /> Enviar mensagem
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onWorkout} className="cursor-pointer py-2.5">
                                <Dumbbell className="h-4 w-4 mr-2 text-slate-400" /> Novo treino
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onMeasurement} className="cursor-pointer py-2.5">
                                <Ruler className="h-4 w-4 mr-2 text-slate-400" /> Registrar medidas
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onPlan} className="cursor-pointer py-2.5">
                                <CreditCard className="h-4 w-4 mr-2 text-slate-400" /> Gerenciar plano
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                onClick={onInactivate} 
                                className={cn(
                                    "cursor-pointer py-2.5 font-bold text-xs uppercase tracking-wider",
                                    student.status === 'ACTIVE' || student.status === 'OVERDUE'
                                        ? "text-red-600 focus:text-red-700 focus:bg-red-50"
                                        : "text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50"
                                    )}
                            >
                                <Power className="h-4 w-4 mr-2" />
                                {student.status === 'ACTIVE' || student.status === 'OVERDUE' ? 'Inativar aluno' : 'Ativar aluno'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6">
                    {/* Avatar — centered on mobile, left on desktop */}
                    <div className="relative shrink-0 mx-auto sm:mx-0">
                        <Avatar className="h-24 w-24 sm:h-20 sm:w-20 border-2 border-slate-100 shadow-sm">
                            <AvatarImage src={student.avatar_url || ''} className="object-cover" />
                            <AvatarFallback className="text-2xl font-black bg-orange-50 text-orange-500">{initials}</AvatarFallback>
                        </Avatar>
                        <button
                            onClick={onEdit}
                            aria-label="Editar aluno"
                            className="absolute -bottom-1 -right-1 h-7 w-7 sm:h-6 sm:w-6 bg-white rounded-full shadow border border-slate-100 flex items-center justify-center text-slate-400 hover:text-bee-amber transition-colors"
                        >
                            <Edit2 className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                        </button>
                    </div>

                    {/* Name & meta — centered on mobile */}
                    <div className="flex-1 min-w-0 mt-4 sm:mt-0 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                            <h1 className="text-xl sm:text-[22px] font-bold text-slate-900 leading-tight tracking-tight break-words">
                                {student.full_name}
                            </h1>
                            <Badge className={cn('text-[10px] font-bold border rounded-full px-2.5 py-0.5 shadow-none shrink-0', statusInfo.cls)}>
                                {statusInfo.label}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-center sm:justify-start flex-wrap gap-x-3 gap-y-1 mt-2 sm:mt-1.5">
                            {student.phone && (
                                <span className="text-sm text-slate-500">{student.phone}</span>
                            )}
                            {student.email && (
                                <span className="text-sm text-slate-400 truncate max-w-full">{student.email}</span>
                            )}
                            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Aluno desde {formatDate(student.created_at)}
                            </span>
                        </div>
                    </div>

                    {/* Action buttons — desktop only, inline */}
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                        <Button onClick={onMessage} variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold">
                            <MessageSquare className="h-3.5 w-3.5" /> Mensagem
                        </Button>
                        <Button onClick={onWorkout} variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold">
                            <Dumbbell className="h-3.5 w-3.5" /> Treino
                        </Button>
                        <Button onClick={onMeasurement} variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold">
                            <Ruler className="h-3.5 w-3.5" /> Medidas
                        </Button>
                        <Button onClick={onPlan} variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold">
                            <CreditCard className="h-3.5 w-3.5" /> Plano
                        </Button>
                        <Button 
                            onClick={onInactivate} 
                            variant="outline" 
                            size="sm" 
                            aria-label={student.status === 'ACTIVE' || student.status === 'OVERDUE' ? 'Inativar aluno' : 'Ativar aluno'} 
                            className={cn(
                                "h-8 w-8 p-0 rounded-lg border-slate-200 transition-colors",
                                student.status === 'ACTIVE' || student.status === 'OVERDUE'
                                    ? "text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                                    : "text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                            )}
                        >
                            <Power className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Mobile-only quick action row (touch-friendly, thumb zone) */}
                <div className="sm:hidden grid grid-cols-4 gap-2 mt-5">
                    <QuickAction icon={MessageSquare} label="Mensagem" onClick={onMessage} />
                    <QuickAction icon={Dumbbell} label="Treino" onClick={onWorkout} />
                    <QuickAction icon={Ruler} label="Medidas" onClick={onMeasurement} />
                    <QuickAction icon={CreditCard} label="Plano" onClick={onPlan} />
                </div>
            </div>

            {/* ── KPI strip ───────────────────────────────────────────── */}
            {/* Mobile: 2x2 grid. Desktop: 4 across. */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-slate-100">
                <KpiCell
                    label="Frequência"
                    value={`${attendancePercentage}%`}
                    valueClass={attendancePercentage >= 75 ? 'text-emerald-600' : attendancePercentage >= 50 ? 'text-amber-500' : 'text-red-500'}
                />
                <KpiCell label="Treinos concluídos" value={String(completedCount)} valueClass="text-bee-amber" mobileDivider />
                <KpiCell label="Peso atual" value={currentWeight ? `${formatNumber(currentWeight, 1)} kg` : '—'} desktopDivider mobileTopBorder />
                <KpiCell label="Altura" value={currentHeight ? `${formatNumber(currentHeight, 2)} m` : '—'} desktopDivider mobileDivider mobileTopBorder />
            </div>

            {/* ── Info + Plan ──────────────────────────────────────── */}
            {/* Mobile: stacked (info above plan). Desktop: 2/3 + 1/3 columns. */}
            <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-slate-100">
                <div className="sm:col-span-2 px-4 sm:px-6 py-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                    <InfoItem label="Sexo" value={student.gender === 'male' ? 'Masculino' : student.gender === 'female' ? 'Feminino' : 'Não informado'} />
                    <InfoItem label="Nascimento" value={formatDate(student.birth_date)} />
                    <InfoItem label="Idade" value={age ? `${age} anos` : '—'} />
                    <InfoItem label="Telefone" value={student.phone} />
                    <InfoItem label="Objetivo" value={student.objective} />
                    <InfoItem label="Unidade" value={student.unitName || 'Não vinculado'} />
                </div>

                <div className="border-t sm:border-t-0 sm:border-l border-slate-100 px-4 sm:px-6 py-4 flex flex-col justify-center gap-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Plano atual</p>
                    {student.plan ? (
                        <>
                            <p className="text-base font-bold text-slate-800 leading-snug">{planLabel.name}</p>
                            {planLabel.detail && (
                                <p className="text-[13px] text-slate-500">{planLabel.detail}</p>
                            )}
                            {student.plan.price && (
                                <p className="text-[13px] font-bold text-slate-700 mt-0.5">{formatCurrency(student.plan.price)}<span className="text-slate-400 font-normal text-[11px]">/mês</span></p>
                            )}
                            {planLabel.isCredits && (
                                <button
                                    onClick={() => setCreditHistoryOpen(true)}
                                    className="mt-1 flex items-center gap-1.5 hover:opacity-80 transition-opacity text-left group"
                                    type="button"
                                >
                                    <span className="text-xl font-black text-bee-amber group-hover:underline">{student.credits_balance ?? 0}</span>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">créditos</span>
                                    <span className="text-[10px] text-slate-400 font-semibold group-hover:text-slate-500 ml-0.5">(histórico)</span>
                                </button>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-slate-400">Sem plano vinculado</p>
                    )}
                    <button
                        onClick={onPlan}
                        className="mt-1.5 text-[12px] font-bold text-bee-amber hover:text-amber-600 transition-colors self-start"
                    >
                        Gerenciar plano →
                    </button>
                </div>
            </div>

            <StudentCreditHistoryModal
                open={creditHistoryOpen}
                onOpenChange={setCreditHistoryOpen}
                studentId={student.id}
                studentName={student.full_name}
            />
        </div>
    );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex flex-col items-center gap-1 py-2.5 rounded-xl border border-slate-100 bg-slate-50/60 active:scale-95 active:bg-slate-100 transition-all min-h-[64px]"
        >
            <Icon className="h-5 w-5 text-bee-amber" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{label}</span>
        </button>
    );
}

function KpiCell({
    label,
    value,
    valueClass,
    mobileDivider,
    desktopDivider,
    mobileTopBorder,
}: {
    label: string;
    value: string;
    valueClass?: string;
    mobileDivider?: boolean;
    desktopDivider?: boolean;
    mobileTopBorder?: boolean;
}) {
    return (
        <div className={cn(
            'px-4 sm:px-6 py-4',
            mobileDivider && 'border-l border-slate-100',
            !mobileDivider && desktopDivider && 'sm:border-l sm:border-slate-100',
            desktopDivider && !mobileDivider && 'border-l-0',
            mobileTopBorder && 'border-t sm:border-t-0 border-slate-100',
        )}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
            <p className={cn('text-xl sm:text-2xl font-black leading-none', valueClass || 'text-slate-800')}>{value}</p>
        </div>
    );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
            <p className="text-[14px] font-semibold text-slate-700 break-words">{value || '—'}</p>
        </div>
    );
}
