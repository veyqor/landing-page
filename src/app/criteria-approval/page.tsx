'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockAuthGateway, type AuthSession } from '@/lib/auth/mockAuthGateway';
import intakeStyles from '../job-intake/page.module.css';
import styles from './page.module.css';

type Priority = 'required' | 'preferred';

type Criterion = {
  id: string;
  title: string;
  basis: string;
  sourceSnippet: string;
  priority: Priority;
};

const TENANT_STORAGE_KEY = 'veyqor.mock.tenant-context.v1';
const ORG_STORAGE_KEY = 'veyqor.mock.org-context.v1';
const WORKFLOW_STEPS = ['Signal Intake', 'Criteria', 'Approval', 'Candidate Ingestion'];

const INITIAL_CRITERIA: Criterion[] = [
  {
    id: 'criterion-qualification',
    title: 'Qualification',
    basis: 'Relevant degree in computer science or equivalent software engineering experience.',
    sourceSnippet: 'Senior frontend engineer with strong ownership and delivery history.',
    priority: 'required',
  },
  {
    id: 'criterion-technical',
    title: 'Technical capability',
    basis: 'Hands-on experience with TypeScript, React, and service integration patterns.',
    sourceSnippet: 'Need to own front-end execution and integrate with platform services.',
    priority: 'required',
  },
  {
    id: 'criterion-domain',
    title: 'Domain experience',
    basis: 'Experience in regulated or governance-heavy delivery environments.',
    sourceSnippet: 'Sensitive hiring workflows need explainability and controls.',
    priority: 'required',
  },
  {
    id: 'criterion-policy',
    title: 'Policy alignment',
    basis: 'Ensure criteria do not introduce undue or unapproved screening constraints.',
    sourceSnippet: 'Work must remain governed and explainable.',
    priority: 'required',
  },
  {
    id: 'criterion-arrangement',
    title: 'Work arrangement',
    basis: 'Validate candidate can work within the approved engagement model.',
    sourceSnippet: 'Hybrid and remote signals coexist in the source content.',
    priority: 'preferred',
  },
];

type NavItem = {
  id: string;
  label: string;
  href: string;
};

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

export default function CriteriaApprovalPage() {
  const router = useRouter();

  const [session, setSession] = useState<AuthSession | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [orgName, setOrgName] = useState('');

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  const requiredCriteria = INITIAL_CRITERIA.filter(c => c.priority === 'required');
  const preferredCriteria = INITIAL_CRITERIA.filter(c => c.priority === 'preferred');

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

  function toggleAccordion(id: string) {
    setExpandedId(current => current === id ? null : id);
  }

  if (!session) {
    return (
      <main className={intakeStyles.page}>
        <div style={{ padding: 40 }}>Loading workspace...</div>
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
          >
            <span className={intakeStyles.mobileMenuBars} aria-hidden="true" />
          </button>
          <Image src="/Untitled design - 2026-08-10T155155.182.png" alt="Veyqor" width={130} height={34} className={intakeStyles.mobileMark} priority />
          <button type="button" className={intakeStyles.mobileAvatarButton}>
            {session.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('')}
          </button>
        </header>

        <div className={`${intakeStyles.mobileBackdrop} ${mobileNavOpen ? intakeStyles.mobileBackdropOpen : ''}`} onClick={() => setMobileNavOpen(false)} aria-hidden="true" />

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
          <nav className={intakeStyles.sidebarNav}>
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
            >
              <span aria-hidden="true">{sidebarCollapsed ? '»' : '«'}</span>
              {!sidebarCollapsed ? <span>{sidebarCollapsed ? 'Expand' : 'Collapse'}</span> : null}
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className={intakeStyles.mainWrap}>
          <header className={intakeStyles.topHeader}>
            <div className={intakeStyles.topHeaderLeft}>
              <button
                type="button"
                className={intakeStyles.collapseButtonInline}
                onClick={() => setSidebarCollapsed((current) => !current)}
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
              <button type="button" className={intakeStyles.userButton}>
                <span className={intakeStyles.avatar}>{session.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                <span className={intakeStyles.userMeta}>
                  <strong>{session.fullName}</strong>
                  <small>{roleLabel(session.role)}</small>
                </span>
              </button>
            </div>
          </header>

          <section className={styles.contentContainer}>
            
            <header className={intakeStyles.pageHeader}>
              <div>
                <p className={intakeStyles.kicker}>CRITERIA APPROVAL</p>
                <h1>Review & approve hiring criteria</h1>
                <p className={intakeStyles.pageCopy}>Review the criteria generated from the hiring signal before they are used for candidate evaluation.</p>
              </div>

              <aside className={intakeStyles.aiInsight} aria-label="Automation insight">
                <span className={intakeStyles.aiIcon} aria-hidden="true">✧</span>
                <p>AI Validated. Human review required.</p>
              </aside>
            </header>

            <div className={intakeStyles.stepper} aria-label="Workflow progress">
              {WORKFLOW_STEPS.map((step, index) => (
                <div key={step} className={`${intakeStyles.step} ${index === 2 ? intakeStyles.stepActive : ''}`}>
                  <span>{index < 2 ? '✓' : index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>

            {/* TOP SUMMARY BAR */}
            <div className={`${styles.topStatusBar} ${isApproved ? styles.topStatusBarApproved : ''}`}>
              <div className={styles.topStatusLeft}>
                <div className={`${styles.statusIcon} ${isApproved ? styles.successIcon : styles.pendingIcon}`}>
                  {isApproved ? '✓' : '🛡️'}
                </div>
                <div>
                  <h2 className={styles.topStatusTitle}>
                    {isApproved ? 'All criteria approved' : 'Approval required'}
                  </h2>
                  <p className={styles.topStatusDesc}>
                    {isApproved
                      ? 'Everything looks good! Your evaluation criteria is ready.'
                      : 'Review the generated criteria below and click Approve Criteria to proceed.'}
                  </p>
                </div>
              </div>
              <div className={styles.topStatusRight}>
                <div className={styles.statusStat}>
                  <strong>5</strong>
                  <span>Total criteria</span>
                </div>
                <div className={styles.statusStat}>
                  <strong>4</strong>
                  <span>Required</span>
                </div>
                <div className={styles.statusStat}>
                  <strong>1</strong>
                  <span>Preferred</span>
                </div>
                <div className={styles.statusStat}>
                  <strong>6</strong>
                  <span>Skills detected</span>
                </div>
              </div>
            </div>

            <div className={styles.mainGrid}>
              {/* LEFT COLUMN: CRITERIA */}
              <div className={styles.leftColumn}>
                <div className={styles.sectionBlock}>
                  <header className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionTitle}>Evaluation criteria summary</h2>
                      <p className={styles.sectionDesc}>These are the criteria VEYQOR will use to evaluate and match candidates.</p>
                    </div>
                    <button type="button" className={styles.secondaryButton}>View full details ⌄</button>
                  </header>

                  <h3 className={styles.groupHeader}>
                    <span className={`${styles.groupDot} ${styles.groupDotGreen}`} /> Required criteria ({requiredCriteria.length})
                  </h3>
                  
                  <div className={styles.accordionList}>
                    {requiredCriteria.map((item, i) => (
                      <div key={item.id} className={styles.accordionItem}>
                        <div className={styles.accordionHeader} onClick={() => toggleAccordion(item.id)}>
                          <div className={styles.accordionLeft}>
                            <div className={`${styles.accordionIcon} ${styles.iconGreen}`}>
                              {i === 0 ? '🎓' : i === 1 ? '</>' : i === 2 ? '💼' : '🛡️'}
                            </div>
                            <div>
                              <h4 className={styles.accordionTitle}>{item.title}</h4>
                              <p className={styles.accordionSnippet}>{item.basis}</p>
                            </div>
                          </div>
                          <div className={styles.accordionRight}>
                            <span className={styles.pillRequired}>Required</span>
                          </div>
                        </div>
                        {expandedId === item.id && (
                          <div className={styles.accordionContent}>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Evaluation Basis</span>
                              <p className={styles.detailText}>{item.basis}</p>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Source Extract</span>
                              <p className={styles.detailText}>"{item.sourceSnippet}"</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <h3 className={styles.groupHeader}>
                    <span className={`${styles.groupDot} ${styles.groupDotPurple}`} /> Preferred criteria ({preferredCriteria.length})
                  </h3>

                  <div className={styles.accordionList}>
                    {preferredCriteria.map((item) => (
                      <div key={item.id} className={styles.accordionItem}>
                        <div className={styles.accordionHeader} onClick={() => toggleAccordion(item.id)}>
                          <div className={styles.accordionLeft}>
                            <div className={`${styles.accordionIcon} ${styles.iconPurple}`}>
                              👥
                            </div>
                            <div>
                              <h4 className={styles.accordionTitle}>{item.title}</h4>
                              <p className={styles.accordionSnippet}>{item.basis}</p>
                            </div>
                          </div>
                          <div className={styles.accordionRight}>
                            <span className={styles.pillPreferred}>Preferred</span>
                          </div>
                        </div>
                        {expandedId === item.id && (
                          <div className={styles.accordionContent}>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Evaluation Basis</span>
                              <p className={styles.detailText}>{item.basis}</p>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Source Extract</span>
                              <p className={styles.detailText}>"{item.sourceSnippet}"</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                </div>
              </div>

              {/* RIGHT COLUMN: CHECKLIST */}
              <div className={styles.rightColumn}>
                <div className={styles.sectionBlock}>
                  <header className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Approval summary</h2>
                  </header>

                  <div className={styles.checklist}>
                    <div className={styles.checkItem}>
                      <div className={styles.checkIcon}>✓</div>
                      <div className={styles.checkText}>
                        <h4>Criteria completeness</h4>
                        <p>All required and preferred criteria are defined.</p>
                      </div>
                    </div>
                    <div className={styles.checkItem}>
                      <div className={styles.checkIcon}>✓</div>
                      <div className={styles.checkText}>
                        <h4>Requirement consistency</h4>
                        <p>No conflicts or contradictions detected.</p>
                      </div>
                    </div>
                    <div className={styles.checkItem}>
                      <div className={styles.checkIcon}>✓</div>
                      <div className={styles.checkText}>
                        <h4>Ambiguity detection</h4>
                        <p>No material ambiguities found.</p>
                      </div>
                    </div>
                    <div className={styles.checkItem}>
                      <div className={styles.checkIcon}>✓</div>
                      <div className={styles.checkText}>
                        <h4>Policy review</h4>
                        <p>All relevant policies reviewed.</p>
                      </div>
                    </div>
                    <div className={styles.checkItem}>
                      <div className={styles.checkIcon}>✓</div>
                      <div className={styles.checkText}>
                        <h4>AI confidence</h4>
                        <p>High confidence in generated criteria.</p>
                      </div>
                    </div>
                  </div>

                  {!isApproved ? (
                    <div className={styles.actionBox}>
                      <button
                        type="button"
                        className={styles.approveButton}
                        onClick={() => setIsApproved(true)}
                      >
                        <span className={styles.approveIcon}>✓</span>
                        Approve Criteria
                      </button>
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => router.push('/criteria-editor')}
                      >
                        Edit criteria
                      </button>
                    </div>
                  ) : (
                    <div className={styles.readyBox}>
                      <div className={styles.checkIcon}>✓</div>
                      <div className={styles.checkText}>
                        <h4>Criteria approved</h4>
                        <p>All checks passed. Select how you would like to proceed with candidates below.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* WHAT HAPPENS NEXT */}
            {isApproved && (
              <div className={`${styles.sectionBlock} ${styles.revealAnimation}`}>
                <div className={styles.postApprovalSection}>
                  <div className={styles.postApprovalLeft}>
                    <h3>What happens next?</h3>
                    <p>Choose how you would like to proceed.</p>
                  </div>

                  <div className={styles.postActionArea}>
                    <div className={`${styles.actionCard} ${styles.cardPurple}`} onClick={() => router.push('/candidate-search')}>
                      <div className={styles.actionIcon}>✨</div>
                      <div>
                        <h4>Let VEYQOR find candidates for you</h4>
                        <p>VEYQOR will search, screen, and present qualified candidates based on these criteria.</p>
                      </div>
                      <span className={styles.actionArrow}>→</span>
                    </div>

                    <span className={styles.postSeparator}>OR</span>

                    <div className={`${styles.actionCard} ${styles.cardWhite}`} onClick={() => router.push('/candidate-ingestion')}>
                      <div className={styles.actionIcon}>👤</div>
                      <div>
                        <h4>Ingest candidates myself</h4>
                        <p>I will upload or add candidates to evaluate against these criteria.</p>
                      </div>
                      <span className={styles.actionArrow}>→</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DETAILS & AUDIT */}
            <div className={styles.auditSection}>
               <button type="button">View technical and audit information →</button>
            </div>

          </section>
        </div>
      </div>
    </main>
  );
}
