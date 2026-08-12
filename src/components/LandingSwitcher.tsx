import Link from 'next/link';

interface LandingSwitcherProps {
  active: 1 | 2;
}

export default function LandingSwitcher({ active }: LandingSwitcherProps) {
  return (
    <div className="landing-switcher" aria-label="Landing page switcher">
      <Link
        href="/"
        className={`landing-switch-btn ${active === 1 ? 'active' : ''}`}
      >
        Landing Page 1
      </Link>
      <Link
        href="/landing-2"
        className={`landing-switch-btn ${active === 2 ? 'active' : ''}`}
      >
        Landing Page 2
      </Link>
    </div>
  );
}
