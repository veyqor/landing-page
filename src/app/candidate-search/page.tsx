'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockAuthGateway, type AuthSession } from '@/lib/auth/mockAuthGateway';
import intakeStyles from '../job-intake/page.module.css';
import styles from './page.module.css';

type NavItem = {
  id: string;
  label: string;
  href: string;
};

const WORKFLOW_STEPS = [
  'Signal Intake',
  'Criteria',
  'Approval',
  'Candidate Search',
  'Candidate Processing',
  'Review',
];

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'cases', label: 'Cases', href: '#' },
  { id: 'review', label: 'Review queues', href: '#' },
  { id: 'notifications', label: 'Notifications', href: '#' },
  { id: 'audit', label: 'Audit', href: '#' },
  { id: 'settings', label: 'Settings', href: '#' },
];

type SearchState = 'idle' | 'searching' | 'completed' | 'no_matches' | 'error';
type VolumeOption = '5-10' | '10-20' | '20-30';
type PriorityOption = 'strongest' | 'broader';

type ApprovedCriterion = {
  id: string;
  title: string;
  description: string;
  type: 'Required' | 'Preferred';
};

const APPROVED_CRITERIA: ApprovedCriterion[] = [
  {
    id: 'c1',
    title: 'Product Systems & UX Architecture',
    description: '6+ years designing scalable SaaS product systems and tokenized component libraries.',
    type: 'Required',
  },
  {
    id: 'c2',
    title: 'Enterprise SaaS Experience',
    description: 'Demonstrated experience designing complex multi-tenant workflows and data-dense dashboards.',
    type: 'Required',
  },
  {
    id: 'c3',
    title: 'Cross-functional Collaboration',
    description: 'Proven track record partnering directly with engineering leads and product managers.',
    type: 'Required',
  },
  {
    id: 'c4',
    title: 'Accessibility Standards (WCAG 2.1 AA)',
    description: 'Proficiency in building accessible, high-contrast interfaces for enterprise environments.',
    type: 'Required',
  },
  {
    id: 'c5',
    title: 'Design Leadership & Governance',
    description: 'Experience mentoring junior designers and establishing system governance models.',
    type: 'Preferred',
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

export default function CandidateSearchPage() {
  const router = useRouter();

  const [session, setSession] = useState<AuthSession | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [orgName, setOrgName] = useState('');

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Search preferences state
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [candidateVolume, setCandidateVolume] = useState<VolumeOption>('10-20');
  const [searchPriority, setSearchPriority] = useState<PriorityOption>('strongest');
  const [locationText, setLocationText] = useState('Lagos / Remote');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isCriteriaExpanded, setIsCriteriaExpanded] = useState(false);

  // Search progress animation state
  const [progressStep, setProgressStep] = useState(0);

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

  // Automated search simulation sequence
  useEffect(() => {
    if (searchState !== 'searching') return;

    setProgressStep(1); // Searching
    const t1 = setTimeout(() => setProgressStep(2), 2000); // Evaluating
    const t2 = setTimeout(() => setProgressStep(3), 4000); // Preparing shortlist
    const t3 = setTimeout(() => {
      setSearchState('completed');
    }, 5500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [searchState]);

  function handleStartSearch() {
    setSearchState('searching');
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
          {/* TOP HEADER */}
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
            {/* WORKFLOW STEPPER */}
            <div className={intakeStyles.stepper} aria-label="Workflow progress">
              {WORKFLOW_STEPS.map((step, index) => {
                const isComplete = index < 3;
                const isActive = index === 3;
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

            {/* STATE 1: IDLE / READY TO SEARCH */}
            {searchState === 'idle' ? (
              <>
                {/* PAGE HEADER */}
                <header className={styles.pageHeader}>
                  <span className={styles.eyebrow}>CANDIDATE SEARCH</span>
                  <h1 className={styles.mainTitle}>Find candidates with Veyqor</h1>
                  <p className={styles.mainSubtitle}>
                    Veyqor will search for candidates who match your approved criteria and surface the strongest matches for you to review.
                  </p>

                  <div className={styles.readyStatusBadge}>
                    <span>✓</span>
                    <span>Criteria approved · Ready to search</span>
                  </div>
                </header>

                {/* APPROVED JOB SUMMARY */}
                <div className={styles.summaryCard}>
                  <div className={styles.summaryCardHeader}>
                    <div>
                      <h3 className={styles.summaryJobTitle}>Senior Product Designer</h3>
                      <p className={styles.summaryJobMeta}>Senior · Full-time · {locationText}</p>
                    </div>
                    <span className={styles.criteriaCountBadge}>5 approved criteria</span>
                  </div>

                  <div className={styles.chipsWrapper}>
                    {APPROVED_CRITERIA.map((c) => (
                      <span key={c.id} className={styles.criteriaChip}>
                        <span>✓</span> {c.title.split('&')[0].trim()}
                      </span>
                    ))}
                  </div>

                  <div>
                    <button
                      type="button"
                      className={styles.accordionToggleBtn}
                      onClick={() => setIsCriteriaExpanded((prev) => !prev)}
                    >
                      <span>{isCriteriaExpanded ? 'Hide approved criteria ↑' : 'View approved criteria ↓'}</span>
                    </button>

                    {isCriteriaExpanded ? (
                      <div className={styles.criteriaAccordionList}>
                        {APPROVED_CRITERIA.map((item) => (
                          <div key={item.id} className={styles.accordionItem}>
                            <div>
                              <h4 className={styles.accordionItemTitle}>{item.title}</h4>
                              <p className={styles.accordionItemDesc}>{item.description}</p>
                            </div>
                            <span className={styles.verifiedPill}>{item.type} • Verified</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* SEARCH PREFERENCES */}
                <div className={styles.preferencesGrid}>
                  <div>
                    <h2 className={styles.sectionTitle}>Search preferences</h2>
                    <p className={styles.sectionSubtitle}>Tailor how Veyqor executes candidate sourcing for this role.</p>
                  </div>

                  {/* CANDIDATE VOLUME */}
                  <div className={styles.preferenceGroup}>
                    <label className={styles.preferenceLabel}>How many candidates should we find?</label>
                    <div className={styles.optionCardsRow}>
                      <button
                        type="button"
                        className={`${styles.optionCard} ${candidateVolume === '5-10' ? styles.optionCardActive : ''}`}
                        onClick={() => setCandidateVolume('5-10')}
                      >
                        <div className={styles.optionCardHeader}>
                          <span className={styles.optionCardTitle}>5–10</span>
                        </div>
                        <p className={styles.optionCardDesc}>Focused shortlist of top-tier matches.</p>
                      </button>

                      <button
                        type="button"
                        className={`${styles.optionCard} ${candidateVolume === '10-20' ? styles.optionCardActive : ''}`}
                        onClick={() => setCandidateVolume('10-20')}
                      >
                        <div className={styles.optionCardHeader}>
                          <span className={styles.optionCardTitle}>10–20</span>
                          <span className={styles.recommendedTag}>Recommended</span>
                        </div>
                        <p className={styles.optionCardDesc}>Balanced pool for quick executive selection.</p>
                      </button>

                      <button
                        type="button"
                        className={`${styles.optionCard} ${candidateVolume === '20-30' ? styles.optionCardActive : ''}`}
                        onClick={() => setCandidateVolume('20-30')}
                      >
                        <div className={styles.optionCardHeader}>
                          <span className={styles.optionCardTitle}>20–30</span>
                        </div>
                        <p className={styles.optionCardDesc}>Broader search across extended networks.</p>
                      </button>
                    </div>
                  </div>

                  {/* SEARCH LOCATION */}
                  <div className={styles.preferenceGroup}>
                    <label className={styles.preferenceLabel}>Search location</label>
                    <div className={styles.locationDisplayBox}>
                      <div>
                        {isEditingLocation ? (
                          <input
                            type="text"
                            value={locationText}
                            onChange={(e) => setLocationText(e.target.value)}
                            onBlur={() => setIsEditingLocation(false)}
                            className={intakeStyles.inputField}
                            style={{ padding: '4px 8px', fontSize: '14px' }}
                            autoFocus
                          />
                        ) : (
                          <>
                            <span className={styles.locationText}>{locationText}</span>
                            <span className={styles.locationMeta}>(Derived from approved job context)</span>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        className={styles.editLocationBtn}
                        onClick={() => setIsEditingLocation((prev) => !prev)}
                      >
                        {isEditingLocation ? 'Save' : 'Edit'}
                      </button>
                    </div>
                  </div>

                  {/* SEARCH PRIORITY */}
                  <div className={styles.preferenceGroup}>
                    <label className={styles.preferenceLabel}>Search priority</label>
                    <div className={styles.optionCardsRow}>
                      <button
                        type="button"
                        className={`${styles.optionCard} ${searchPriority === 'strongest' ? styles.optionCardActive : ''}`}
                        onClick={() => setSearchPriority('strongest')}
                      >
                        <div className={styles.optionCardHeader}>
                          <span className={styles.optionCardTitle}>Strongest matches</span>
                        </div>
                        <p className={styles.optionCardDesc}>Prioritize candidates who closely match all approved criteria.</p>
                      </button>

                      <button
                        type="button"
                        className={`${styles.optionCard} ${searchPriority === 'broader' ? styles.optionCardActive : ''}`}
                        onClick={() => setSearchPriority('broader')}
                      >
                        <div className={styles.optionCardHeader}>
                          <span className={styles.optionCardTitle}>Broader pool</span>
                        </div>
                        <p className={styles.optionCardDesc}>Include more potential matches with flexible qualification criteria.</p>
                      </button>
                    </div>
                  </div>
                </div>

                {/* NOTIFICATION PROMISE BANNER */}
                <div className={styles.notificationBanner}>
                  <div className={styles.notificationIcon}>🔔</div>
                  <div>
                    <h4 className={styles.notificationTitle}>You don&apos;t need to wait</h4>
                    <p className={styles.notificationDesc}>
                      Veyqor will continue searching in the background and <strong>notify you as soon as matching candidates are found.</strong>
                    </p>
                    <p className={styles.notificationDesc} style={{ marginTop: '4px', fontSize: '12.5px', color: '#64748b' }}>
                      You can safely leave this page and continue with your work. We&apos;ll let you know when candidates are ready to review.
                    </p>
                  </div>
                </div>

                {/* WHAT HAPPENS AFTER YOU START */}
                <div>
                  <h2 className={styles.sectionTitle}>What happens after you start?</h2>
                  <p className={styles.sectionSubtitle}>Simple, automated process from search to shortlist.</p>

                  <div className={styles.stepsVisualRow}>
                    <div className={styles.stepVisualCard}>
                      <span className={styles.stepNum}>01</span>
                      <h4 className={styles.stepTitle}>Search</h4>
                      <p className={styles.stepDesc}>Veyqor searches global networks for candidates matching your approved criteria.</p>
                    </div>

                    <div className={styles.stepVisualCard}>
                      <span className={styles.stepNum}>02</span>
                      <h4 className={styles.stepTitle}>Evaluate</h4>
                      <p className={styles.stepDesc}>Candidates are evaluated against each requirement and verified for fit.</p>
                    </div>

                    <div className={styles.stepVisualCard}>
                      <span className={styles.stepNum}>03</span>
                      <h4 className={styles.stepTitle}>Review</h4>
                      <p className={styles.stepDesc}>You receive the highest-scoring candidate shortlist to review and proceed.</p>
                    </div>
                  </div>
                </div>

                {/* ACTION BAR */}
                <div className={styles.actionBar}>
                  <button
                    type="button"
                    className={styles.backBtn}
                    onClick={() => router.push('/criteria-approval')}
                  >
                    ← Back to criteria
                  </button>

                  <div>
                    <button
                      type="button"
                      className={styles.startSearchBtn}
                      onClick={handleStartSearch}
                    >
                      Start candidate search →
                    </button>
                    <p className={styles.ctaSupportText}>
                      Start the search and we&apos;ll notify you when matching candidates are found.
                    </p>
                  </div>
                </div>
              </>
            ) : null}

            {/* STATE 2: SEARCHING IN PROGRESS */}
            {searchState === 'searching' ? (
              <div className={styles.progressCard}>
                <header className={styles.pageHeader}>
                  <span className={styles.eyebrow}>SEARCH IN PROGRESS</span>
                  <h1 className={styles.mainTitle}>Finding candidates</h1>
                  <p className={styles.mainSubtitle}>
                    Veyqor is searching for candidates who match your approved criteria.
                  </p>
                </header>

                <div className={styles.progressSequence}>
                  <div className={`${styles.progressStepItem} ${styles.progressStepDone}`}>
                    <span>✓</span>
                    <span>Criteria confirmed</span>
                  </div>

                  <div className={`${styles.progressStepItem} ${progressStep >= 1 ? (progressStep === 1 ? styles.progressStepActive : styles.progressStepDone) : ''}`}>
                    {progressStep === 1 ? <span className={styles.pulseDot} /> : progressStep > 1 ? <span>✓</span> : <span>○</span>}
                    <span>Searching for candidates</span>
                  </div>

                  <div className={`${styles.progressStepItem} ${progressStep >= 2 ? (progressStep === 2 ? styles.progressStepActive : styles.progressStepDone) : ''}`}>
                    {progressStep === 2 ? <span className={styles.pulseDot} /> : progressStep > 2 ? <span>✓</span> : <span>○</span>}
                    <span>Evaluating matches</span>
                  </div>

                  <div className={`${styles.progressStepItem} ${progressStep >= 3 ? (progressStep === 3 ? styles.progressStepActive : styles.progressStepDone) : ''}`}>
                    {progressStep === 3 ? <span className={styles.pulseDot} /> : progressStep > 3 ? <span>✓</span> : <span>○</span>}
                    <span>Preparing shortlist</span>
                  </div>
                </div>

                <div className={styles.notificationBanner}>
                  <div className={styles.notificationIcon}>⚡</div>
                  <div>
                    <h4 className={styles.notificationTitle}>Veyqor is working in the background</h4>
                    <p className={styles.notificationDesc}>
                      You don&apos;t need to keep this page open. We&apos;ll notify you as soon as matching candidates are found.
                    </p>
                  </div>
                </div>

                <div className={styles.actionBar}>
                  <button
                    type="button"
                    className={styles.backBtn}
                    onClick={() => router.push('/dashboard')}
                  >
                    Back to dashboard
                  </button>

                  <button
                    type="button"
                    className={styles.startSearchBtn}
                    onClick={() => setSearchState('completed')}
                  >
                    View results now →
                  </button>
                </div>
              </div>
            ) : null}

            {/* STATE 3: COMPLETED / CANDIDATES READY */}
            {searchState === 'completed' ? (
              <div className={styles.progressCard}>
                <header className={styles.pageHeader}>
                  <div className={styles.readyStatusBadge}>
                    <span>✓</span>
                    <span>Search complete</span>
                  </div>
                  <h1 className={styles.mainTitle} style={{ marginTop: '8px' }}>Candidates are ready</h1>
                  <p className={styles.mainSubtitle}>
                    Veyqor found <strong>8 candidates</strong> matching your approved hiring criteria.
                  </p>
                </header>

                <div className={styles.metricsGrid}>
                  <div className={metricCardStyle()}>
                    <div className={styles.metricNumber}>8</div>
                    <div className={styles.metricLabel}>Candidates found</div>
                  </div>

                  <div className={metricCardStyle()}>
                    <div className={styles.metricNumber} style={{ color: '#047857' }}>5</div>
                    <div className={styles.metricLabel}>Strong matches (90%+)</div>
                  </div>

                  <div className={metricCardStyle()}>
                    <div className={styles.metricNumber} style={{ color: '#0284c7' }}>3</div>
                    <div className={styles.metricLabel}>Potential matches (75–89%)</div>
                  </div>
                </div>

                <div className={styles.notificationBanner} style={{ borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(240, 253, 244, 0.6)' }}>
                  <div className={styles.notificationIcon} style={{ background: '#dcfce7', color: '#047857' }}>✨</div>
                  <div>
                    <h4 className={styles.notificationTitle} style={{ color: '#065f46' }}>Shortlist ready for executive review</h4>
                    <p className={styles.notificationDesc} style={{ color: '#047857' }}>
                      All candidates have been evaluated against your approved Senior Product Designer criteria.
                    </p>
                  </div>
                </div>

                <div className={styles.actionBar}>
                  <button
                    type="button"
                    className={styles.backBtn}
                    onClick={() => router.push('/dashboard')}
                  >
                    Back to dashboard
                  </button>

                  <button
                    type="button"
                    className={styles.startSearchBtn}
                    onClick={() => router.push('/shortlist-review')}
                  >
                    Review candidates →
                  </button>
                </div>
              </div>
            ) : null}

            {/* STATE 4: NO MATCHES STATE */}
            {searchState === 'no_matches' ? (
              <div className={styles.progressCard}>
                <header className={styles.pageHeader}>
                  <h1 className={styles.mainTitle}>We couldn&apos;t find enough strong matches</h1>
                  <p className={styles.mainSubtitle}>
                    Veyqor couldn&apos;t find enough candidates who closely match your approved criteria.
                  </p>
                </header>

                <div className={styles.actionBar}>
                  <button
                    type="button"
                    className={styles.backBtn}
                    onClick={() => router.push('/criteria-editor')}
                  >
                    Review criteria
                  </button>

                  <button
                    type="button"
                    className={styles.startSearchBtn}
                    onClick={() => { setSearchPriority('broader'); setSearchState('searching'); }}
                  >
                    Broaden search &amp; retry →
                  </button>
                </div>
              </div>
            ) : null}

            {/* STATE 5: ERROR STATE */}
            {searchState === 'error' ? (
              <div className={styles.progressCard}>
                <header className={styles.pageHeader}>
                  <h1 className={styles.mainTitle}>We couldn&apos;t complete the search</h1>
                  <p className={styles.mainSubtitle}>
                    Something went wrong while searching for candidates. Your approved criteria are still saved.
                  </p>
                </header>

                <div className={styles.actionBar}>
                  <button
                    type="button"
                    className={styles.backBtn}
                    onClick={() => router.push('/criteria-approval')}
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    className={styles.startSearchBtn}
                    onClick={() => setSearchState('searching')}
                  >
                    Try again →
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

function metricCardStyle() {
  return styles.metricCard;
}
