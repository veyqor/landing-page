import React from 'react';

export default function TrustSection() {
  return (
    <section className="trust-section section-pad trust-atmo-section">
      <div className="wrap">
        <div>
          <p className="trust-quote">
            "Intelligence, coordination, and control, without ever removing human accountability."
          </p>

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
  );
}
