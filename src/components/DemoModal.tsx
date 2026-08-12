'use client';

import React, { useState } from 'react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    teamSize: '10-50',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
            <h3 className="modal-title">Demo Request Received</h3>
            <p className="modal-sub">
              Thank you, {formData.name || 'there'}! Our team will reach out to schedule your personalized VEYQOR platform walk-through.
            </p>
          </div>
        ) : (
          <>
            <h3 className="modal-title">Request a VEYQOR Demo</h3>
            <p className="modal-sub">
              Discover how AI-driven applicant signal decomposition and human governance checkpoints elevate your recruiting.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Sarah Connor"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="sarah@company.com"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="Acme Talent Solutions"
                  className="form-input"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company Size</label>
                <select
                  className="form-input"
                  style={{ background: '#FFFFFF' }}
                  value={formData.teamSize}
                  onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                >
                  <option value="1-10">1-10 employees</option>
                  <option value="10-50">10-50 employees</option>
                  <option value="50-250">50-250 employees</option>
                  <option value="250+">250+ employees</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn-gold btn-gold-lg"
                style={{ width: '100%', marginTop: '12px' }}
              >
                Schedule Demo →
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
