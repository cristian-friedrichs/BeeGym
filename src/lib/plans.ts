export type Plan = {
    id: string;
    name: string;
    price: string;
    scheduleType: 'fixed' | 'flexible' | 'open';
    classesPerWeek?: number;
    color: string;
    gradient: string;
}

export const plans: Plan[] = [
    { id: "pro", name: "Plano Pro", price: "R$ 120,00", scheduleType: 'flexible', classesPerWeek: 5, color: '#8B5CF6', gradient: 'linear-gradient(110deg, #8B5CF64D 0%, #A78BFA80 100%)' },
    { id: "basic", name: "Plano Básico", price: "R$ 80,00", scheduleType: 'fixed', classesPerWeek: 2, color: '#3B82F6', gradient: 'linear-gradient(110deg, #3B82F64D 0%, #60A5FA80 100%)' },
    { id: "premium", name: "Plano Premium", price: "R$ 150,00", scheduleType: 'fixed', classesPerWeek: 3, color: '#10B981', gradient: 'linear-gradient(110deg, #10B9814D 0%, #34D39980 100%)' },
    { id: "gold", name: "Gold Plan", price: "R$ 150,00", scheduleType: 'open', color: '#F59E0B', gradient: 'linear-gradient(110deg, #F59E0B4D 0%, #FBBF2480 100%)' },
    { id: "silver", name: "Silver Plan", price: "R$ 120,00", scheduleType: 'flexible', classesPerWeek: 3, color: '#6B7280', gradient: 'linear-gradient(110deg, #6B72804D 0%, #9CA3AF80 100%)' },
];

export const planHistory = [
    { date: "12/01/2023", action: "Início do Plano", details: "Plano Pro" },
    { date: "10/02/2024", action: "Aplicação de Desconto", details: "10%" },
];

export const initialSystemPlans = [
    {
        id: 'pro',
        name: 'Plano Pro',
        code: 'PRO_MONTHLY',
        type: 'assinatura',
        price: 120.00,
        billingCycle: 'monthly',
        validityDays: null,
        sessionsIncluded: null,
        unitScope: 'global',
        units: [],
        status: 'active',
        color: '#8B5CF6',
        icon: 'Bookmark',
    },
    {
        id: 'basic',
        name: 'Plano Básico',
        code: 'BASIC_MONTHLY',
        type: 'assinatura',
        price: 80.00,
        billingCycle: 'monthly',
        validityDays: 30,
        sessionsIncluded: 8,
        unitScope: 'specific',
        units: ['unit-1'],
        status: 'active',
        color: '#3B82F6',
        icon: 'Bookmark',
    },
    {
        id: 'gold',
        name: 'Gold Plan',
        code: 'GOLD_PLAN',
        type: 'ilimitado',
        price: 150.00,
        billingCycle: 'monthly',
        validityDays: null,
        sessionsIncluded: null,
        unitScope: 'specific',
        units: ['unit-1', 'unit-2'],
        status: 'active',
        color: '#F59E0B',
        icon: 'Star',
    }
];
