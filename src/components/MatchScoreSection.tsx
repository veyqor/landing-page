'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function MatchScoreSection() {
  const [bigScore, setBigScore] = useState(0);
  const [animated, setAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackStartRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const animateScore = () => {
      if (hasAnimated.current) return;
      hasAnimated.current = true;
      setAnimated(true);

      let current = 0;
      const target = 87;
      timerRef.current = setInterval(() => {
        current += Math.ceil((target - current) / 6) || 1;
        if (current >= target) {
          current = target;
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
        setBigScore(current);
      }, 40);
    };

    if (!('IntersectionObserver' in window)) {
      animateScore();
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) animateScore();
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);

      const rect = containerRef.current.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.9 && rect.bottom >= 0) {
        animateScore();
      }
    }

    // Safety fallback for browsers/sessions where observer callbacks are delayed.
    fallbackStartRef.current = setTimeout(() => {
      animateScore();
    }, 1200);

    return () => {
      observer.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
      if (fallbackStartRef.current) clearTimeout(fallbackStartRef.current);
    };
  }, []);

  return (
    <section className="light section-pad score-section">
      <div className="wrap">
        <div className="match-viz" ref={containerRef}>
          <div>
            <div className="match-big-label">Match Score</div>
            <div className="match-big">{bigScore}%</div>
            <p
              style={{
                marginTop: '18px',
                color: 'var(--color-slate-mid)',
                fontSize: '15px',
                lineHeight: '1.6',
                maxWidth: '340px',
              }}
            >
              A single composite score, fully decomposed into the evidence that produced it.
            </p>
          </div>

          <div>
            <div className="mv-row">
              <div className="mv-top">
                <span>Criteria fit</span>
                <span>92%</span>
              </div>
              <div className="mv-track">
                <div
                  className="mv-fill gold"
                  style={{ width: animated ? '92%' : '0%' }}
                ></div>
              </div>
            </div>

            <div className="mv-row">
              <div className="mv-top">
                <span>Experience</span>
                <span>84%</span>
              </div>
              <div className="mv-track">
                <div
                  className="mv-fill gold"
                  style={{ width: animated ? '84%' : '0%' }}
                ></div>
              </div>
            </div>

            <div className="mv-row">
              <div className="mv-top">
                <span>Skills</span>
                <span>91%</span>
              </div>
              <div className="mv-track">
                <div
                  className="mv-fill gold"
                  style={{ width: animated ? '91%' : '0%' }}
                ></div>
              </div>
            </div>

            <div className="mv-row">
              <div className="mv-top">
                <span>Qualifications</span>
                <span>86%</span>
              </div>
              <div className="mv-track">
                <div
                  className="mv-fill violet"
                  style={{ width: animated ? '86%' : '0%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
