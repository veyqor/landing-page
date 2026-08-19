'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockAuthGateway, type AuthSession } from '@/lib/auth/mockAuthGateway';
import styles from './page.module.css';

type QueueCategory = 'criteria' | 'eligibility' | 'ai-evaluation' | 'risk' | 'disclosure' | 'feedback';

type ReviewItem = {
  id: string;
  caseName: string;
  category: QueueCategory;
  reason: string;
  actionLabel: string;
  severity: 'pending' | 'warning' | 'blocked';
  roleScope: Array<AuthSession['role']>;
};

type CaseRow = {
  id: string;
  title: string;
  organisation: string;
  stage: string;
  candidatesProcessed: number;
  exceptions: number;
  lastActivity: string;
  status: 'processing' | 'awaiting-review' | 'blocked' | 'ready' | 'completed';
};

type ActivityItem = {
  id: string;
  label: string;
  detail: string;
  progress: number;
  aiRelated?: boolean;
};

type EventItem = {
  id: string;
  event: string;
  actor: string;
  caseRef: string;
  time: string;
};

type QueueFilter = 'all' | QueueCategory;

type DashboardLoadState = 'loading' | 'ready' | 'error';

const TENANT_STORAGE_KEY = 'veyqor.mock.tenant-context.v1';
const ORG_STORAGE_KEY = 'veyqor.mock.org-context.v1';

const QUEUE_FILTERS: Array<{ id: QueueFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'criteria', label: 'Criteria' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'ai-evaluation', label: 'AI Evaluation' },
  { id: 'risk', label: 'Risk' },
  { id: 'disclosure', label: 'Disclosure' },
  { id: 'feedback', label: 'Feedback' },
];

const REVIEW_ITEMS: ReviewItem[] = [
  {
    id: 'rv_001',
    caseName: 'Senior Product Designer',
    category: 'criteria',
    reason: 'Required experience criteria returned low extraction confidence.',
    actionLabel: 'Review criteria',
    severity: 'warning',
    roleScope: ['operator', 'reviewer', 'administrator'],
  },
  {
    id: 'rv_002',
    caseName: 'Clinical Data Analyst',
    category: 'risk',
    reason: 'Re-identification risk exceeded policy threshold in candidate preview.',
    actionLabel: 'Review risk gate',
    severity: 'blocked',
    roleScope: ['reviewer', 'administrator', 'leadership'],
  },
  {
    id: 'rv_003',
    caseName: 'Engineering Manager',
    category: 'disclosure',
    reason: 'Disclosure approval is required before full candidate profile release.',
    actionLabel: 'Approve disclosure',
    severity: 'pending',
    roleScope: ['operator', 'reviewer', 'administrator'],
  },
  {
    id: 'rv_004',
    caseName: 'Operations Lead',
    category: 'ai-evaluation',
    reason: 'AI recommendation diverged from historical acceptance pattern.',
    actionLabel: 'Inspect recommendation',
    severity: 'warning',
    roleScope: ['reviewer', 'administrator'],
  },
  {
    id: 'rv_005',
    caseName: 'Talent Partner',
    category: 'feedback',
    reason: 'Candidate feedback conflict requires policy-aligned resolution.',
    actionLabel: 'Resolve feedback',
    severity: 'pending',
    roleScope: ['operator', 'administrator'],
  },
];

const ACTIVE_CASES: CaseRow[] = [
  {
    id: 'CASE-1048',
    title: 'Senior Product Designer',
    organisation: 'Recruitment Operations',
    stage: 'Risk validation',
    candidatesProcessed: 58,
    exceptions: 1,
    lastActivity: '12m ago',
    status: 'awaiting-review',
  },
  {
    id: 'CASE-1046',
    title: 'Clinical Data Analyst',
    organisation: 'Quality Review Office',
    stage: 'Controlled preview',
    candidatesProcessed: 41,
    exceptions: 2,
    lastActivity: '24m ago',
    status: 'blocked',
  },
  {
    id: 'CASE-1042',
    title: 'Engineering Manager',
    organisation: 'Recruitment Operations',
    stage: 'AI evaluation',
    candidatesProcessed: 76,
    exceptions: 0,
    lastActivity: '7m ago',
    status: 'processing',
  },
  {
    id: 'CASE-1039',
    title: 'Operations Lead',
    organisation: 'Quality Review Office',
    stage: 'Authorized disclosure',
    candidatesProcessed: 34,
    exceptions: 0,
    lastActivity: '1h ago',
    status: 'ready',
  },
  {
    id: 'CASE-1031',
    title: 'Talent Partner',
    organisation: 'Recruitment Operations',
    stage: 'Completed',
    candidatesProcessed: 52,
    exceptions: 0,
    lastActivity: '3h ago',
    status: 'completed',
  },
];

const AUTOMATION_ACTIVITY: ActivityItem[] = [
  {
    id: 'auto_1',
    label: 'Candidate ingestion',
    detail: '14 candidate packets normalized and indexed',
    progress: 78,
  },
  {
    id: 'auto_2',
    label: 'Criteria extraction',
    detail: '6 role criteria sets extracted',
    progress: 62,
    aiRelated: true,
  },
  {
    id: 'auto_3',
    label: 'Anonymization checks',
    detail: 'Identity masking pass complete for 11 profiles',
    progress: 94,
  },
  {
    id: 'auto_4',
    label: 'Risk validations',
    detail: 'Policy checks completed for 9 profile previews',
    progress: 55,
  },
];

const RECENT_EVENTS: EventItem[] = [
  {
    id: 'evt_001',
    event: 'Criteria version approved',
    actor: 'Maya Okafor',
    caseRef: 'CASE-1048',
    time: '09:42',
  },
  {
    id: 'evt_002',
    event: 'Candidate batch processed',
    actor: 'System',
    caseRef: 'CASE-1042',
    time: '09:31',
  },
  {
    id: 'evt_003',
    event: 'AI evaluation completed',
    actor: 'System AI',
    caseRef: 'CASE-1042',
    time: '09:27',
  },
  {
    id: 'evt_004',
    event: 'Risk review triggered',
    actor: 'Governance Engine',
    caseRef: 'CASE-1046',
    time: '09:14',
  },
  {
    id: 'evt_005',
    event: 'Disclosure approval granted',
    actor: 'Daniel Mensah',
    caseRef: 'CASE-1039',
    time: '08:58',
  },
];

function roleLabel(role: AuthSession['role']) {
  if (role === 'administrator') return 'Administrator';
  if (role === 'reviewer') return 'Reviewer';
  if (role === 'leadership') return 'Leadership/Oversight';
  return 'Recruitment Operator';
}

function statusLabel(status: CaseRow['status']) {
  if (status === 'awaiting-review') return 'Awaiting review';
  if (status === 'processing') return 'Processing';
  if (status === 'blocked') return 'Blocked';
  if (status === 'ready') return 'Ready';
  return 'Completed';
}

function statusClass(status: CaseRow['status']) {
  if (status === 'awaiting-review') return styles.statusAwaiting;
  if (status === 'processing') return styles.statusProcessing;
  if (status === 'blocked') return styles.statusBlocked;
  if (status === 'ready') return styles.statusReady;
  return styles.statusCompleted;
}

function severityClass(severity: ReviewItem['severity']) {
  if (severity === 'blocked') return styles.severityBlocked;
  if (severity === 'warning') return styles.severityWarning;
  return styles.severityPending;
}

function queueCategoryLabel(category: QueueCategory) {
  if (category === 'ai-evaluation') return 'AI evaluation';
  return category[0].toUpperCase() + category.slice(1);
}

export default function DashboardPage() {
  const router = useRouter();

  const [session, setSession] = useState<AuthSession | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all');
  const [queueSearch, setQueueSearch] = useState('');
  const [loadState, setLoadState] = useState<DashboardLoadState>('loading');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const activeRole = session?.role ?? 'operator';

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
    const organisation = tenant?.organisations.find((item) => item.id === selectedOrgId) ?? tenant?.organisations[0] ?? null;

    if (!tenant || !organisation) {
      router.replace('/sign-in');
      return;
    }

    setTenantName(tenant.name);
    setOrgName(organisation.name);

    const timer = window.setTimeout(() => {
      if (activeSession.email === 'error@veyqor.internal') {
        setLoadState('error');
      } else {
        setLoadState('ready');
      }
    }, 650);

    return () => window.clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    if (!isMobileNavOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isMobileNavOpen]);

  const dashboardNavItems = useMemo(() => {
    const baseItems = [
      { label: 'Dashboard', href: '/dashboard', active: true },
      { label: 'Cases', href: '#', active: false },
      { label: 'Review queues', href: '#', active: false },
      { label: 'Notifications', href: '#', active: false },
      { label: 'Audit', href: '#', active: false },
    ];

    if (activeRole === 'administrator' || activeRole === 'leadership') {
      return [...baseItems, { label: 'Settings', href: '#', active: false }];
    }

    return baseItems;
  }, [activeRole]);

  const scopedReviewItems = useMemo(() => {
    return REVIEW_ITEMS.filter((item) => item.roleScope.includes(activeRole));
  }, [activeRole]);

  const filteredReviewItems = useMemo(() => {
    return scopedReviewItems.filter((item) => {
      const inFilter = queueFilter === 'all' ? true : item.category === queueFilter;
      const inSearch = queueSearch.trim()
        ? `${item.caseName} ${item.reason}`.toLowerCase().includes(queueSearch.trim().toLowerCase())
        : true;
      return inFilter && inSearch;
    });
  }, [queueFilter, queueSearch, scopedReviewItems]);

  const visibleCases = useMemo(() => {
    if (activeRole === 'reviewer') {
      return ACTIVE_CASES.filter((item) => item.status === 'awaiting-review' || item.status === 'blocked' || item.status === 'ready');
    }
    if (activeRole === 'leadership') {
      return ACTIVE_CASES.filter((item) => item.status !== 'processing');
    }
    return ACTIVE_CASES;
  }, [activeRole]);

  const overview = useMemo(() => {
    const active = visibleCases.length;
    const processing = visibleCases.filter((item) => item.status === 'processing').length;
    const review = visibleCases.filter((item) => item.status === 'awaiting-review').length;
    const blocked = visibleCases.filter((item) => item.status === 'blocked').length;
    const completed = visibleCases.filter((item) => item.status === 'completed' || item.status === 'ready').length;

    return { active, processing, review, blocked, completed };
  }, [visibleCases]);

  if (!session) {
    return (
      <main className={styles.page}>
        <div className={styles.skeletonShell}>
          <span className={styles.skeletonBlock} />
          <span className={styles.skeletonBlockWide} />
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.appShell}>
        <header className={styles.mobileHeader}>
          <Image
            src="/Untitled design - 2026-08-10T155155.182.png"
            alt="Veyqor"
            width={118}
            height={30}
            className={styles.mobileMark}
            priority
          />
          <button
            type="button"
            className={`${styles.mobileMenuButton} ${isMobileNavOpen ? styles.mobileMenuButtonOpen : ''}`}
            aria-label={isMobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileNavOpen}
            aria-controls="dashboard-mobile-drawer"
            onClick={() => setIsMobileNavOpen((current) => !current)}
          >
            <span className={styles.mobileMenuBars} aria-hidden="true" />
          </button>
        </header>

        <div
          className={`${styles.mobileBackdrop} ${isMobileNavOpen ? styles.mobileBackdropOpen : ''}`}
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />

        <aside
          id="dashboard-mobile-drawer"
          className={`${styles.mobileDrawer} ${isMobileNavOpen ? styles.mobileDrawerOpen : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div className={styles.mobileDrawerTop}>
            <Image
              src="/logo.png"
              alt="Veyqor"
              width={126}
              height={32}
              className={styles.mobileDrawerMark}
            />
            <button
              type="button"
              className={styles.mobileDrawerClose}
              onClick={() => setIsMobileNavOpen(false)}
              aria-label="Close navigation menu"
            >
              ×
            </button>
          </div>

          <div className={styles.workspaceContext}>
            <span className={styles.contextKicker}>Workspace context</span>
            <strong>{orgName}</strong>
            <p>{tenantName} · Production workspace</p>
          </div>

          <button type="button" className={styles.mobileUserSummary}>
            <span className={styles.avatar}>{session.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
            <span>
              <strong>{session.fullName}</strong>
              <small>{roleLabel(session.role)}</small>
            </span>
          </button>

          <nav className={styles.mobileNav} aria-label="Mobile primary navigation">
            {dashboardNavItems.map((item) => (
              <a
                key={item.label}
                className={`${styles.navItem} ${item.active ? styles.navItemActive : ''}`}
                href={item.href}
                onClick={() => setIsMobileNavOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <aside className={styles.sidebar}>
          <div className={styles.brandArea}>
            <Image
              src="/logo.png"
              alt="Veyqor"
              width={142}
              height={38}
              className={styles.brandMark}
              priority
            />
            <div className={styles.workspaceContext}>
              <span className={styles.contextKicker}>Workspace context</span>
              <strong>{orgName}</strong>
              <p>{tenantName} · Production workspace</p>
            </div>
          </div>

          <nav className={styles.sidebarNav} aria-label="Primary navigation">
            {dashboardNavItems.map((item) => (
              <a key={item.label} className={`${styles.navItem} ${item.active ? styles.navItemActive : ''}`} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className={styles.mainWrap}>
          <header className={styles.topHeader}>
            <div>
              <p className={styles.breadcrumb}>Workspace / Dashboard</p>
              <h1>Dashboard</h1>
              <p className={styles.mobileContextSummary}>{orgName} · {tenantName}</p>
            </div>
            <div className={styles.topActions}>
              <button type="button" className={styles.iconButton} aria-label="Notifications">◦</button>
              <div className={styles.headerContext}>
                <strong>{orgName}</strong>
                <span>{tenantName}</span>
              </div>
              <button type="button" className={styles.userButton}>
                <span className={styles.avatar}>{session.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                <span>
                  <strong>{session.fullName}</strong>
                  <small>{roleLabel(session.role)}</small>
                </span>
              </button>
            </div>
          </header>

          {loadState === 'error' ? (
            <section className={styles.errorPanel} role="alert" aria-live="assertive">
              <h2>We couldn't load your workspace activity</h2>
              <p>Try again or contact your administrator if the issue continues.</p>
              <button type="button" className={styles.retryButton} onClick={() => setLoadState('ready')}>
                Retry
              </button>
            </section>
          ) : null}

          {loadState === 'loading' ? (
            <section className={styles.loadingGrid} aria-hidden="true">
              <span className={styles.skeletonTitle} />
              <span className={styles.skeletonPanel} />
              <span className={styles.skeletonPanel} />
              <span className={styles.skeletonPanel} />
            </section>
          ) : null}

          {loadState === 'ready' ? (
            <>
              <section className={styles.introRow}>
                <div>
                  <h2>Good morning, {session.fullName.split(' ')[0]}</h2>
                  <p>Here&apos;s what needs your attention across the workspace.</p>
                </div>
                <button type="button" className={styles.primaryAction} onClick={() => router.push('/job-intake')}>Create new case</button>
              </section>

              <section className={styles.overviewPanel} aria-label="Workspace overview">
                <div className={styles.overviewTop}>
                  <p className={styles.panelKicker}>Workspace overview</p>
                  <span>Automation by default. Human intervention by exception.</span>
                </div>
                <div className={styles.metricRow}>
                  <article><span>Active cases</span><strong>{overview.active}</strong></article>
                  <article><span>Processing</span><strong>{overview.processing}</strong></article>
                  <article><span>Needs review</span><strong>{overview.review}</strong></article>
                  <article><span>Blocked</span><strong>{overview.blocked}</strong></article>
                  <article><span>Completed</span><strong>{overview.completed}</strong></article>
                </div>
                <div className={styles.flowMap}>
                  <span>Intake</span><span>Criteria</span><span>Ingestion</span><span>Evaluation</span><span>Anonymization</span><span>Risk</span><span>Preview</span><span>Disclosure</span>
                </div>
              </section>

              <div className={styles.contentGrid}>
                <section className={styles.sectionCard}>
                  <header className={styles.sectionHeader}>
                    <h3>Needs your attention</h3>
                    <span>{filteredReviewItems.length} item(s)</span>
                  </header>

                  {filteredReviewItems.length ? (
                    <div className={styles.attentionList}>
                      {filteredReviewItems.slice(0, 3).map((item) => (
                        <article key={item.id} className={styles.attentionItem}>
                          <div className={styles.attentionTop}>
                            <span className={`${styles.severityDot} ${severityClass(item.severity)}`} />
                            <small>{queueCategoryLabel(item.category)}</small>
                          </div>
                          <strong>{item.caseName}</strong>
                          <p>{item.reason}</p>
                          <button type="button" className={styles.inlineButton}>{item.actionLabel} →</button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <strong>You're all clear.</strong>
                      <p>No cases currently require human intervention. VEYQOR will surface exceptions here automatically.</p>
                    </div>
                  )}
                </section>

                <section className={styles.sectionCard}>
                  <header className={styles.sectionHeader}>
                    <h3>Governance status</h3>
                  </header>
                  <div className={styles.governanceStats}>
                    <article><span>Passed checks</span><strong>26</strong></article>
                    <article><span>Reviews pending</span><strong>4</strong></article>
                    <article><span>Blocked items</span><strong>2</strong></article>
                    <article><span>Policy events</span><strong>3</strong></article>
                  </div>
                </section>
              </div>

              <section className={styles.sectionCard}>
                <header className={styles.sectionHeader}>
                  <h3>Review queue</h3>
                  <input
                    value={queueSearch}
                    onChange={(event) => setQueueSearch(event.target.value)}
                    className={styles.queueSearch}
                    type="search"
                    placeholder="Search review items"
                    aria-label="Search review queue"
                  />
                </header>

                <div className={styles.filterRow} role="tablist" aria-label="Queue categories">
                  {QUEUE_FILTERS.map((filter) => {
                    const active = queueFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        type="button"
                        className={`${styles.filterPill} ${active ? styles.filterPillActive : ''}`}
                        onClick={() => setQueueFilter(filter.id)}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>

                {filteredReviewItems.length ? (
                  <div className={styles.queueList}>
                    {filteredReviewItems.map((item) => (
                      <article key={item.id} className={styles.queueItem}>
                        <div>
                          <small>{queueCategoryLabel(item.category)}</small>
                          <strong>{item.caseName}</strong>
                          <p>{item.reason}</p>
                        </div>
                        <button type="button" className={styles.inlineButton}>{item.actionLabel}</button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <strong>You're all clear.</strong>
                    <p>No queue items match your current filters.</p>
                  </div>
                )}
              </section>

              <section className={styles.sectionCard}>
                <header className={styles.sectionHeader}>
                  <h3>Active cases</h3>
                </header>
                <div className={styles.tableWrap}>
                  <table className={styles.caseTable}>
                    <thead>
                      <tr>
                        <th>Case</th>
                        <th>Context</th>
                        <th>Automated stage</th>
                        <th>Candidates</th>
                        <th>Exceptions</th>
                        <th>Last activity</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleCases.map((row) => (
                        <tr key={row.id}>
                          <td><strong>{row.title}</strong><small>{row.id}</small></td>
                          <td>{row.organisation}</td>
                          <td>{row.stage}</td>
                          <td>{row.candidatesProcessed}</td>
                          <td>{row.exceptions}</td>
                          <td>{row.lastActivity}</td>
                          <td><span className={`${styles.statusPill} ${statusClass(row.status)}`}>{statusLabel(row.status)}</span></td>
                          <td><button type="button" className={styles.inlineButton}>Open</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className={styles.contentGrid}>
                <section className={styles.sectionCard}>
                  <header className={styles.sectionHeader}><h3>Automation activity</h3></header>
                  <div className={styles.automationList}>
                    {AUTOMATION_ACTIVITY.map((item) => (
                      <article key={item.id} className={styles.automationItem}>
                        <div className={styles.automationText}>
                          <strong>{item.label} {item.aiRelated ? <span className={styles.aiFlag}>AI</span> : null}</strong>
                          <p>{item.detail}</p>
                        </div>
                        <div className={styles.progressTrack} aria-hidden="true">
                          <span style={{ width: `${item.progress}%` }} className={item.aiRelated ? styles.progressAi : styles.progressBar} />
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className={styles.sectionCard}>
                  <header className={styles.sectionHeader}><h3>Recent activity</h3></header>
                  <div className={styles.timeline}>
                    {RECENT_EVENTS.map((event) => (
                      <article key={event.id} className={styles.timelineItem}>
                        <div className={styles.timelineDot} />
                        <div>
                          <strong>{event.event}</strong>
                          <p>{event.actor} · <code>{event.caseRef}</code> · <time>{event.time}</time></p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
