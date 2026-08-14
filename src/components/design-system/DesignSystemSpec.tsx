'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './DesignSystemSpec.module.css';

type Section = { id: string; number: string; title: string };
type Tone = 'dark' | 'light';
type IconName = 'check' | 'warning' | 'clock' | 'danger' | 'spark' | 'user' | 'shield' | 'x';

type TokenItem = {
  name: string;
  value: string;
  varName: string;
  tone: Tone;
  textVarName: string;
};

type RGB = { r: number; g: number; b: number };

function hexToRgb(hex: string): RGB {
  const cleaned = hex.replace('#', '');
  const raw = cleaned.length === 3
    ? cleaned.split('').map((c) => c + c).join('')
    : cleaned;
  const num = Number.parseInt(raw, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function srgbToLinear(v: number): number {
  const scaled = v / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb: RGB): number {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fg: RGB, bg: RGB): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function compositeOver(fg: RGB, alpha: number, bg: RGB): RGB {
  return {
    r: Math.round(fg.r * alpha + bg.r * (1 - alpha)),
    g: Math.round(fg.g * alpha + bg.g * (1 - alpha)),
    b: Math.round(fg.b * alpha + bg.b * (1 - alpha)),
  };
}

const sections: Section[] = [
  { id: 'philosophy', number: '01', title: 'Design Philosophy' },
  { id: 'colors', number: '02', title: 'Color Palette' },
  { id: 'type', number: '03', title: 'Type Scale & Hierarchy' },
  { id: 'layout', number: '04', title: 'Layout System' },
  { id: 'spacing', number: '05', title: 'Spacing Scale' },
  { id: 'radius', number: '06', title: 'Corner Radius Scale' },
  { id: 'elevation', number: '07', title: 'Elevation System' },
  { id: 'glass', number: '08', title: 'Glass Surface System' },
  { id: 'icons', number: '09', title: 'Icon System' },
  { id: 'buttons', number: '10', title: 'Buttons' },
  { id: 'inputs', number: '11', title: 'Inputs' },
  { id: 'cards', number: '12', title: 'Cards' },
  { id: 'badges', number: '13', title: 'Badges & Chips' },
  { id: 'navigation', number: '14', title: 'Navigation' },
  { id: 'accessibility', number: '15', title: 'Accessibility Standards' },
];

const baseSurfaces: TokenItem[] = [
  { name: 'surface-canvas', value: '#10131d', varName: '--ds-surface-canvas', tone: 'dark', textVarName: '--ds-text-primary-on-dark' },
  { name: 'surface-raised', value: '#22293e', varName: '--ds-surface-raised', tone: 'dark', textVarName: '--ds-text-primary-on-dark' },
  { name: 'surface-overlay', value: 'rgba(34, 41, 62, 0.92)', varName: '--ds-surface-overlay', tone: 'dark', textVarName: '--ds-text-primary-on-dark' },
  { name: 'surface-content-light', value: '#ffffff', varName: '--ds-surface-content-light', tone: 'light', textVarName: '--ds-text-primary-on-light' },
  { name: 'surface-content-light-muted', value: '#f6f6f4', varName: '--ds-surface-content-light-muted', tone: 'light', textVarName: '--ds-text-primary-on-light' },
];

const accentTokens: TokenItem[] = [
  { name: 'accent-primary-default', value: '#f0ba3e', varName: '--ds-accent-primary', tone: 'light', textVarName: '--ds-text-primary-on-light' },
  { name: 'accent-primary-hover', value: '#f4cb6d', varName: '--ds-accent-primary-hover', tone: 'light', textVarName: '--ds-text-primary-on-light' },
  { name: 'accent-primary-active', value: '#e9a812', varName: '--ds-accent-primary-active', tone: 'light', textVarName: '--ds-text-primary-on-light' },
  { name: 'accent-primary-subtle', value: 'rgba(240, 186, 62, 0.10)', varName: '--ds-accent-primary-subtle', tone: 'light', textVarName: '--ds-text-primary-on-light' },
  { name: 'accent-primary-border', value: 'rgba(240, 186, 62, 0.24)', varName: '--ds-accent-primary-border', tone: 'light', textVarName: '--ds-text-primary-on-light' },
  { name: 'accent-ai-default', value: '#7c3aed', varName: '--ds-accent-ai', tone: 'dark', textVarName: '--ds-text-primary-on-dark' },
  { name: 'accent-ai-hover', value: '#8b5cf6', varName: '--ds-accent-ai-hover', tone: 'dark', textVarName: '--ds-text-primary-on-dark' },
  { name: 'accent-ai-active', value: '#6425d0', varName: '--ds-accent-ai-active', tone: 'dark', textVarName: '--ds-text-primary-on-dark' },
  { name: 'accent-ai-subtle', value: 'rgba(124, 58, 237, 0.12)', varName: '--ds-accent-ai-subtle', tone: 'dark', textVarName: '--ds-text-primary-on-dark' },
  { name: 'accent-ai-border', value: 'rgba(124, 58, 237, 0.24)', varName: '--ds-accent-ai-border', tone: 'dark', textVarName: '--ds-text-primary-on-dark' },
];

const statusTokens: TokenItem[] = [
  { name: 'status-success', value: '#10b981', varName: '--ds-status-success', tone: 'light', textVarName: '--ds-text-primary-on-light' },
  { name: 'status-success-subtle', value: 'rgba(16, 185, 129, 0.12)', varName: '--ds-status-success-subtle', tone: 'light', textVarName: '--ds-text-primary-on-light' },
  { name: 'status-warning', value: '#f5920b', varName: '--ds-status-warning', tone: 'light', textVarName: '--ds-text-primary-on-light' },
  { name: 'status-warning-subtle', value: 'rgba(245, 146, 11, 0.12)', varName: '--ds-status-warning-subtle', tone: 'light', textVarName: '--ds-text-primary-on-light' },
  { name: 'status-neutral', value: '#687388', varName: '--ds-status-neutral', tone: 'light', textVarName: '--ds-text-primary-on-light' },
  { name: 'status-neutral-subtle', value: 'rgba(60, 66, 78, 0.10)', varName: '--ds-status-neutral-subtle', tone: 'light', textVarName: '--ds-text-primary-on-light' },
  { name: 'status-danger', value: '#dc2626', varName: '--ds-status-danger', tone: 'light', textVarName: '--ds-text-primary-on-light' },
  { name: 'status-danger-subtle', value: 'rgba(220, 38, 38, 0.12)', varName: '--ds-status-danger-subtle', tone: 'light', textVarName: '--ds-text-primary-on-light' },
];

const textTokens: TokenItem[] = [
  { name: 'text-primary-on-dark', value: '#ffffff', varName: '--ds-text-primary-on-dark', tone: 'dark', textVarName: '--ds-text-primary-on-dark' },
  { name: 'text-secondary-on-dark', value: '#e6e6e6', varName: '--ds-text-secondary-on-dark', tone: 'dark', textVarName: '--ds-text-primary-on-dark' },
  { name: 'text-muted-on-dark', value: '#687388', varName: '--ds-text-muted-on-dark', tone: 'dark', textVarName: '--ds-text-primary-on-dark' },
  { name: 'text-primary-on-light', value: '#10131d', varName: '--ds-text-primary-on-light', tone: 'light', textVarName: '--ds-text-primary-on-light' },
  { name: 'text-secondary-on-light', value: '#3c424e', varName: '--ds-text-secondary-on-light', tone: 'light', textVarName: '--ds-text-primary-on-light' },
  { name: 'text-muted-on-light', value: '#525a6b', varName: '--ds-text-muted-on-light', tone: 'light', textVarName: '--ds-text-primary-on-light' },
];

const borderTokens: TokenItem[] = [
  { name: 'border-subtle-on-dark', value: 'rgba(255, 255, 255, 0.08)', varName: '--ds-border-subtle-on-dark', tone: 'dark', textVarName: '--ds-text-primary-on-dark' },
  { name: 'border-strong-on-dark', value: 'rgba(255, 255, 255, 0.18)', varName: '--ds-border-strong-on-dark', tone: 'dark', textVarName: '--ds-text-primary-on-dark' },
  { name: 'border-subtle-on-light', value: 'rgba(60, 66, 78, 0.14)', varName: '--ds-border-subtle-on-light', tone: 'light', textVarName: '--ds-text-primary-on-light' },
  { name: 'border-strong-on-light', value: 'rgba(60, 66, 78, 0.28)', varName: '--ds-border-strong-on-light', tone: 'light', textVarName: '--ds-text-primary-on-light' },
];

function Icon({ name, size = 16, decorative = false }: { name: IconName; size?: number; decorative?: boolean }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': decorative || undefined,
    role: decorative ? 'presentation' : 'img',
  };

  if (name === 'check') return <svg {...common}><path d="M5 12.5l4.2 4.2L19 7" /></svg>;
  if (name === 'warning') return <svg {...common}><path d="M12 3.7l9 15.6H3L12 3.7z" /><path d="M12 9v4.5" /><path d="M12 17.6h.01" /></svg>;
  if (name === 'clock') return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 8v4.6l2.8 1.6" /></svg>;
  if (name === 'danger') return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M9.5 9.5l5 5" /><path d="M14.5 9.5l-5 5" /></svg>;
  if (name === 'spark') return <svg {...common}><path d="M12 3l2.2 4.7L19 10l-4.8 2.2L12 17l-2.2-4.8L5 10l4.8-2.3L12 3z" /></svg>;
  if (name === 'user') return <svg {...common}><circle cx="12" cy="8" r="3.5" /><path d="M5.5 19c1.8-3.4 4.4-5 6.5-5s4.7 1.6 6.5 5" /></svg>;
  if (name === 'shield') return <svg {...common}><path d="M12 3.5l7 2.7v5.7c0 4.7-2.9 8-7 9.8-4.1-1.8-7-5.1-7-9.8V6.2l7-2.7z" /></svg>;
  return <svg {...common}><path d="M6 6l12 12" /><path d="M18 6L6 18" /></svg>;
}

function SectionHeader({ section }: { section: Section }) {
  return (
    <header className={styles.sectionHeader}>
      <div className={styles.micro}>{section.number} - {section.title.toUpperCase()}</div>
      <h2>{section.title}</h2>
    </header>
  );
}

function TokenSwatch({ token }: { token: TokenItem }) {
  const toneClass = token.tone === 'dark' ? styles.swatchDark : styles.swatchLight;
  return (
    <article className={styles.swatchCard}>
      <div className={`${styles.swatch} ${toneClass}`} style={{ background: `var(${token.varName})` }}>
        <span style={{ color: `var(${token.textVarName})` }}>Aa</span>
      </div>
      <div className={styles.swatchMeta}>
        <strong>{token.name}</strong>
        <span>{token.value}</span>
      </div>
    </article>
  );
}

function StatusPill({ tone, label }: { tone: 'success' | 'warning' | 'neutral' | 'danger'; label: string }) {
  const iconMap = { success: 'check', warning: 'warning', neutral: 'clock', danger: 'danger' } as const;
  return (
    <span className={`${styles.pill} ${styles[`pill${tone[0].toUpperCase()}${tone.slice(1)}`]}`}>
      <Icon name={iconMap[tone]} size={14} decorative />
      {label}
    </span>
  );
}

function Button({
  variant,
  size,
  icon,
  trailing,
  loading,
  disabled,
  children,
}: {
  variant: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size: 'sm' | 'md' | 'lg';
  icon?: IconName;
  trailing?: IconName;
  loading?: boolean;
  disabled?: boolean;
  children: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`${styles.button} ${styles[`btn${variant[0].toUpperCase()}${variant.slice(1)}`]} ${styles[`btn${size.toUpperCase()}`]}`}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : icon ? <Icon name={icon} size={16} decorative /> : null}
      <span>{loading ? 'Loading' : children}</span>
      {!loading && trailing ? <Icon name={trailing} size={16} decorative /> : null}
    </button>
  );
}

function GlassModal({ open, onClose, onOpenedBy }: { open: boolean; onClose: () => void; onOpenedBy: React.RefObject<HTMLButtonElement | null> }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusables = modalRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    const first = modalRef.current?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    first?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      onOpenedBy.current?.focus();
    };
  }, [open, onClose, onOpenedBy]);

  if (!open) return null;

  return (
    <div className={styles.modalScrim} role="presentation" onClick={onClose}>
      <div className={styles.glassModal} role="dialog" aria-modal="true" aria-label="Glass surface modal" ref={modalRef} onClick={(event) => event.stopPropagation()}>
        <div className={styles.micro}>OVERLAY SURFACE</div>
        <h4>Decision checkpoint</h4>
        <p>Glass is reserved for temporary overlays, not dense table content. Escape closes, tab order is trapped, and focus returns to trigger.</p>
        <div className={styles.row}>
          <Button variant="primary" size="sm">Approve</Button>
          <Button variant="secondary" size="sm">Request review</Button>
        </div>
        <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close dialog">
          <Icon name="x" size={16} decorative />
        </button>
      </div>
    </div>
  );
}

export default function DesignSystemSpec() {
  const [active, setActive] = useState(sections[0].id);
  const [showGrid, setShowGrid] = useState(false);
  const [tab, setTab] = useState<'overview' | 'tokens' | 'patterns'>('overview');
  const [switchOn, setSwitchOn] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const modalTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0.01 }
    );

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    const closeDropdown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) setDropdownOpen(false);
    };

    document.addEventListener('mousedown', closeDropdown);
    return () => {
      document.removeEventListener('mousedown', closeDropdown);
      observer.disconnect();
    };
  }, []);

  const spacing = useMemo(
    () => [
      ['space-1', 4], ['space-2', 8], ['space-3', 12], ['space-4', 16], ['space-5', 24], ['space-6', 32], ['space-7', 40], ['space-8', 48], ['space-9', 64], ['space-10', 80],
    ] as const,
    []
  );

  const radii = useMemo(
    () => [
      ['radius-xs', 6, 'Tight controls'],
      ['radius-sm', 8, 'Inputs and compact buttons'],
      ['radius-md', 12, 'Cards and panels'],
      ['radius-lg', 16, 'Major surface containers'],
      ['radius-xl', 20, 'Feature containers'],
      ['radius-full', 999, 'Pills and rounded actions'],
    ] as const,
    []
  );

  const glassFormulaRows = [
    ['dark backdrop blur', '16px'],
    ['dark surface opacity', '92%'],
    ['dark hairline border', 'rgba(255,255,255,0.08)'],
    ['light backdrop blur', '12px'],
    ['light surface opacity', '86%'],
    ['light hairline border', 'rgba(16,19,29,0.12)'],
    ['motion easing', 'cubic-bezier(0.2, 0.8, 0.2, 1)'],
    ['motion duration', '280ms'],
  ] as const;

  const contrastChecks = useMemo(() => {
    const white = hexToRgb('#ffffff');
    const amber = hexToRgb('#f0ba3e');
    const violet = hexToRgb('#7c3aed');
    const canvas = hexToRgb('#10131d');
    const overlayBase = hexToRgb('#22293e');
    const glassComposite = compositeOver(overlayBase, 0.92, canvas);

    return [
      {
        pair: 'Amber on dark canvas',
        ratio: contrastRatio(amber, canvas),
      },
      {
        pair: 'Violet on dark canvas',
        ratio: contrastRatio(violet, canvas),
      },
      {
        pair: 'White text on glass surface',
        ratio: contrastRatio(white, glassComposite),
      },
    ];
  }, []);

  return (
    <main className={`${styles.root} ${showGrid ? styles.gridOn : ''}`}>
      <aside className={styles.stickyNav}>
        <div className={styles.brand}>VEYQOR Design System</div>
        <nav aria-label="Design system sections">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`${styles.jumpLink} ${active === section.id ? styles.jumpLinkActive : ''}`}
            >
              <span>{section.number}</span>
              <span>{section.title}</span>
            </a>
          ))}
        </nav>
        <button
          type="button"
          className={styles.gridToggle}
          onClick={() => setShowGrid((value) => !value)}
          aria-pressed={showGrid}
        >
          {showGrid ? 'Hide grid overlay' : 'Show grid overlay'}
        </button>
      </aside>

      <div className={styles.content}>
        <section id="philosophy" className={styles.section}>
          <SectionHeader section={sections[0]} />
          <div className={styles.philosophyHero}>
            <h1>AI can recommend. It cannot decide.</h1>
            <p>Restraint over decoration. Trust through clarity. Two accent colors, two jobs. Dark is home, light is content. Depth through layering, not shadow alone.</p>
          </div>
          <div className={styles.philosophyGrid}>
            <article>
              <h3>Restraint over decoration</h3>
              <p>Every gradient, blur and shadow has a structural job: hierarchy, state, or elevation.</p>
            </article>
            <article>
              <h3>Trust through clarity</h3>
              <p>Legibility and calm always outrank visual flair in governance-heavy workflows.</p>
            </article>
            <article>
              <h3>Two accent colors, two jobs</h3>
              <p>Amber for human action and primary moments. Violet for AI-originated content only.</p>
            </article>
            <article>
              <h3>Dark is home, light is content</h3>
              <p>Dark surfaces define product shell. Light surfaces carry dense, long-read information.</p>
            </article>
            <article>
              <h3>Depth through layering</h3>
              <p>Elevation comes from surface, translucency and border contrast before shadow intensity.</p>
            </article>
          </div>
        </section>

        <section id="colors" className={styles.section}>
          <SectionHeader section={sections[1]} />
          <div className={styles.tokenGroup}><h3>Base surfaces</h3><div className={styles.swatchGrid}>{baseSurfaces.map((token) => <TokenSwatch key={token.name} token={token} />)}</div></div>
          <div className={styles.tokenGroup}><h3>Accent</h3><div className={styles.swatchGrid}>{accentTokens.map((token) => <TokenSwatch key={token.name} token={token} />)}</div></div>
          <div className={styles.tokenGroup}><h3>Status</h3><div className={styles.swatchGrid}>{statusTokens.map((token) => <TokenSwatch key={token.name} token={token} />)}</div></div>
          <div className={styles.tokenGroup}><h3>Text</h3><div className={styles.swatchGrid}>{textTokens.map((token) => <TokenSwatch key={token.name} token={token} />)}</div></div>
          <div className={styles.tokenGroup}><h3>Borders & dividers</h3><div className={styles.swatchGrid}>{borderTokens.map((token) => <TokenSwatch key={token.name} token={token} />)}</div></div>
        </section>

        <section id="type" className={`${styles.section} ${styles.lightSection}`}>
          <SectionHeader section={sections[2]} />
          <p className={styles.metaLine}>Display/heading sans: Inter. Body sans: Inter. Micro metadata mono: IBM Plex Mono. Editorial serif accent: Source Serif 4.</p>
          <div className={styles.typeSpecimen}><div className={styles.display}>Display</div><div className={styles.specMeta}>80/700/1.04/-0.03em</div></div>
          <div className={styles.typeSpecimen}><h1>H1 heading scale</h1><div className={styles.specMeta}>56/700/1.08/-0.025em</div></div>
          <div className={styles.typeSpecimen}><h2>H2 heading scale</h2><div className={styles.specMeta}>46/700/1.12/-0.025em</div></div>
          <div className={styles.typeSpecimen}><h3>H3 heading scale</h3><div className={styles.specMeta}>30/700/1.2/-0.01em</div></div>
          <div className={styles.typeSpecimen}><h4>H4 heading scale</h4><div className={styles.specMeta}>24/700/1.3/0em</div></div>
          <div className={styles.typeSpecimen}><p className={styles.bodyLarge}>Body large supports key explanatory copy in sections.</p><div className={styles.specMeta}>17.5/500/1.6</div></div>
          <div className={styles.typeSpecimen}><p>Body default supports table and card content at normal density.</p><div className={styles.specMeta}>15/400/1.6</div></div>
          <div className={styles.typeSpecimen}><p className={styles.bodySmall}>Body small supports secondary details and metadata rows.</p><div className={styles.specMeta}>13.5/500/1.5</div></div>
          <div className={styles.typeSpecimen}><p className={styles.caption}>Caption text supports helper copy and evidence qualifiers.</p><div className={styles.specMeta}>12.5/500/1.4</div></div>
          <div className={styles.typeSpecimen}><p className={styles.label}>Label</p><div className={styles.specMeta}>11/600/1.2/0.08em</div></div>
          <div className={styles.typeSpecimen}><p className={styles.micro}>MATCH ENGINE ACTIVE</p><div className={styles.specMeta}>10.5/500/1.2/0.1em</div></div>

          <div className={styles.hierarchyCard}>
            <p className={styles.micro}>AI ADVISORY</p>
            <h3>Strong candidate fit</h3>
            <p className={styles.bodySmall}>The hierarchy pairs micro mono metadata, clear heading, and explanatory body without introducing visual noise.</p>
          </div>
        </section>

        <section id="layout" className={styles.section}>
          <SectionHeader section={sections[3]} />
          <div className={styles.layoutGrid}>
            <article>
              <h3>Container</h3>
              <p>Max width: 1240px. Side paddings: 32px desktop, 20px mobile.</p>
            </article>
            <article>
              <h3>Breakpoints</h3>
              <ul>
                <li>sm: 640px</li>
                <li>md: 700px</li>
                <li>lg: 760px</li>
                <li>xl: 900px</li>
              </ul>
            </article>
            <article>
              <h3>Grid</h3>
              <p>Desktop 12 columns/24px gutters. Tablet 8 columns/20px gutters. Mobile 4 columns/16px gutters.</p>
            </article>
          </div>
          <div className={styles.gridDemo}>
            {Array.from({ length: 12 }).map((_, index) => <span key={index} />)}
          </div>
        </section>

        <section id="spacing" className={`${styles.section} ${styles.lightSection}`}>
          <SectionHeader section={sections[4]} />
          <p className={styles.metaLine}>8px base scale with 4px half-step only for tight icon-to-label contexts.</p>
          <div className={styles.scaleRows}>
            {spacing.map(([name, value]) => (
              <div key={name} className={styles.scaleRow}>
                <div className={styles.scaleLabel}>{name}</div>
                <div className={styles.scaleBarWrap}><div className={styles.scaleBar} style={{ width: `${value * 3}px` }} /></div>
                <div className={styles.scaleValue}>{value}px</div>
              </div>
            ))}
          </div>
        </section>

        <section id="radius" className={styles.section}>
          <SectionHeader section={sections[5]} />
          <p className={styles.metaLine}>Buttons and pills intentionally lean rounder than cards to signal action versus container.</p>
          <div className={styles.radiusGrid}>
            {radii.map(([name, value, use]) => (
              <article key={name} className={styles.radiusCard}>
                <div className={styles.radiusSwatch} style={{ borderRadius: value === 999 ? '999px' : `${value}px` }} />
                <strong>{name}</strong>
                <span>{value === 999 ? 'full' : `${value}px`}</span>
                <p>{use}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="elevation" className={`${styles.section} ${styles.lightSection}`}>
          <SectionHeader section={sections[6]} />
          <div className={styles.elevationGrid}>
            <article className={`${styles.elevCard} ${styles.elev0}`}><h4>elevation-0</h4><p>Flat on-canvas</p></article>
            <article className={`${styles.elevCard} ${styles.elev1}`}><h4>elevation-1</h4><p>Card resting state</p></article>
            <article className={`${styles.elevCard} ${styles.elev2}`}><h4>elevation-2</h4><p>Hover or active card</p></article>
            <article className={`${styles.elevCard} ${styles.elev3}`}><h4>elevation-3</h4><p>Modal and popover</p></article>
          </div>
          <table className={styles.table}>
            <thead><tr><th>Level</th><th>Dark context</th><th>Light context</th></tr></thead>
            <tbody>
              <tr><td>elevation-0</td><td>border only</td><td>border only</td></tr>
              <tr><td>elevation-1</td><td>0 8 30 rgba(0,0,0,0.25)</td><td>0 12 30 rgba(16,19,29,0.08)</td></tr>
              <tr><td>elevation-2</td><td>0 18 44 rgba(0,0,0,0.34)</td><td>0 20 48 rgba(16,19,29,0.14)</td></tr>
              <tr><td>elevation-3</td><td>0 30 70 rgba(0,0,0,0.55)</td><td>0 28 60 rgba(16,19,29,0.24)</td></tr>
            </tbody>
          </table>
        </section>

        <section id="glass" className={styles.section}>
          <SectionHeader section={sections[7]} />
          <p className={styles.metaLine}>Glass applies to floating AI panels, sticky headers, modals and menus. Dense tables remain solid.</p>
          <div className={styles.glassScene}>
            <div className={styles.glassNoise} />
            <article className={styles.glassCard}>
              <p className={styles.micro}>AI ADVISORY</p>
              <h4>Signal confidence: high</h4>
              <p>Glass card over a busy backdrop with preserved text contrast.</p>
            </article>
            <div className={styles.dropdownWrap} data-dropdown>
              <button type="button" className={styles.buttonSecondary} onClick={() => setDropdownOpen((v) => !v)} aria-expanded={dropdownOpen}>Open glass dropdown</button>
              {dropdownOpen ? (
                <div className={styles.glassDropdown} role="menu">
                  <button type="button" role="menuitem">View evidence</button>
                  <button type="button" role="menuitem">Audit timeline</button>
                  <button type="button" role="menuitem">Close recommendation</button>
                </div>
              ) : null}
            </div>
            <button type="button" className={styles.buttonPrimary} onClick={() => setModalOpen(true)} ref={modalTriggerRef}>Open glass modal</button>
          </div>
          <table className={styles.table}>
            <thead><tr><th>Recipe key</th><th>Value</th></tr></thead>
            <tbody>{glassFormulaRows.map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody>
          </table>
        </section>

        <section id="icons" className={`${styles.section} ${styles.lightSection}`}>
          <SectionHeader section={sections[8]} />
          <p className={styles.metaLine}>Icons are rounded-stroke line icons at 1.8px stroke. Sizes: 16 inline, 20 button-support, 24 large status points.</p>
          <div className={styles.iconGrid}>
            <article><Icon name="check" size={20} /><span>success/check</span></article>
            <article><Icon name="warning" size={20} /><span>warning/attention</span></article>
            <article><Icon name="clock" size={20} /><span>neutral/pending</span></article>
            <article><Icon name="danger" size={20} /><span>danger/block</span></article>
            <article><Icon name="spark" size={20} /><span>AI attributed</span></article>
            <article><Icon name="shield" size={20} /><span>governance</span></article>
            <article><Icon name="user" size={20} /><span>human actor</span></article>
          </div>
          <div className={styles.row}>
            <StatusPill tone="success" label="Strong" />
            <StatusPill tone="warning" label="Review" />
            <StatusPill tone="neutral" label="Pending" />
            <StatusPill tone="danger" label="Rejected" />
          </div>
        </section>

        <section id="buttons" className={styles.section}>
          <SectionHeader section={sections[9]} />
          <div className={styles.componentBlock}>
            <h3>Variants and sizes</h3>
            <div className={styles.buttonMatrix}>
              <Button variant="primary" size="sm" icon="spark">Primary</Button>
              <Button variant="primary" size="md" trailing="check">Primary</Button>
              <Button variant="primary" size="lg">Primary large</Button>
              <Button variant="secondary" size="sm">Secondary</Button>
              <Button variant="secondary" size="md">Secondary</Button>
              <Button variant="ghost" size="md">Ghost</Button>
              <Button variant="destructive" size="md" icon="danger">Destructive</Button>
              <Button variant="secondary" size="md" icon="user" trailing="x">Icon + label</Button>
              <Button variant="primary" size="md" loading>Loading</Button>
              <Button variant="primary" size="md" disabled>Disabled</Button>
            </div>
          </div>
        </section>

        <section id="inputs" className={`${styles.section} ${styles.lightSection}`}>
          <SectionHeader section={sections[10]} />
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.label}>Text input</span>
              <input type="text" defaultValue="Sarah Williams" className={styles.input} />
              <small>Default helper text</small>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Focused input</span>
              <input type="text" className={`${styles.input} ${styles.focusMock}`} defaultValue="" placeholder="Focus ring sample" />
              <small>Focus is ring + border, not border alone</small>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Error input</span>
              <input type="email" className={`${styles.input} ${styles.error}`} defaultValue="sarah@" />
              <small className={styles.errorText}>Enter a valid work email</small>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Disabled input</span>
              <input type="text" className={styles.input} defaultValue="Disabled" disabled />
              <small>Disabled state</small>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Textarea</span>
              <textarea className={styles.input} rows={4} defaultValue="Reasoning notes and evidence summary." />
              <small>Supports long-form review notes</small>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Select</span>
              <select className={styles.input} defaultValue="review">
                <option value="review">Needs review</option>
                <option value="advance">Advance</option>
                <option value="reject">Reject</option>
              </select>
              <small>Dropdown follows same field shell</small>
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.choice}><input type="checkbox" defaultChecked /> Include AI rationale</label>
            <label className={styles.choice}><input type="radio" name="decision" defaultChecked /> Approve</label>
            <label className={styles.choice}><input type="radio" name="decision" /> Request review</label>
            <button type="button" className={`${styles.switch} ${switchOn ? styles.switchOn : ''}`} onClick={() => setSwitchOn((v) => !v)} role="switch" aria-checked={switchOn}>
              <span />
              <b>{switchOn ? 'On' : 'Off'}</b>
            </button>
          </div>
        </section>

        <section id="cards" className={styles.section}>
          <SectionHeader section={sections[11]} />
          <div className={styles.cardGallery}>
            <article className={styles.metricCard}><span className={styles.metricValue}>124</span><span className={styles.metricLabel}>Candidates</span></article>
            <article className={styles.candidateCard}>
              <p className={styles.micro}>CANDIDATE INTELLIGENCE</p>
              <h4>Sarah Williams</h4>
              <p>Senior Product Designer</p>
              <div className={styles.progress}><span style={{ width: '87%' }} /></div>
              <div className={styles.row}><StatusPill tone="success" label="Strong" /><StatusPill tone="neutral" label="Pending" /></div>
            </article>
            <article className={styles.aiCard}>
              <p className={styles.micro}><Icon name="spark" size={12} decorative /> AI ADVISORY</p>
              <h4>Strong candidate fit</h4>
              <p>Skills alignment 92% · Experience alignment 88%</p>
            </article>
            <article className={styles.governanceCard}>
              <p className={styles.micro}>GOVERNANCE CHECKPOINT</p>
              <h4>Human decision required</h4>
              <div className={styles.row}><Button variant="primary" size="sm">Approve</Button><Button variant="secondary" size="sm">Review</Button></div>
            </article>
            <article className={styles.genericCard}>
              <h4>Generic content card</h4>
              <p>Base container with standard radius, border and elevation token pairing.</p>
            </article>
            <article className={styles.skeletonCard} aria-label="Loading skeleton card">
              <span /><span /><span />
            </article>
          </div>
        </section>

        <section id="badges" className={`${styles.section} ${styles.lightSection}`}>
          <SectionHeader section={sections[12]} />
          <div className={styles.row}>
            <StatusPill tone="success" label="Strong" />
            <StatusPill tone="warning" label="Review" />
            <StatusPill tone="neutral" label="Pending" />
            <StatusPill tone="danger" label="Blocked" />
            <span className={styles.aiTag}><Icon name="spark" size={12} decorative /> AI Advisory</span>
            <span className={styles.chip}>Role: Product</span>
            <button type="button" className={styles.chipRemovable}>Location: Remote <Icon name="x" size={12} decorative /></button>
            <span className={styles.countBadge}>9</span>
          </div>
        </section>

        <section id="navigation" className={styles.section}>
          <SectionHeader section={sections[13]} />
          <div className={styles.navShowcase}>
            <div className={styles.topNavSample}>
              <span className={styles.brandMark}>VEYQOR</span>
              <div className={styles.navLinks}>
                <a href="#">Product</a>
                <a href="#" className={styles.current}>Platform</a>
                <a href="#">Governance</a>
              </div>
              <div className={styles.row}><Button variant="ghost" size="sm">Sign in</Button><Button variant="primary" size="sm">Request demo</Button></div>
            </div>
            <div className={styles.tabs} role="tablist" aria-label="Design system tabs">
              <button type="button" role="tab" aria-selected={tab === 'overview'} className={tab === 'overview' ? styles.tabActive : ''} onClick={() => setTab('overview')}>Overview</button>
              <button type="button" role="tab" aria-selected={tab === 'tokens'} className={tab === 'tokens' ? styles.tabActive : ''} onClick={() => setTab('tokens')}>Tokens</button>
              <button type="button" role="tab" aria-selected={tab === 'patterns'} className={tab === 'patterns' ? styles.tabActive : ''} onClick={() => setTab('patterns')}>Patterns</button>
            </div>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <a href="#">Product</a>
              <span>/</span>
              <a href="#">Hiring</a>
              <span>/</span>
              <span aria-current="page">Decision Review</span>
            </nav>
            <p className={styles.metaLine}>Sidebar pattern is intentionally marked as placeholder until workflow IA is finalized.</p>
          </div>
        </section>

        <section id="accessibility" className={`${styles.section} ${styles.lightSection}`}>
          <SectionHeader section={sections[14]} />
          <ul className={styles.a11yList}>
            <li>Focus-visible is always present with a compliant ring replacement.</li>
            <li>Status is never color-only: each state pairs icon + text.</li>
            <li>Amber-on-dark, violet-on-dark and glass text contrast are validated at AA targets in implementation.</li>
            <li>Keyboard operability: tab order, enter/space actions, escape close, and modal focus return are implemented.</li>
            <li>Reduced-motion preference disables non-essential transitions and animated gradients.</li>
          </ul>
          <table className={styles.table}>
            <thead><tr><th>Contrast pair</th><th>Ratio</th><th>WCAG AA (4.5:1)</th></tr></thead>
            <tbody>
              {contrastChecks.map((check) => (
                <tr key={check.pair}>
                  <td>{check.pair}</td>
                  <td>{check.ratio.toFixed(2)}:1</td>
                  <td>{check.ratio >= 4.5 ? 'Pass' : 'Fail'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.a11yDemo}>
            <Button variant="primary" size="md" icon="check">Focusable control</Button>
            <Button variant="secondary" size="md" icon="warning">Focusable control</Button>
            <StatusPill tone="warning" label="Review required" />
          </div>
        </section>
      </div>

      <GlassModal open={modalOpen} onClose={() => setModalOpen(false)} onOpenedBy={modalTriggerRef} />
    </main>
  );
}
