import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { StatsRibbon } from './components/StatsRibbon';
import { PortalShowcase } from './components/PortalShowcase';
import { FeaturesBento } from './components/FeaturesBento';
import { HowItWorks } from './components/HowItWorks';
import { PricingSection } from './components/PricingSection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { DemoModal } from './components/DemoModal';
import { CheckoutModal } from './components/CheckoutModal';

function App() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoSubject, setDemoSubject] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'MONTHLY' | 'ANNUAL'>('ANNUAL');

  const openDemo = (subject?: string) => {
    setDemoSubject(subject || '');
    setDemoOpen(true);
  };

  const openBuy = (plan: 'MONTHLY' | 'ANNUAL') => {
    setSelectedPlan(plan);
    setCheckoutOpen(true);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: '#f0f2f5',
        fontFamily: "'Montserrat', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <Navbar onOpenDemo={openDemo} />
      <main>
        <Hero onOpenDemo={openDemo} />
        <StatsRibbon />
        <PortalShowcase onOpenDemo={openDemo} />
        <FeaturesBento onOpenDemo={openDemo} />
        <HowItWorks />
        <PricingSection onOpenDemo={openDemo} onOpenBuy={openBuy} />
        <FaqSection />
      </main>
      <Footer onOpenDemo={openDemo} />
      <DemoModal
        isOpen={demoOpen}
        onClose={() => setDemoOpen(false)}
        initialSubject={demoSubject}
      />
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        initialPlan={selectedPlan}
      />
    </div>
  );
}

export default App;
