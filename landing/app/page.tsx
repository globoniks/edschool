import Header from "@/components/sections/Header";
import HeroSection from "@/components/sections/HeroSection";
import ProblemSection from "@/components/sections/ProblemSection";
import SolutionSection from "@/components/sections/SolutionSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import RoleDemoSection from "@/components/sections/RoleDemoSection";
import WhyChooseUsSection from "@/components/sections/WhyChooseUsSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import PricingSection from "@/components/sections/PricingSection";
import TrustSection from "@/components/sections/TrustSection";
import FinalCTASection from "@/components/sections/FinalCTASection";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <div id="features">
        <FeaturesSection />
      </div>
      <RoleDemoSection />
      <WhyChooseUsSection />
      <HowItWorksSection />
      <div id="pricing">
        <PricingSection />
      </div>
      <TrustSection />
      <div id="contact">
        <FinalCTASection />
      </div>
      <Footer />
    </main>
  );
}

