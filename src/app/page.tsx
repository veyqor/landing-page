'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import PlatformSection from '@/components/PlatformSection';
import ProductShowcaseSection from '@/components/ProductShowcaseSection';
import MatchScoreSection from '@/components/MatchScoreSection';
import GovernanceSection from '@/components/GovernanceSection';
import ExplainabilitySection from '@/components/ExplainabilitySection';
import AuditTrailSection from '@/components/AuditTrailSection';
import DifferenceSection from '@/components/DifferenceSection';
import TrustSection from '@/components/TrustSection';
import Footer from '@/components/Footer';
import DemoModal from '@/components/DemoModal';
import LandingSwitcher from '@/components/LandingSwitcher';

export default function Home() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('js');

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
      return () => {
        document.documentElement.classList.remove('js');
      };
    }

    // Intersection Observer for scroll reveal animations
    const revealEls = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
          }
        });
      },
      { threshold: 0.12 }
    );

    revealEls.forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove('js');
    };
  }, []);

  return (
    <main>
      <LandingSwitcher active={1} />
      <Navbar onOpenDemo={() => setIsDemoModalOpen(true)} />
      <HeroSection onOpenDemo={() => setIsDemoModalOpen(true)} />

      <div className="reveal">
        <PlatformSection />
      </div>

      <div className="reveal">
        <ProductShowcaseSection />
      </div>

      <div className="reveal">
        <MatchScoreSection />
      </div>

      <div className="reveal">
        <GovernanceSection />
      </div>

      <div className="reveal">
        <ExplainabilitySection />
      </div>

      <div className="reveal">
        <AuditTrailSection />
      </div>

      <div className="reveal">
        <DifferenceSection />
      </div>

      <div className="reveal">
        <TrustSection />
      </div>

      <Footer onOpenDemo={() => setIsDemoModalOpen(true)} />

      <DemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </main>
  );
}
