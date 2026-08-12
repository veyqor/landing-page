'use client';

import React, { useState } from 'react';

interface Candidate {
  id: number;
  name: string;
  match: number;
  skillsRating: 'Strong' | 'Good' | 'Fair';
  status: 'Review' | 'Pending' | 'Approved';
}

const INITIAL_CANDIDATES: Candidate[] = [
  { id: 1, name: 'Sarah Williams', match: 92, skillsRating: 'Strong', status: 'Review' },
  { id: 2, name: 'James Carter', match: 88, skillsRating: 'Strong', status: 'Pending' },
  { id: 3, name: 'David Brown', match: 84, skillsRating: 'Good', status: 'Review' },
  { id: 4, name: 'Emma Wilson', match: 81, skillsRating: 'Good', status: 'Pending' },
  { id: 5, name: 'Alex Rodriguez', match: 79, skillsRating: 'Fair', status: 'Pending' },
];

export default function ProductShowcaseSection() {
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [filter, setFilter] = useState<'all' | 'strong' | 'review'>('all');

  const filteredCandidates = candidates.filter((cand) => {
    if (filter === 'strong') return cand.match >= 85;
    if (filter === 'review') return cand.status === 'Review';
    return true;
  });

  const handleStatusChange = (id: number) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus: Candidate['status'] =
            c.status === 'Pending' ? 'Review' : c.status === 'Review' ? 'Approved' : 'Pending';
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  return (
    <section className="light section-pad product-section" id="product">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Product</span>
          <h2 style={{ marginTop: '14px' }}>See the decision before you make it.</h2>
        </div>

        <div className="showcase-panel">
          <div className="showcase-top">
            <div>
              <div className="showcase-role-label">Open Role</div>
              <div className="showcase-role">Senior Product Designer</div>
            </div>

            <div className="showcase-stats">
              <div>
                <div className="sc-stat-val">124</div>
                <div className="sc-stat-label">Candidates</div>
              </div>
              <div>
                <div className="sc-stat-val gold">18</div>
                <div className="sc-stat-label">Strong matches</div>
              </div>
              <div>
                <div className="sc-stat-val">7</div>
                <div className="sc-stat-label">Awaiting review</div>
              </div>
              <div>
                <div className="sc-stat-val gold">3</div>
                <div className="sc-stat-label">Governance checks</div>
              </div>
            </div>
          </div>

          <div className="showcase-filter-row">
            <span className="showcase-filter-label">
              Filter candidates:
            </span>
            <button
              onClick={() => setFilter('all')}
              className={`pill showcase-filter-pill ${filter === 'all' ? 'review' : ''}`}
              style={{ cursor: 'pointer' }}
            >
              All ({candidates.length})
            </button>
            <button
              onClick={() => setFilter('strong')}
              className={`pill showcase-filter-pill ${filter === 'strong' ? 'strong' : ''}`}
              style={{ cursor: 'pointer' }}
            >
              Top Matches (Match ≥ 85%)
            </button>
            <button
              onClick={() => setFilter('review')}
              className={`pill showcase-filter-pill ${filter === 'review' ? 'good' : ''}`}
              style={{ cursor: 'pointer' }}
            >
              Needs Review
            </button>
          </div>

          <table className="showcase-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Match</th>
                <th>Skills</th>
                <th>Governance Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((cand) => (
                <tr key={cand.id}>
                  <td className="sc-name">{cand.name}</td>
                  <td className="sc-match">{cand.match}%</td>
                  <td>
                    <span
                      className={`pill ${
                        cand.skillsRating === 'Strong'
                          ? 'strong'
                          : cand.skillsRating === 'Good'
                          ? 'good'
                          : 'pending'
                      }`}
                    >
                      {cand.skillsRating}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleStatusChange(cand.id)}
                      className={`pill ${
                        cand.status === 'Approved'
                          ? 'strong'
                          : cand.status === 'Review'
                          ? 'review'
                          : 'pending'
                      }`}
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                      title="Click to advance status"
                    >
                      {cand.status === 'Approved'
                        ? '✅ Approved'
                        : cand.status === 'Review'
                        ? '🔍 Review'
                        : '⏳ Pending'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
