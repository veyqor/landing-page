'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockAuthGateway, type AuthSession } from '@/lib/auth/mockAuthGateway';
import intakeStyles from '../job-intake/page.module.css';
import styles from './page.module.css';

type NavItem = {
  id: string;
  label: string;
  href: string;
};

type ShortlistedCandidate = {
  id: string;
  code: string;
  name: string;
  initials: string;
  role: string;
  experience: string;
  location: string;
  skills: string[];
  matchScore: number;
  matchCategory: 'strong' | 'potential';
  requiredCriteriaResult: string;
  whyRecommended: string;
  criteriaChecklist: {
    id: string;
    title: string;
    status: 'passed' | 'attention';
    desc: string;
    evidence?: string;
  }[];
};

const WORKFLOW_STEPS = [
  'Signal Intake',
  'Criteria',
  'Approval',
  'Candidate Intake',
  'Processing',
  'Review',
  'Shortlist',
];

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'cases', label: 'Cases', href: '#' },
  { id: 'review', label: 'Review queues', href: '#' },
  { id: 'notifications', label: 'Notifications', href: '#' },
  { id: 'audit', label: 'Audit', href: '#' },
  { id: 'settings', label: 'Settings', href: '#' },
];

const INITIAL_SHORTLIST: ShortlistedCandidate[] = [
  {
    id: 'cand-024',
    code: 'Candidate 024',
    name: 'Alexandre Morgan',
    initials: 'AM',
    role: 'Senior Product Designer',
    experience: '8+ years',
    location: 'Lagos / Remote',
    skills: ['Product systems', 'SaaS', 'Design systems', 'Cross-functional leadership', 'Figma'],
    matchScore: 94,
    matchCategory: 'strong',
    requiredCriteriaResult: '5/5 required criteria',
    whyRecommended: 'Strong evidence of leading product systems across enterprise SaaS products, with demonstrated cross-functional leadership and delivery impact.',
    criteriaChecklist: [
      {
        id: 'c1',
        title: 'Qualification & Background',
        status: 'passed',
        desc: 'B.Sc in Human-Computer Interaction & 8+ years leading enterprise product design teams.',
        evidence: 'Verified transcript from University of Waterloo & verified reference from Stripe design leadership.',
      },
      {
        id: 'c2',
        title: 'Technical capability & Systems design',
        status: 'passed',
        desc: 'Hands-on experience with TypeScript, React component libraries, and tokenized design systems.',
        evidence: 'Authored multi-brand design tokens used across 14 product modules at previous enterprise role.',
      },
      {
        id: 'c3',
        title: 'Domain experience (B2B SaaS)',
        status: 'passed',
        desc: '6+ years designing complex workflow interfaces for governance and compliance platforms.',
      },
    ],
  },
  {
    id: 'cand-012',
    code: 'Candidate 012',
    name: 'Elena Rostova',
    initials: 'ER',
    role: 'Lead Product Designer',
    experience: '9+ years',
    location: 'London / Remote',
    skills: ['Design systems', 'UX Architecture', 'B2B Platforms', 'Prototyping'],
    matchScore: 91,
    matchCategory: 'strong',
    requiredCriteriaResult: '5/5 required criteria',
    whyRecommended: 'Extensive track record of architecting scalable design systems for financial and recruiting software.',
    criteriaChecklist: [
      {
        id: 'c1',
        title: 'Qualification & Background',
        status: 'passed',
        desc: 'Master of Fine Arts in Digital Design. 9+ years industry practice.',
      },
      {
        id: 'c2',
        title: 'Technical capability',
        status: 'passed',
        desc: 'Proficient in CSS architecture, Web Components, and React prototyping.',
      },
    ],
  },
  {
    id: 'cand-038',
    code: 'Candidate 038',
    name: 'Marcus Vance',
    initials: 'MV',
    role: 'Staff Product Architect',
    experience: '10+ years',
    location: 'Remote',
    skills: ['Enterprise SaaS', 'Complex workflows', 'User Research', 'Design Operations'],
    matchScore: 89,
    matchCategory: 'strong',
    requiredCriteriaResult: '5/5 required criteria',
    whyRecommended: 'Deep experience designing high-throughput administrative platforms with strict audit requirements.',
    criteriaChecklist: [
      {
        id: 'c1',
        title: 'Qualification & Background',
        status: 'passed',
        desc: 'B.Sc Computer Science & 10 years experience.',
      },
    ],
  },
  {
    id: 'cand-045',
    code: 'Candidate 045',
    name: 'Ketan Patel',
    initials: 'KP',
    role: 'Senior Product Designer',
    experience: '7+ years',
    location: 'Lagos / Hybrid',
    skills: ['Design tokens', 'SaaS', 'Accessibility', 'Figma'],
    matchScore: 88,
    matchCategory: 'strong',
    requiredCriteriaResult: '5/5 required criteria',
    whyRecommended: 'Specialist in accessibility compliance and design systems for enterprise web applications.',
    criteriaChecklist: [
      {
        id: 'c1',
        title: 'Accessibility & Design Tokens',
        status: 'passed',
        desc: 'WCAG AAA compliance certified.',
      },
    ],
  },
  {
    id: 'cand-019',
    code: 'Candidate 019',
    name: 'Sophia Chen',
    initials: 'SC',
    role: 'Senior UI/UX Specialist',
    experience: '6+ years',
    location: 'Remote',
    skills: ['Figma', 'UI Animation', 'Design Tokens', 'User Testing'],
    matchScore: 85,
    matchCategory: 'potential',
    requiredCriteriaResult: '4/5 required criteria',
    whyRecommended: 'Strong UI craft and visual polish; primary experience in consumer platforms rather than B2B compliance.',
    criteriaChecklist: [
      {
        id: 'c1',
        title: 'Visual Polish & Prototyping',
        status: 'passed',
        desc: 'Expert high-fidelity design output.',
      },
    ],
  },
  {
    id: 'cand-052',
    code: 'Candidate 052',
    name: 'Liam O’Connor',
    initials: 'LO',
    role: 'Product Designer',
    experience: '5+ years',
    location: 'Remote',
    skills: ['User Research', 'Prototyping', 'Design Systems'],
    matchScore: 82,
    matchCategory: 'strong',
    requiredCriteriaResult: '5/5 required criteria',
    whyRecommended: 'Proven researcher and systems practitioner with strong collaboration skills.',
    criteriaChecklist: [
      {
        id: 'c1',
        title: 'Research & Collaboration',
        status: 'passed',
        desc: 'Strong user testing background.',
      },
    ],
  },
];

function roleLabel(role: AuthSession['role']) {
  if (role === 'administrator') return 'Administrator';
  if (role === 'reviewer') return 'Reviewer';
  if (role === 'leadership') return 'Leadership/Oversight';
  return 'Recruitment Operator';
}

function ShellIcon({ id }: { id: NavItem['id'] }) {
  if (id === 'dashboard') return <span aria-hidden="true">⌂</span>;
  if (id === 'cases') return <span aria-hidden="true">◫</span>;
  if (id === 'review') return <span aria-hidden="true">◎</span>;
  if (id === 'notifications') return <span aria-hidden="true">◉</span>;
  if (id === 'audit') return <span aria-hidden="true">◌</span>;
  return <span aria-hidden="true">⚙</span>;
}

export default function ShortlistReviewPage() {
  const router = useRouter();

  const [session, setSession] = useState<AuthSession | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [orgName, setOrgName] = useState('');

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [shortlist, setShortlist] = useState<ShortlistedCandidate[]>(INITIAL_SHORTLIST);
  const [activeDrawerCandidate, setActiveDrawerCandidate] = useState<ShortlistedCandidate | null>(null);
  const [removedCandidateToast, setRemovedCandidateToast] = useState<{ candidate: ShortlistedCandidate; index: number } | null>(null);
  const [decisionCompleted, setDecisionCompleted] = useState<null | 'veyqor' | 'manual'>(null);

  useEffect(() => {
    const activeSession = mockAuthGateway.getSession();
    if (!activeSession) {
      router.replace('/sign-in');
      return;
    }
    setSession(activeSession);
    setTenantName('Acme Global Operations');
    setOrgName('Product & Engineering Workspace');
  }, [router]);

  const metrics = useMemo(() => {
    const total = shortlist.length;
    const strong = shortlist.filter((c) => c.matchCategory === 'strong').length;
    const potential = shortlist.filter((c) => c.matchCategory === 'potential').length;
    return { total, strong, potential };
  }, [shortlist]);

  function handleRemoveCandidate(id: string) {
    const index = shortlist.findIndex((c) => c.id === id);
    if (index !== -1) {
      const removed = shortlist[index];
      setShortlist((prev) => prev.filter((c) => c.id !== id));
      setRemovedCandidateToast({ candidate: removed, index });
    }
  }

  function handleUndoRemove() {
    if (removedCandidateToast) {
      setShortlist((prev) => {
        const next = [...prev];
        next.splice(removedCandidateToast.index, 0, removedCandidateToast.candidate);
        return next;
      });
      setRemovedCandidateToast(null);
    }
  }

  if (!session) {
    return (
      <main className={intakeStyles.page}>
        <div className={intakeStyles.skeletonSurface}>
          <span className={intakeStyles.skeletonLine} />
          <span className={intakeStyles.skeletonBlock} />
        </div>
      </main>
    );
  }

  return (
    <main className={intakeStyles.page}>
      <div className={`${intakeStyles.appShell} ${sidebarCollapsed ? intakeStyles.appShellCollapsed : ''}`}>
        {/* MOBILE HEADER */}
        <header className={intakeStyles.mobileHeader}>
          <button
            type="button"
            className={intakeStyles.mobileMenuButton}
            onClick={() => setMobileNavOpen((current) => !current)}
            aria-label="Open menu"
          >
            <span className={intakeStyles.mobileMenuBars} aria-hidden="true" />
          </button>
          <Image src="/Untitled design - 2026-08-10T155155.182.png" alt="Veyqor" width={130} height={34} className={intakeStyles.mobileMark} priority />
        </header>

        {/* SIDEBAR */}
        <aside className={intakeStyles.sidebar}>
          <div className={intakeStyles.sidebarTop}>
            <div className={intakeStyles.brandRow}>
              <span className={intakeStyles.brandShield} aria-hidden="true">◈</span>
              {!sidebarCollapsed ? <Image src="/logo.png" alt="Veyqor" width={124} height={32} className={intakeStyles.sidebarMark} /> : null}
            </div>
            {!sidebarCollapsed ? (
              <div className={intakeStyles.workspaceContext}>
                <small>Workspace context</small>
                <strong>{orgName}</strong>
                <p>{tenantName}</p>
              </div>
            ) : null}
          </div>

          <nav className={intakeStyles.sidebarNav} aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className={`${intakeStyles.navItem} ${item.id === 'cases' ? intakeStyles.navItemActive : ''}`}
              >
                <span className={intakeStyles.navIcon}><ShellIcon id={item.id} /></span>
                {!sidebarCollapsed ? <span>{item.label}</span> : null}
              </a>
            ))}
          </nav>

          <div className={intakeStyles.sidebarFoot}>
            <button
              type="button"
              className={intakeStyles.collapseButton}
              onClick={() => setSidebarCollapsed((current) => !current)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <span aria-hidden="true">{sidebarCollapsed ? '»' : '«'}</span>
            </button>
          </div>
        </aside>

        {/* MAIN WORKSPACE WRAPPER */}
        <div className={intakeStyles.mainWrap}>
          {/* TOP APPLICATION HEADER */}
          <header className={intakeStyles.topHeader}>
            <div className={intakeStyles.topHeaderLeft}>
              <button
                type="button"
                className={intakeStyles.collapseButtonInline}
                onClick={() => setSidebarCollapsed((current) => !current)}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? '»' : '«'}
              </button>
              <Image src="/Untitled design - 2026-08-10T155155.182.png" alt="Veyqor" width={134} height={34} className={intakeStyles.mark} priority />
            </div>

            <div className={intakeStyles.topHeaderRight}>
              <button type="button" className={intakeStyles.iconButton} aria-label="Notifications">◦</button>
              <div className={intakeStyles.topMeta}>
                <span className={intakeStyles.contextLabel}>Workspace</span>
                <strong>{orgName}</strong>
                <small>{tenantName}</small>
              </div>
              <button type="button" className={intakeStyles.userButton} aria-label="User menu">
                <span className={intakeStyles.avatar}>{session.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                <span className={intakeStyles.userMeta}>
                  <strong>{session.fullName}</strong>
                  <small>{roleLabel(session.role)}</small>
                </span>
                <span className={intakeStyles.userCaret} aria-hidden="true">⌄</span>
              </button>
            </div>
          </header>

          <div className={styles.contentContainer}>
            {/* WORKFLOW PROGRESS STEPPER */}
            <div className={intakeStyles.stepper} aria-label="Workflow progress">
              {WORKFLOW_STEPS.map((step, index) => {
                const isComplete = index < 6;
                const isActive = index === 6;
                return (
                  <div
                    key={step}
                    className={`${intakeStyles.step} ${isComplete ? intakeStyles.stepComplete : ''} ${isActive ? intakeStyles.stepActive : ''}`}
                  >
                    <span>{isComplete ? '✓' : index + 1}</span>
                    <p>{step}</p>
                  </div>
                );
              })}
            </div>

            {/* PAGE HEADER */}
            <header className={styles.pageHeader}>
              <span className={styles.breadcrumb}>Candidate Review / Shortlist Review</span>
              <h1 className={styles.mainTitle}>Shortlist review</h1>
              <p className={styles.mainSubtitle}>
                You&apos;ve selected candidates to move forward. Review your shortlist and choose what happens next.
              </p>
              <div className={styles.jobContextRow}>
                <span className={styles.jobTitleBadge}>Senior Product Designer</span>
                <span className={styles.contextDot}>•</span>
                <span>Product Design</span>
                <span className={styles.contextDot}>•</span>
                <span>Senior level</span>
                <span className={styles.contextDot}>•</span>
                <span>Full-time</span>
                <span className={styles.contextDot}>•</span>
                <span>Lagos or Remote</span>
              </div>
            </header>

            {/* SHORTLIST SUMMARY BANNER */}
            <section className={styles.summaryBanner} aria-label="Shortlist Summary">
              <div className={styles.summaryBannerLeft}>
                <div className={styles.summaryIcon}>✓</div>
                <div>
                  <h2 className={styles.summaryTitle}>{metrics.total} candidates shortlisted</h2>
                  <p className={styles.summaryDesc}>
                    Your shortlist is ready. Choose how you&apos;d like to proceed.
                  </p>
                </div>
              </div>

              <div className={styles.metricsRow}>
                <div className={styles.metricBadge}>
                  <span className={`${styles.metricDot} ${styles.dotSuccess}`} />
                  <span>{metrics.total} Selected</span>
                </div>
                <div className={styles.metricBadge}>
                  <span className={`${styles.metricDot} ${styles.dotSuccess}`} />
                  <span>{metrics.strong} Strong matches</span>
                </div>
                <div className={styles.metricBadge}>
                  <span className={`${styles.metricDot} ${styles.dotWarning}`} />
                  <span>{metrics.potential} Potential match</span>
                </div>
                <div className={styles.metricBadge}>
                  <span className={`${styles.metricDot} ${styles.dotNeutral}`} />
                  <span>0 Issues</span>
                </div>
              </div>
            </section>

            {/* MAIN TWO-COLUMN WORKSPACE */}
            <div className={styles.layoutGrid}>
              {/* LEFT COLUMN: SHORTLISTED CANDIDATE ROWS */}
              <div className={styles.leftColumn}>
                <div className={styles.sectionHeader}>
                  <h2>Your shortlisted candidates</h2>
                  <p>Candidates selected from the processed applicant pool.</p>
                </div>

                <div className={styles.candidateSurface}>
                  {shortlist.length > 0 ? (
                    shortlist.map((candidate) => (
                      <div key={candidate.id} className={styles.candidateRow}>
                        <div className={styles.candidateInfo}>
                          <div className={styles.candidateAvatar}>{candidate.initials}</div>
                          <div className={styles.candidateMeta}>
                            <h4>{candidate.code}</h4>
                            <p>{candidate.role} • {candidate.experience} • {candidate.location}</p>
                          </div>
                        </div>

                        <div className={styles.skillsTags}>
                          {candidate.skills.slice(0, 3).map((skill) => (
                            <span key={skill} className={styles.skillTag}>{skill}</span>
                          ))}
                          {candidate.skills.length > 3 ? (
                            <span className={styles.moreSkillsTag}>+{candidate.skills.length - 3} more</span>
                          ) : null}
                        </div>

                        <div className={styles.scoreBox}>
                          <div
                            className={`${styles.scoreCircle} ${
                              candidate.matchCategory === 'potential' ? styles.scoreCirclePotential : ''
                            }`}
                          >
                            {candidate.matchScore}%
                          </div>
                          <span
                            className={`${styles.scoreLabel} ${
                              candidate.matchCategory === 'potential' ? styles.labelPotential : styles.labelEligible
                            }`}
                          >
                            {candidate.matchCategory === 'strong' ? 'Strong match' : 'Potential'}
                          </span>
                        </div>

                        <div className={styles.criteriaSummary}>
                          <span>{candidate.requiredCriteriaResult}</span>
                        </div>

                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.detailsBtn}
                            onClick={() => setActiveDrawerCandidate(candidate)}
                          >
                            View details →
                          </button>
                          <button
                            type="button"
                            className={styles.removeBtn}
                            onClick={() => handleRemoveCandidate(candidate.id)}
                            title="Remove from shortlist"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#10131d' }}>No candidates shortlisted yet</h4>
                      <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                        Review your processed candidates and select the people you&apos;d like to move forward.
                      </p>
                      <button
                        type="button"
                        className={styles.outlineSecondaryBtn}
                        style={{ width: 'auto', marginTop: '16px', padding: '0 20px' }}
                        onClick={() => router.push('/eligibility-review')}
                      >
                        Review candidates →
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: DECISION PANEL */}
              <div className={styles.rightColumn}>
                {/* SHORTLIST SUMMARY CARD */}
                <div className={styles.decisionCard}>
                  <h3 className={styles.decisionCardTitle}>Shortlist summary</h3>
                  <div className={styles.summaryBulletList}>
                    <div className={styles.bulletItem}>
                      <span className={styles.bulletCheck}>✓</span>
                      <div>
                        <strong>Strong alignment</strong>
                        <p>{metrics.strong} candidates strongly meet the required hiring criteria.</p>
                      </div>
                    </div>
                    <div className={styles.bulletItem}>
                      <span className={styles.bulletCheck}>✓</span>
                      <div>
                        <strong>High confidence</strong>
                        <p>Shortlisted candidates show verified evidence against approved criteria.</p>
                      </div>
                    </div>
                    <div className={styles.bulletItem}>
                      <span className={styles.bulletCheck}>✓</span>
                      <div>
                        <strong>Relevant experience</strong>
                        <p>Candidates demonstrate required B2B product and systems expertise.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BEFORE YOU CONTINUE CARD */}
                <div className={styles.decisionCard}>
                  <h3 className={styles.decisionCardTitle}>Before you continue</h3>
                  <div className={styles.beforeContinueBox}>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>
                    <span><strong>No outstanding issues.</strong> All candidates in your shortlist are cleared to proceed.</span>
                  </div>
                </div>

                {/* WHAT WOULD YOU LIKE TO DO NEXT? (DECISION CARDS) */}
                <div className={styles.nextOptionsCard}>
                  <div>
                    <h3 className={styles.decisionCardTitle}>What would you like to do next?</h3>
                    <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                      Choose how you&apos;d like to proceed with these shortlisted candidates.
                    </p>
                  </div>

                  {/* OPTION 1: CONTINUE WITH VEYQOR (PRIMARY RECOMMENDED) */}
                  <div className={styles.optionCardPrimary}>
                    <div className={styles.optionHeader}>
                      <span className={styles.optionTitle}>Continue with VEYQOR</span>
                      <span className={styles.optionBadge}>Recommended</span>
                    </div>
                    <p className={styles.optionDesc}>
                      Let VEYQOR manage the next stage, including candidate outreach and automated assessment based on your approved criteria.
                    </p>
                    <button
                      type="button"
                      className={styles.purplePrimaryBtn}
                      onClick={() => {
                        setDecisionCompleted('veyqor');
                        setTimeout(() => router.push('/candidate-engagement'), 1000);
                      }}
                    >
                      <span>Continue with VEYQOR</span>
                      <span>→</span>
                    </button>
                  </div>

                  {/* OPTION 2: MANAGE CANDIDATES MYSELF (SECONDARY) */}
                  <div className={styles.optionCardSecondary}>
                    <span className={styles.optionTitle}>Manage candidates myself</span>
                    <p className={styles.optionDesc}>
                      Keep the shortlist in VEYQOR and manage candidate communication and next steps yourself.
                    </p>
                    <button
                      type="button"
                      className={styles.outlineSecondaryBtn}
                      onClick={() => {
                        setDecisionCompleted('manual');
                        setTimeout(() => router.push('/candidate-management'), 1000);
                      }}
                    >
                      Manage candidates myself →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CANDIDATE DETAIL DRAWER */}
        {activeDrawerCandidate ? (
          <>
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(3px)',
                zIndex: 200,
              }}
              onClick={() => setActiveDrawerCandidate(null)}
              aria-hidden="true"
            />
            <div
              style={{
                position: 'fixed',
                right: 0,
                top: 0,
                bottom: 0,
                width: 'min(500px, 100%)',
                background: '#ffffff',
                boxShadow: '-10px 0 40px rgba(15, 23, 42, 0.15)',
                zIndex: 201,
                display: 'flex',
                flexDirection: 'column',
                padding: '24px',
                gap: '20px',
                overflowY: 'auto',
              }}
              role="dialog"
              aria-modal="true"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#10131d' }}>{activeDrawerCandidate.code}</h3>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                    {activeDrawerCandidate.role} • {activeDrawerCandidate.experience} • {activeDrawerCandidate.location}
                  </p>
                </div>
                <button
                  type="button"
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(60,66,78,0.16)',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setActiveDrawerCandidate(null)}
                >
                  ✕
                </button>
              </div>

              <div
                style={{
                  background: 'rgba(124, 58, 237, 0.05)',
                  border: '1px solid rgba(124, 58, 237, 0.16)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#5b21b6', marginBottom: '6px' }}>
                  Why VEYQOR recommended this candidate
                </h4>
                <p style={{ fontSize: '13px', color: '#4c1d95', lineHeight: 1.5 }}>
                  {activeDrawerCandidate.whyRecommended}
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '12px' }}>Criteria match results</h4>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {activeDrawerCandidate.criteriaChecklist.map((item) => (
                    <div key={item.id} style={{ borderBottom: '1px solid rgba(60,66,78,0.08)', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '13.5px' }}>
                        <span style={{ color: '#10b981' }}>✓</span>
                        <span>{item.title}</span>
                      </div>
                      <p style={{ fontSize: '12.5px', color: '#525a6b', marginLeft: '22px', marginTop: '4px' }}>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}

        {/* TOAST NOTIFICATION ON REMOVAL */}
        {removedCandidateToast ? (
          <div className={styles.toast}>
            <span>{removedCandidateToast.candidate.code} removed from shortlist</span>
            <button type="button" className={styles.undoBtn} onClick={handleUndoRemove}>
              Undo
            </button>
          </div>
        ) : null}

        {/* SUCCESS CONFIRMATION TOAST */}
        {decisionCompleted ? (
          <div className={styles.toast} style={{ background: '#059669' }}>
            <span>
              {decisionCompleted === 'veyqor'
                ? '✓ VEYQOR is taking over candidate outreach & assessment!'
                : '✓ Shortlist saved. Redirecting to workspace...'}
            </span>
          </div>
        ) : null}
      </div>
    </main>
  );
}
