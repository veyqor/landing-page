'use client';

import React, { useState } from 'react';

export default function GovernanceSection() {
  const [userChoice, setUserChoice] = useState<'none' | 'approved' | 'review'>('none');

  return (
    <section className="gov-section section-pad governance-section" id="governance">
      <div className="wrap">
        <div className="gov-layout">
          <div>
            <span className="eyebrow">Governance</span>
            <h2
              style={{
                marginTop: '14px',
                fontSize: 'clamp(30px,4.2vw,48px)',
                letterSpacing: '-0.025em',
                lineHeight: '1.12',
              }}
            >
              AI can recommend.
              <br />
              It cannot decide.
            </h2>
            <p
              style={{
                marginTop: '20px',
                color: 'var(--color-cloud)',
                opacity: 0.75,
                fontSize: '16.5px',
                lineHeight: '1.65',
                maxWidth: '440px',
              }}
            >
              Every consequential action passes through a human governance checkpoint before the recruitment workflow can continue.
            </p>
          </div>

          <div className="gov-panel">
            <div className="gov-panel-title">
              Governance Checkpoint <span className="gov-pulse"></span>
            </div>
            <div className="gov-cand">Sarah Williams</div>
            <div className="gov-role-sm">Senior Product Designer</div>

            <div className="gov-adv-label">AI Recommendation</div>
            <div className="gov-adv-val">Advance</div>

            <div className="gov-meta-row">
              <span>Match score</span>
              <b>87%</b>
            </div>
            <div className="gov-meta-row">
              <span>Evidence</span>
              <b>12 items</b>
            </div>
            <div className="gov-meta-row">
              <span>Confidence</span>
              <b>High</b>
            </div>

            <div className="gov-req">
              {userChoice === 'none' && '⚡ Human decision required'}
              {userChoice === 'approved' && '✅ Approved by Hiring Manager'}
              {userChoice === 'review' && '⚠️ Additional Assessment Requested'}
            </div>

            <div className="gov-btns">
              <button
                onClick={() => setUserChoice('approved')}
                className="gov-btn approve"
                style={
                  userChoice === 'approved'
                    ? { outline: '2px solid #10B981', transform: 'scale(1.02)' }
                    : {}
                }
              >
                {userChoice === 'approved' ? 'Approved' : 'Approve'}
              </button>
              <button
                onClick={() => setUserChoice('review')}
                className="gov-btn review"
                style={
                  userChoice === 'review'
                    ? { borderColor: '#F5920B', color: '#F5920B', background: 'rgba(245,146,11,0.1)' }
                    : {}
                }
              >
                {userChoice === 'review' ? 'In Review' : 'Request review'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
