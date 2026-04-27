'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Save, Upload, UserCog, Bell, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
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
    const [phone, setPhone] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [whatsappNotifications, setWhatsappNotifications] = useState(false);

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        async function fetchProfile() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                setUserId(user.id);
                setUserEmail(user.email || '');

                const { data: userData, error } = await (supabase as any)
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) console.error('Error fetching user data:', error);

                const dbAvatar = userData?.avatar_url;
                const authAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
                const finalAvatar = dbAvatar || authAvatar || '';

                if (userData) {
                    setFullName(userData.full_name || '');
                    setProfessionalTitle(userData.job_title || '');
                    setBio(userData.bio || '');
                    setPhone(userData.phone || '');
                    setAvatarUrl(finalAvatar);
                    setShowPublicProfile(userData.show_public_profile ?? true);
                } else {
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

    const formatPhone = (value: string) => {
        const clean = value.replace(/\D/g, '').slice(0, 11);
        if (clean.length <= 2) return clean;
        if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
        if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
        return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userId) return;

        setIsSaving(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            const { error: updateError } = await (supabase as any)
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', userId);

            if (updateError) throw updateError;

            setAvatarUrl(publicUrl);
            toast({ title: 'Foto Atualizada!', className: 'bg-bee-amber text-bee-midnight border-none font-bold' });
            router.refresh();
            window.dispatchEvent(new CustomEvent('userProfileUpdated'));
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao fazer upload', description: error.message });
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
                    bio,
                    phone: phone || null,
                    show_public_profile: showPublicProfile,
                })
                .eq('id', userId);

            if (error) throw error;

            toast({ title: 'Perfil Atualizado!', description: 'Suas informações foram salvas.', className: 'bg-bee-amber text-bee-midnight border-none font-bold' });
            router.refresh();
            window.dispatchEvent(new CustomEvent('userProfileUpdated'));
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        setPasswordError('');

        if (!newPassword || !confirmPassword) {
            setPasswordError('Preencha a nova senha e a confirmação.');
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('A confirmação não coincide com a nova senha.');
            return;
        }

        setIsSavingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            toast({ title: 'Senha Alterada!', description: 'Sua senha de acesso foi atualizada com sucesso.', className: 'bg-bee-amber text-bee-midnight border-none font-bold' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setPasswordError(error.message || 'Erro ao alterar senha. Tente novamente.');
        } finally {
            setIsSavingPassword(false);
        }
    };

    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const passwordStrength = (pwd: string) => {
        if (!pwd) return null;
        if (pwd.length < 6) return { label: 'Muito curta', color: 'bg-red-400', width: 'w-1/4' };
        if (pwd.length < 8) return { label: 'Fraca', color: 'bg-orange-400', width: 'w-2/4' };
        if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return { label: 'Forte', color: 'bg-green-500', width: 'w-full' };
        return { label: 'Moderada', color: 'bg-yellow-400', width: 'w-3/4' };
    };

    const strength = passwordStrength(newPassword);

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
                        {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : <><Save className="mr-2 h-4 w-4" />Salvar Alterações</>}
                    </Button>
                }
            />

            {/* Avatar */}
            <div className="flex justify-center">
                <div className="relative group">
                    <Avatar className="h-40 w-40 border-[6px] border-white shadow-2xl transition-transform group-hover:scale-[1.02]">
                        <AvatarImage src={avatarUrl} alt={fullName} />
                        <AvatarFallback className="text-4xl bg-bee-amber/10 text-bee-amber font-display font-bold">
                            {getInitials(fullName)}
                        </AvatarFallback>
                    </Avatar>
                    <input type="file" id="avatar-upload" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
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

            {/* Dados de Acesso (read-only email) */}
            <Card className="rounded-[2.5rem] shadow-sm border-slate-100 overflow-hidden bg-white">
                <CardHeader className="py-6 px-8 border-b border-slate-50 flex flex-row items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
                        <Mail className="h-5 w-5 text-bee-amber" />
                        <CardTitle className="text-xl font-bold text-deep-midnight tracking-tight font-display">Dados de Acesso</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">E-mail de Login</Label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                            <Input
                                value={userEmail}
                                readOnly
                                className="rounded-2xl bg-slate-50 border-slate-100 h-12 pl-10 font-medium text-slate-500 cursor-default select-all focus:ring-0 focus:border-slate-100"
                            />
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium ml-1">
                            O e-mail de login não pode ser alterado por aqui. Entre em contato com o suporte se necessário.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Perfil Público */}
            <Card className="rounded-[2.5rem] shadow-sm border-slate-100 overflow-hidden bg-white">
                <CardHeader className="py-6 px-8 border-b border-slate-50 flex flex-row items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
                        <UserCog className="h-5 w-5 text-bee-amber" />
                        <CardTitle className="text-xl font-bold text-deep-midnight tracking-tight font-display">Perfil Público</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
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
                        <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Telefone Pessoal</Label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(formatPhone(e.target.value))}
                                placeholder="(00) 00000-0000"
                                maxLength={15}
                                className="rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-1 focus:ring-bee-amber/20 transition-all h-12 pl-10 pr-4 font-medium"
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

            {/* Alterar Senha */}
            <Card className="rounded-[2.5rem] shadow-sm border-slate-100 overflow-hidden bg-white">
                <CardHeader className="py-6 px-8 border-b border-slate-50 flex flex-row items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
                        <Lock className="h-5 w-5 text-bee-amber" />
                        <CardTitle className="text-xl font-bold text-deep-midnight tracking-tight font-display">Alterar Senha</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <p className="text-sm text-slate-500 font-medium">
                        A senha alterada aqui é a mesma usada para fazer login no sistema.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* New Password */}
                        <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Nova Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                <Input
                                    id="newPassword"
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    className="rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-1 focus:ring-bee-amber/20 transition-all h-12 pl-10 pr-12 font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(v => !v)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {/* Password strength indicator */}
                            {newPassword && strength && (
                                <div className="space-y-1 mt-1">
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                                    </div>
                                    <p className={`text-[11px] font-bold ml-1 ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Confirmar Nova Senha</Label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repita a nova senha"
                                    className={`rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-1 focus:ring-bee-amber/20 transition-all h-12 pl-10 pr-12 font-medium ${confirmPassword && newPassword !== confirmPassword ? 'border-red-300' : confirmPassword && newPassword === confirmPassword ? 'border-green-300' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(v => !v)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {confirmPassword && newPassword !== confirmPassword && (
                                <p className="text-[11px] font-bold text-red-500 ml-1">As senhas não coincidem.</p>
                            )}
                            {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
                                <p className="text-[11px] font-bold text-green-600 ml-1">Senhas coincidem.</p>
                            )}
                        </div>
                    </div>

                    {passwordError && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                            <p className="text-sm font-bold text-red-600">{passwordError}</p>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button
                            onClick={handleChangePassword}
                            disabled={isSavingPassword || !newPassword || !confirmPassword}
                            className="bg-bee-midnight hover:bg-slate-800 text-white font-bold h-11 px-8 rounded-full shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] text-[13px] uppercase tracking-wider"
                        >
                            {isSavingPassword ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Alterando...</> : <><Lock className="mr-2 h-4 w-4" />Alterar Senha</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Preferências de Alerta */}
            <Card className="rounded-[2.5rem] shadow-sm border-slate-100 overflow-hidden bg-white">
                <CardHeader className="py-6 px-8 border-b border-slate-50 flex flex-row items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
                        <Bell className="h-5 w-5 text-bee-amber" />
                        <CardTitle className="text-xl font-bold text-deep-midnight tracking-tight font-display">Preferências de Alerta</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                    <div className="flex items-center justify-between p-5 bg-slate-50/80 rounded-[1.5rem] border border-slate-100">
                        <div className="space-y-1">
                            <Label htmlFor="email-notifications" className="font-bold text-deep-midnight">Notificações por E-mail</Label>
                            <p className="text-xs text-slate-500 font-medium">Receber resumos semanais e alertas críticos via e-mail.</p>
                        </div>
                        <Switch
                            id="email-notifications"
                            checked={emailNotifications}
                            onCheckedChange={setEmailNotifications}
                            className="bg-slate-200 data-[state=checked]:bg-bee-amber"
                        />
                    </div>
                    <div className="flex items-center justify-between p-5 bg-slate-50/80 rounded-[1.5rem] border border-slate-100">
                        <div className="space-y-1">
                            <Label htmlFor="whatsapp-notifications" className="font-bold text-deep-midnight">Notificações por WhatsApp</Label>
                            <p className="text-xs text-slate-500 font-medium">Receber lembretes de aula e avisos urgentes via WhatsApp.</p>
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
