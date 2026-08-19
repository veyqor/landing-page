'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockAuthGateway, type AuthSession } from '@/lib/auth/mockAuthGateway';
import intakeStyles from '../job-intake/page.module.css';
import styles from './page.module.css';

type Priority = 'required' | 'preferred';
type Confidence = 'High' | 'Medium' | 'Low';
type ExceptionStatus = 'open' | 'resolved' | 'dismissed';

type GeneratedRequirement = {
  id: string;
  text: string;
  category: string;
  priority: Priority;
  confidence: Confidence;
  evaluationBasis: string;
  sourceSnippet: string;
  origin: 'ai' | 'human';
  reviewed: boolean;
  notes: string;
};

type ExceptionItem = {
  id: string;
  title: string;
  detail: string;
  status: ExceptionStatus;
};

const TENANT_STORAGE_KEY = 'veyqor.mock.tenant-context.v1';
const ORG_STORAGE_KEY = 'veyqor.mock.org-context.v1';
const CASE_CONTEXT_STORAGE_KEY = 'veyqor.mock.case-context.v1';
const WORKFLOW_STEPS = ['Signal Intake', 'Criteria', 'Approval', 'Candidate Ingestion'];

const INITIAL_REQUIREMENTS: GeneratedRequirement[] = [
  {
    id: 'rq-001',
    text: 'Relevant degree in computer science or equivalent software engineering experience',
    category: 'Qualification',
    priority: 'required',
    confidence: 'High',
    evaluationBasis: 'Review formal education background or equivalent role history in production systems.',
    sourceSnippet: 'Looking for a senior engineer with strong software engineering foundation and demonstrable delivery history.',
    origin: 'ai',
    reviewed: false,
    notes: '',
  },
  {
    id: 'rq-002',
    text: 'Hands-on experience with TypeScript, React, and service integration patterns',
    category: 'Technical capability',
    priority: 'required',
    confidence: 'High',
    evaluationBasis: 'Validate through relevant shipped work and practical scenario-based screening.',
    sourceSnippet: 'Must be able to own front-end execution and integrate with existing platform services.',
    origin: 'ai',
    reviewed: false,
    notes: '',
  },
  {
    id: 'rq-003',
    text: 'Experience working in regulated or governance-heavy delivery environments',
    category: 'Domain experience',
    priority: 'preferred',
    confidence: 'Medium',
    evaluationBasis: 'Assess prior projects with policy constraints, audits, or compliance workflows.',
    sourceSnippet: 'Role supports sensitive hiring workflows where explainability and controls are essential.',
    origin: 'ai',
    reviewed: false,
    notes: '',
  },
];

const INITIAL_EXCEPTIONS: ExceptionItem[] = [
  {
    id: 'ex-001',
    title: 'Certification requirement is ambiguous',
    detail: 'The source signal implies professional certification may be required but does not explicitly name one.',
    status: 'open',
  },
  {
    id: 'ex-002',
    title: 'Minimum years of experience not explicit',
    detail: 'The source indicates seniority but does not define a clear minimum experience threshold.',
    status: 'open',
  },
  {
    id: 'ex-003',
    title: 'Work arrangement policy check',
    detail: 'Hybrid and remote signals coexist. Confirm final arrangement for evaluation consistency.',
    status: 'open',
  },
];

const CORE_SKILLS = [
  'React',
  'TypeScript',
  'Next.js',
  'REST APIs',
  'Cloud infrastructure',
  'Accessibility standards',
];

type NavItem = {
  id: string;
  label: string;
  href: string;
  active?: boolean;
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

export default function CriteriaEditorPage() {
  const router = useRouter();

  const [session, setSession] = useState<AuthSession | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [draftVersion] = useState('v1');
  const [generatedAt] = useState(() => new Date());

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [requirements, setRequirements] = useState<GeneratedRequirement[]>(INITIAL_REQUIREMENTS);
  const [exceptions, setExceptions] = useState<ExceptionItem[]>(INITIAL_EXCEPTIONS);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    qualifications: true,
    skills: false,
    experience: false,
  });

  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);

  const requiredCriteriaCount = useMemo(
    () => requirements.filter((item) => item.priority === 'required').length,
    [requirements]
  );

  const openExceptions = useMemo(
    () => exceptions.filter((item) => item.status === 'open'),
    [exceptions]
  );

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

  function toggleGroup(groupId: string) {
    setExpandedGroups((current) => ({ ...current, [groupId]: !current[groupId] }));
  }

  function toggleDetails(reqId: string) {
    setExpandedDetailsId((current) => current === reqId ? null : reqId);
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
                <p className={intakeStyles.kicker}>Criteria Editor</p>
                <h1>Criteria drafted: {requiredCriteriaCount} required qualifications, {CORE_SKILLS.length} core skills</h1>
                <p className={intakeStyles.pageCopy}>Review the drafted criteria and resolve any exceptions before approval.</p>
              </div>

              <aside className={intakeStyles.aiInsight} aria-label="Automation insight">
                <span className={intakeStyles.aiIcon} aria-hidden="true">✧</span>
                <p>AI draft ready. Generated at {generatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.</p>
              </aside>
            </header>

            <div className={intakeStyles.stepper} aria-label="Workflow progress">
              {WORKFLOW_STEPS.map((step, index) => (
                <div key={step} className={`${intakeStyles.step} ${index === 1 ? intakeStyles.stepActive : ''}`}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>

            <div className={styles.mainGrid}>
              {/* LEFT COLUMN: REQUIREMENTS */}
              <div className={styles.leftColumn}>
                
                {/* Qualifications Group */}
                <article className={styles.groupCard}>
                  <button type="button" className={styles.groupToggle} onClick={() => toggleGroup('qualifications')}>
                    <h3>Required qualifications</h3>
                    <span>{expandedGroups.qualifications ? 'Collapse' : 'Expand'}</span>
                  </button>
                  
                  {expandedGroups.qualifications && (
                    <div className={styles.groupBody}>
                      {requirements.map((item) => (
                        <div key={item.id}>
                          <div className={styles.requirementRow}>
                            <div className={styles.requirementRowLeft}>
                              <span className={styles.requirementTitle}>{item.text}</span>
                              <div className={styles.pillGroup}>
                                <span className={styles.inlinePill}>{item.category}</span>
                                <span className={`${styles.inlinePill} ${item.priority === 'required' ? styles.pillRequired : ''}`}>
                                  {item.priority === 'required' ? 'Required' : 'Preferred'}
                                </span>
                              </div>
                            </div>
                            <button 
                              type="button" 
                              className={styles.requirementDetailsToggle}
                              onClick={() => toggleDetails(item.id)}
                            >
                              {expandedDetailsId === item.id ? 'Hide details' : 'View details'}
                            </button>
                          </div>
                          
                          {/* Expanded Details Pane */}
                          {expandedDetailsId === item.id && (
                            <div className={styles.requirementExpandedDetails}>
                              <div className={styles.detailSection}>
                                <span className={styles.detailLabel}>Evaluation basis</span>
                                <p className={styles.detailText}>{item.evaluationBasis}</p>
                              </div>
                              <div className={styles.detailSection}>
                                <span className={styles.detailLabel}>Source excerpt ({item.confidence} confidence)</span>
                                <p className={styles.detailText}>"{item.sourceSnippet}"</p>
                              </div>
                              <div className={styles.actionRow}>
                                <button type="button" className={styles.secondaryButton}>Edit requirement</button>
                                <button type="button" className={styles.secondaryButton}>Confirm</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </article>

                {/* Core Skills Group */}
                <article className={styles.groupCard}>
                  <button type="button" className={styles.groupToggle} onClick={() => toggleGroup('skills')}>
                    <h3>Core skills</h3>
                    <span>{expandedGroups.skills ? 'Collapse' : 'Expand'}</span>
                  </button>
                  
                  {expandedGroups.skills && (
                    <div className={styles.skillsWrap}>
                      {CORE_SKILLS.map((skill) => (
                        <span key={skill} className={styles.skillChip}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              </div>

              {/* RIGHT COLUMN: STICKY PANEL */}
              <div className={styles.sidePanelSticky}>
                
                <section>
                  <header className={styles.sideHeader}>
                    <h2>AI Analysis</h2>
                  </header>
                  <div className={styles.insightRows}>
                    <div>
                      <small>Extraction confidence</small>
                      <strong>High</strong>
                    </div>
                    <div>
                      <small>Requirements detected</small>
                      <strong>{requirements.length} structured criteria</strong>
                    </div>
                  </div>
                </section>

                <section>
                  <header className={styles.sideHeader}>
                    <h2>Needs Attention</h2>
                    <span className={styles.exceptionCount}>{openExceptions.length} open</span>
                  </header>
                  <div className={styles.exceptionList}>
                    {exceptions.map((item) => (
                      <article key={item.id} className={styles.exceptionItem}>
                        <div className={styles.exceptionTop}>
                          <strong>{item.title}</strong>
                        </div>
                        <p>{item.detail}</p>
                        <div className={styles.exceptionActions}>
                          <button type="button" className={styles.textAction}>Resolve</button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

              </div>
            </div>
            
            {/* Sticky Action Bar matches Job Intake sticky footer */}
            <div className={intakeStyles.stickyBar}>
              <div className={intakeStyles.stickyBarInner}>
                 <button type="button" className={styles.secondaryButton} onClick={() => router.push('/job-intake')}>Back</button>
                 <button type="button" className={styles.primaryButton} onClick={() => router.push('/criteria-approval')}>Continue to approval →</button>
              </div>
            </div>

          </section>
        </div>
      </div>
    </main>
  );
}
