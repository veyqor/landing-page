'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockAuthGateway, type AuthSession } from '@/lib/auth/mockAuthGateway';
import intakeStyles from '../job-intake/page.module.css';
import styles from './page.module.css';

const TENANT_STORAGE_KEY = 'veyqor.mock.tenant-context.v1';
const ORG_STORAGE_KEY = 'veyqor.mock.org-context.v1';

type NavItem = {
  id: string;
  label: string;
  href: string;
};

const WORKFLOW_STEPS = [
  'Signal Intake',
  'Criteria',
  'Approval',
  'Candidate Intake',
  'Processing',
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

type ProcessingState = 'starting' | 'processing' | 'completed' | 'partial' | 'recoverable' | 'failed';
type SourcePathMode = 'sourcing' | 'upload';

type CandidatePreviewItem = {
  id: string;
  candidateCode: string;
  role: string;
  status: 'Eligible' | 'Potential' | 'Attention';
  matchNote: string;
};

const CANDIDATE_PREVIEWS: CandidatePreviewItem[] = [
  {
    id: 'cand-24',
    candidateCode: 'Candidate 024',
    role: 'Senior Product Designer',
    status: 'Eligible',
    matchNote: 'Strong match · All 5 approved criteria verified',
  },
  {
    id: 'cand-31',
    candidateCode: 'Candidate 031',
    role: 'Senior Product Designer',
    status: 'Eligible',
    matchNote: 'Strong match · 5 approved criteria verified',
  },
  {
    id: 'cand-44',
    candidateCode: 'Candidate 044',
    role: 'Senior Product Designer',
    status: 'Potential',
    matchNote: 'Needs additional review · Work arrangement clarification',
  },
];

type ExceptionPreviewItem = {
  id: string;
  code: string;
  issue: string;
};

const EXCEPTION_ITEMS: ExceptionPreviewItem[] = [
  { id: 'ex-18', code: 'Candidate 018', issue: 'Missing experience evidence' },
  { id: 'ex-42', code: 'Candidate 042', issue: 'Qualification degree could not be verified' },
  { id: 'ex-77', code: 'Candidate 077', issue: 'Incomplete candidate document' },
  { id: 'ex-105', code: 'Candidate 105', issue: 'Work arrangement discrepancy detected' },
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

export default function CandidateProcessingPage() {
  const router = useRouter();

  const [session, setSession] = useState<AuthSession | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [orgName, setOrgName] = useState('');

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Core state: Processing State & Source Path
  const [processingState, setProcessingState] = useState<ProcessingState>('processing');
  const [sourcePath, setSourcePath] = useState<SourcePathMode>('sourcing');

  // Accessible Notification Toggle: DEFAULT IS ON (true)
  const [notifyEnabled, setNotifyEnabled] = useState(true);

  // Smooth background progress simulation
  const [progressPercent, setProgressPercent] = useState(64);

  useEffect(() => {
    const activeSession = mockAuthGateway.getSession();
    if (!activeSession) {
      router.replace('/sign-in');
      return;
    }

    setSession(activeSession);

    const selectedTenantId = window.localStorage.getItem(TENANT_STORAGE_KEY) ?? '';
    const selectedOrgId = window.localStorage.getItem(ORG_STORAGE_KEY) ?? '';
    const tenant = activeSession.workspaceTenants.find((item) => item.id === selectedTenantId) ?? activeSession.workspaceTenants[0] ?? null;
    const org = tenant?.organisations.find((item) => item.id === selectedOrgId) ?? tenant?.organisations[0] ?? null;

    if (!tenant || !org) {
      router.replace('/sign-in');
      return;
    }

    setTenantName(tenant.name);
    setOrgName(org.name);
  }, [router]);

  // Automated progress updates when in 'processing' mode
  useEffect(() => {
    if (processingState !== 'processing') return;

    const timer = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setProcessingState('completed');
          return 100;
        }
        return prev + 8;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [processingState]);

  function goToReview() {
    router.push('/shortlist-review');
  }

  function goToCriteria() {
    router.push('/criteria-approval');
  }

  function goToDashboard() {
    router.push('/dashboard');
  }

  if (!session) {
    return (
      <main className={intakeStyles.page}>
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading workspace...</div>
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
          <button type="button" className={intakeStyles.mobileAvatarButton}>
            {session.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('')}
          </button>
        </header>

        <div
          className={`${intakeStyles.mobileBackdrop} ${mobileNavOpen ? intakeStyles.mobileBackdropOpen : ''}`}
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />

        {/* MOBILE DRAWER */}
        <aside className={`${intakeStyles.mobileDrawer} ${mobileNavOpen ? intakeStyles.mobileDrawerOpen : ''}`}>
          <div className={intakeStyles.mobileDrawerTop}>
            <Image src="/logo.png" alt="Veyqor" width={124} height={32} className={intakeStyles.mobileDrawerMark} />
            <button type="button" className={intakeStyles.mobileDrawerClose} onClick={() => setMobileNavOpen(false)}>×</button>
          </div>
          <div className={intakeStyles.mobileWorkspace}>
            <small>Workspace context</small>
            <strong>{orgName}</strong>
            <p>{tenantName}</p>
          </div>
          <nav className={intakeStyles.mobileNav}>
            {NAV_ITEMS.map((item) => (
              <a key={item.id} href={item.href} className={`${intakeStyles.navItem} ${item.id === 'cases' ? intakeStyles.navItemActive : ''}`}>
                <span className={intakeStyles.navIcon}><ShellIcon id={item.id} /></span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* DESKTOP SIDEBAR */}
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
              <a key={item.id} href={item.href} className={`${intakeStyles.navItem} ${item.id === 'cases' ? intakeStyles.navItemActive : ''}`} title={sidebarCollapsed ? item.label : undefined}>
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
              {!sidebarCollapsed ? <span>{sidebarCollapsed ? 'Expand' : 'Collapse'}</span> : null}
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT WRAPPER */}
        <div className={intakeStyles.mainWrap}>
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

          <div style={{ padding: '24px 32px' }}>
            <section className={styles.contentContainer}>
              
              {/* WORKFLOW STEPPER */}
              <div className={intakeStyles.stepper} aria-label="Workflow progress">
                {WORKFLOW_STEPS.map((step, index) => {
                  const isComplete = index < 4;
                  const isActive = index === 4;
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
                <div className={styles.headerTop}>
                  <div>
                    <p className={styles.kicker}>CANDIDATE PROCESSING</p>
                    <h1 className={styles.mainTitle}>
                      {processingState === 'starting'
                        ? 'Preparing your candidate search'
                        : processingState === 'processing'
                        ? 'VEYQOR is working on your candidates'
                        : processingState === 'completed'
                        ? 'Candidates are ready'
                        : processingState === 'partial'
                        ? 'Candidate processing is almost complete'
                        : processingState === 'recoverable'
                        ? 'Some candidates need attention'
                        : "We couldn't complete candidate processing"}
                    </h1>
                    <p className={styles.mainSubtitle}>
                      {processingState === 'starting'
                        ? 'VEYQOR is getting everything ready using your approved hiring criteria.'
                        : processingState === 'processing'
                        ? 'Candidate sourcing and evaluation can take some time. You can safely leave this page — we\'ll let you know when your candidates are ready.'
                        : processingState === 'completed'
                        ? 'VEYQOR has finished processing your candidates against your approved criteria.'
                        : processingState === 'partial'
                        ? 'Most candidates have been processed, but a small number need additional attention.'
                        : processingState === 'recoverable'
                        ? 'VEYQOR completed most of the process, but some candidates could not be fully evaluated.'
                        : 'Something prevented VEYQOR from completing this process. Your approved criteria remain saved.'}
                    </p>
                  </div>

                  {/* INTERACTIVE DEMO STATE TOGGLE BAR */}
                  <div className={styles.stateToggleBar}>
                    <button
                      type="button"
                      className={`${styles.stateToggleBtn} ${processingState === 'processing' ? styles.stateToggleBtnActive : ''}`}
                      onClick={() => { setProcessingState('processing'); setProgressPercent(64); }}
                    >
                      In progress
                    </button>
                    <button
                      type="button"
                      className={`${styles.stateToggleBtn} ${processingState === 'completed' ? styles.stateToggleBtnActive : ''}`}
                      onClick={() => setProcessingState('completed')}
                    >
                      Completed
                    </button>
                    <button
                      type="button"
                      className={`${styles.stateToggleBtn} ${processingState === 'recoverable' ? styles.stateToggleBtnActive : ''}`}
                      onClick={() => setProcessingState('recoverable')}
                    >
                      Exceptions
                    </button>
                    <button
                      type="button"
                      className={`${styles.stateToggleBtn} ${processingState === 'failed' ? styles.stateToggleBtnActive : ''}`}
                      onClick={() => setProcessingState('failed')}
                    >
                      Failed
                    </button>
                  </div>
                </div>

                {/* BADGE ROW */}
                <div className={styles.badgeRow}>
                  {processingState === 'processing' || processingState === 'starting' ? (
                    <div className={styles.statusBadgeProcessing}>
                      <span className={styles.pulseDot} />
                      {processingState === 'starting' ? 'Starting search' : 'In progress'}
                    </div>
                  ) : processingState === 'completed' ? (
                    <div className={styles.statusBadgeComplete}>
                      ✓ Completed &amp; Evaluated
                    </div>
                  ) : processingState === 'failed' ? (
                    <div className={styles.statusBadgeProcessing} style={{ borderColor: '#ef4444', color: '#b91c1c', background: '#fef2f2' }}>
                      ✕ Search issue
                    </div>
                  ) : (
                    <div className={styles.statusBadgeProcessing} style={{ borderColor: '#f59e0b', color: '#b45309', background: '#fffbeb' }}>
                      ⚠️ Action needed
                    </div>
                  )}

                  <span className={styles.pathPill}>
                    Path: {sourcePath === 'sourcing' ? '✨ Veyqor AI Sourcing' : '📁 User Import'}
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                      onClick={() => setSourcePath((p) => (p === 'sourcing' ? 'upload' : 'sourcing'))}
                    >
                      (Switch)
                    </button>
                  </span>

                  <button type="button" className={styles.approvedCriteriaLink} onClick={goToCriteria}>
                    View approved criteria →
                  </button>
                </div>
              </header>

              {/* MAIN LAYOUT GRID */}
              <div className={styles.layoutGrid}>
                
                {/* LEFT MAIN COLUMN */}
                <div className={styles.mainColumn}>
                  
                  {/* IN PROGRESS STATE */}
                  {(processingState === 'processing' || processingState === 'starting') && (
                    <>
                      {/* STATUS CARD */}
                      <div className={styles.card}>
                        <div className={styles.cardHeader}>
                          <div>
                            <h2 className={styles.cardTitle}>
                              {sourcePath === 'sourcing' ? 'Candidate sourcing & evaluation' : 'Candidate processing & evaluation'}
                            </h2>
                            <p className={styles.cardDesc}>
                              {sourcePath === 'sourcing'
                                ? "We're searching available candidate sources using your approved hiring criteria."
                                : "We're preparing and evaluating the candidates you provided against the approved hiring criteria."}
                            </p>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', fontFamily: 'var(--font-ibm-mono)' }}>
                            {progressPercent}%
                          </span>
                        </div>

                        {/* PROGRESS TRACK */}
                        <div className={styles.progressWrap}>
                          <div className={styles.progressLabelRow}>
                            <span>Processing stage</span>
                            <span>{progressPercent}%</span>
                          </div>
                          <div className={styles.progressBarTrack}>
                            <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
                          </div>
                        </div>

                        {/* DYNAMIC STAGES LIST */}
                        <div className={styles.stagesList}>
                          {sourcePath === 'sourcing' ? (
                            <>
                              <div className={`${styles.stageItem} ${styles.stageCompleted}`}>
                                <span className={styles.stageIconCompleted}>✓</span>
                                <span>Candidates requested</span>
                              </div>
                              <div className={`${styles.stageItem} ${progressPercent >= 50 ? styles.stageCompleted : styles.stageActive}`}>
                                {progressPercent >= 50 ? <span className={styles.stageIconCompleted}>✓</span> : <span className={styles.stageIconActive}>●</span>}
                                <span>Candidate sourcing in progress</span>
                              </div>
                              <div className={`${styles.stageItem} ${progressPercent >= 75 ? styles.stageActive : styles.stagePending}`}>
                                {progressPercent >= 75 ? <span className={styles.stageIconActive}>●</span> : <span className={styles.stageIconPending}>○</span>}
                                <span>Candidate evaluation</span>
                              </div>
                              <div className={`${styles.stageItem} ${styles.stagePending}`}>
                                <span className={styles.stageIconPending}>○</span>
                                <span>Results preparation</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className={`${styles.stageItem} ${styles.stageCompleted}`}>
                                <span className={styles.stageIconCompleted}>✓</span>
                                <span>Candidate upload complete</span>
                              </div>
                              <div className={`${styles.stageItem} ${styles.stageCompleted}`}>
                                <span className={styles.stageIconCompleted}>✓</span>
                                <span>Document extraction</span>
                              </div>
                              <div className={`${styles.stageItem} ${styles.stageActive}`}>
                                <span className={styles.stageIconActive}>●</span>
                                <span>Eligibility evaluation</span>
                              </div>
                              <div className={`${styles.stageItem} ${styles.stagePending}`}>
                                <span className={styles.stageIconPending}>○</span>
                                <span>Shortlist assembly</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* NOTIFICATION TOGGLE CARD (KEY FEATURE) */}
                      <div className={styles.notificationCard}>
                        <div className={styles.notificationCardLeft}>
                          <div className={styles.notificationCardIcon}>🔔</div>
                          <div>
                            <h3 className={styles.notificationCardTitle}>Get notified when your candidates are ready</h3>
                            <p className={styles.notificationCardDesc}>
                              {notifyEnabled
                                ? "We'll let you know as soon as processing is complete."
                                : 'Notifications are off. You can check processing status from your dashboard.'}
                            </p>
                          </div>
                        </div>

                        {/* ACCESSIBLE TOGGLE SWITCH */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={notifyEnabled}
                          aria-label="Notify me when my candidates are ready"
                          className={`${styles.toggleSwitch} ${notifyEnabled ? styles.toggleSwitchOn : ''}`}
                          onClick={() => setNotifyEnabled((prev) => !prev)}
                        >
                          <span className={`${styles.toggleThumb} ${notifyEnabled ? styles.toggleThumbOn : ''}`} />
                        </button>
                      </div>

                      {/* LEAVE REASSURANCE BANNER */}
                      <div className={styles.leaveBanner}>
                        <div className={styles.leaveBannerLeft}>
                          <div className={styles.leaveBannerIcon}>🏠</div>
                          <div>
                            <h3 className={styles.leaveBannerTitle}>You&apos;re free to leave</h3>
                            <p className={styles.leaveBannerDesc}>
                              VEYQOR will continue working in the background. Leaving this page will not interrupt candidate sourcing or processing.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className={styles.backDashboardBtn}
                          onClick={goToDashboard}
                        >
                          Back to Dashboard
                        </button>
                      </div>

                      {/* PROCESSING SUMMARY METRICS */}
                      <div className={styles.card}>
                        <h3 className={styles.cardTitle}>Processing summary</h3>
                        <div className={styles.counterGrid}>
                          <div className={styles.counterBox}>
                            <span className={styles.counterNumber}>142</span>
                            <span className={styles.counterLabel}>Candidates identified</span>
                          </div>
                          <div className={styles.counterBox}>
                            <span className={styles.counterNumber} style={{ color: '#10b981' }}>118</span>
                            <span className={styles.counterLabel}>Evaluated</span>
                          </div>
                          <div className={styles.counterBox}>
                            <span className={styles.counterNumber} style={{ color: '#7c3aed' }}>24</span>
                            <span className={styles.counterLabel}>In evaluation</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* COMPLETED RESULTS STATE */}
                  {processingState === 'completed' && (
                    <>
                      {/* ELIGIBILITY OVERVIEW */}
                      <div className={styles.card}>
                        <header className={styles.cardHeader}>
                          <div>
                            <h2 className={styles.cardTitle}>Eligibility overview</h2>
                            <p className={styles.cardDesc}>Evaluation results against your approved Senior Product Designer criteria</p>
                          </div>
                        </header>

                        <div className={styles.eligibilityGrid}>
                          <div className={`${styles.eligibilityCard} ${styles.cardEligible}`}>
                            <div className={styles.eligibilityHeader}>
                              <span className={`${styles.eligibilityCount} ${styles.countEligible}`}>126</span>
                              <span className={`${styles.eligibilityBadge} ${styles.badgeEligible}`}>Eligible</span>
                            </div>
                            <h3 className={styles.eligibilityTitle}>Eligible candidates</h3>
                            <p className={styles.eligibilityDesc}>Met all approved eligibility requirements and criteria.</p>
                          </div>

                          <div className={`${styles.eligibilityCard} ${styles.cardPotential}`}>
                            <div className={styles.eligibilityHeader}>
                              <span className={`${styles.eligibilityCount} ${styles.countPotential}`}>12</span>
                              <span className={`${styles.eligibilityBadge} ${styles.badgePotential}`}>Potential</span>
                            </div>
                            <h3 className={styles.eligibilityTitle}>Potential matches</h3>
                            <p className={styles.eligibilityDesc}>May meet criteria but have minor evidence gaps.</p>
                          </div>

                          <div className={`${styles.eligibilityCard} ${styles.cardAttention}`}>
                            <div className={styles.eligibilityHeader}>
                              <span className={`${styles.eligibilityCount} ${styles.countAttention}`}>4</span>
                              <span className={`${styles.eligibilityBadge} ${styles.badgeAttention}`}>Attention</span>
                            </div>
                            <h3 className={styles.eligibilityTitle}>Needs attention</h3>
                            <p className={styles.eligibilityDesc}>Require human review to verify specific criteria.</p>
                          </div>
                        </div>
                      </div>

                      {/* CANDIDATE RESULT PREVIEW */}
                      <div className={styles.card}>
                        <header className={styles.cardHeader}>
                          <div>
                            <h2 className={styles.cardTitle}>Top candidates preview</h2>
                            <p className={styles.cardDesc}>Sample evaluated candidates ready for review</p>
                          </div>
                        </header>

                        <div className={styles.previewList}>
                          {CANDIDATE_PREVIEWS.map((cand) => (
                            <div key={cand.id} className={styles.previewRow}>
                              <div className={styles.previewLeft}>
                                <div className={styles.previewAvatar}>
                                  {cand.candidateCode.replace('Candidate ', '#')}
                                </div>
                                <div>
                                  <h4 className={styles.previewName}>{cand.candidateCode}</h4>
                                  <p className={styles.previewRole}>{cand.role}</p>
                                </div>
                              </div>
                              <div className={styles.previewRight}>
                                <span className={styles.previewMatchNote}>{cand.matchNote}</span>
                                <span
                                  className={cand.status === 'Eligible' ? styles.badgeEligible : styles.badgePotential}
                                  style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}
                                >
                                  {cand.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* PRIMARY CTA ACTIONS ROW */}
                        <div className={styles.actionsRow}>
                          <button type="button" className={styles.primaryGoldButton} onClick={goToReview}>
                            Review candidates →
                          </button>
                          <button type="button" className={styles.secondaryOutlineButton} onClick={goToDashboard}>
                            Back to Dashboard
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* RECOVERABLE / EXCEPTION STATE */}
                  {(processingState === 'recoverable' || processingState === 'partial') && (
                    <div className={styles.exceptionCard}>
                      <div className={styles.exceptionHeader}>
                        <div className={styles.exceptionTitleArea}>
                          <h3>Needs your attention</h3>
                          <p>VEYQOR completed most of the process, but 4 candidates could not be fully evaluated.</p>
                        </div>
                        <span className={styles.exceptionBadge}>4 candidates</span>
                      </div>

                      <div className={styles.exceptionList}>
                        {EXCEPTION_ITEMS.map((ex) => (
                          <div key={ex.id} className={styles.exceptionItem}>
                            <div className={styles.exceptionItemLeft}>
                              <span style={{ color: '#ef4444' }}>⚠️</span>
                              <div>
                                <span className={styles.exceptionItemCode}>{ex.code}</span>
                                <span className={styles.exceptionItemDesc}> · {ex.issue}</span>
                              </div>
                            </div>
                            <button type="button" className={styles.secondaryExceptionBtn} onClick={goToReview}>
                              Review →
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className={styles.actionsRow} style={{ marginTop: 20 }}>
                        <button type="button" className={styles.primaryGoldButton} onClick={goToReview}>
                          Review exceptions →
                        </button>
                        <button type="button" className={styles.secondaryOutlineButton} onClick={goToDashboard}>
                          Back to Dashboard
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FAILED STATE */}
                  {processingState === 'failed' && (
                    <div className={styles.card} style={{ border: '1px solid rgba(239, 68, 68, 0.25)', background: '#fef2f2' }}>
                      <h2 className={styles.cardTitle} style={{ color: '#991b1b' }}>We couldn&apos;t complete candidate processing</h2>
                      <p className={styles.cardDesc} style={{ color: '#7f1d1d' }}>
                        Something prevented VEYQOR from completing this process. Your approved criteria are still saved.
                      </p>

                      <div className={styles.actionsRow} style={{ marginTop: 20 }}>
                        <button
                          type="button"
                          className={styles.primaryGoldButton}
                          onClick={() => { setProcessingState('processing'); setProgressPercent(40); }}
                        >
                          Try again →
                        </button>
                        <button type="button" className={styles.secondaryOutlineButton} onClick={goToDashboard}>
                          Back to Dashboard
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                {/* RIGHT SIDEBAR COLUMN */}
                <div className={styles.sideColumn}>
                  
                  <div className={styles.reassuranceSideCard}>
                    <div className={styles.reassuranceSideHeader}>
                      <span style={{ fontSize: 18 }}>✨</span>
                      <h3 className={styles.reassuranceSideTitle}>VEYQOR handles the rest</h3>
                    </div>
                    <p className={styles.reassuranceSideText}>
                      Candidate information is processed automatically using the hiring criteria and governance rules you&apos;ve already approved.
                    </p>
                  </div>

                  {/* CASE DETAILS */}
                  <div className={styles.card} style={{ gap: 12 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: '#10131d' }}>Case details</h4>
                    <div style={{ fontSize: 12.5, color: '#525a6b', display: 'grid', gap: 6 }}>
                      <div><strong>Role:</strong> Senior Product Designer</div>
                      <div><strong>Case ID:</strong> #VQ-1042</div>
                      <div><strong>Criteria version:</strong> v2 (Approved)</div>
                      <div><strong>Location:</strong> Lagos / Remote</div>
                    </div>
                  </div>

                </div>

              </div>

            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
