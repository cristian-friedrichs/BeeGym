import {
  Bike,
  Dumbbell,
  Flame,
  Waves,
  Heart,
  Award,
  Swords,
  Shield,
  Target,
  Trophy,
  Activity,
  Zap,
  Leaf,
  PersonStanding,
  Sparkles,
  Brain,
  Wind,
  Smile,
  Footprints,
  MoreHorizontal,
  HeartPulse,
  Flower2
} from 'lucide-react';
import { Volleyball } from 'lucide-react'; // Ensure this exists or use fallback

// --- NEW IMPORTS/TYPES (For Supabase Integration) ---
export type ClassType = {
  value: string;
  label: string;
  icon: any;
  iconName: string; // DynamicIcon support
  color: string;
};

export const CLASS_TYPES: ClassType[] = [
  { value: 'musculacao', label: 'Musculação', icon: Dumbbell, iconName: 'Dumbbell', color: '#F59E0B' },
  { value: 'hiit', label: 'HIIT', icon: Flame, iconName: 'Flame', color: '#000000' },
  { value: 'yoga', label: 'Yoga', icon: Wind, iconName: 'Wind', color: '#10B981' },
  { value: 'pilates', label: 'Pilates', icon: Sparkles, iconName: 'Sparkles', color: '#8B5CF6' },
  { value: 'crossfit', label: 'Crossfit', icon: Zap, iconName: 'Zap', color: '#EF4444' },
  { value: 'spinning', label: 'Spinning', icon: Bike, iconName: 'Bike', color: '#3B82F6' },
  { value: 'funcional', label: 'Funcional', icon: Target, iconName: 'Target', color: '#EC4899' },
  { value: 'natacao', label: 'Natação', icon: Waves, iconName: 'Waves', color: '#06B6D4' },
  { value: 'boxe', label: 'Boxe', icon: Swords, iconName: 'Swords', color: '#991B1B' },
  { value: 'corrida', label: 'Corrida', icon: PersonStanding, iconName: 'PersonStanding', color: '#F97316' },
  { value: 'danca', label: 'Dança', icon: Smile, iconName: 'Smile', color: '#EC4899' },
  { value: 'volei', label: 'Vôlei', icon: Volleyball || Activity, iconName: 'Volleyball', color: '#3B82F6' },
  { value: 'futebol', label: 'Futebol', icon: Footprints, iconName: 'Footprints', color: '#10B981' },
  { value: 'basquete', label: 'Basquete', icon: Trophy, iconName: 'Trophy', color: '#F59E0B' },
  { value: 'cardio', label: 'Cardio', icon: Heart, iconName: 'Heart', color: '#EF4444' },
  { value: 'fisioterapia', label: 'Fisioterapia', icon: Activity, iconName: 'Activity', color: '#14B8A6' },
  { value: 'outro', label: 'Outro', icon: MoreHorizontal, iconName: 'MoreHorizontal', color: '#6B7280' },
];

export const WEEKDAYS = [
  { value: 1, short: 'Seg', full: 'Segunda' },
  { value: 2, short: 'Ter', full: 'Terça' },
  { value: 3, short: 'Qua', full: 'Quarta' },
  { value: 4, short: 'Qui', full: 'Quinta' },
  { value: 5, short: 'Sex', full: 'Sexta' },
  { value: 6, short: 'Sáb', full: 'Sábado' },
  { value: 0, short: 'Dom', full: 'Domingo' },
];

export const DURATION_OPTIONS = [
  { value: '30', label: '30 minutos' },
  { value: '60', label: '1 hora' },
  { value: '90', label: '1 hora e 30 minutos' },
  { value: '120', label: '2 horas' },
];

export const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
];

export function getClassType(typeValue: string | null, title?: string) {
  // 1. Try direct match by value
  if (typeValue) {
    const match = CLASS_TYPES.find(t => t.value === typeValue.toLowerCase());
    if (match) return match;
  }

  // 2. Try fuzzy match by title (if provided)
  if (title) {
    const lowerTitle = title.toLowerCase();
    const match = CLASS_TYPES.find(t => lowerTitle.includes(t.label.toLowerCase()) || lowerTitle.includes(t.value.toLowerCase()));
    if (match) return match;

    // Specific keywords mapping
    if (lowerTitle.includes('power') || lowerTitle.includes('força')) return CLASS_TYPES.find(t => t.value === 'musculacao')!;
    if (lowerTitle.includes('pump')) return CLASS_TYPES.find(t => t.value === 'musculacao')!;
    if (lowerTitle.includes('fight') || lowerTitle.includes('combat')) return CLASS_TYPES.find(t => t.value === 'boxe')!;
    if (lowerTitle.includes('zumba') || lowerTitle.includes('ritmos')) return CLASS_TYPES.find(t => t.value === 'danca')!;
    if (lowerTitle.includes('treino') || lowerTitle.includes('class')) return CLASS_TYPES.find(t => t.value === 'funcional')!;
  }

  // 3. Fallback to 'funcional' (Target icon) instead of 'outro' (...) for better UX in a gym context
  // unless explicitly 'outro'
  if (typeValue === 'outro') return CLASS_TYPES.find(t => t.value === 'outro')!;

  return CLASS_TYPES.find(t => t.value === 'funcional') || CLASS_TYPES[0];
}

// --- LEGACY EXPORTS (Restored for backward compatibility with CalendarPage) ---

export type RecurringClass = {
  id: number;
  name: string;
  instructor: string;
  location: string;
  icon: string;
  color: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  daysOfWeek: string[]; // 0 for Sunday, 1 for Monday, etc.
  time: string; // HH:mm
  duration: number; // in minutes
  capacity?: number;
  status: 'active' | 'inactive';
  unitId: string;
}

export const iconCategories = {
  'Atividades Físicas': [
    { value: 'weights', label: 'Musculação', icon: Dumbbell },
    { value: 'spinning', label: 'Spinning', icon: Bike },
    { value: 'wod', label: 'Crossfit/WOD', icon: Flame },
    { value: 'cardio', label: 'Cardio', icon: HeartPulse },
    { value: 'swimming', label: 'Natação/Hidro', icon: Waves },
    { value: 'functional', label: 'Funcional', icon: Activity },
    { value: 'hiit', label: 'HIIT', icon: Zap },
    { value: 'martial-arts', label: 'Lutas', icon: Swords },
  ],
  'Mente & Corpo': [
    { value: 'yoga', label: 'Yoga', icon: Flower2 },
    { value: 'pilates', label: 'Pilates', icon: PersonStanding },
    { value: 'meditation', label: 'Meditação', icon: Brain },
    { value: 'stretching', label: 'Alongamento', icon: Wind },
    { value: 'wellness', label: 'Bem-estar', icon: Leaf },
  ],
  'Metas & Conquistas': [
    { value: 'award', label: 'Prêmio', icon: Award },
    { value: 'shield', label: 'Defesa', icon: Shield },
    { value: 'target', label: 'Foco/Meta', icon: Target },
    { value: 'trophy', label: 'Troféu', icon: Trophy },
    { value: 'sparkles', label: 'Destaque', icon: Sparkles },
    { value: 'health', label: 'Saúde', icon: Heart },
  ],
};

export const classIcons = Object.values(iconCategories).flat();

export function getIcon(iconName: string) {
  return classIcons.find(i => i.value === iconName)?.icon || Dumbbell;
}

export const classColors = [
  { value: 'blue', label: 'Azul', background: 'bg-blue-500', text: 'text-white' },
  { value: 'green', label: 'Verde', background: 'bg-green-500', text: 'text-white' },
  { value: 'red', label: 'Vermelho', background: 'bg-red-500', text: 'text-white' },
  { value: 'purple', label: 'Roxo', background: 'bg-purple-500', text: 'text-white' },
  { value: 'teal', label: 'Verde-azulado', background: 'bg-teal-500', text: 'text-white' },
  { value: 'orange', label: 'Laranja', background: 'bg-orange-500', text: 'text-white' },
  { value: 'primary', label: 'Primária (Tema)', background: 'bg-primary', text: 'text-primary-foreground' },
];

export const classColorStyles: { [key: string]: { background: string, text: string, border: string } } = {
  blue: { background: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500' },
  green: { background: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', border: 'border-green-500' },
  red: { background: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', border: 'border-red-500' },
  purple: { background: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500' },
  teal: { background: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500' },
  orange: { background: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500' },
  primary: { background: 'bg-primary/10', text: 'text-primary', border: 'border-primary' },
};
