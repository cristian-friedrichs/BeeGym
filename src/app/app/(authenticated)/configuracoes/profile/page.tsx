'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Save, Upload, UserCog, Bell } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';

export default function ProfilePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showPublicProfile, setShowPublicProfile] = useState(true);
    const [fullName, setFullName] = useState('');
    const [professionalTitle, setProfessionalTitle] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [whatsappNotifications, setWhatsappNotifications] = useState(false);
    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        async function fetchProfile() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                setUserId(user.id);

                // Get user profile data from public.profiles table
                const { data: userData, error } = await (supabase as any)
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error('Error fetching user data:', error);
                }

                // Priority fallback for avatar: db → auth metadata → null
                const dbAvatar = userData?.avatar_url;
                const authAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
                const finalAvatar = dbAvatar || authAvatar || '';

                if (userData) {
                    setFullName(userData.full_name || '');
                    setProfessionalTitle(userData.job_title || '');
                    setBio(userData.bio || '');
                    setAvatarUrl(finalAvatar);
                    setShowPublicProfile(userData.show_public_profile ?? true);
                } else {
                    // Fallback if no user data in table
                    setFullName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
                    setAvatarUrl(authAvatar || '');
                }
            } catch (err) {
                console.error('Error loading profile:', err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchProfile();
    }, []);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userId) return;

        setIsSaving(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to avatars bucket
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update profiles table
            const { error: updateError } = await (supabase as any)
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', userId);

            if (updateError) throw updateError;

            setAvatarUrl(publicUrl);

            toast({
                title: 'Foto Atualizada!',
                description: 'Sua foto de perfil foi salva com sucesso.',
                className: 'bg-bee-amber text-bee-midnight border-none font-bold',
            });
            router.refresh();

            // Force header to refresh
            window.dispatchEvent(new CustomEvent('userProfileUpdated'));

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao fazer upload',
                description: error.message || 'Tente novamente mais tarde.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async () => {
        if (!userId) return;
        setIsSaving(true);

        try {
            const { error } = await (supabase as any)
                .from('profiles')
                .update({
                    full_name: fullName,
                    job_title: professionalTitle,
                    bio: bio,
                    show_public_profile: showPublicProfile,
                })
                .eq('id', userId);

            if (error) throw error;

            toast({
                title: 'Perfil Atualizado!',
                description: 'Suas informações foram salvas com sucesso.',
                className: 'bg-bee-amber text-bee-midnight border-none font-bold',
            });
            router.refresh();

            // Force header to refresh by dispatching custom event
            window.dispatchEvent(new CustomEvent('userProfileUpdated'));

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao salvar',
                description: error.message || 'Tente novamente mais tarde.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-bee-amber" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            <SectionHeader
                title="Meu Perfil"
                subtitle="Gerencie suas informações pessoais e de acesso"
                action={
                    <Button
                        onClick={handleSave}
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

            {/* Avatar Section */}
            <div className="flex justify-center">
                <div className="relative group">
                    <Avatar className="h-40 w-40 border-[6px] border-white shadow-2xl transition-transform group-hover:scale-[1.02]">
                        <AvatarImage src={avatarUrl} alt={fullName} />
                        <AvatarFallback className="text-4xl bg-bee-amber/10 text-bee-amber font-display font-bold">
                            {getInitials(fullName)}
                        </AvatarFallback>
                    </Avatar>
                    <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                    />
                    <Button
                        size="icon"
                        className="absolute bottom-2 right-2 rounded-full h-10 w-10 bg-bee-amber hover:bg-amber-500 text-bee-midnight shadow-lg border-2 border-white transition-all hover:scale-110 active:scale-90"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                        disabled={isSaving}
                    >
                        <Upload className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Profile Form Card */}
            <Card className="rounded-[2.5rem] shadow-sm border-slate-100 overflow-hidden bg-white">
                <CardHeader className="py-6 px-8 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 text-bee-amber">
                                <UserCog className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-xl font-bold text-deep-midnight tracking-tight font-display">Perfil Público</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    {/* Public Profile Toggle */}
                    <div className="flex items-center justify-between p-6 bg-slate-50/80 rounded-[1.5rem] border border-slate-100 shadow-inner">
                        <div className="space-y-1">
                            <Label htmlFor="show-profile" className="font-bold text-deep-midnight">Mostrar perfil público?</Label>
                            <p className="text-xs text-slate-500 font-medium">
                                Se desativado, seu perfil não aparecerá para os alunos e outros membros.
                            </p>
                        </div>
                        <Switch
                            id="show-profile"
                            checked={showPublicProfile}
                            onCheckedChange={setShowPublicProfile}
                            className="bg-slate-200 data-[state=checked]:bg-bee-amber"
                        />
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Nome Completo *</Label>
                            <Input
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Seu nome completo"
                                className="rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-1 focus:ring-bee-amber/20 transition-all h-12 px-4 font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="professionalTitle" className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Cargo / Especialidade</Label>
                            <Input
                                id="professionalTitle"
                                value={professionalTitle}
                                onChange={(e) => setProfessionalTitle(e.target.value)}
                                placeholder="Ex: Personal Trainer, Nutricionista"
                                className="rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-1 focus:ring-bee-amber/20 transition-all h-12 px-4 font-medium"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio" className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Bio / Mini Currículo</Label>
                        <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Conte um pouco sobre sua formação e experiência..."
                            className="min-h-[150px] resize-none rounded-[1.5rem] bg-slate-50 border-slate-100 focus:bg-white focus:ring-1 focus:ring-bee-amber/20 transition-all p-5 font-medium leading-relaxed"
                        />
                    </div>

                </CardContent>
            </Card>

            {/* Notification Preferences Card */}
            <Card className="rounded-[2.5rem] shadow-sm border-slate-100 overflow-hidden bg-white">
                <CardHeader className="py-6 px-8 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 text-bee-amber">
                                <Bell className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-xl font-bold text-deep-midnight tracking-tight font-display">Preferências de Alerta</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between p-5 bg-slate-50/80 rounded-[1.5rem] border border-slate-100">
                        <div className="space-y-1">
                            <Label htmlFor="email-notifications" className="font-bold text-deep-midnight">Notificações por E-mail</Label>
                            <p className="text-xs text-slate-500 font-medium">
                                Receber resumos semanais e alertas críticos via e-mail.
                            </p>
                        </div>
                        <Switch
                            id="email-notifications"
                            checked={emailNotifications}
                            onCheckedChange={setEmailNotifications}
                            className="bg-slate-200 data-[state=checked]:bg-bee-amber"
                        />
                    </div>

                    {/* WhatsApp Notifications */}
                    <div className="flex items-center justify-between p-5 bg-slate-50/80 rounded-[1.5rem] border border-slate-100">
                        <div className="space-y-1">
                            <Label htmlFor="whatsapp-notifications" className="font-bold text-deep-midnight">Notificações por WhatsApp</Label>
                            <p className="text-xs text-slate-500 font-medium">
                                Receber lembretes de aula e avisos urgentes via WhatsApp.
                            </p>
                        </div>
                        <Switch
                            id="whatsapp-notifications"
                            checked={whatsappNotifications}
                            onCheckedChange={setWhatsappNotifications}
                            className="bg-slate-200 data-[state=checked]:bg-bee-amber"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
