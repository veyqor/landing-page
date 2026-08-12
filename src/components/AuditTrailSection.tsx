import React from 'react';

export default function AuditTrailSection() {
  return (
    <section className="audit-split audit-section">
      <div className="audit-left">
        <div>
          <span className="eyebrow">Audit trail</span>
          <h2 style={{ marginTop: '14px' }}>Every decision has a history.</h2>
          <p>
            Each governance checkpoint is captured in full — who reviewed, what evidence they saw, and when the decision was made.
          </p>
        </div>
      </div>

      <div className="audit-right">
        <div className="timeline">
          <div className="t-item">
            <div className="t-time">09:42:18</div>
            <div className="t-desc">AI recommendation generated</div>
          </div>
          <div className="t-item">
            <div className="t-time">09:44:07</div>
            <div className="t-desc">Recruiter reviewed candidate</div>
          </div>
          <div className="t-item">
            <div className="t-time">09:46:12</div>
            <div className="t-desc">Evidence examined</div>
          </div>
          <div className="t-item">
            <div className="t-time">09:49:33</div>
            <div className="t-desc">Governance checkpoint initiated</div>
          </div>
          <div className="t-item">
            <div className="t-time">09:51:02</div>
            <div className="t-desc">Human decision recorded</div>
          </div>
          <div className="t-item">
            <div className="t-time">09:51:04</div>
            <div className="t-desc">Candidate advanced</div>
          </div>
        </div>
      </div>
    </section>
  );
}
