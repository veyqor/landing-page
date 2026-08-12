import React from 'react';

export default function PlatformSection() {
  return (
    <section className="light section-pad platform-section" id="platform">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow" style={{ color: 'var(--color-accent-strong)' }}>
            Platform
          </span>
          <h2 style={{ marginTop: '14px' }}>The intelligence layer for modern hiring.</h2>
          <p>
            VEYQOR transforms fragmented candidate information into structured intelligence that recruiting teams can review, challenge and act on.
          </p>
        </div>
      </div>

      <div className="value-modules">
        <div className="value-module">
          <div className="vm-num">01</div>
          <h3>Surface the signal</h3>
          <p>
            AI extracts skills, experience, qualifications and criteria fit from every application, structured for fast, consistent review.
          </p>
        </div>
        <div className="value-module">
          <div className="vm-num">02</div>
          <h3>Explain the recommendation</h3>
          <p>
            Recruiters can inspect the evidence behind every recommendation — not just the score, but the reasoning underneath it.
          </p>
        </div>
        <div className="value-module">
          <div className="vm-num">03</div>
          <h3>Control the decision</h3>
          <p>
            No consequential action moves forward without the appropriate human decision. AI advises. People decide.
          </p>
        </div>
      </div>
    </section>
  );
}
