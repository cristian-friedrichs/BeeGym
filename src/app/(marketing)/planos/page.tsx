import { Pricing } from '@/components/marketing/Pricing';
import { createClient } from '@/lib/supabase/server';
import { CheckCircle2, Minus } from 'lucide-react';
import { MODULE_TO_MARKETING } from '@/lib/marketing/plan-utils';

export default async function PlanosPage(props: { 
    searchParams: Promise<{ update?: string | string[] | undefined }> 
}) {
    const searchParams = await props.searchParams;
    const update = searchParams?.update;

    const supabase = await createClient();
    const { data: plans } = await supabase
        .from('saas_plans')
        .select('*')
        .eq('active', true)
        .order('price', { ascending: true });

    const displayPlans = plans || [];

    return (
        <div className="pt-40 pb-24">
            <div className="container mx-auto px-6 md:px-12">
                <div className="text-center max-w-4xl mx-auto mb-16">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-bee-amber mb-5">Planos</p>
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight mb-8">
                        Preços simples e <br />
                        <span className="text-bee-amber italic font-medium inline-block md:whitespace-nowrap">transparentes.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Escolha o plano que melhor se adapta ao momento do seu negócio. Sem taxas escondidas, sem surpresas no final do mês.
                    </p>
                </div>

                <Pricing plans={displayPlans} />

                {/* Comparison Table */}
                <div className="mt-28 max-w-6xl mx-auto">
                    <h2 className="text-3xl font-display font-bold text-white text-center mb-16">Compare os planos</h2>
                    <div className="overflow-x-auto border border-white/10">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-white/5">
                                    <th className="p-6 text-sm font-bold uppercase tracking-widest text-slate-500 w-1/3 border-b border-white/10">Funcionalidade</th>
                                    {displayPlans.map(plan => (
                                        <th key={plan.id} className="p-6 text-sm font-bold uppercase tracking-widest text-white text-center border-b border-white/10">
                                            {plan.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {Object.entries(MODULE_TO_MARKETING).map(([key, feature], i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-6 font-medium text-slate-300 border-r border-white/5">
                                            <div className="flex flex-col">
                                                <span className="flex items-center gap-2">
                                                    {feature.name}
                                                    {feature.upcoming && (
                                                        <span className="text-[8px] font-black text-bee-amber uppercase tracking-tighter bg-bee-amber/10 px-1.5 py-0.5 border border-bee-amber/20">Breve</span>
                                                    )}
                                                </span>
                                                <span className="text-[10px] text-slate-600 font-normal">{feature.description}</span>
                                            </div>
                                        </td>
                                        {displayPlans.map(plan => {
                                            const allowedFeatures = (plan as any).allowed_features as string[] || [];
                                            const isIncluded = allowedFeatures.includes(key);

                                            // Caso especial para limite de alunos
                                            if (key === 'alunos') {
                                                const limit = (plan as any).max_students;
                                                return (
                                                    <td key={plan.id} className="p-6 text-center">
                                                        <span className="text-sm font-bold text-white">
                                                            {limit ? `Até ${limit}` : 'Ilimitado'}
                                                        </span>
                                                    </td>
                                                );
                                            }

                                            return (
                                                <td key={plan.id} className="p-6 text-center">
                                                    {isIncluded ? (
                                                        <CheckCircle2 className="w-5 h-5 text-bee-amber mx-auto" />
                                                    ) : (
                                                        <Minus className="w-5 h-5 text-slate-700 mx-auto" />
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
