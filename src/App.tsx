import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';

import { SolarpunkAtmosphere } from './components/SolarpunkAtmosphere';
import { LandingHeader } from './components/LandingHeader';
import { Hero } from './components/Hero';
import { Productivity } from './components/Productivity';
import { LassoStage } from './components/LassoStage';
import { DictateStage } from './components/DictateStage';
import { ScheduleStage } from './components/ScheduleStage';
import { YouTubeStage } from './components/YouTubeStage';
import { IslandSection } from './components/IslandSection';
import { PersonaSection } from './components/PersonaSection';
import { SpeedSection } from './components/SpeedSection';
import { EditionsSection } from './components/EditionsSection';
import { PriceSection } from './components/PriceSection';
import { KeySection } from './components/KeySection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { UnavailableGate } from './components/UnavailableGate';

import { BuyPage } from './pages/BuyPage';
import { AccountPage } from './pages/AccountPage';
import { HitodamaApp } from './desktop/HitodamaApp';

export const App: React.FC = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const isDesktopMode = urlParams.get('mode') === 'desktop';

  const [route, setRoute] = useState<string>('/');
  const [currency, setCurrency] = useState<'IN' | 'INTL'>('INTL');
  const [showGate, setShowGate] = useState(false);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const animId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animId);
      lenis.destroy();
    };
  }, []);

  // Listen to browser popstate for back/forward
  useEffect(() => {
    const handlePopState = () => {
      setRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (newRoute: string) => {
    window.history.pushState({}, '', newRoute);
    setRoute(newRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === 'IN' ? 'INTL' : 'IN'));
  };

  // Route handlers
  if (isDesktopMode) {
    return <HitodamaApp />;
  }

  if (route.startsWith('/buy')) {
    return <BuyPage onNavigate={navigate} currency={currency} />;
  }

  if (route.startsWith('/account')) {
    return <AccountPage onNavigate={navigate} currency={currency} />;
  }

  return (
    <div className="hitodama-app" style={{ position: 'relative' }}>
      {/* Ambient Grid Atmosphere */}
      <SolarpunkAtmosphere />

      {/* Main Navigation */}
      <LandingHeader
        currentRoute="/"
        onNavigate={navigate}
        currency={currency}
        onToggleCurrency={toggleCurrency}
      />

      {/* Main Content Sections */}
      <main id="main">
        <Hero onBuyClick={() => navigate('/buy/')} />
        <Productivity />
        <LassoStage />
        <DictateStage />
        <ScheduleStage />
        <YouTubeStage />
        <IslandSection />
        <PersonaSection />
        <SpeedSection />
        <EditionsSection onBuyClick={() => navigate('/buy/')} currency={currency} />
        <PriceSection onBuyClick={() => navigate('/buy/')} currency={currency} />
        <KeySection />
        <FaqSection />
      </main>

      {/* Site Footer */}
      <Footer onBuyClick={() => navigate('/buy/')} currency={currency} />

      {/* Unavailable Region Modal Gate */}
      <UnavailableGate isOpen={showGate} onClose={() => setShowGate(false)} />
    </div>
  );
};
