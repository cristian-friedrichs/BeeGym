'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Upload, Globe, Instagram, Building2, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { updateOrganizationSettings } from '@/actions/organization';
import { SectionHeader } from '@/components/ui/section-header';

type DaySchedule = { start: string; end: string; active: boolean };
type ScheduleConfig = Record<
    'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'holidays',
    DaySchedule
>;

const dayScheduleSchema = z.object({
    active: z.boolean(),
    start: z.string(),
    end: z.string(),
});

const scheduleSchema = z.object({
    sunday: dayScheduleSchema,
    monday: dayScheduleSchema,
    tuesday: dayScheduleSchema,
    wednesday: dayScheduleSchema,
    thursday: dayScheduleSchema,
    friday: dayScheduleSchema,
    saturday: dayScheduleSchema,
    holidays: dayScheduleSchema,
});

const settingsSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    description: z.string().optional(),
    website: z.string()
        .optional()
        .or(z.literal(''))
        .transform((url) => {
            if (!url) return '';
            const cleanUrl = url.trim();
            if (!cleanUrl) return '';
            // Auto-add https:// if no protocol present
            if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
                return `https://${cleanUrl}`;
            }
            return cleanUrl;
        })
        .pipe(z.string().url('URL inválida (ex: www.seusite.com)').optional().or(z.literal(''))),
    instagram: z.string()
        .optional()
        .transform((handle) => {
            if (!handle) return '';
            const cleanHandle = handle.trim().replace(/^@/, ''); // Remove @ if present
            if (!cleanHandle) return '';
            // Add @ prefix
            return `@${cleanHandle}`;
        }),
    schedule: scheduleSchema,
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const DAY_LABELS: Record<keyof ScheduleConfig, string> = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo',
    holidays: 'Feriados',
};

const DAY_ORDER: (keyof ScheduleConfig)[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
    'holidays',
];

interface GeneralSettingsFormProps {
    org: any;
    orgId: string;
}

export function GeneralSettingsForm({ org, orgId }: GeneralSettingsFormProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string>(org?.logo_url || '');
    const [organizationName, setOrganizationName] = useState<string>(org?.name || '');

    const { toast } = useToast();
    const supabase = createClient();

    const normalizeSchedule = (rawSchedule: any) => {
        const defaultDay = { active: true, start: '06:00', end: '22:00' };
        const base = {
            monday: { ...defaultDay },
            tuesday: { ...defaultDay },
            wednesday: { ...defaultDay },
            thursday: { ...defaultDay },
            friday: { ...defaultDay },
            saturday: { active: true, start: '08:00', end: '14:00' },
            sunday: { active: false, start: '09:00', end: '13:00' },
            holidays: { active: false, start: '09:00', end: '13:00' },
        };

        if (!rawSchedule) return base;

        try {
            const parsed = typeof rawSchedule === 'string' ? JSON.parse(rawSchedule) : rawSchedule;

            // If DB uses 'weekdays' group, spread it to individual days
            if (parsed.weekdays) {
                const wd = parsed.weekdays;
                ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
                    base[day as keyof ScheduleConfig] = { ...wd };
                });
            }

            // Overlay specific days from DB
            Object.keys(parsed).forEach(key => {
                if (key !== 'weekdays' && base[key as keyof ScheduleConfig]) {
                    base[key as keyof ScheduleConfig] = { ...parsed[key] };
                }
            });

            return base;
        } catch (e) {
            console.error('Error parsing schedule:', e);
            return base;
        }
    };

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            name: org?.name || '',
            description: org?.description || '',
            website: org?.website || '',
            instagram: org?.instagram || '',
            schedule: normalizeSchedule(org?.schedule),
        }
    });

    const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

    async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file || !orgId) return;

        setIsUploadingLogo(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${orgId}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(filePath);

            const { error: dbError } = await (supabase as any)
                .from('organizations')
                .update({
                    logo_url: publicUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', orgId);

            if (dbError) throw dbError;

            setLogoUrl(publicUrl);
            toast({
                title: 'Logo atualizada',
                description: 'A logo do negócio foi atualizada com sucesso.',
            });

            // Dispatch custom event for Header update
            window.dispatchEvent(new CustomEvent('organizationUpdated'));
            router.refresh();
        } catch (error: any) {
            console.error('Error uploading logo:', error);
            toast({
                title: 'Erro ao fazer upload',
                description: error.message || 'Ocorreu um erro ao enviar a logo.',
                variant: 'destructive',
            });
        } finally {
            setIsUploadingLogo(false);
        }
    }

    async function onSubmit(values: SettingsFormValues) {
        if (!orgId) {
            toast({
                title: 'Erro Crítico',
                description: 'ID da organização não identificado. Por favor, tente recarregar a página.',
                variant: 'destructive',
            });
            return;
        }

        setIsSaving(true);

        try {
            const result = await updateOrganizationSettings(values);

            if (result.error) {
                toast({
                    title: 'Erro ao salvar',
                    description: result.error,
                    variant: 'destructive',
                });
                return;
            }

            setOrganizationName(values.name);

            toast({
                title: 'Configurações salvas',
                description: 'As configurações do negócio foram atualizadas com sucesso.',
            });

            // Dispatch custom event for Header update
            window.dispatchEvent(new CustomEvent('organizationUpdated'));
            router.refresh();
        } catch (error: any) {
            console.error('Error saving settings:', error);
            toast({
                title: 'Erro ao salvar',
                description: 'Ocorreu um erro inesperado ao salvar as configurações.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    }

    const schedule = watch('schedule');

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <SectionHeader
                title="Configurações Gerais"
                subtitle="Gerencie os dados básicos, identidade visual e horários da sua academia"
                action={
                    <Button
                        type="submit"
                        disabled={isSaving}
                        className="bg-bee-amber hover:bg-amber-500 text-bee-midnight font-bold h-11 px-8 rounded-full shadow-lg shadow-bee-amber/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-[13px] uppercase tracking-wider"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Salvar Alterações
                            </>
                        )}
                    </Button>
                }
            />
            {/* Card 1: Business Identity */}
            <Card className="rounded-[2rem] shadow-sm border-slate-100 overflow-hidden bg-white">
                <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 text-bee-amber">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Dados da Academia</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Logo Upload */}
                    <div className="space-y-2">
                        <Label>Logo do Negócio</Label>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20 rounded-2xl">
                                <AvatarImage src={logoUrl} className="object-cover" />
                                <AvatarFallback className="rounded-2xl text-lg bg-slate-100 text-slate-400">
                                    {organizationName?.slice(0, 2).toUpperCase() || 'BG'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleLogoUpload}
                                    disabled={isUploadingLogo}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById('logo-upload')?.click()}
                                    disabled={isUploadingLogo}
                                    className="rounded-full shadow-sm hover:-translate-y-0.5 transition-all active:scale-95 border-bee-amber text-bee-midnight hover:bg-bee-amber/5"
                                >
                                    {isUploadingLogo ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin text-bee-amber" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Alterar Logo
                                        </>
                                    )}
                                </Button>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Formatos aceitos: JPG, PNG. Tamanho recomendado: 200x200px.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Business Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-deep-midnight font-bold">Nome do Negócio</Label>
                        <Input
                            id="name"
                            {...register('name')}
                            placeholder="Ex: Academia FitLife"
                            className="rounded-full bg-slate-50 border-slate-100 focus:bg-white transition-all h-10 border focus:border-bee-amber focus:ring-1 focus:ring-bee-amber/20"
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-deep-midnight font-bold">Descrição</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            placeholder="Sobre a academia..."
                            rows={4}
                            className="rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all p-4 resize-none border focus:border-bee-amber focus:ring-1 focus:ring-bee-amber/20"
                        />
                        {errors.description && (
                            <p className="text-sm text-destructive">{errors.description.message}</p>
                        )}
                    </div>

                    {/* Website & Instagram */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="website" className="text-deep-midnight font-bold">Website</Label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="website"
                                    {...register('website')}
                                    placeholder="www.suaacademia.com.br"
                                    className="pl-10 rounded-full bg-slate-50 border-slate-100 focus:bg-white transition-all h-10 border focus:border-bee-amber focus:ring-1 focus:ring-bee-amber/20"
                                />
                            </div>
                            {errors.website && (
                                <p className="text-sm text-destructive">{errors.website.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="instagram" className="text-deep-midnight font-bold">Instagram</Label>
                            <div className="relative">
                                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="instagram"
                                    {...register('instagram')}
                                    placeholder="@seu.perfil"
                                    className="pl-10 rounded-full bg-slate-50 border-slate-100 focus:bg-white transition-all h-10 border focus:border-bee-amber focus:ring-1 focus:ring-bee-amber/20"
                                />
                            </div>
                            {errors.instagram && (
                                <p className="text-sm text-destructive">{errors.instagram.message}</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card 2: Operating Schedule */}
            <Card className="rounded-[2rem] shadow-sm border-slate-100 overflow-hidden bg-white">
                <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 text-bee-amber">
                                <Clock className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Horário Comercial</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {DAY_ORDER.map((day) => (
                        <div key={day} className="flex items-center gap-4 p-4 border-2 rounded-2xl bg-slate-50/50 transition-all hover:border-bee-amber/30">
                            <div className="flex items-center gap-2 min-w-[140px]">
                                <Switch
                                    checked={schedule?.[day]?.active || false}
                                    onCheckedChange={(checked) => setValue(`schedule.${day}.active`, checked)}
                                    className="data-[state=checked]:bg-bee-amber"
                                />
                                <Label className="font-bold text-deep-midnight">{DAY_LABELS[day]}</Label>
                            </div>
                            <div className="flex items-center gap-2 flex-1">
                                <Input
                                    type="time"
                                    {...register(`schedule.${day}.start`)}
                                    disabled={!schedule?.[day]?.active}
                                    className="w-32 rounded-full border h-9 focus:border-bee-amber focus:ring-1 focus:ring-bee-amber/20"
                                />
                                <span className="text-muted-foreground font-medium">até</span>
                                <Input
                                    type="time"
                                    {...register(`schedule.${day}.end`)}
                                    disabled={!schedule?.[day]?.active}
                                    className="w-32 rounded-full border h-9 focus:border-bee-amber focus:ring-1 focus:ring-bee-amber/20"
                                />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

        </form>
    );
}
