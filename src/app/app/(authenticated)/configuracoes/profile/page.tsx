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
                className: 'bg-[#FFBF00] text-white border-none',
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
                className: 'bg-[#FFBF00] text-white border-none',
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
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex justify-center">
                <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                        <AvatarImage src={avatarUrl} alt={fullName} />
                        <AvatarFallback className="text-3xl bg-primary/10 text-primary">
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
                        variant="outline"
                        className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                        disabled={isSaving}
                    >
                        <Upload className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Profile Form Card */}
            <Card className="rounded-[16px] shadow-sm border-slate-100 overflow-hidden bg-white">
                <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-5 text-orange-500">
                            <UserCog className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Perfil Público</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Public Profile Toggle */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                            <Label htmlFor="show-profile" className="font-medium">Mostrar perfil público?</Label>
                            <p className="text-sm text-muted-foreground">
                                Se desativado, seu perfil não aparecerá para os alunos.
                            </p>
                        </div>
                        <Switch
                            id="show-profile"
                            checked={showPublicProfile}
                            onCheckedChange={setShowPublicProfile}
                        />
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nome Completo *</Label>
                            <Input
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Seu nome completo"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="professionalTitle">Cargo / Título Profissional</Label>
                            <Input
                                id="professionalTitle"
                                value={professionalTitle}
                                onChange={(e) => setProfessionalTitle(e.target.value)}
                                placeholder="Ex: Personal Trainer, Nutricionista"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio / Descrição</Label>
                        <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Conte um pouco sobre você e sua experiência profissional..."
                            className="min-h-[120px] resize-none"
                        />
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={handleSave}
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
                </CardContent>
            </Card>

            {/* Notification Preferences Card */}
            <Card className="rounded-[16px] shadow-sm border-slate-100 overflow-hidden bg-white">
                <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-5 text-orange-500">
                            <Bell className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Preferências de Notificação</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                            <Label htmlFor="email-notifications" className="font-medium">Notificações por E-mail</Label>
                            <p className="text-sm text-muted-foreground">
                                Receber resumos e alertas via e-mail
                            </p>
                        </div>
                        <Switch
                            id="email-notifications"
                            checked={emailNotifications}
                            onCheckedChange={setEmailNotifications}
                        />
                    </div>

                    {/* WhatsApp Notifications */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                            <Label htmlFor="whatsapp-notifications" className="font-medium">Notificações por WhatsApp</Label>
                            <p className="text-sm text-muted-foreground">
                                Receber avisos urgentes via WhatsApp
                            </p>
                        </div>
                        <Switch
                            id="whatsapp-notifications"
                            checked={whatsappNotifications}
                            onCheckedChange={setWhatsappNotifications}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
