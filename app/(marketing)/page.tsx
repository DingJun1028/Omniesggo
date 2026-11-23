import { HeroSection } from './_sections/HeroSection';
import { StatsSection } from './_sections/StatsSection';
import { FeaturesSection } from './_sections/FeaturesSection';
import { BenefitsSection } from './_sections/BenefitsSection';
import { CtaSection } from './_sections/CtaSection';

export default function MarketingHomePage() {
  return (
    <div className="pt-16 lg:pt-20">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <BenefitsSection />
      <CtaSection />
    </div>
  );
}
