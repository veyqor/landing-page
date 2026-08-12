import React from 'react';

export default function ExplainabilitySection() {
  return (
    <section className="light section-pad explain-section">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow" style={{ color: 'var(--color-accent-strong)' }}>
            Explainability
          </span>
          <h2 style={{ marginTop: '14px' }}>
            Don't just trust the score.
            <br />
            Understand it.
          </h2>
        </div>

        <div className="explain-card" style={{ maxWidth: '640px' }}>
          <div className="explain-title">Why this candidate matches</div>

          <div className="ex-item">
            <div className="ex-icon ok">✓</div>
            <div className="ex-text">
              <b>8 of 9</b> required skills identified
            </div>
          </div>

          <div className="ex-item">
            <div className="ex-icon ok">✓</div>
            <div className="ex-text">
              <b>6+ years</b> relevant experience
            </div>
          </div>

          <div className="ex-item">
            <div className="ex-icon ok">✓</div>
            <div className="ex-text">Required certification detected</div>
          </div>

          <div className="ex-item">
            <div className="ex-icon ok">✓</div>
            <div className="ex-text">Strong role criteria alignment</div>
          </div>

          <div className="ex-item">
            <div className="ex-icon warn">!</div>
            <div>
              <div className="ex-text">Employment gap identified</div>
              <div className="ex-flag">Requires review</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
