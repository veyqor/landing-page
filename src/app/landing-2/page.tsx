'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LandingSwitcher from '@/components/LandingSwitcher';
import styles from './page.module.css';

export default function LandingPageTwo() {
  const [matchScore, setMatchScore] = useState(0);
  const [bigScore, setBigScore] = useState(0);

  useEffect(() => {
    const nav = document.getElementById('lp2-nav');
    const hasIntersectionObserver = 'IntersectionObserver' in window;

    const handleScroll = () => {
      if (!nav) return;
      if (window.scrollY > 40) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    const revealEls = document.querySelectorAll('.reveal');
    let revealObserver: IntersectionObserver | null = null;

    if (hasIntersectionObserver) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add('in');
          });
        },
        { threshold: 0.15 }
      );

      revealEls.forEach((el) => revealObserver?.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add('in'));
    }

    let heroAnimated = false;
    let mvAnimated = false;
    let heroTimer: ReturnType<typeof setInterval> | null = null;
    let mvTimer: ReturnType<typeof setInterval> | null = null;
    let heroFallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let mvFallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const heroStage = document.querySelector('.hero-stage');
    const mvContainer = document.getElementById('lp2-mv-container');

    const animateHeroMatch = () => {
      if (heroAnimated) return;
      heroAnimated = true;
      let current = 0;
      const target = 87;
      heroTimer = setInterval(() => {
        current += Math.ceil((target - current) / 6) || 1;
        if (current >= target) {
          current = target;
          if (heroTimer) {
            clearInterval(heroTimer);
            heroTimer = null;
          }
        }
        setMatchScore(current);
      }, 45);
    };

    const animateMV = () => {
      if (mvAnimated) return;
      mvAnimated = true;
      const fillEls = document.querySelectorAll<HTMLElement>('.mv-fill');
      fillEls.forEach((el) => {
        const w = el.dataset.w || '0';
        el.style.width = `${w}%`;
      });

      let current = 0;
      const target = 87;
      mvTimer = setInterval(() => {
        current += Math.ceil((target - current) / 6) || 1;
        if (current >= target) {
          current = target;
          if (mvTimer) {
            clearInterval(mvTimer);
            mvTimer = null;
          }
        }
        setBigScore(current);
      }, 45);
    };

    if (!hasIntersectionObserver) {
      animateHeroMatch();
      animateMV();
      return () => {
        window.removeEventListener('scroll', handleScroll);
        if (heroTimer) clearInterval(heroTimer);
        if (mvTimer) clearInterval(mvTimer);
        if (heroFallbackTimer) clearTimeout(heroFallbackTimer);
        if (mvFallbackTimer) clearTimeout(mvFallbackTimer);
      };
    }

    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) animateHeroMatch();
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
    );

    const mvObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) animateMV();
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
    );

    if (heroStage) {
      heroObserver.observe(heroStage);
      const rect = heroStage.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.9 && rect.bottom >= 0) {
        animateHeroMatch();
      }
    }

    if (mvContainer) {
      mvObserver.observe(mvContainer);
      const rect = mvContainer.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.9 && rect.bottom >= 0) {
        animateMV();
      }
    }

    // Safety fallback for browsers/sessions where observer callbacks are delayed.
    heroFallbackTimer = setTimeout(() => {
      animateHeroMatch();
    }, 1200);

    mvFallbackTimer = setTimeout(() => {
      animateMV();
    }, 1400);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      revealObserver?.disconnect();
      heroObserver.disconnect();
      mvObserver.disconnect();
      if (heroTimer) clearInterval(heroTimer);
      if (mvTimer) clearInterval(mvTimer);
      if (heroFallbackTimer) clearTimeout(heroFallbackTimer);
      if (mvFallbackTimer) clearTimeout(mvFallbackTimer);
    };
  }, []);

  return (
    <main className={styles.root}>
      <LandingSwitcher active={2} />

      <div className="nav-outer">
        <nav className="nav" id="lp2-nav">
          <div className="nav-left">
            <a href="#" className="nav-logo" aria-label="VEYQOR Home">
              <Image
                src="/logo.png"
                alt="VEYQOR Logo"
                width={160}
                height={44}
                priority
                className="nav-logo-img"
              />
            </a>
            <div className="nav-links">
              <a href="#product">Product</a>
              <a href="#platform">Platform</a>
              <a href="#governance">Governance</a>
            </div>
          </div>
          <div className="nav-right">
            <Link href="/sign-in" className="nav-signin">Sign in</Link>
            <a href="#demo" className="btn-gold">Demo</a>
          </div>
        </nav>
      </div>

      <header className="hero">
        <div className="hero-video-layer" aria-hidden="true">
          <video className="hero-video" autoPlay loop muted playsInline preload="metadata">
            <source src="/videos/veyqor-hero1.mp4" type="video/mp4" />
          </video>
          <div className="hero-video-scrim"></div>
        </div>
        <div className="hero-noise"></div>
        <div className="hero-grid"></div>
        <div className="wrap hero-inner">
          <h1>AI that accelerates hiring.<br /><span className="gold">People still decide.</span></h1>
          <p className="hero-sub">VEYQOR gives recruiting teams structured AI intelligence to evaluate candidates faster — while keeping every consequential hiring decision firmly in human hands.</p>
          <div className="hero-ctas">
            <a href="#demo" className="btn-gold btn-gold-lg">Request a demo →</a>
            <a href="#platform" className="btn-ghost">Explore the platform</a>
          </div>

          <div className="control-strip reveal">
            <div className="control-node"><span className="n-dot"></span>AI recommends</div>
            <div className="control-line"></div>
            <div className="control-node active"><span className="n-dot"></span>Human reviews</div>
            <div className="control-line"></div>
            <div className="control-node active"><span className="n-dot"></span>Human decides</div>
            <div className="control-line"></div>
            <div className="control-node"><span className="n-dot"></span>System records</div>
          </div>

          <div className="hero-stage">
            <div className="hero-glow"></div>

            <div className="float-meta fm1"><span className="g">MATCH ENGINE</span><span>ACTIVE</span></div>
            <div className="float-meta fm2"><span>EVIDENCE</span><span className="v">12</span></div>
            <div className="float-meta fm3"><span className="g">GOVERNANCE</span><span>REQUIRED</span></div>
            <div className="float-meta fm4"><span>AUDIT TRAIL</span><span className="v">ENABLED</span></div>
            <div className="float-meta fm5"><span className="g">DECISION OWNER</span><span>HUMAN</span></div>

            <div className="card-base card-candidate">
              <div className="card-label">Candidate Intelligence</div>
              <div className="cand-name">Sarah Williams</div>
              <div className="cand-role">Senior Product Designer</div>
              <div className="match-row">
                <div>
                  <div className="match-label">Match</div>
                  <div className="match-num">{matchScore}%</div>
                </div>
              </div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${matchScore}%` }}></div></div>
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

            <div className="card-base card-ai">
              <div className="ai-tag"><span className="dot"></span>AI Advisory</div>
              <div className="ai-title">Strong candidate fit</div>
              <div className="ai-metric"><span>Skills alignment</span><b>92%</b></div>
              <div className="ai-metric"><span>Experience alignment</span><b>88%</b></div>
              <div className="ai-metric"><span>Criteria fit</span><b>86%</b></div>
              <div className="ai-rec">
                <div className="ai-rec-label">Recommendation</div>
                <div className="ai-rec-val">Advance to review</div>
              </div>
            </div>

            <div className="card-base card-gov">
              <div className="gov-top">
                <span className="gov-label">Governance Checkpoint</span>
                <span className="gov-pulse"></span>
              </div>
              <div className="gov-sub">Human decision required</div>
              <div className="gov-row"><span>AI recommendation</span><b>ADVANCE</b></div>
              <div className="gov-row"><span>Status</span><b>Pending review</b></div>
              <div className="gov-btns">
                <button className="gov-btn approve">Approve</button>
                <button className="gov-btn review">Review</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="light section-pad" id="platform">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow" style={{ color: 'var(--lp2-color-gold-dark)' }}>Platform</span>
            <h2 style={{ marginTop: '14px' }}>The intelligence layer for modern hiring.</h2>
            <p>VEYQOR transforms fragmented candidate information into structured intelligence that recruiting teams can review, challenge and act on.</p>
          </div>
        </div>
        <div className="value-modules">
          <div className="value-module reveal">
            <div className="vm-num">01</div>
            <h3>Surface the signal</h3>
            <p>AI extracts skills, experience, qualifications and criteria fit from every application, structured for fast, consistent review.</p>
          </div>
          <div className="value-module reveal">
            <div className="vm-num">02</div>
            <h3>Explain the recommendation</h3>
            <p>Recruiters can inspect the evidence behind every recommendation — not just the score, but the reasoning underneath it.</p>
          </div>
          <div className="value-module reveal">
            <div className="vm-num">03</div>
            <h3>Control the decision</h3>
            <p>No consequential action moves forward without the appropriate human decision. AI advises. People decide.</p>
          </div>
        </div>
      </section>

      <section className="dark section-pad" id="product">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">Product</span>
            <h2 style={{ marginTop: '14px' }}>See the decision before you make it.</h2>
          </div>
          <div className="showcase-panel reveal">
            <div className="showcase-top">
              <div>
                <div className="showcase-role-label">Open Role</div>
                <div className="showcase-role">Senior Product Designer</div>
              </div>
              <div className="showcase-stats">
                <div><div className="sc-stat-val">124</div><div className="sc-stat-label">Candidates</div></div>
                <div><div className="sc-stat-val gold">18</div><div className="sc-stat-label">Strong matches</div></div>
                <div><div className="sc-stat-val">7</div><div className="sc-stat-label">Awaiting review</div></div>
                <div><div className="sc-stat-val gold">3</div><div className="sc-stat-label">Governance checks</div></div>
              </div>
            </div>
            <table className="showcase-table">
              <thead>
                <tr><th>Candidate</th><th>Match</th><th>Skills</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="sc-name">Sarah Williams</td>
                  <td className="sc-match">92%</td>
                  <td><span className="pill strong">Strong</span></td>
                  <td><span className="pill review">Review</span></td>
                </tr>
                <tr>
                  <td className="sc-name">James Carter</td>
                  <td className="sc-match">88%</td>
                  <td><span className="pill strong">Strong</span></td>
                  <td><span className="pill pending">Pending</span></td>
                </tr>
                <tr>
                  <td className="sc-name">David Brown</td>
                  <td className="sc-match">84%</td>
                  <td><span className="pill good">Good</span></td>
                  <td><span className="pill review">Review</span></td>
                </tr>
                <tr>
                  <td className="sc-name">Emma Wilson</td>
                  <td className="sc-match">81%</td>
                  <td><span className="pill good">Good</span></td>
                  <td><span className="pill pending">Pending</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="light section-pad">
        <div className="wrap">
          <div className="match-viz">
            <div className="reveal">
              <div className="match-big-label">Match Score</div>
              <div className="match-big">{bigScore}%</div>
              <p style={{ marginTop: '18px', color: 'var(--lp2-color-slate-mid)', fontSize: '15px', lineHeight: '1.6', maxWidth: '340px' }}>
                A single composite score, fully decomposed into the evidence that produced it.
              </p>
            </div>
            <div className="reveal" id="lp2-mv-container">
              <div className="mv-row">
                <div className="mv-top"><span>Criteria fit</span><span>92%</span></div>
                <div className="mv-track"><div className="mv-fill gold" data-w="92"></div></div>
              </div>
              <div className="mv-row">
                <div className="mv-top"><span>Experience</span><span>84%</span></div>
                <div className="mv-track"><div className="mv-fill gold" data-w="84"></div></div>
              </div>
              <div className="mv-row">
                <div className="mv-top"><span>Skills</span><span>91%</span></div>
                <div className="mv-track"><div className="mv-fill gold" data-w="91"></div></div>
              </div>
              <div className="mv-row">
                <div className="mv-top"><span>Qualifications</span><span>86%</span></div>
                <div className="mv-track"><div className="mv-fill violet" data-w="86"></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="gov-section section-pad" id="governance">
        <div className="wrap">
          <div className="gov-layout">
            <div className="reveal">
              <span className="eyebrow">Governance</span>
              <h2 style={{ marginTop: '14px', fontSize: 'clamp(30px,4.2vw,48px)', letterSpacing: '-0.025em', lineHeight: '1.12' }}>
                AI can recommend.<br />It cannot decide.
              </h2>
              <p style={{ marginTop: '20px', color: 'var(--lp2-color-cloud)', opacity: 0.75, fontSize: '16.5px', lineHeight: '1.65', maxWidth: '440px' }}>
                Every consequential action passes through a human governance checkpoint before the recruitment workflow can continue.
              </p>
            </div>
            <div className="gov-panel reveal">
              <div className="gov-panel-title">Governance Checkpoint <span className="gov-pulse"></span></div>
              <div className="gov-cand">Sarah Williams</div>
              <div className="gov-role-sm" style={{ marginTop: '2px', marginBottom: '22px' }}>Senior Product Designer</div>
              <div className="gov-adv-label" style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>AI Recommendation</div>
              <div className="gov-adv-val">Advance</div>
              <div className="gov-meta-row"><span>Match score</span><b>87%</b></div>
              <div className="gov-meta-row"><span>Evidence</span><b>12 items</b></div>
              <div className="gov-meta-row"><span>Confidence</span><b>High</b></div>
              <div className="gov-req">Human decision required</div>
              <div className="gov-btns">
                <button className="gov-btn approve">Approve</button>
                <button className="gov-btn review">Request review</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="light section-pad">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow" style={{ color: 'var(--lp2-color-gold-dark)' }}>Explainability</span>
            <h2 style={{ marginTop: '14px' }}>Don't just trust the score.<br />Understand it.</h2>
          </div>
          <div className="explain-card reveal" style={{ maxWidth: '640px' }}>
            <div className="explain-title">Why this candidate matches</div>
            <div className="ex-item"><div className="ex-icon ok">✓</div><div className="ex-text"><b>8 of 9</b> required skills identified</div></div>
            <div className="ex-item"><div className="ex-icon ok">✓</div><div className="ex-text"><b>6+ years</b> relevant experience</div></div>
            <div className="ex-item"><div className="ex-icon ok">✓</div><div className="ex-text">Required certification detected</div></div>
            <div className="ex-item"><div className="ex-icon ok">✓</div><div className="ex-text">Strong role criteria alignment</div></div>
            <div className="ex-item">
              <div className="ex-icon warn">!</div>
              <div>
                <div className="ex-text">Employment gap identified</div>
                <div style={{ fontSize: '12px', color: 'var(--lp2-color-pending-amber)', fontWeight: 600, marginTop: '2px' }}>Requires review</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="audit-split">
        <div className="audit-left reveal">
          <div>
            <span className="eyebrow">Audit trail</span>
            <h2 style={{ marginTop: '14px' }}>Every decision has a history.</h2>
            <p>Each governance checkpoint is captured in full — who reviewed, what evidence they saw, and when the decision was made.</p>
          </div>
        </div>
        <div className="audit-right reveal">
          <div className="timeline">
            <div className="t-item"><div className="t-time">09:42:18</div><div className="t-desc">AI recommendation generated</div></div>
            <div className="t-item"><div className="t-time">09:44:07</div><div className="t-desc">Recruiter reviewed candidate</div></div>
            <div className="t-item"><div className="t-time">09:46:12</div><div className="t-desc">Evidence examined</div></div>
            <div className="t-item"><div className="t-time">09:49:33</div><div className="t-desc">Governance checkpoint initiated</div></div>
            <div className="t-item"><div className="t-time">09:51:02</div><div className="t-desc">Human decision recorded</div></div>
            <div className="t-item"><div className="t-time">09:51:04</div><div className="t-desc">Candidate advanced</div></div>
          </div>
        </div>
      </section>

      <section className="diff-section section-pad">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">The VEYQOR difference</span>
            <h2 style={{ marginTop: '14px' }}>Two ways to build an AI hiring workflow.</h2>
          </div>
          <div className="diff-grid reveal">
            <div className="diff-col trad">
              <div className="diff-label">Traditional automation</div>
              <div>
                <div className="diff-step">Automate</div>
                <div className="diff-arrow">↓</div>
                <div className="diff-step">Recommend</div>
                <div className="diff-arrow">↓</div>
                <div className="diff-step">Advance</div>
              </div>
            </div>
            <div className="diff-col veyqor">
              <div className="diff-label">VEYQOR</div>
              <div>
                <div className="diff-step">Analyze</div>
                <div className="diff-arrow">↓</div>
                <div className="diff-step">Recommend</div>
                <div className="diff-arrow">↓</div>
                <div className="diff-step">Human review</div>
                <div className="diff-arrow">↓</div>
                <div className="diff-step">Governance</div>
                <div className="diff-arrow">↓</div>
                <div className="diff-step">Human decision</div>
                <div className="diff-arrow">↓</div>
                <div className="diff-step">Audit</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-section section-pad">
        <div className="wrap">
          <div className="reveal">
            <p className="trust-quote">"Intelligence, coordination, and control, without ever removing human accountability."</p>
            <div className="trust-list">
              <div className="trust-item">Explainable recommendations</div>
              <div className="trust-item">Human oversight</div>
              <div className="trust-item">Governance checkpoints</div>
              <div className="trust-item">Decision traceability</div>
              <div className="trust-item">Evidence-based review</div>
              <div className="trust-item">Auditability</div>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta" id="demo">
        <div className="wrap">
          <div className="reveal">
            <h2>Build a hiring process<br />you can explain.</h2>
            <p>VEYQOR brings AI-assisted candidate intelligence into a workflow designed around human judgment, governance and accountability.</p>
            <div className="hero-ctas">
              <a href="#demo" className="btn-gold btn-gold-lg">Request a demo →</a>
              <a href="#platform" className="btn-ghost">Explore VEYQOR</a>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="footer-top">
            <div>
              <div className="footer-logo">
                <Image
                  src="/logo.png"
                  alt="VEYQOR Logo"
                  width={160}
                  height={44}
                  className="footer-logo-img"
                />
              </div>
              <div className="footer-tag">AI-advisory recruitment.<br />Human-governed decisions.</div>
            </div>
            <div className="footer-cols">
              <div className="footer-col">
                <h4>Product</h4>
                <a href="#product">Candidate intelligence</a>
                <a href="#">Match engine</a>
                <a href="#">Evidence review</a>
              </div>
              <div className="footer-col">
                <h4>Platform</h4>
                <a href="#platform">Overview</a>
                <a href="#governance">Governance</a>
                <a href="#">Audit trail</a>
              </div>
              <div className="footer-col">
                <h4>Company</h4>
                <a href="#">About</a>
                <a href="#">Careers</a>
                <a href="#">Contact</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-copy">© VEYQOR GmbH</div>
            <div className="footer-legal">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
