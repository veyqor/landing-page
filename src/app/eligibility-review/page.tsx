'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockAuthGateway, type AuthSession } from '@/lib/auth/mockAuthGateway';
import styles from './page.module.css';

const TENANT_STORAGE_KEY = 'veyqor.mock.tenant-context.v1';
const ORG_STORAGE_KEY = 'veyqor.mock.org-context.v1';
const CASE_CONTEXT_STORAGE_KEY = 'veyqor.mock.case-context.v1';
const CANDIDATE_BATCH_STORAGE_KEY = 'veyqor.mock.candidate-intake.batch.v1';
const NEXT_STAGE_ROUTE = '/ai-sanitisation';

const WORKFLOW_STEPS = [
  'Criteria Approval',
  'Candidate Intake',
  'Quarantine',
  'Provenance',
  'Eligibility',
  'AI Evaluation',
] as const;

type CaseContext = {
  jobTitle: string;
  caseId: string;
  criteriaVersion: string;
};

type IntakeBatchItem = {
  id: string;
  fileName: string;
  candidateName: string;
  fileType: string;
  source: string;
  status: string;
  detail: string;
  recordedAt: string;
};

type EligibilityStatus =
  | 'pending'
  | 'processing'
  | 'eligible'
  | 'requires_attention'
  | 'ineligible'
  | 'blocked';

type CheckStatus = 'passed' | 'attention' | 'blocked' | 'pending' | 'processing';

type GateState =
  | 'pending'
  | 'processing'
  | 'eligible'
  | 'requires_attention'
  | 'ineligible'
  | 'blocked'
  | 'partial_success'
  | 'completed'
  | 'permission_denied';

type EligibilityReason =
  | 'all_checks_passed'
  | 'required_information_missing'
  | 'conflicting_information'
  | 'policy_review_required'
  | 'invalid_processing_context'
  | 'mandatory_rule_not_satisfied'
  | 'workflow_blocking_condition'
  | 'assessment_in_progress';

type CandidateRecord = {
  id: string;
  candidateIdentifier: string;
  candidateName: string;
  source: string;
  eligibility: EligibilityStatus;
  reason: EligibilityReason;
  checks: {
    requiredInformation: CheckStatus;
    provenance: CheckStatus;
    processingPurpose: CheckStatus;
    policy: CheckStatus;
    eligibilityRule: CheckStatus;
  };
  updatedAt: string;
  criteriaVersion: string;
  restrictedInfo: boolean;
  auditEvents: string[];
};

type AutomationState = 'assessing' | 'completed' | 'attention_required' | 'blocked';

type EligibilityFilter = 'all' | EligibilityStatus;
type ProcessingFilter = 'all' | 'active' | 'completed';
type QueueNoticeTone = 'neutral' | 'success' | 'warning' | 'error';

function roleLabel(role: AuthSession['role']) {
  if (role === 'administrator') return 'Administrator';
  if (role === 'reviewer') return 'Reviewer';
  if (role === 'leadership') return 'Leadership/Oversight';
  return 'Recruitment Operator';
}

function canResolve(role: AuthSession['role']) {
  return role === 'operator' || role === 'reviewer' || role === 'administrator';
}

function canContinue(role: AuthSession['role']) {
  return role === 'operator' || role === 'reviewer' || role === 'administrator';
}

function normalizeStatus(raw: string, fileName: string) {
  const status = raw.trim().toLowerCase();
  if (status === 'invalid') return 'blocked';
  if (status === 'failed') return 'blocked';
  if (status === 'requires_attention') return 'requires_attention';
  if (status === 'duplicate') return 'requires_attention';
  if (status === 'ready') return 'cleared';
  if (status === 'processing') return 'processing';
  if (status === 'validating') return 'validating';
  if (status === 'quarantined') return 'quarantined';
  if (status === 'uploading') return 'uploading';
  if (fileName.toLowerCase().includes('blocked')) return 'blocked';
  if (fileName.toLowerCase().includes('conflict')) return 'requires_attention';
  return 'queued';
}

function reasonLabel(reason: EligibilityReason) {
  if (reason === 'all_checks_passed') return 'All required eligibility checks have passed.';
  if (reason === 'required_information_missing') return 'Required candidate information is incomplete.';
  if (reason === 'conflicting_information') return 'Candidate information is conflicting across submitted records.';
  if (reason === 'policy_review_required') return 'A configured policy requires human confirmation.';
  if (reason === 'invalid_processing_context') return 'Processing context is not valid for this case.';
  if (reason === 'mandatory_rule_not_satisfied') return 'One or more mandatory eligibility conditions are not satisfied.';
  if (reason === 'workflow_blocking_condition') return 'A blocking policy condition prevents safe continuation.';
  return 'VEYQOR is still completing required checks.';
}

function displayStatus(status: EligibilityStatus) {
  if (status === 'eligible') return 'Eligible';
  if (status === 'requires_attention') return 'Requires attention';
  if (status === 'ineligible') return 'Ineligible';
  if (status === 'blocked') return 'Blocked';
  if (status === 'processing') return 'Processing';
  return 'Pending';
}

function checkLabel(status: CheckStatus) {
  if (status === 'passed') return 'Passed';
  if (status === 'attention') return 'Attention';
  if (status === 'blocked') return 'Blocked';
  if (status === 'processing') return 'Processing';
  return 'Pending';
}

function toCandidateIdentifier(id: string) {
  return `Candidate ${id.slice(-4).toUpperCase()}`;
}

function buildInitialCandidate(item: IntakeBatchItem, criteriaVersion: string, restrictIdentity: boolean): CandidateRecord {
  const normalizedStatus = normalizeStatus(item.status, item.fileName);

  if (normalizedStatus === 'blocked') {
    return {
      id: item.id,
      candidateIdentifier: toCandidateIdentifier(item.id),
      candidateName: item.candidateName,
      source: item.source,
      eligibility: 'blocked',
      reason: 'workflow_blocking_condition',
      checks: {
        requiredInformation: 'blocked',
        provenance: 'passed',
        processingPurpose: 'passed',
        policy: 'blocked',
        eligibilityRule: 'blocked',
      },
      updatedAt: item.recordedAt || new Date().toLocaleString(),
      criteriaVersion,
      restrictedInfo: restrictIdentity,
      auditEvents: ['Eligibility assessment started', 'Blocking policy condition detected', 'Candidate blocked from progression'],
    };
  }

  if (normalizedStatus === 'requires_attention') {
    return {
      id: item.id,
      candidateIdentifier: toCandidateIdentifier(item.id),
      candidateName: item.candidateName,
      source: item.source,
      eligibility: 'requires_attention',
      reason: item.fileName.toLowerCase().includes('conflict') ? 'conflicting_information' : 'policy_review_required',
      checks: {
        requiredInformation: 'attention',
        provenance: 'passed',
        processingPurpose: 'passed',
        policy: 'attention',
        eligibilityRule: 'attention',
      },
      updatedAt: item.recordedAt || new Date().toLocaleString(),
      criteriaVersion,
      restrictedInfo: restrictIdentity,
      auditEvents: ['Eligibility assessment started', 'Exception raised', 'Human review required'],
    };
  }

  if (normalizedStatus === 'cleared') {
    return {
      id: item.id,
      candidateIdentifier: toCandidateIdentifier(item.id),
      candidateName: item.candidateName,
      source: item.source,
      eligibility: 'processing',
      reason: 'assessment_in_progress',
      checks: {
        requiredInformation: 'processing',
        provenance: 'passed',
        processingPurpose: 'passed',
        policy: 'processing',
        eligibilityRule: 'processing',
      },
      updatedAt: item.recordedAt || new Date().toLocaleString(),
      criteriaVersion,
      restrictedInfo: restrictIdentity,
      auditEvents: ['Eligibility assessment started', 'Rule evaluation in progress'],
    };
  }

  return {
    id: item.id,
    candidateIdentifier: toCandidateIdentifier(item.id),
    candidateName: item.candidateName,
    source: item.source,
    eligibility: 'pending',
    reason: 'assessment_in_progress',
    checks: {
      requiredInformation: 'pending',
      provenance: 'pending',
      processingPurpose: 'pending',
      policy: 'pending',
      eligibilityRule: 'pending',
    },
    updatedAt: item.recordedAt || new Date().toLocaleString(),
    criteriaVersion,
    restrictedInfo: restrictIdentity,
    auditEvents: ['Eligibility assessment queued'],
  };
}

export default function EligibilityReviewPage() {
  const router = useRouter();

  const [session, setSession] = useState<AuthSession | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const [caseContext, setCaseContext] = useState<CaseContext>({
    jobTitle: 'Senior Frontend Engineer',
    caseId: 'Case #VQ-1042',
    criteriaVersion: 'v2',
  });

  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [eligibilityFilter, setEligibilityFilter] = useState<EligibilityFilter>('all');
  const [reasonFilter, setReasonFilter] = useState<EligibilityReason | 'all'>('all');
  const [processingFilter, setProcessingFilter] = useState<ProcessingFilter>('all');
  const [search, setSearch] = useState('');
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);

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
      router.replace('/org-context');
      return;
    }

    setTenantName(tenant.name);
    setOrgName(org.name);

    let resolvedCaseContext: CaseContext = {
      jobTitle: 'Senior Frontend Engineer',
      caseId: 'Case #VQ-1042',
      criteriaVersion: 'v2',
    };

    const rawContext = window.localStorage.getItem(CASE_CONTEXT_STORAGE_KEY);
    if (rawContext) {
      try {
        const parsed = JSON.parse(rawContext) as Partial<CaseContext>;
        const nextJobTitle = parsed.jobTitle?.trim();
        const nextCaseId = parsed.caseId?.trim();
        const nextVersion = parsed.criteriaVersion?.trim() ?? 'v2';
        if (nextJobTitle && nextCaseId) {
          resolvedCaseContext = { jobTitle: nextJobTitle, caseId: nextCaseId, criteriaVersion: nextVersion };
        }
      } catch {
        // Keep fallback context for malformed payload.
      }
    }

    setCaseContext(resolvedCaseContext);

    const rawBatch = window.localStorage.getItem(CANDIDATE_BATCH_STORAGE_KEY);
    if (!rawBatch) {
      setCandidates([]);
      return;
    }

    try {
      const restrictIdentity = activeSession.role === 'leadership';
      const batch = JSON.parse(rawBatch) as IntakeBatchItem[];
      const transformed = batch.map((item) => buildInitialCandidate(item, resolvedCaseContext.criteriaVersion, restrictIdentity));
      setCandidates(transformed);
    } catch {
      setCandidates([]);
    }
  }, [router]);

  useEffect(() => {
    const hasInFlight = candidates.some((candidate) => candidate.eligibility === 'pending' || candidate.eligibility === 'processing');
    if (!hasInFlight) {
      return;
    }

    const timer = window.setInterval(() => {
      setCandidates((current) =>
        current.map((candidate) => {
          if (candidate.eligibility === 'pending') {
            return {
              ...candidate,
              eligibility: 'processing',
              reason: 'assessment_in_progress',
              checks: {
                ...candidate.checks,
                requiredInformation: 'processing',
                provenance: 'passed',
                processingPurpose: 'passed',
                policy: 'processing',
                eligibilityRule: 'processing',
              },
              updatedAt: 'Just now',
              auditEvents: [...candidate.auditEvents, 'Eligibility checks started'],
            };
          }

          if (candidate.eligibility === 'processing') {
            const source = candidate.source.trim().toLowerCase();
            const needsAttention = source === 'other';
            const isIneligible = source === 'agency';

            if (isIneligible) {
              return {
                ...candidate,
                eligibility: 'ineligible',
                reason: 'mandatory_rule_not_satisfied',
                checks: {
                  requiredInformation: 'passed',
                  provenance: 'passed',
                  processingPurpose: 'passed',
                  policy: 'blocked',
                  eligibilityRule: 'blocked',
                },
                updatedAt: 'Just now',
                auditEvents: [...candidate.auditEvents, 'Mandatory rule violation found', 'Candidate marked ineligible'],
              };
            }

            return {
              ...candidate,
              eligibility: needsAttention ? 'requires_attention' : 'eligible',
              reason: needsAttention ? 'required_information_missing' : 'all_checks_passed',
              checks: {
                requiredInformation: needsAttention ? 'attention' : 'passed',
                provenance: 'passed',
                processingPurpose: 'passed',
                policy: needsAttention ? 'attention' : 'passed',
                eligibilityRule: needsAttention ? 'attention' : 'passed',
              },
              updatedAt: 'Just now',
              auditEvents: [...candidate.auditEvents, needsAttention ? 'Exception raised' : 'Eligibility assessment completed'],
            };
          }

          return candidate;
        })
      );
    }, 900);

    return () => window.clearInterval(timer);
  }, [candidates]);

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

  useEffect(() => {
    if (!activeCandidateId) {
      return;
    }

    function onEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActiveCandidateId(null);
      }
    }

    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [activeCandidateId]);

  const activeRole = session?.role ?? 'operator';
  const isReadOnly = Boolean(session?.role === 'leadership');
  const hasResolvePermission = Boolean(session && canResolve(session.role) && !isReadOnly);
  const hasContinuePermission = Boolean(session && canContinue(session.role) && !isReadOnly);

  const dashboardNavItems = useMemo(() => {
    const baseItems = [
      { label: 'Dashboard', href: '/dashboard', active: false },
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

  const counts = useMemo(() => {
    const eligible = candidates.filter((item) => item.eligibility === 'eligible').length;
    const attention = candidates.filter((item) => item.eligibility === 'requires_attention').length;
    const ineligible = candidates.filter((item) => item.eligibility === 'ineligible').length;
    const blocked = candidates.filter((item) => item.eligibility === 'blocked').length;
    const pending = candidates.filter((item) => item.eligibility === 'pending').length;
    const processing = candidates.filter((item) => item.eligibility === 'processing').length;
    return { eligible, attention, ineligible, blocked, pending, processing, total: candidates.length };
  }, [candidates]);

  const automationState: AutomationState = useMemo(() => {
    if (counts.blocked > 0) {
      return 'blocked';
    }
    if (counts.pending > 0 || counts.processing > 0) {
      return 'assessing';
    }
    if (counts.attention > 0) {
      return 'attention_required';
    }
    return 'completed';
  }, [counts.attention, counts.blocked, counts.pending, counts.processing]);

  const gateState: GateState = useMemo(() => {
    if (!session) return 'permission_denied';
    if (counts.total === 0) return 'pending';
    if (counts.pending > 0 || counts.processing > 0) return 'processing';
    if (counts.blocked > 0) return 'blocked';
    if (counts.attention > 0 && counts.eligible > 0) return 'partial_success';
    if (counts.attention > 0) return 'requires_attention';
    if (counts.ineligible > 0 && counts.eligible === 0) return 'ineligible';
    if (counts.eligible > 0) return 'completed';
    return 'eligible';
  }, [counts, session]);

  const reasonOptions = useMemo(() => {
    const unique = new Set<EligibilityReason>(candidates.map((item) => item.reason));
    return Array.from(unique);
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      if (eligibilityFilter !== 'all' && candidate.eligibility !== eligibilityFilter) {
        return false;
      }

      if (reasonFilter !== 'all' && candidate.reason !== reasonFilter) {
        return false;
      }

      if (processingFilter === 'active' && !(candidate.eligibility === 'pending' || candidate.eligibility === 'processing')) {
        return false;
      }

      if (processingFilter === 'completed' && (candidate.eligibility === 'pending' || candidate.eligibility === 'processing')) {
        return false;
      }

      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const searchName = isReadOnly ? '' : candidate.candidateName.toLowerCase();
        if (!candidate.candidateIdentifier.toLowerCase().includes(query) && !searchName.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [candidates, eligibilityFilter, isReadOnly, processingFilter, reasonFilter, search]);

  const exceptionQueue = useMemo(
    () => candidates.filter((candidate) => candidate.eligibility === 'requires_attention' || candidate.eligibility === 'blocked'),
    [candidates]
  );

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === activeCandidateId) ?? null,
    [activeCandidateId, candidates]
  );

  const queueNotice = useMemo((): { tone: QueueNoticeTone; message: string } => {
    if (automationState === 'assessing') {
      return {
        tone: 'neutral',
        message: 'VEYQOR is automatically checking candidate records against approved rules, processing purpose, and policy constraints.',
      };
    }

    if (automationState === 'blocked') {
      return {
        tone: 'error',
        message: 'Blocking policy conditions were detected. Affected candidates cannot proceed until blocking conditions are resolved.',
      };
    }

    if (automationState === 'attention_required') {
      return {
        tone: 'warning',
        message: 'Some candidates require human attention before they can continue to AI sanitisation.',
      };
    }

    return {
      tone: 'success',
      message: 'Eligibility assessment completed.',
    };
  }, [automationState]);

  const canAdvanceToAI =
    counts.eligible > 0
    && counts.attention === 0
    && counts.blocked === 0
    && counts.pending === 0
    && counts.processing === 0;

  function resolveAttention(candidateId: string) {
    setCandidates((current) =>
      current.map((candidate) => {
        if (candidate.id !== candidateId || (candidate.eligibility !== 'requires_attention' && candidate.eligibility !== 'blocked')) {
          return candidate;
        }

        return {
          ...candidate,
          eligibility: 'eligible',
          reason: 'all_checks_passed',
          checks: {
            requiredInformation: 'passed',
            provenance: 'passed',
            processingPurpose: 'passed',
            policy: 'passed',
            eligibilityRule: 'passed',
          },
          updatedAt: 'Just now',
          auditEvents: [...candidate.auditEvents, 'Human intervention recorded', 'Exception resolved', 'Candidate marked eligible'],
        };
      })
    );
  }

  function statusTone(status: EligibilityStatus) {
    if (status === 'eligible') return styles.statusEligible;
    if (status === 'requires_attention') return styles.statusAttention;
    if (status === 'ineligible') return styles.statusIneligible;
    if (status === 'blocked') return styles.statusBlocked;
    return styles.statusPending;
  }

  function checkTone(status: CheckStatus) {
    if (status === 'passed') return styles.checkPassed;
    if (status === 'attention') return styles.checkAttention;
    if (status === 'blocked') return styles.checkBlocked;
    if (status === 'processing') return styles.checkProcessing;
    return styles.checkPending;
  }

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
            aria-controls="eligibility-mobile-drawer"
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
          id="eligibility-mobile-drawer"
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
              <p className={styles.breadcrumb}>Cases / {caseContext.jobTitle} / Candidate Ingestion / Eligibility Review</p>
              <h1>Eligibility Review</h1>
              <p className={styles.topSubtitle}>VEYQOR automatically validates candidate eligibility before they enter the AI evaluation workflow.</p>
            </div>
            <div className={styles.topActions}>
              <button type="button" className={styles.iconButton} aria-label="Notifications">◦</button>
              <div className={styles.headerContext}>
                <strong>{orgName}</strong>
                <span>{tenantName}</span>
              </div>
              <button type="button" className={styles.userButton} onClick={() => router.push('/dashboard')}>
                <span className={styles.avatar}>{session.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                <span>
                  <strong>{session.fullName}</strong>
                  <small>{roleLabel(session.role)}</small>
                </span>
              </button>
            </div>
          </header>

          <section className={styles.contextPanel}>
            <div>
              <p className={styles.panelKicker}>Case context</p>
              <h2>{caseContext.jobTitle}</h2>
              <p className={styles.caseMeta}>{caseContext.caseId} · Criteria {caseContext.criteriaVersion} · {orgName}</p>
            </div>
            <div className={styles.contextPills}>
              <span>Case ID <strong>{caseContext.caseId}</strong></span>
              <span>Criteria version <strong>{caseContext.criteriaVersion}</strong></span>
              <span>Organisation <strong>{orgName}</strong></span>
            </div>
          </section>

          <section className={styles.stepperPanel}>
            <div className={styles.stepper} aria-label="Candidate ingestion workflow progress">
              {WORKFLOW_STEPS.map((step, index) => {
                const complete = index < 4;
                const active = index === 4;
                return (
                  <div key={step} className={`${styles.step} ${complete ? styles.stepComplete : ''} ${active ? styles.stepActive : ''}`}>
                    <span>{complete ? '✓' : active ? '●' : '○'}</span>
                    <p>{step}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {isReadOnly ? (
            <section className={styles.readOnlyBanner} role="status">
              <strong>View only access</strong>
              <p>You can inspect eligibility outcomes and evidence, but cannot resolve exceptions or continue restricted workflow actions.</p>
            </section>
          ) : null}

          <section className={styles.summaryStrip} aria-label="Eligibility summary metrics">
            <article className={styles.summaryCard}><span>Eligible</span><strong>{counts.eligible}</strong></article>
            <article className={styles.summaryCard}><span>Requires attention</span><strong>{counts.attention}</strong></article>
            <article className={styles.summaryCard}><span>Ineligible</span><strong>{counts.ineligible}</strong></article>
            <article className={styles.summaryCard}><span>Pending</span><strong>{counts.pending + counts.processing}</strong></article>
          </section>

          <section className={styles.workspaceGrid}>
            <div className={styles.mainColumn}>
              <section className={`${styles.systemPanel} ${queueNotice.tone === 'success' ? styles.systemSuccess : queueNotice.tone === 'warning' ? styles.systemWarning : queueNotice.tone === 'error' ? styles.systemError : ''}`} role="status" aria-live="polite">
                <div className={styles.systemPanelHead}>
                  <h3>Automated eligibility assessment</h3>
                  <span className={styles.systemSignal} aria-hidden="true" />
                </div>
                <p>{queueNotice.message}</p>
                <small>
                  {automationState === 'assessing'
                    ? 'Processing'
                    : automationState === 'attention_required'
                      ? 'Attention required'
                      : automationState === 'blocked'
                        ? 'Blocked'
                        : 'Completed'}
                </small>
              </section>

              {exceptionQueue.length > 0 ? (
                <section className={styles.panel}>
                  <header className={styles.panelHeader}>
                    <div>
                      <h3>Attention required</h3>
                      <p>{exceptionQueue.length} candidate{exceptionQueue.length === 1 ? '' : 's'} require review before they can continue safely.</p>
                    </div>
                    {hasResolvePermission ? (
                      <button type="button" className={styles.primaryAction} onClick={() => setActiveCandidateId(exceptionQueue[0].id)}>
                        Review exceptions
                      </button>
                    ) : null}
                  </header>
                  <div className={styles.exceptionQueue}>
                    {exceptionQueue.slice(0, 4).map((candidate) => (
                      <article key={candidate.id} className={styles.exceptionItem}>
                        <strong>{candidate.candidateIdentifier}</strong>
                        <p>{reasonLabel(candidate.reason)}</p>
                        <button type="button" className={styles.linkAction} onClick={() => setActiveCandidateId(candidate.id)}>
                          {candidate.eligibility === 'blocked' ? 'Review block' : 'Review exception'}
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className={styles.panel}>
                <header className={styles.panelHeader}>
                  <div>
                    <h3>Candidate eligibility workspace</h3>
                    <p>{counts.total} candidate{counts.total === 1 ? '' : 's'} assessed against approved eligibility rules and policy context.</p>
                  </div>
                </header>

                <div className={styles.filtersRow}>
                  <label>
                    <span>Eligibility</span>
                    <select value={eligibilityFilter} onChange={(event) => setEligibilityFilter(event.target.value as EligibilityFilter)}>
                      <option value="all">All</option>
                      <option value="eligible">Eligible</option>
                      <option value="requires_attention">Requires attention</option>
                      <option value="ineligible">Ineligible</option>
                      <option value="blocked">Blocked</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                    </select>
                  </label>

                  <label>
                    <span>Reason</span>
                    <select value={reasonFilter} onChange={(event) => setReasonFilter(event.target.value as EligibilityReason | 'all')}>
                      <option value="all">All</option>
                      {reasonOptions.map((reason) => (
                        <option key={reason} value={reason}>{reasonLabel(reason)}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Processing</span>
                    <select value={processingFilter} onChange={(event) => setProcessingFilter(event.target.value as ProcessingFilter)}>
                      <option value="all">All</option>
                      <option value="active">Pending / Processing</option>
                      <option value="completed">Completed</option>
                    </select>
                  </label>

                  <label className={styles.searchLabel}>
                    <span>Search</span>
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search candidate identifier"
                    />
                  </label>
                </div>

                {filteredCandidates.length === 0 ? (
                  <div className={styles.emptyState}>
                    <strong>No candidates match the selected filters</strong>
                    <p>Adjust eligibility, reason, processing state, or search filters.</p>
                  </div>
                ) : (
                  <>
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Candidate</th>
                            <th>Eligibility</th>
                            <th>Reason</th>
                            <th>Checks</th>
                            <th>Updated</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCandidates.map((candidate) => (
                            <tr key={candidate.id}>
                              <td>
                                <strong>{candidate.candidateIdentifier}</strong>
                                <p>{isReadOnly ? 'Restricted information' : candidate.candidateName}</p>
                              </td>
                              <td><span className={`${styles.statusBadge} ${statusTone(candidate.eligibility)}`}>{displayStatus(candidate.eligibility)}</span></td>
                              <td>{reasonLabel(candidate.reason)}</td>
                              <td>
                                <span className={styles.checkSummary}>
                                  {candidate.eligibility === 'eligible'
                                    ? 'Passed'
                                    : candidate.eligibility === 'requires_attention'
                                      ? 'Attention'
                                      : candidate.eligibility === 'ineligible' || candidate.eligibility === 'blocked'
                                        ? 'Blocked'
                                        : 'Processing'}
                                </span>
                              </td>
                              <td>{candidate.updatedAt}</td>
                              <td>
                                <button type="button" className={styles.linkAction} onClick={() => setActiveCandidateId(candidate.id)}>
                                  {candidate.eligibility === 'requires_attention' || candidate.eligibility === 'blocked' ? 'Review' : 'View details'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className={styles.mobileList}>
                      {filteredCandidates.map((candidate) => (
                        <article key={candidate.id} className={styles.mobileCard}>
                          <strong>{candidate.candidateIdentifier}</strong>
                          <span className={`${styles.statusBadge} ${statusTone(candidate.eligibility)}`}>{displayStatus(candidate.eligibility)}</span>
                          <p>{reasonLabel(candidate.reason)}</p>
                          <small>Criteria {candidate.criteriaVersion} · Updated {candidate.updatedAt}</small>
                          <button type="button" className={styles.linkAction} onClick={() => setActiveCandidateId(candidate.id)}>
                            {candidate.eligibility === 'requires_attention' || candidate.eligibility === 'blocked' ? 'Review exception' : 'View details'}
                          </button>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </section>
            </div>

            <aside className={styles.sideColumn}>
              <section className={styles.sideCard}>
                <h3>Eligibility check pipeline</h3>
                <ol className={styles.pipeline}>
                  <li><span>✓</span><p>Candidate received</p></li>
                  <li><span>✓</span><p>Required information</p></li>
                  <li><span>✓</span><p>Provenance verified</p></li>
                  <li><span>✓</span><p>Processing purpose</p></li>
                  <li><span>{counts.pending + counts.processing > 0 ? '●' : '✓'}</span><p>Eligibility rules</p></li>
                  <li><span>{counts.attention > 0 || counts.blocked > 0 ? '!' : '✓'}</span><p>Policy checks</p></li>
                  <li><span>{counts.pending + counts.processing > 0 ? '○' : '✓'}</span><p>Eligibility decision</p></li>
                </ol>
              </section>

              <section className={styles.sideCard}>
                <h3>Evaluation context</h3>
                <div className={styles.policyMeta}>
                  <p><span>Case</span><strong>{caseContext.jobTitle}</strong></p>
                  <p><span>Criteria</span><strong>Criteria {caseContext.criteriaVersion}</strong></p>
                  <p><span>Eligibility policy</span><strong>Current organisation policy</strong></p>
                  <p><span>Evaluated against</span><strong>Criteria {caseContext.criteriaVersion}</strong></p>
                </div>
              </section>

              <section className={styles.sideCard}>
                {gateState === 'completed' || gateState === 'eligible' ? (
                  <>
                    <h3>Eligibility assessment complete</h3>
                    <p>VEYQOR has completed the eligibility assessment for this case.</p>
                    <div className={styles.compactStats}>
                      <span>Eligible <strong>{counts.eligible}</strong></span>
                      <span>Requires attention <strong>{counts.attention}</strong></span>
                      <span>Ineligible <strong>{counts.ineligible + counts.blocked}</strong></span>
                    </div>
                    {hasContinuePermission && canAdvanceToAI ? (
                      <button type="button" className={styles.primaryAction} onClick={() => router.push(NEXT_STAGE_ROUTE)}>
                        Continue to AI evaluation
                      </button>
                    ) : (
                      <p className={styles.viewOnlyNotice}>
                        {isReadOnly ? 'View only access: progression actions are disabled.' : 'Continue is available only when workflow rules allow progression.'}
                      </p>
                    )}
                  </>
                ) : gateState === 'partial_success' ? (
                  <>
                    <h3>Partial success</h3>
                    <p>Some candidates are eligible, while others require attention or are ineligible.</p>
                    {hasResolvePermission && exceptionQueue.length > 0 ? (
                      <button type="button" className={styles.primaryAction} onClick={() => setActiveCandidateId(exceptionQueue[0].id)}>
                        Review exceptions
                      </button>
                    ) : null}
                  </>
                ) : gateState === 'blocked' || gateState === 'requires_attention' ? (
                  <>
                    <h3>Eligibility review requires attention</h3>
                    <p>Some candidates require resolution before the case can continue.</p>
                    {hasResolvePermission && exceptionQueue.length > 0 ? (
                      <button type="button" className={styles.primaryAction} onClick={() => setActiveCandidateId(exceptionQueue[0].id)}>
                        Review exceptions
                      </button>
                    ) : null}
                  </>
                ) : gateState === 'processing' ? (
                  <>
                    <h3>Assessment in progress</h3>
                    <p>VEYQOR is completing automated eligibility checks for this case.</p>
                  </>
                ) : gateState === 'permission_denied' ? (
                  <>
                    <h3>Permission required</h3>
                    <p>Your current role can view this page but cannot perform eligibility actions.</p>
                  </>
                ) : (
                  <>
                    <h3>Awaiting candidate data</h3>
                    <p>No candidate records are ready for eligibility assessment yet.</p>
                  </>
                )}
              </section>
            </aside>
          </section>
        </div>
      </div>

      {selectedCandidate ? (
        <>
          <div className={styles.drawerOverlay} role="presentation" onClick={() => setActiveCandidateId(null)} />
          <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Eligibility details">
            <header className={styles.drawerHeader}>
              <div>
                <h3>Eligibility details</h3>
                <p>{selectedCandidate.candidateIdentifier}</p>
              </div>
              <button type="button" className={styles.closeBtn} onClick={() => setActiveCandidateId(null)} aria-label="Close eligibility details">×</button>
            </header>

            <section className={styles.drawerSection}>
              <h4>Candidate</h4>
              <p>{selectedCandidate.candidateIdentifier}</p>
              <small>{isReadOnly ? 'Restricted information' : selectedCandidate.candidateName}</small>
            </section>

            <section className={styles.drawerSection}>
              <h4>Eligibility</h4>
              <span className={`${styles.statusBadge} ${statusTone(selectedCandidate.eligibility)}`}>{displayStatus(selectedCandidate.eligibility)}</span>
              <p>{reasonLabel(selectedCandidate.reason)}</p>
            </section>

            <section className={styles.drawerSection}>
              <h4>Eligibility checks</h4>
              <div className={styles.checkList}>
                <p><span>Required information</span><strong className={checkTone(selectedCandidate.checks.requiredInformation)}>{checkLabel(selectedCandidate.checks.requiredInformation)}</strong></p>
                <p><span>Provenance</span><strong className={checkTone(selectedCandidate.checks.provenance)}>{checkLabel(selectedCandidate.checks.provenance)}</strong></p>
                <p><span>Processing purpose</span><strong className={checkTone(selectedCandidate.checks.processingPurpose)}>{checkLabel(selectedCandidate.checks.processingPurpose)}</strong></p>
                <p><span>Policy</span><strong className={checkTone(selectedCandidate.checks.policy)}>{checkLabel(selectedCandidate.checks.policy)}</strong></p>
                <p><span>Eligibility rule</span><strong className={checkTone(selectedCandidate.checks.eligibilityRule)}>{checkLabel(selectedCandidate.checks.eligibilityRule)}</strong></p>
              </div>
            </section>

            {(selectedCandidate.eligibility === 'requires_attention' || selectedCandidate.eligibility === 'blocked') ? (
              <section className={styles.drawerSection}>
                <h4>Exception details</h4>
                <div className={styles.evidenceList}>
                  <p><span>Issue</span><strong>{selectedCandidate.eligibility === 'blocked' ? 'Blocking condition detected' : 'Automatic determination incomplete'}</strong></p>
                  <p><span>Impact</span><strong>{selectedCandidate.eligibility === 'blocked' ? 'Candidate cannot continue' : 'Candidate requires authorised review'}</strong></p>
                  <p><span>Required action</span><strong>{hasResolvePermission ? 'Review and resolve exception' : 'Await authorised reviewer action'}</strong></p>
                  <p><span>Evidence</span><strong>Policy and ingestion checks attached</strong></p>
                </div>
              </section>
            ) : null}

            <section className={styles.drawerSection}>
              <h4>Policy context</h4>
              <div className={styles.evidenceList}>
                <p><span>Case</span><strong>{caseContext.jobTitle}</strong></p>
                <p><span>Criteria</span><strong>Criteria {caseContext.criteriaVersion}</strong></p>
                <p><span>Organisation</span><strong>{orgName}</strong></p>
              </div>
            </section>

            <section className={styles.drawerSection}>
              <h4>Eligibility-related history</h4>
              <ol className={styles.auditList}>
                {selectedCandidate.auditEvents.map((event, index) => (
                  <li key={`${selectedCandidate.id}-${event}-${index}`}>{event}</li>
                ))}
              </ol>
            </section>

            {hasResolvePermission && (selectedCandidate.eligibility === 'requires_attention' || selectedCandidate.eligibility === 'blocked') ? (
              <button type="button" className={styles.primaryAction} onClick={() => resolveAttention(selectedCandidate.id)}>
                Resolve and mark eligible
              </button>
            ) : null}
          </aside>
        </>
      ) : null}
    </main>
  );
}
