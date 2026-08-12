import React from 'react';

export default function DifferenceSection() {
  return (
    <section className="diff-section section-pad diff-atmo-section">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">The VEYQOR difference</span>
          <h2 style={{ marginTop: '14px' }}>Two ways to build an AI hiring workflow.</h2>
        </div>

        <div className="diff-grid">
          <div className="diff-col trad">
            <div className="diff-label">Traditional automation</div>
            <div className="diff-flow">
              <div className="diff-step">Automate</div>
              <div className="diff-arrow">↓</div>
              <div className="diff-step">Recommend</div>
              <div className="diff-arrow">↓</div>
              <div className="diff-step">Advance</div>
            </div>
          </div>

          <div className="diff-col veyqor">
            <div className="diff-label">VEYQOR</div>
            <div className="diff-flow">
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
  );
}
