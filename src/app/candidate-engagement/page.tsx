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
  'Candidate Intake',
  'Processing',
  'Review',
  'Engagement',
];

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'cases', label: 'Cases', href: '#' },
  { id: 'review', label: 'Review queues', href: '#' },
  { id: 'notifications', label: 'Notifications', href: '#' },
  { id: 'audit', label: 'Audit', href: '#' },
  { id: 'settings', label: 'Settings', href: '#' },
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

export default function CandidateEngagementSetupPage() {
  const router = useRouter();

  const [session, setSession] = useState<AuthSession | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [orgName, setOrgName] = useState('');

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Accordion states
  const [openCommunication, setOpenCommunication] = useState(false);
  const [openEvaluation, setOpenEvaluation] = useState(false);
  const [openShortlist, setOpenShortlist] = useState(false);

  // Modal & engagement states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [engagementStarted, setEngagementStarted] = useState(false);
  const [isMessageEditing, setIsMessageEditing] = useState(false);
  const [messageContent, setMessageContent] = useState(
    "Hi [Candidate], we'd like to invite you to continue in the selection process for the Senior Product Designer role at Acme Global. Please follow the link to complete your brief technical confirmation."
  );

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

  function handleStartEngagementConfirm() {
    setShowConfirmModal(false);
    setEngagementStarted(true);
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
              <span className={styles.eyebrow}>CANDIDATE ENGAGEMENT</span>
              <h1 className={styles.mainTitle}>Candidate engagement</h1>
              <p className={styles.mainSubtitle}>
                Your shortlist is ready. Review what VEYQOR will do next, then start the engagement.
              </p>
              <div className={styles.jobContextRow}>
                <span className={styles.jobTitleBadge}>Senior Product Designer</span>
                <span className={styles.contextDot}>•</span>
                <span>6 shortlisted candidates</span>
                <span className={styles.contextDot}>•</span>
                <span>Lagos / Remote</span>
              </div>
            </header>

            {!engagementStarted ? (
              /* MAIN TWO-COLUMN LAYOUT */
              <div className={styles.layoutGrid}>
                {/* LEFT COLUMN */}
                <div className={styles.leftColumn}>
                  {/* PRIMARY SECTION: READY TO ENGAGE */}
                  <div className={styles.readySurface}>
                    <div className={styles.surfaceHeader}>
                      <h2>Ready to engage</h2>
                      <p>VEYQOR will take the approved shortlist through the next stage of the hiring process.</p>
                    </div>

                    <div className={styles.numberedFlow}>
                      <div className={styles.flowStep}>
                        <span className={styles.flowNumber}>01</span>
                        <div className={styles.flowContent}>
                          <h4>Contact shortlisted candidates</h4>
                          <p>Send the approved invitation and introduce the next step.</p>
                        </div>
                      </div>

                      <div className={styles.flowStep}>
                        <span className={styles.flowNumber}>02</span>
                        <div className={styles.flowContent}>
                          <h4>Run the evaluation process</h4>
                          <p>Evaluate candidates against the criteria you approved.</p>
                        </div>
                      </div>

                      <div className={styles.flowStep}>
                        <span className={styles.flowNumber}>03</span>
                        <div className={styles.flowContent}>
                          <h4>Keep you updated</h4>
                          <p>Track candidate responses and surface anything that needs your attention.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACCORDION SECTIONS */}
                  <div className={styles.accordionsGroup}>
                    {/* ACCORDION 1: CANDIDATE COMMUNICATION */}
                    <div className={styles.accordionItem}>
                      <button
                        type="button"
                        className={styles.accordionHeader}
                        onClick={() => setOpenCommunication((prev) => !prev)}
                        aria-expanded={openCommunication}
                      >
                        <div className={styles.accordionHeaderLeft}>
                          <span className={styles.accordionTitle}>Candidate communication</span>
                          <span className={styles.accordionSubtitle}>Initial outreach preview</span>
                        </div>
                        <span className={`${styles.chevronIcon} ${openCommunication ? styles.chevronOpen : ''}`}>
                          ▼
                        </span>
                      </button>

                      {openCommunication ? (
                        <div className={styles.accordionBody}>
                          {!isMessageEditing ? (
                            <>
                              <div className={styles.messagePreviewBox}>{messageContent}</div>
                              <div className={styles.accordionActions}>
                                <button
                                  type="button"
                                  className={styles.textActionBtn}
                                  onClick={() => setIsMessageEditing(true)}
                                >
                                  Edit message
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <textarea
                                value={messageContent}
                                onChange={(e) => setMessageContent(e.target.value)}
                                style={{
                                  width: '100%',
                                  minHeight: '100px',
                                  padding: '12px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(60,66,78,0.2)',
                                  fontSize: '13px',
                                }}
                              />
                              <div className={styles.accordionActions}>
                                <button
                                  type="button"
                                  className={styles.textActionBtn}
                                  onClick={() => setIsMessageEditing(false)}
                                >
                                  Save message
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ) : null}
                    </div>

                    {/* ACCORDION 2: EVALUATION SUMMARY */}
                    <div className={styles.accordionItem}>
                      <button
                        type="button"
                        className={styles.accordionHeader}
                        onClick={() => setOpenEvaluation((prev) => !prev)}
                        aria-expanded={openEvaluation}
                      >
                        <div className={styles.accordionHeaderLeft}>
                          <span className={styles.accordionTitle}>Evaluation</span>
                          <span className={styles.accordionSubtitle}>5 approved criteria (4 required · 1 preferred)</span>
                        </div>
                        <span className={`${styles.chevronIcon} ${openEvaluation ? styles.chevronOpen : ''}`}>
                          ▼
                        </span>
                      </button>

                      {openEvaluation ? (
                        <div className={styles.accordionBody}>
                          <p style={{ fontSize: '13px', color: '#525a6b' }}>
                            Candidates will be evaluated against the criteria approved for this role.
                          </p>
                          <div className={styles.accordionActions}>
                            <button
                              type="button"
                              className={styles.textActionBtn}
                              onClick={() => router.push('/criteria-approval')}
                            >
                              View criteria →
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* ACCORDION 3: SHORTLISTED CANDIDATES */}
                    <div className={styles.accordionItem}>
                      <button
                        type="button"
                        className={styles.accordionHeader}
                        onClick={() => setOpenShortlist((prev) => !prev)}
                        aria-expanded={openShortlist}
                      >
                        <div className={styles.accordionHeaderLeft}>
                          <span className={styles.accordionTitle}>Shortlisted candidates</span>
                          <span className={styles.accordionSubtitle}>6 candidates ready</span>
                        </div>
                        <span className={`${styles.chevronIcon} ${openShortlist ? styles.chevronOpen : ''}`}>
                          ▼
                        </span>
                      </button>

                      {openShortlist ? (
                        <div className={styles.accordionBody}>
                          <div className={styles.compactCandidateList}>
                            <div className={styles.compactCandidateRow}>
                              <span className={styles.compactCandidateName}>Candidate 024</span>
                              <span className={styles.compactCandidateMatch}>94% match</span>
                            </div>
                            <div className={styles.compactCandidateRow}>
                              <span className={styles.compactCandidateName}>Candidate 012</span>
                              <span className={styles.compactCandidateMatch}>91% match</span>
                            </div>
                            <div className={styles.compactCandidateRow}>
                              <span className={styles.compactCandidateName}>Candidate 038</span>
                              <span className={styles.compactCandidateMatch}>89% match</span>
                            </div>
                          </div>
                          <div className={styles.accordionActions}>
                            <button
                              type="button"
                              className={styles.textActionBtn}
                              onClick={() => router.push('/shortlist-review')}
                            >
                              View shortlist → (+3 more candidates)
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN (STICKY SUMMARY CARD & WHAT HAPPENS NEXT) */}
                <div className={styles.rightColumn}>
                  {/* PRIMARY SUMMARY CARD */}
                  <div className={styles.summaryCard}>
                    <div className={styles.readyBadge}>
                      <span>✓</span>
                      <span>Your shortlist is ready</span>
                    </div>

                    <h3 className={styles.summaryCardTitle}>Ready to start</h3>

                    <div className={styles.factsGrid}>
                      <div className={styles.factItem}>
                        <span className={styles.factLabel}>Role</span>
                        <span className={styles.factValue}>Senior Product Designer</span>
                      </div>
                      <div className={styles.factItem}>
                        <span className={styles.factLabel}>Candidates</span>
                        <span className={styles.factValue}>6 shortlisted</span>
                      </div>
                      <div className={styles.factItem}>
                        <span className={styles.factLabel}>Criteria</span>
                        <span className={styles.factValue}>5 approved</span>
                      </div>
                      <div className={styles.factItem}>
                        <span className={styles.factLabel}>Communication</span>
                        <span className={styles.factValue}>Ready</span>
                      </div>
                    </div>

                    <p className={styles.reassuranceText}>
                      VEYQOR will begin outreach and evaluation once you start the engagement.
                    </p>

                    <button
                      type="button"
                      className={styles.goldPrimaryBtn}
                      onClick={() => setShowConfirmModal(true)}
                    >
                      Start candidate engagement →
                    </button>

                    <button
                      type="button"
                      className={styles.backLink}
                      onClick={() => router.push('/shortlist-review')}
                    >
                      Back to shortlist
                    </button>
                  </div>

                  {/* SECONDARY CARD: WHAT HAPPENS NEXT */}
                  <div className={styles.nextStepsCard}>
                    <h3 className={styles.nextStepsTitle}>What happens next</h3>

                    <div className={styles.nextStepItem}>
                      <span className={styles.nextStepItemTitle}>1. Candidates are contacted</span>
                      <span className={styles.nextStepItemDesc}>VEYQOR sends the approved outreach.</span>
                    </div>

                    <div className={styles.nextStepItem}>
                      <span className={styles.nextStepItemTitle}>2. Candidates respond</span>
                      <span className={styles.nextStepItemDesc}>Their progress is tracked automatically.</span>
                    </div>

                    <div className={styles.nextStepItem}>
                      <span className={styles.nextStepItemTitle}>3. You review outcomes</span>
                      <span className={styles.nextStepItemDesc}>VEYQOR surfaces candidates that need your attention.</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* SUCCESS STATE: VEYQOR IS TAKING IT FROM HERE */
              <div className={styles.successCard}>
                <div className={styles.successIcon}>✓</div>
                <h2 className={styles.successTitle}>VEYQOR is taking it from here</h2>
                <p className={styles.successDesc}>Your candidate engagement has started.</p>

                <div className={styles.statusChecklist}>
                  <div style={{ color: '#047857', fontWeight: 600 }}>✓ 6 candidates ready</div>
                  <div style={{ color: '#047857', fontWeight: 600 }}>✓ Outreach initiated</div>
                  <div style={{ color: '#3b82f6', fontWeight: 600 }}>○ Evaluation begins as candidates respond</div>
                </div>

                <button
                  type="button"
                  className={styles.goldPrimaryBtn}
                  style={{ width: 'fit-content', margin: '0 auto', padding: '0 24px' }}
                  onClick={() => router.push('/dashboard')}
                >
                  View candidate pipeline →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CONFIRMATION MODAL */}
        {showConfirmModal ? (
          <div className={styles.modalBackdrop} onClick={() => setShowConfirmModal(false)} aria-hidden="true">
            <div className={styles.modalSurface} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <h3 className={styles.modalTitle}>Ready to begin?</h3>
              <p className={styles.modalDesc}>
                VEYQOR will contact your 6 shortlisted candidates and begin the approved evaluation process.
              </p>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.goldPrimaryBtn}
                  onClick={handleStartEngagementConfirm}
                >
                  Start engagement
                </button>
                <button
                  type="button"
                  className={styles.backLink}
                  style={{ padding: '0 16px' }}
                  onClick={() => setShowConfirmModal(false)}
                >
                  Go back
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
