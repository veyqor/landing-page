'use client';

import React, { useState, useEffect, useRef } from 'react';

interface HeroSectionProps {
  onOpenDemo: () => void;
}

export default function HeroSection({ onOpenDemo }: HeroSectionProps) {
  const [matchScore, setMatchScore] = useState(0);
  const [govDecision, setGovDecision] = useState<'pending' | 'approved' | 'review'>('pending');
  const stageRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackStartRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const animateMatchScore = () => {
      if (hasAnimated.current) return;
      hasAnimated.current = true;

      let current = 0;
      const target = 87;
      timerRef.current = setInterval(() => {
        current += Math.ceil((target - current) / 5) || 1;
        if (current >= target) {
          current = target;
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
        setMatchScore(current);
      }, 50);
    };


          // Safety fallback for browsers/sessions where observer callbacks are delayed.
          fallbackStartRef.current = setTimeout(() => {
            animateMatchScore();
          }, 1200);
    if (!('IntersectionObserver' in window)) {
      animateMatchScore();
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
            if (fallbackStartRef.current) clearTimeout(fallbackStartRef.current);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) animateMatchScore();
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
    );

    if (stageRef.current) {
      observer.observe(stageRef.current);

      // Start immediately when the stage is already near viewport on first paint.
      const rect = stageRef.current.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.9 && rect.bottom >= 0) {
        animateMatchScore();
      }
    }

    return () => {
      observer.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <header className="hero">
      <div className="hero-video-layer" aria-hidden="true">
        <video className="hero-video" autoPlay loop muted playsInline preload="metadata">
          <source src="/videos/veyqor-hero.mp4" type="video/mp4" />
        </video>
        <div className="hero-video-scrim"></div>
      </div>
      <div className="hero-noise"></div>
      <div className="hero-grid"></div>
      <div className="wrap hero-inner">
        <h1>
          AI that accelerates hiring.
          <br />
          <span className="gold">People still decide.</span>
        </h1>

        <p className="hero-sub">
          VEYQOR gives recruiting teams structured AI intelligence to evaluate candidates faster — while keeping every consequential hiring decision firmly in human hands.
        </p>

        <div className="hero-ctas">
          <button onClick={onOpenDemo} className="btn-gold btn-gold-lg">
            Request a demo →
          </button>
          <a href="#platform" className="btn-ghost">
            Explore the platform
          </a>
        </div>

        <div className="control-strip">
          <div className="control-node">
            <span className="n-dot"></span>AI recommends
          </div>
          <div className="control-line"></div>
          <div className="control-node active">
            <span className="n-dot"></span>Human reviews
          </div>
          <div className="control-line"></div>
          <div className="control-node active">
            <span className="n-dot"></span>Human decides
          </div>
          <div className="control-line"></div>
          <div className="control-node">
            <span className="n-dot"></span>System records
          </div>
        </div>

        <div className="hero-stage" ref={stageRef}>
          <div className="hero-glow"></div>

          <div className="float-meta fm1">
            <span className="g">MATCH ENGINE</span>
            <span>ACTIVE</span>
          </div>
          <div className="float-meta fm2">
            <span>EVIDENCE</span>
            <span className="v">12</span>
          </div>
          <div className="float-meta fm3">
            <span className="g">GOVERNANCE</span>
            <span>REQUIRED</span>
          </div>
          <div className="float-meta fm4">
            <span>AUDIT TRAIL</span>
            <span className="v">ENABLED</span>
          </div>
          <div className="float-meta fm5">
            <span className="g">DECISION OWNER</span>
            <span>HUMAN</span>
          </div>

          {/* Candidate Card */}
          <div className="card-base card-candidate" id="candCard">
            <div className="card-label">Candidate Intelligence</div>
            <div className="cand-name">Sarah Williams</div>
            <div className="cand-role">Senior Product Designer</div>
            <div className="match-row">
              <div>
                <div className="match-label">Match</div>
                <div className="match-num">{matchScore}%</div>
              </div>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${matchScore}%` }}></div>
            </div>
            <div className="cand-stats">
              <div>
                <div className="cand-stat-label">Skills</div>
                <div className="cand-stat-val">8 / 9</div>
              </div>
              <div>
                <div className="cand-stat-label">Experience</div>
                <div className="cand-stat-val">6.4 yrs</div>
              </div>
              <div>
                <div className="cand-stat-label">Criteria fit</div>
                <div className="cand-stat-val">Strong</div>
              </div>
            </div>
          </div>

          {/* AI Advisory Card */}
          <div className="card-base card-ai">
            <div className="ai-tag">
              <span className="dot"></span>AI Advisory
            </div>
            <div className="ai-title">Strong candidate fit</div>
            <div className="ai-metric">
              <span>Skills alignment</span>
              <b>92%</b>
            </div>
            <div className="ai-metric">
              <span>Experience alignment</span>
              <b>88%</b>
            </div>
            <div className="ai-metric">
              <span>Criteria fit</span>
              <b>86%</b>
            </div>
            <div className="ai-rec">
              <div className="ai-rec-label">Recommendation</div>
              <div className="ai-rec-val">Advance to review</div>
            </div>
          </div>

          {/* Governance Card */}
          <div className="card-base card-gov">
            <div className="gov-top">
              <span className="gov-label">Governance Checkpoint</span>
              <span className="gov-pulse"></span>
            </div>
            <div className="gov-sub">
              {govDecision === 'pending' && 'Human decision required'}
              {govDecision === 'approved' && '✅ Approved by Human Reviewer'}
              {govDecision === 'review' && '⚠️ Additional Review Requested'}
            </div>
            <div className="gov-row">
              <span>AI recommendation</span>
              <b>ADVANCE</b>
            </div>
            <div className="gov-row">
              <span>Status</span>
              <b>
                {govDecision === 'pending' && 'Pending review'}
                {govDecision === 'approved' && 'Decision Recorded'}
                {govDecision === 'review' && 'In Assessment'}
              </b>
            </div>

            <div className="gov-btns">
              <button
                className={`gov-btn approve ${govDecision === 'approved' ? 'selected' : ''}`}
                onClick={() => setGovDecision('approved')}
                style={
                  govDecision === 'approved'
                    ? { outline: '2px solid #10B981', transform: 'scale(1.02)' }
                    : {}
                }
              >
                {govDecision === 'approved' ? 'Approved' : 'Approve'}
              </button>
              <button
                className={`gov-btn review ${govDecision === 'review' ? 'selected' : ''}`}
                onClick={() => setGovDecision('review')}
                style={
                  govDecision === 'review'
                    ? { borderColor: '#F5920B', color: '#F5920B', background: 'rgba(245,146,11,0.1)' }
                    : {}
                }
              >
                {govDecision === 'review' ? 'Reviewing...' : 'Review'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
