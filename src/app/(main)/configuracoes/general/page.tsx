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

export default function GeneralSettingsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [orgId, setOrgId] = useState<string | null>(null);
    const [logoUrl, setLogoUrl] = useState<string>('');
    const [organizationName, setOrganizationName] = useState<string>('');

    const { toast } = useToast();
    const supabase = createClient();

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            name: '',
            description: '',
            website: '',
            instagram: '',
            schedule: {
                monday: { active: true, start: '06:00', end: '22:00' },
                tuesday: { active: true, start: '06:00', end: '22:00' },
                wednesday: { active: true, start: '06:00', end: '22:00' },
                thursday: { active: true, start: '06:00', end: '22:00' },
                friday: { active: true, start: '06:00', end: '22:00' },
                saturday: { active: true, start: '08:00', end: '14:00' },
                sunday: { active: false, start: '09:00', end: '13:00' },
                holidays: { active: false, start: '09:00', end: '13:00' },
            },
        }
    });

    const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

    useEffect(() => {
        async function fetchSettings() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setIsLoading(false);
                    return;
                }

                const { data: profile } = await (supabase as any)
                    .from('profiles')
                    .select('organization_id')
                    .eq('id', user.id)
                    .single();

                if (!(profile as any)?.organization_id) {
                    setIsLoading(false);
                    return;
                }

                setOrgId((profile as any).organization_id);

                const { data: org } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', profile.organization_id)
                    .single() as { data: any, error: any };

                if (org) {
                    setValue('name', org.name || '');
                    setValue('description', org.description || '');
                    setValue('website', org.website || '');
                    setValue('instagram', org.instagram || '');

                    setOrganizationName(org.name || '');
                    setLogoUrl(org.logo_url || '');

                    // Parse schedule JSON
                    if (org.schedule) {
                        const schedule = typeof org.schedule === 'string'
                            ? JSON.parse(org.schedule)
                            : org.schedule;

                        // Handle migration from old format
                        if (schedule.weekdays) {
                            // Old format - convert to new
                            const newSchedule: ScheduleConfig = {
                                monday: schedule.weekdays,
                                tuesday: schedule.weekdays,
                                wednesday: schedule.weekdays,
                                thursday: schedule.weekdays,
                                friday: schedule.weekdays,
                                saturday: schedule.saturday || { active: true, start: '08:00', end: '14:00' },
                                sunday: schedule.sunday || { active: false, start: '09:00', end: '13:00' },
                                holidays: { active: false, start: '09:00', end: '13:00' },
                            };
                            setValue('schedule', newSchedule);
                        } else {
                            setValue('schedule', schedule);
                        }
                    }
                }

                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching settings:', error);
                setIsLoading(false);
            }
        }

        fetchSettings();
    }, [supabase, setValue]);

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
                .update({ logo_url: publicUrl })
                .eq('id', orgId);

            if (dbError) throw dbError;

            setLogoUrl(publicUrl);
            toast({
                title: 'Logo atualizada',
                description: 'A logo do negócio foi atualizada com sucesso.',
            });
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
        if (!orgId) return;

        setIsSaving(true);

        try {
            const { error } = await (supabase as any)
                .from('organizations')
                .update({
                    name: values.name,
                    description: values.description,
                    website: values.website,
                    instagram: values.instagram,
                    schedule: values.schedule,
                })
                .eq('id', orgId);

            if (error) throw error;

            setOrganizationName(values.name);

            toast({
                title: 'Configurações salvas',
                description: 'As configurações do negócio foram atualizadas com sucesso.',
            });
            router.refresh();
        } catch (error: any) {
            console.error('Error saving settings:', error);
            toast({
                title: 'Erro ao salvar',
                description: error.message || 'Ocorreu um erro ao salvar as configurações.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <div className="text-xs text-slate-500 font-mono bg-slate-100 p-3 rounded text-center">
                    Carregando Configurações Gerais...<br />
                    orgId: {orgId || 'null'}
                </div>
            </div>
        );
    }

    const schedule = watch('schedule');

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Card 1: Business Identity */}
            <Card className="rounded-[16px] shadow-sm border-slate-100 overflow-hidden bg-white">
                <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-5 text-orange-500">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Identidade Visual & Sobre</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Logo Upload */}
                    <div className="space-y-2">
                        <Label>Logo do Negócio</Label>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20 rounded-lg">
                                <AvatarImage src={logoUrl} className="object-cover" />
                                <AvatarFallback className="rounded-lg text-lg bg-primary/10">
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
                                >
                                    {isUploadingLogo ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                        <Label htmlFor="name">Nome do Negócio</Label>
                        <Input
                            id="name"
                            {...register('name')}
                            placeholder="Ex: Academia FitLife"
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            placeholder="Sobre a academia..."
                            rows={4}
                        />
                        {errors.description && (
                            <p className="text-sm text-destructive">{errors.description.message}</p>
                        )}
                    </div>

                    {/* Website & Instagram */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="website"
                                    {...register('website')}
                                    placeholder="www.suaacademia.com.br"
                                    className="pl-10"
                                />
                            </div>
                            {errors.website && (
                                <p className="text-sm text-destructive">{errors.website.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="instagram">Instagram</Label>
                            <div className="relative">
                                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="instagram"
                                    {...register('instagram')}
                                    placeholder="@seu.perfil"
                                    className="pl-10"
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
            <Card className="rounded-[16px] shadow-sm border-slate-100 overflow-hidden bg-white">
                <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-5 text-orange-500">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Horário de Funcionamento</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {DAY_ORDER.map((day) => (
                        <div key={day} className="flex items-center gap-4 p-4 border rounded-lg">
                            <div className="flex items-center gap-2 min-w-[140px]">
                                <Switch
                                    checked={schedule[day].active}
                                    onCheckedChange={(checked) => setValue(`schedule.${day}.active`, checked)}
                                />
                                <Label className="font-medium">{DAY_LABELS[day]}</Label>
                            </div>
                            <div className="flex items-center gap-2 flex-1">
                                <Input
                                    type="time"
                                    {...register(`schedule.${day}.start`)}
                                    disabled={!schedule[day].active}
                                    className="w-32"
                                />
                                <span className="text-muted-foreground">até</span>
                                <Input
                                    type="time"
                                    {...register(`schedule.${day}.end`)}
                                    disabled={!schedule[day].active}
                                    className="w-32"
                                />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
                <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-orange-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
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
            </div>
        </form>
    );
}
