'use client';

import React, { useState, useEffect } from 'react';

import Image from 'next/image';

interface NavbarProps {
  onOpenDemo: () => void;
}

export default function Navbar({ onOpenDemo }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="nav-outer">
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`} id="nav">
        <div className="nav-left">
          <a href="#" className="nav-logo" aria-label="VEYQOR Home">
            <Image
              src="/Untitled design - 2026-08-10T155155.182.png"
              alt="VEYQOR Logo"
              width={160}
              height={44}
              priority
              className="nav-logo-img"
            />
          </a>
          <div className="nav-links">
            <a href="#product">Product</a>
            <a href="#platform">Platform</a>
            <a href="#governance">Governance</a>
          </div>
        </div>
        <div className="nav-right">
          <button
            onClick={() => alert('Sign-in portal simulated for VEYQOR platform.')}
            className="nav-signin"
          >
            Sign in
          </button>
          <button onClick={onOpenDemo} className="btn-gold">
            Demo
          </button>
        </div>
      </nav>
    </div>
  );
}
