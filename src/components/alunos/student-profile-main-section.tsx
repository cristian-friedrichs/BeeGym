'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    MessageSquare, Dumbbell, Ruler, CreditCard, Power, Edit2,
    Calendar,
} from "lucide-react";
import { differenceInYears } from "date-fns";
import { formatDate, formatNumber, formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

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
    ACTIVE:   { label: 'Ativo',        cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    INACTIVE: { label: 'Inativo',      cls: 'bg-slate-100 text-slate-500 border-slate-200' },
    OVERDUE:  { label: 'Inadimplente', cls: 'bg-red-50 text-red-600 border-red-100' },
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
            <div className="flex items-start gap-6 px-6 pt-6 pb-5">
                {/* Avatar */}
                <div className="relative shrink-0">
                    <Avatar className="h-20 w-20 border-2 border-slate-100 shadow-sm">
                        <AvatarImage src={student.avatar_url || ''} className="object-cover" />
                        <AvatarFallback className="text-2xl font-black bg-orange-50 text-orange-500">{initials}</AvatarFallback>
                    </Avatar>
                    <button
                        onClick={onEdit}
                        className="absolute -bottom-1 -right-1 h-6 w-6 bg-white rounded-full shadow border border-slate-100 flex items-center justify-center text-slate-400 hover:text-bee-amber transition-colors"
                    >
                        <Edit2 className="h-3 w-3" />
                    </button>
                </div>

                {/* Name & meta */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="text-[22px] font-bold text-slate-900 leading-tight tracking-tight">{student.full_name}</h1>
                        <Badge className={cn('text-[10px] font-bold border rounded-full px-2.5 py-0.5 shadow-none', statusInfo.cls)}>
                            {statusInfo.label}
                        </Badge>
                    </div>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1.5">
                        {student.email && (
                            <span className="text-sm text-slate-400 truncate">{student.email}</span>
                        )}
                        {student.phone && (
                            <span className="text-sm text-slate-400">{student.phone}</span>
                        )}
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Aluno desde {formatDate(student.created_at)}
                        </span>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
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
                    <Button onClick={onInactivate} variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors">
                        <Power className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* ── KPI strip ───────────────────────────────────────────── */}
            <div className="grid grid-cols-4 border-t border-slate-100">
                <KpiCell
                    label="Frequência"
                    value={`${attendancePercentage}%`}
                    valueClass={attendancePercentage >= 75 ? 'text-emerald-600' : attendancePercentage >= 50 ? 'text-amber-500' : 'text-red-500'}
                />
                <KpiCell label="Treinos concluídos" value={String(completedCount)} valueClass="text-bee-amber" divider />
                <KpiCell label="Peso atual" value={currentWeight ? `${formatNumber(currentWeight, 1)} kg` : '—'} divider />
                <KpiCell label="Altura" value={currentHeight ? `${formatNumber(currentHeight, 2)} m` : '—'} divider />
            </div>

            {/* ── Info + Plan row ──────────────────────────────────────── */}
            <div className="grid grid-cols-3 border-t border-slate-100">
                {/* Personal info */}
                <div className="col-span-2 px-6 py-4 grid grid-cols-3 gap-x-8 gap-y-4">
                    <InfoItem label="Sexo" value={student.gender === 'male' ? 'Masculino' : student.gender === 'female' ? 'Feminino' : 'Não informado'} />
                    <InfoItem label="Nascimento" value={formatDate(student.birth_date)} />
                    <InfoItem label="Idade" value={age ? `${age} anos` : '—'} />
                    <InfoItem label="Telefone" value={student.phone} />
                    <InfoItem label="Objetivo" value={student.objective} />
                    <InfoItem label="Unidade" value={student.unitName || 'Não vinculado'} />
                </div>

                {/* Plan card */}
                <div className="border-l border-slate-100 px-6 py-4 flex flex-col justify-center gap-1.5">
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
                                <div className="mt-1 flex items-center gap-1.5">
                                    <span className="text-xl font-black text-bee-amber">{student.credits_balance ?? 0}</span>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">créditos</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-slate-400">Sem plano vinculado</p>
                    )}
                    <button
                        onClick={onPlan}
                        className="mt-1.5 text-[11px] font-bold text-bee-amber hover:text-amber-600 transition-colors self-start"
                    >
                        Gerenciar plano →
                    </button>
                </div>
            </div>
        </div>
    );
}

function KpiCell({ label, value, valueClass, divider }: { label: string; value: string; valueClass?: string; divider?: boolean }) {
    return (
        <div className={cn('px-6 py-4', divider && 'border-l border-slate-100')}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
            <p className={cn('text-2xl font-black leading-none', valueClass || 'text-slate-800')}>{value}</p>
        </div>
    );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
            <p className="text-[14px] font-semibold text-slate-700">{value || '—'}</p>
        </div>
    );
}
