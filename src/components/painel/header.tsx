'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import {
  Search,
  MessageCircle,
  Bell,
  ChevronDown,
  Sun,
  Moon,
  Globe,
  Building,
  LogOut,
  UserCircle,
  Loader2,
  User,
  LifeBuoy
} from "lucide-react"
import { useState, useEffect } from "react"
import { GlobalSearch } from './global-search'
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar"
import { Button } from "../ui/button"
import { TopbarActions } from "./topbar-actions"
import { BeeGymLogo } from "@/components/ui/beegym-logo"
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'

import { useUnit } from '@/context/UnitContext';
import { cn } from '@/lib/utils';

const translations = {
  'pt-BR': {
    theme: 'Tema',
    light: 'Claro',
    dark: 'Escuro',
    system: 'Sistema',
    language: 'Idioma',
    portuguese: 'Português',
    english: 'English (US)',
    spanish: 'Español',
    myProfile: 'Meu Perfil',
    support: 'Suporte',
    logout: 'Sair',
    searchPlaceholder: 'Buscar alunos, aulas ou treinos...',
    themeChangedToast: (theme: string) => `Tema alterado para ${theme}`,
    langChangedToast: (lang: string) => `Idioma alterado para ${lang}`,
  },
  'en-US': {
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'Language',
    portuguese: 'Português',
    english: 'English (US)',
    spanish: 'Español',
    myProfile: 'My Profile',
    support: 'Support',
    logout: 'Logout',
    searchPlaceholder: 'Search students, classes, or workouts...',
    themeChangedToast: (theme: string) => `Theme changed to ${theme}`,
    langChangedToast: (lang: string) => `Language changed to ${lang}`,
  },
  'es-ES': {
    theme: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
    system: 'Sistema',
    language: 'Idioma',
    portuguese: 'Português',
    english: 'English (US)',
    spanish: 'Español',
    myProfile: 'Mi Perfil',
    support: 'Soporte',
    logout: 'Cerrar Sesión',
    searchPlaceholder: 'Buscar alumnos, clases o entrenamientos...',
    themeChangedToast: (theme: string) => `Tema cambiado a ${theme}`,
    langChangedToast: (lang: string) => `Idioma cambiado a ${lang}`,
  }
};

type Locale = keyof typeof translations;

const useTranslation = (lang: string) => {
  const localeMap: { [key: string]: Locale } = {
    'PT': 'pt-BR',
    'US': 'en-US',
    'ES': 'es-ES'
  }
  const locale = localeMap[lang] || 'pt-BR';
  return translations[locale];
}

export function Header({ className }: { className?: string }) {
  const [theme, setThemeState] = useState('system');
  const [effectiveTheme, setEffectiveTheme] = useState('light');
  const [language, setLanguage] = useState('PT');
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  const [units, setUnits] = useState<any[]>([]);
  const { currentUnitId, setCurrentUnitId } = useUnit();
  const { user: authUser, profile: authProfile } = useAuth();
  const [orgName, setOrgName] = useState<string | null>(null);

  // User Data State
  const [userProfile, setUserProfile] = useState<{
    full_name: string | null,
    avatar_url: string | null,
    email: string | null,
    business_type: string | null
  } | null>(null);

  const t = useTranslation(language);

  // Helper to get initials
  const getInitials = (name: string) => {
    if (!name) return 'BG'; // BeeGym default
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const [isSignOutLoading, setIsSignOutLoading] = useState(false);

  const syncStateFromStorage = () => {
    const storedUnits = JSON.parse(localStorage.getItem('units_data') || '[]');
    // Mock user having multiple units for testing if needed, or real flow
    setUnits(storedUnits);

    const storedUnitId = localStorage.getItem('currentUnitId');
    const availableUnitIds = storedUnits.map((u: any) => u.id);

    if (storedUnitId && availableUnitIds.includes(storedUnitId)) {
      setCurrentUnitId(storedUnitId);
    } else if (storedUnits.length > 0) {
      const defaultUnit = storedUnits.find((u: any) => u.status === 'Ativo')?.id || storedUnits[0].id;
      setCurrentUnitId(defaultUnit);
      localStorage.setItem('currentUnitId', defaultUnit);
    } else {
      setCurrentUnitId(null);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsClient(true);

    // User/profile come from AuthContext (no duplicate fetches).
    async function loadUser() {
      const user = authUser;
      const userData = authProfile;
      if (user) {
        const dbAvatar = userData?.avatar_url;
        const authAvatar = (user as any).user_metadata?.avatar_url || (user as any).user_metadata?.picture;
        const finalAvatar = dbAvatar || authAvatar || null;

        if (userData) {
          setUserProfile({
            full_name: userData.full_name || (user as any).user_metadata?.full_name || 'Usuário',
            avatar_url: finalAvatar,
            email: userData.email || user.email || '',
            business_type: (user as any).user_metadata?.business_type || null
          });

          if (userData.organization_id) {
            const { data: org } = await (supabase as any)
              .from('organizations')
              .select('name')
              .eq('id', userData.organization_id)
              .single();

            if (org) {
              setOrgName(org.name);
            }
          }
        } else {
          setUserProfile({
            full_name: (user as any).user_metadata?.full_name || 'Usuário',
            avatar_url: authAvatar,
            email: user.email || '',
            business_type: (user as any).user_metadata?.business_type || null
          });
        }
      }
    }
    // Listen for Auth Changes to ensure we load user if session restores late
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Debounce or just call loadUser? calling is fine.
        loadUser();
      }
    });

    loadUser(); // Initial try

    // Listen for profile updates from profile page
    const handleProfileUpdate = () => {
      loadUser();
    };
    window.addEventListener('userProfileUpdated', handleProfileUpdate);

    // Listen for organization updates from general settings
    const handleOrganizationUpdate = () => {
      loadUser();
    };
    window.addEventListener('organizationUpdated', handleOrganizationUpdate);

    // ... (rest of existing useEffect logic) ... 

    const storedTheme = localStorage.getItem('theme') || 'system';
    setThemeState(storedTheme);

    const storedLang = localStorage.getItem('lang') || 'PT';
    setLanguage(storedLang);

    // Dark mode removed — always force light
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');
    setEffectiveTheme('light');

    const applyTheme = (_t: string) => {
      document.documentElement.classList.remove('dark');
      setEffectiveTheme('light');
    };

    applyTheme(storedTheme);
    syncStateFromStorage();

    window.addEventListener('storage-update', syncStateFromStorage);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const stored = localStorage.getItem('theme') || 'system';
      if (stored === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      subscription.unsubscribe();
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('storage-update', syncStateFromStorage);
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
      window.removeEventListener('organizationUpdated', handleOrganizationUpdate);
    }
  }, [supabase, authUser, authProfile]);

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);

    let isDark;
    if (newTheme === 'system') {
      localStorage.removeItem('theme');
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      localStorage.setItem('theme', newTheme);
      isDark = newTheme === 'dark';
    }

    if (isDark) {
      document.documentElement.classList.add('dark');
      setEffectiveTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      setEffectiveTheme('light');
    }

    const themeLabels = { light: t.light, dark: t.dark, system: t.system };
    toast({ title: t.themeChangedToast(themeLabels[newTheme]) });
  };

  const handleLanguageChange = (lang: 'PT' | 'US' | 'ES') => {
    setLanguage(lang);
    localStorage.setItem('lang', lang);
    const langLabels = { PT: "Português", US: "English (US)", ES: "Español" };
    toast({ title: translations[lang === 'PT' ? 'pt-BR' : lang === 'US' ? 'en-US' : 'es-ES'].langChangedToast(langLabels[lang]) });
  };

  const handleUnitChange = (unitId: string) => {
    setCurrentUnitId(unitId);
    localStorage.setItem('currentUnitId', unitId);
    window.location.reload();
  };

  const handleLogout = async () => {
    setIsSignOutLoading(true);

    // Give a tiny moment for the loading UI to mount before the hard navigation begins
    setTimeout(() => {
      // Step 1: Client side sign out (non-blocking)
      supabase.auth.signOut();

      // Step 2: Hard redirect to our server-side signout route
      // This is the most robust way as it forces a clean state via a GET request
      window.location.href = '/auth/signout';
    }, 300);
  };

  const ThemeIcon = effectiveTheme === 'dark' ? Moon : Sun;
  const selectedUnit = units.find(u => u.id === currentUnitId);

  // If we have single unit, we display just text/badge. If multiple, dropdown.
  // Actually, wait - let's default to "Main Organisation" if no units are technically "created" in local storage but we know one exists in DB (implied). 
  // For now, let's assume we use the user's name if no unit found? Or "Minha Unidade".
  // Logic to determine display name for unit
  let displayUnitName = 'Unidade';

  if (userProfile?.business_type === 'personal') {
    displayUnitName = userProfile.full_name ? `Personal ${userProfile.full_name}` : 'Personal';
  } else {
    // For non-personal business types, show organization name
    displayUnitName = orgName || selectedUnit?.name || 'Minha Unidade';
  }

  const hasMultipleUnits = units.length > 1;

  // Always render the header structure to prevent "layout shift" or "missing topbar"
  // Skeleton state can be handled within the inner components if needed.

  return (
    <header className={cn(
      "bg-white border-b border-[#E2E8F0] px-6 h-16 flex items-center justify-between shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors duration-200",
      className
    )}>
      {/* Search — full width on mobile, max-w-md on desktop */}
      <div className="flex-1 md:flex-none w-full max-w-md">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-1 md:gap-2">

        {/* Org name — read-only, no unit switcher (single-unit MVP) */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full text-slate-600 border border-slate-200">
          <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="text-xs font-bold max-w-[120px] truncate">{displayUnitName}</span>
        </div>


        <TopbarActions />
        <div className="h-8 w-px bg-border mx-1 hidden sm:block"></div>
        {mounted && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer">
                <Avatar className="h-9 w-9 border-2 border-background shadow-sm ring-1 ring-slate-100">
                  <AvatarImage src={userProfile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-orange-100 text-bee-amber font-bold font-sans">
                    {getInitials(userProfile?.full_name || '')}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-deep-midnight leading-tight font-sans">
                    {userProfile?.full_name ? `Olá, ${userProfile.full_name.split(' ')[0]}` : <Loader2 className="h-3 w-3 animate-spin" />}
                  </p>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider font-sans">Gestor</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="flex items-center justify-start gap-2 p-2 sm:hidden">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{userProfile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{userProfile?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator className="sm:hidden" />
              <DropdownMenuItem asChild><Link href="/app/configuracoes/profile" className="cursor-pointer flex items-center gap-2"><User className="h-4 w-4" />{t.myProfile}</Link></DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/app/configuracoes/suporte" className="cursor-pointer flex items-center gap-2">
                  <LifeBuoy className="h-4 w-4" />
                  {t.support}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive cursor-pointer group">
                <LogOut className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                <span>{t.logout}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {isSignOutLoading && (
          <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-bee-amber/20 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-12 h-12 border-4 border-bee-amber border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-sm font-bold text-deep-midnight animate-pulse uppercase tracking-widest">Saindo...</p>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
