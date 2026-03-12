'use client';

import { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    AlertTriangle, Check, LayoutDashboard, Calendar, ClipboardList,
    Dumbbell, Users, MessageSquare, CreditCard, BarChart3,
    Settings, Smartphone, Target, Bell, Globe, ShieldCheck,
    Building2, Layers, Headphones, Trash2, Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { PlanFeature } from '@/config/plans';
import { cn } from '@/lib/utils';

interface PlanoFormModalProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    plano?: any;
    onSaved: () => void;
}

export function PlanoFormModal({ open, onOpenChange, plano, onSaved }: PlanoFormModalProps) {
    const isEditing = !!plano;
    const { toast } = useToast();

    const [form, setForm] = useState({
        nome: plano?.name ?? plano?.nome ?? '',
        tier: plano?.tier ?? 'STARTER',
        valor_mensal: plano?.price ?? plano?.valor_mensal ?? '',
        descricao: plano?.description ?? plano?.descricao ?? '',
        intervalo: plano?.interval ?? plano?.intervalo ?? 'Mensal',
        repeticoes: plano?.repeats ?? plano?.repeticoes ?? 0,
        promo_price: plano?.promo_price ?? '',
        promo_months: plano?.promo_months ?? 3,
        allowed_features: (plano?.allowed_features as PlanFeature[]) ?? [],
        marketing_subtitle: plano?.marketing_subtitle ?? '',
        marketing_highlights: (plano?.marketing_highlights as string[]) ?? [],
        max_alunos: plano?.max_alunos ?? '',
    });

    const [loading, setLoading] = useState(false);

    const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

    const toggleFeature = (feature: PlanFeature) => {
        // Block feature changes when editing — features are hardcoded
        if (isEditing) return;
        setForm(f => ({
            ...f,
            allowed_features: f.allowed_features.includes(feature)
                ? f.allowed_features.filter(ft => ft !== feature)
                : [...f.allowed_features, feature]
        }));
    };

    const modules = [
        { id: 'painel', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'agenda', label: 'Agenda', icon: Calendar },
        { id: 'aulas', label: 'Aulas Coletivas', icon: ClipboardList },
        { id: 'treinos', label: 'Treinos', icon: Dumbbell },
        { id: 'alunos', label: 'Alunos', icon: Users },
        { id: 'conversas', label: 'Conversas', icon: MessageSquare },
        { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
        { id: 'exercicios', label: 'Exercícios', icon: Dumbbell },
        { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
        { id: 'configuracoes', label: 'Configurações', icon: Settings },
    ];

    const upcomingFeatures = [
        { id: 'app_aluno', label: 'App do Aluno', icon: Smartphone, upcoming: true },
        { id: 'crm', label: 'CRM', icon: Target, upcoming: true },
        { id: 'automacao_cobranca', label: 'Automação Cobrança', icon: CreditCard, upcoming: true },
        { id: 'api_acesso', label: 'API Controle Acesso', icon: ShieldCheck, upcoming: true },
        { id: 'alertas', label: 'Alertas Whats/Email', icon: Bell, upcoming: true },
        { id: 'multiplos_agendamentos', label: 'Mult. Agendamentos', icon: Calendar },
        { id: 'multiplos_usuarios', label: 'Mult. Usuários', icon: Users },
        { id: 'multipropriedade', label: 'Multipropriedade', icon: Building2 },
        { id: 'api_externa', label: 'API Externa', icon: Globe },
        { id: 'suporte_prioritario', label: 'Suporte Prioritário', icon: Headphones },
        { id: 'white_label', label: 'Domínio / White-label', icon: Globe },
    ];

    const handleSubmit = async () => {
        if (!form.nome || !form.valor_mensal) {
            toast({ title: 'Preencha todos os campos obrigatórios.', variant: 'destructive' });
            return;
        }
        setLoading(true);
        try {
            if (isEditing) {
                // STRICT MODE: Only send financial fields when editing
                const url = `/api/admin/planos`;
                const res = await fetch(url, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: plano.id,
                        valor_mensal: form.valor_mensal,
                        promo_price: form.promo_price || null,
                        promo_months: form.promo_months || null,
                        marketing_subtitle: form.marketing_subtitle || null,
                        marketing_highlights: form.marketing_highlights || [],
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Erro ao atualizar plano');
                toast({ title: 'Plano atualizado!', description: 'As alterações foram salvas com sucesso.' });
            } else {
                const url = '/api/admin/planos';
                const payload = {
                    nome: form.nome,
                    tier: form.tier,
                    valor_mensal: form.valor_mensal,
                    descricao: form.descricao,
                    intervalo: form.intervalo,
                    repeticoes: form.repeticoes,
                    promo_price: form.promo_price || null,
                    promo_months: form.promo_months || null,
                    allowed_features: form.allowed_features,
                    marketing_subtitle: form.marketing_subtitle || null,
                    marketing_highlights: form.marketing_highlights || [],
                    max_alunos: form.max_alunos || null
                };
                const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (!res.ok) throw new Error('Erro ao criar plano');
                toast({ title: 'Plano criado!' });
            }
            onSaved();
            onOpenChange(false);
        } catch (err: any) {
            toast({ title: err.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-2xl border-l shadow-2xl p-0 flex flex-col h-full bg-white">
                <SheetHeader className="p-8 border-b relative overflow-hidden shrink-0 bg-white/50 backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-bee-amber/[0.03] rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/[0.05] rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />
                    <div className="flex items-center gap-5 relative text-left">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-bee-amber/20 via-bee-amber/10 to-transparent border border-bee-amber/20 shadow-inner group transition-all">
                            <Layers className="h-8 w-8 text-bee-amber drop-shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <SheetTitle className="text-2xl font-black font-display tracking-tight text-bee-midnight">
                                {isEditing ? 'Editar Plano' : 'Novo Plano'}
                            </SheetTitle>
                            <SheetDescription className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-bee-amber animate-pulse" />
                                {isEditing ? 'Alterações afetarão a próxima cobrança dos assinantes ativos.' : 'Configure o novo plano de assinatura.'}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="p-8 space-y-8">
                        {isEditing && plano?.assinantes_ativos > 0 && (
                            <div className="flex items-start gap-4 p-5 rounded-[1.5rem] bg-amber-50 border border-amber-100/50 group transition-all hover:bg-amber-100/30">
                                <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform shadow-sm">
                                    <AlertTriangle className="w-5 h-5 text-bee-amber" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-amber-700">Atenção ao alterar valores</p>
                                    <p className="text-[11px] font-medium text-amber-600 leading-tight">
                                        Alterar o valor deste plano afetará a próxima cobrança de todos os{' '}
                                        <span className="font-black text-amber-700">{plano.assinantes_ativos} assinantes ativos</span>.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recursos e Acessos</Label>
                                <Badge variant="secondary" className="bg-amber-50 text-bee-amber border-none font-black text-[10px] rounded-full px-3 py-1">
                                    {form.allowed_features.length} selecionados
                                </Badge>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 mb-4 px-1 uppercase tracking-wider">Módulos do Sistema</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {modules.map((mod) => (
                                            <div
                                                key={mod.id}
                                                onClick={() => toggleFeature(mod.id as PlanFeature)}
                                                className={cn(
                                                    "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group",
                                                    form.allowed_features.includes(mod.id as PlanFeature)
                                                        ? "bg-amber-50/50 border-bee-amber shadow-sm ring-4 ring-bee-amber/5"
                                                        : "bg-white border-slate-100 hover:border-slate-300"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm",
                                                        form.allowed_features.includes(mod.id as PlanFeature) ? "bg-bee-amber text-bee-midnight" : "bg-slate-50 text-slate-400"
                                                    )}>
                                                        <mod.icon className="w-5 h-5" />
                                                    </div>
                                                    <span className={cn(
                                                        "text-xs font-bold transition-colors",
                                                        form.allowed_features.includes(mod.id as PlanFeature) ? "text-bee-midnight" : "text-slate-500"
                                                    )}>{mod.label}</span>
                                                </div>
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all",
                                                    form.allowed_features.includes(mod.id as PlanFeature) ? "bg-bee-amber border-bee-amber scale-110" : "border-slate-100 bg-slate-50/50"
                                                )}>
                                                    {form.allowed_features.includes(mod.id as PlanFeature) && <Check className="w-3.5 h-3.5 text-bee-midnight stroke-[4px]" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-2 mb-4 px-1">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recursos Avançados & Breve</p>
                                        <div className="h-[1px] flex-1 bg-slate-100/50" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pb-2">
                                        {upcomingFeatures.map((mod: any) => (
                                            <div
                                                key={mod.id}
                                                onClick={() => toggleFeature(mod.id as PlanFeature)}
                                                className={cn(
                                                    "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group",
                                                    form.allowed_features.includes(mod.id as PlanFeature)
                                                        ? "bg-amber-50/50 border-bee-amber shadow-sm ring-4 ring-bee-amber/5"
                                                        : "bg-white border-slate-100 hover:border-slate-300"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm",
                                                        form.allowed_features.includes(mod.id as PlanFeature) ? "bg-bee-amber text-bee-midnight" : "bg-slate-50 text-slate-400"
                                                    )}>
                                                        <mod.icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={cn(
                                                            "text-xs font-bold transition-colors",
                                                            form.allowed_features.includes(mod.id as PlanFeature) ? "text-bee-midnight" : "text-slate-500"
                                                        )}>{mod.label}</span>
                                                        {mod.upcoming && (
                                                            <span className="text-[9px] font-black text-bee-amber uppercase tracking-tighter">Em Breve</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all",
                                                    form.allowed_features.includes(mod.id as PlanFeature) ? "bg-bee-amber border-bee-amber" : "border-slate-100 bg-slate-50/50"
                                                )}>
                                                    {form.allowed_features.includes(mod.id as PlanFeature) && <Check className="w-3.5 h-3.5 text-bee-midnight stroke-[4px]" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 pt-8 border-t border-slate-100">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dados do Plano</Label>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2 col-span-2 group">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-bee-amber transition-colors">Nome do Plano <span className="text-bee-amber">*</span></Label>
                                    <Input
                                        value={form.nome}
                                        onChange={e => set('nome', e.target.value)}
                                        placeholder="ex: Pro Mensal"
                                        disabled={isEditing}
                                        className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/10 focus-visible:border-bee-amber shadow-sm font-bold text-bee-midnight px-5 text-base disabled:opacity-60 disabled:bg-slate-50"
                                    />
                                </div>

                                <div className="space-y-2 group">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-bee-amber transition-colors">Tier</Label>
                                    <Select value={form.tier} onValueChange={v => set('tier', v)} disabled={isEditing}>
                                        <SelectTrigger className="h-11 rounded-2xl border-slate-200 focus:ring-bee-amber/10 focus:border-bee-amber shadow-sm font-bold text-bee-midnight px-5 disabled:opacity-60 disabled:bg-slate-50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                                            <SelectItem value="STARTER" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-3 px-4">Starter</SelectItem>
                                            <SelectItem value="PLUS" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-3 px-4">Plus</SelectItem>
                                            <SelectItem value="STUDIO" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-3 px-4">Studio</SelectItem>
                                            <SelectItem value="PRO" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-3 px-4">Pro</SelectItem>
                                            <SelectItem value="ENTERPRISE" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-3 px-4">Enterprise</SelectItem>
                                            <SelectItem value="CUSTOM" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-3 px-4">Custom</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2 group">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-bee-amber transition-colors">Valor Mensal (R$) <span className="text-bee-amber">*</span></Label>
                                    <Input
                                        type="number"
                                        value={form.valor_mensal}
                                        onChange={e => set('valor_mensal', Number(e.target.value))}
                                        placeholder="249"
                                        className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/10 focus-visible:border-bee-amber shadow-sm font-black text-bee-midnight px-5 text-lg"
                                    />
                                </div>

                                <div className="space-y-2 group">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-bee-amber transition-colors">Intervalo</Label>
                                    <Select value={form.intervalo} onValueChange={v => set('intervalo', v)} disabled={isEditing}>
                                        <SelectTrigger className="h-11 rounded-2xl border-slate-200 focus:ring-bee-amber/10 focus:border-bee-amber shadow-sm font-bold text-bee-midnight px-5 disabled:opacity-50 disabled:bg-slate-50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                                            <SelectItem value="Mensal" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-3 px-4">Mensal</SelectItem>
                                            <SelectItem value="Trimestral" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-3 px-4">Trimestral</SelectItem>
                                            <SelectItem value="Semestral" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-3 px-4">Semestral</SelectItem>
                                            <SelectItem value="Anual" className="rounded-xl focus:bg-amber-50 focus:text-bee-amber font-bold py-3 px-4">Anual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2 group">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-bee-amber transition-colors">Meses Promo</Label>
                                    <Input
                                        type="number"
                                        value={form.promo_months}
                                        onChange={e => set('promo_months', Number(e.target.value))}
                                        min={1}
                                        className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/10 focus-visible:border-bee-amber shadow-sm font-bold text-bee-midnight px-5"
                                    />
                                </div>

                                <div className="space-y-2 group">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-bee-amber transition-colors">Preço Promo (R$)</Label>
                                    <Input
                                        type="number"
                                        value={form.promo_price}
                                        onChange={e => set('promo_price', e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="9.90"
                                        className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/10 focus-visible:border-bee-amber shadow-sm font-black text-emerald-600 bg-emerald-50/10 px-5 text-lg"
                                    />
                                </div>

                                <div className="space-y-2 group">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-bee-amber transition-colors">Repetições (0 = contínuo)</Label>
                                    <Input
                                        type="number"
                                        value={form.repeticoes}
                                        onChange={e => set('repeticoes', Number(e.target.value))}
                                        min={0}
                                        className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/10 focus-visible:border-bee-amber shadow-sm font-bold text-bee-midnight px-5"
                                    />
                                </div>

                                <div className="space-y-2 col-span-2 group">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-bee-amber transition-colors">Descrição Interna</Label>
                                    <Input
                                        value={form.descricao}
                                        onChange={e => set('descricao', e.target.value)}
                                        placeholder="Breve descrição do plano (uso administrativo)"
                                        className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/10 focus-visible:border-bee-amber shadow-sm font-medium text-slate-600 px-5"
                                    />
                                </div>

                                <div className="space-y-6 col-span-2 pt-4 border-t border-slate-50 mt-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Configuração de Marketing (Landing Page)</Label>

                                    <div className="space-y-2 group">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-bee-amber transition-colors">Subtítulo (Call to Action)</Label>
                                        <Input
                                            value={form.marketing_subtitle}
                                            onChange={e => set('marketing_subtitle', e.target.value)}
                                            placeholder="ex: Perfeito para Studios e Boxes com turmas coletivas."
                                            className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/10 focus-visible:border-bee-amber shadow-sm font-bold text-bee-midnight px-5"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Destaques (Highlights)</Label>
                                        <div className="space-y-2">
                                            {form.marketing_highlights.map((highlight, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <Input
                                                        value={highlight}
                                                        onChange={e => {
                                                            const newHighlights = [...form.marketing_highlights];
                                                            newHighlights[idx] = e.target.value;
                                                            set('marketing_highlights', newHighlights);
                                                        }}
                                                        placeholder="ex: Gestão Financeira"
                                                        className="h-11 rounded-xl border-slate-200 focus-visible:ring-bee-amber/10 focus-visible:border-bee-amber shadow-sm font-semibold text-slate-600 px-4"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            const newHighlights = form.marketing_highlights.filter((_, i) => i !== idx);
                                                            set('marketing_highlights', newHighlights);
                                                        }}
                                                        className="h-10 w-10 rounded-xl text-red-300 hover:text-red-500 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                variant="outline"
                                                onClick={() => set('marketing_highlights', [...form.marketing_highlights, ''])}
                                                className="w-full h-10 rounded-xl border-dashed border-2 hover:border-bee-amber hover:bg-amber-50 hover:text-bee-amber font-bold gap-2"
                                            >
                                                <Plus className="w-4 h-4" /> Adicionar Destaque
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 col-span-2 pt-4 border-t border-slate-50 mt-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Limites</Label>

                                    <div className="space-y-2 group">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-bee-amber transition-colors">Limite de Alunos Ativos</Label>
                                        <Input
                                            type="number"
                                            value={form.max_alunos}
                                            onChange={e => set('max_alunos', e.target.value === '' ? null : Number(e.target.value))}
                                            placeholder="Deixe vazio para ilimitado"
                                            disabled={isEditing}
                                            className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/10 focus-visible:border-bee-amber shadow-sm font-black text-bee-midnight px-5 text-lg disabled:opacity-60 disabled:bg-slate-50"
                                        />
                                        <p className="text-[10px] font-medium text-slate-400 mt-1 px-1">
                                            {isEditing ? '🔒 Limite definido na estrutura do plano (imutável).' : 'Este limite bloqueia o cadastro de novos alunos quando atingido.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <SheetFooter className="p-8 border-t bg-slate-50/50 gap-3 shrink-0">
                    <div className="flex w-full gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                            className="h-10 rounded-full font-bold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest text-[10px] flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-[1.5] h-10 rounded-full bg-bee-amber hover:bg-bee-amber/90 text-bee-midnight font-black shadow-lg shadow-bee-amber/20 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px]"
                        >
                            {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Plano'}
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
