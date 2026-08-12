'use client';

import React from 'react';
import Image from 'next/image';

interface FooterProps {
  onOpenDemo: () => void;
}

export default function Footer({ onOpenDemo }: FooterProps) {
  return (
    <>
      <section className="final-cta final-cta-section" id="demo">
        <div className="wrap">
          <div>
            <h2>
              Build a hiring process
              <br />
              you can explain.
            </h2>
            <p>
              VEYQOR brings AI-assisted candidate intelligence into a workflow designed around human judgment, governance and accountability.
            </p>
            <div className="hero-ctas">
              <button onClick={onOpenDemo} className="btn-gold btn-gold-lg">
                Request a demo →
              </button>
              <a href="#platform" className="btn-ghost">
                Explore VEYQOR
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo">
                <Image
                  src="/Untitled design - 2026-08-10T155643.189.png"
                  alt="VEYQOR Logo"
                  width={160}
                  height={44}
                  className="footer-logo-img"
                />
              </div>
              <div className="footer-tag">
                AI-advisory recruitment.
                <br />
                Human-governed decisions.
              </div>
            </div>

            <div className="footer-cols">
              <div className="footer-col">
                <h4>Product</h4>
                <a href="#product">Candidate intelligence</a>
                <a href="#product">Match engine</a>
                <a href="#product">Evidence review</a>
              </div>
              <div className="footer-col">
                <h4>Platform</h4>
                <a href="#platform">Overview</a>
                <a href="#governance">Governance</a>
                <a href="#platform">Audit trail</a>
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
    </>
  );
}
