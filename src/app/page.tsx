import { Navbar } from '@/components/marketing/Navbar';
import { Hero } from '@/components/marketing/Hero';
import { SocialProof } from '@/components/marketing/SocialProof';
import { ProblemStatement } from '@/components/marketing/ProblemStatement';
import { PlatformOverview } from '@/components/marketing/PlatformOverview';
import { FeaturesGrid } from '@/components/marketing/FeaturesGrid';
import { Benefits } from '@/components/marketing/Benefits';
import { Audiences } from '@/components/marketing/Audiences';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { Guarantee } from '@/components/marketing/Guarantee';
import { Pricing } from '@/components/marketing/Pricing';
import { FAQ } from '@/components/marketing/FAQ';
import { BannerCTA } from '@/components/marketing/BannerCTA';
import { Footer } from '@/components/marketing/Footer';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from('saas_plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  return (
    <div className="flex min-h-screen flex-col bg-white text-bee-midnight font-sans overflow-hidden">
      <Navbar />

      <main className="flex-1">
        <Hero />
        <SocialProof />
        <ProblemStatement />
        <PlatformOverview />
        <FeaturesGrid />
        <Benefits />
        <Audiences />
        <HowItWorks />
        <Guarantee />
        <Pricing plans={plans || []} />
        <FAQ />
        <BannerCTA />
      </main>

      <Footer />
    </div>
  );
}
