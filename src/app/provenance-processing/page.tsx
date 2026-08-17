'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockAuthGateway, type AuthSession } from '@/lib/auth/mockAuthGateway';
import editorStyles from '../criteria-editor/page.module.css';
import styles from './page.module.css';

const TENANT_STORAGE_KEY = 'veyqor.mock.tenant-context.v1';
const ORG_STORAGE_KEY = 'veyqor.mock.org-context.v1';
const CASE_CONTEXT_STORAGE_KEY = 'veyqor.mock.case-context.v1';
const CANDIDATE_BATCH_STORAGE_KEY = 'veyqor.mock.candidate-intake.batch.v1';
const WORKFLOW_STEPS = ['Criteria Approval', 'Candidate Intake', 'Quarantine', 'Provenance', 'Eligibility'];

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

type QuarantineStatus =
  | 'queued'
  | 'uploading'
  | 'quarantined'
  | 'validating'
  | 'processing'
  | 'cleared'
  | 'blocked'
  | 'requires_attention'
  | 'failed';

type ProvenanceStatus = 'verified' | 'incomplete' | 'requires_attention' | 'blocked';
type PolicyAlignmentStatus = 'aligned' | 'review_required' | 'blocked';
type ExperienceState =
  | 'verified'
  | 'incomplete'
  | 'requires_attention'
  | 'blocked'
  | 'policy_review'
  | 'purpose_mismatch'
  | 'source_unknown'
  | 'read_only'
  | 'processing_context_confirmed'
  | 'ready_for_eligibility';

type SourceType = 'Direct upload' | 'Configured integration' | 'Agency' | 'Referral' | 'Internal source' | 'Other' | 'Unknown';
type Severity = 'low' | 'medium' | 'high' | 'critical';

type ProvenanceRecord = {
  id: string;
  sourceType: SourceType;
  sourceReference?: string;
  sourceName?: string;
  importedBy: string;
  importedAt: string;
  organisation: string;
  caseId: string;
  originalFile: string;
  candidateName: string;
  status: QuarantineStatus;
};

type ExceptionCode = 'source_unknown' | 'missing_processing_context' | 'policy_conflict' | 'purpose_mismatch';

type ProvenanceException = {
  code: ExceptionCode;
  issue: string;
  severity: Severity;
  explanation: string;
  recommendedAction: string;
  blocking: boolean;
  resolution: 'source' | 'context' | 'review';
};

type PolicyItem = {
  name: string;
  state: 'Active' | 'Configured' | 'Review required';
  description: string;
};

function normalizeStatus(raw: string, fileName: string): QuarantineStatus {
  if (raw === 'invalid') return 'blocked';
  if (raw === 'failed') return 'failed';
  if (raw === 'requires_attention') return 'requires_attention';
  if (raw === 'duplicate') return 'requires_attention';
  if (raw === 'ready') return 'cleared';
  if (raw === 'processing') return 'processing';
  if (raw === 'validating') return 'validating';
  if (raw === 'quarantined') return 'quarantined';
  if (raw === 'uploading') return 'uploading';
  if (fileName.toLowerCase().includes('blocked')) return 'blocked';
  if (fileName.toLowerCase().includes('attention')) return 'requires_attention';
  return 'queued';
}

function normalizeSourceType(raw: string): SourceType {
  const source = raw.trim().toLowerCase();
  if (source === 'direct upload') return 'Direct upload';
  if (source === 'integration') return 'Configured integration';
  if (source === 'agency') return 'Agency';
  if (source === 'referral') return 'Referral';
  if (source === 'internal source') return 'Internal source';
  if (source === 'other') return 'Other';
  if (!source || source === 'unknown' || source === 'unavailable') return 'Unknown';
  return 'Other';
}

function canResolve(role: AuthSession['role']) {
  return role === 'operator' || role === 'reviewer' || role === 'administrator';
}

function canConfirm(role: AuthSession['role']) {
  return role === 'operator' || role === 'reviewer' || role === 'administrator';
}

function roleLabel(role: AuthSession['role']) {
  if (role === 'administrator') return 'Administrator';
  if (role === 'reviewer') return 'Reviewer';
  if (role === 'leadership') return 'Leadership/Oversight';
  return 'Recruitment Operator';
}

function policyTone(state: PolicyItem['state']) {
  if (state === 'Active') return styles.policyStateActive;
  if (state === 'Configured') return styles.policyStateConfigured;
  return styles.policyStateReview;
}

function severityTone(severity: Severity) {
  if (severity === 'critical') return styles.severityCritical;
  if (severity === 'high') return styles.severityHigh;
  if (severity === 'medium') return styles.severityMedium;
  return styles.severityLow;
}

export default function ProvenanceProcessingPage() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [caseContext, setCaseContext] = useState<CaseContext>({
    jobTitle: 'Senior Frontend Engineer',
    caseId: 'Case #VQ-1042',
    criteriaVersion: 'v2',
  });
  const [records, setRecords] = useState<ProvenanceRecord[]>([]);
  const [resolvedExceptions, setResolvedExceptions] = useState<ExceptionCode[]>([]);
  const [policyDrawerOpen, setPolicyDrawerOpen] = useState(false);
  const [activeResolution, setActiveResolution] = useState<ProvenanceException | null>(null);
  const [resolvedSourceType, setResolvedSourceType] = useState<SourceType>('Direct upload');
  const [resolvedSourceReference, setResolvedSourceReference] = useState('');
  const [processingConfirmed, setProcessingConfirmed] = useState(false);

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
      setRecords([]);
      return;
    }

    try {
      const batch = JSON.parse(rawBatch) as IntakeBatchItem[];
      const transformed = batch.map((item) => {
        const normalizedStatus = normalizeStatus(item.status, item.fileName);
        const sourceType = normalizeSourceType(item.source);
        return {
          id: item.id,
          sourceType,
          sourceReference: item.id,
          sourceName: sourceType === 'Configured integration' ? 'Configured integration channel' : undefined,
          importedBy: activeSession.fullName,
          importedAt: item.recordedAt || new Date().toLocaleString(),
          organisation: org.name,
          caseId: resolvedCaseContext.caseId,
          originalFile: item.fileName,
          candidateName: item.candidateName,
          status: normalizedStatus,
        } satisfies ProvenanceRecord;
      });

      setRecords(transformed);
    } catch {
      setRecords([]);
    }
  }, [router]);

  useEffect(() => {
    if (!policyDrawerOpen && !activeResolution) {
      return;
    }

    function onEsc(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return;
      }

      setPolicyDrawerOpen(false);
      setActiveResolution(null);
    }

    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [policyDrawerOpen, activeResolution]);

  const summary = useMemo(() => {
    const total = records.length;
    const blocked = records.filter((item) => item.status === 'blocked' || item.status === 'failed').length;
    const attention = records.filter((item) => item.status === 'requires_attention').length;
    const sourceUnknown = records.filter((item) => item.sourceType === 'Unknown').length;

    return { total, blocked, attention, sourceUnknown };
  }, [records]);

  const contextMissing = !orgName || !tenantName || !caseContext.jobTitle || !caseContext.caseId;
  const purposeMismatch = !caseContext.jobTitle || !caseContext.caseId;

  const derivedExceptions = useMemo(() => {
    const list: ProvenanceException[] = [];

    if (summary.sourceUnknown > 0) {
      list.push({
        code: 'source_unknown',
        issue: 'Unknown source',
        severity: summary.blocked > 0 ? 'high' : 'medium',
        explanation: 'The original source for one or more candidate records could not be established automatically.',
        recommendedAction: 'Select the correct source so provenance can be completed.',
        blocking: summary.blocked > 0,
        resolution: 'source',
      });
    }

    if (contextMissing) {
      list.push({
        code: 'missing_processing_context',
        issue: 'Missing processing context',
        severity: 'high',
        explanation: 'Required tenant, organisation, case, or role context is incomplete for this candidate workflow.',
        recommendedAction: 'Review the active context and complete missing case information.',
        blocking: true,
        resolution: 'context',
      });
    }

    if (summary.blocked > 0) {
      list.push({
        code: 'policy_conflict',
        issue: 'Policy conflict',
        severity: 'critical',
        explanation: 'One or more records did not satisfy required processing policy checks from quarantine.',
        recommendedAction: 'Resolve the blocked records before continuing to eligibility review.',
        blocking: true,
        resolution: 'review',
      });
    }

    if (purposeMismatch) {
      list.push({
        code: 'purpose_mismatch',
        issue: 'Purpose mismatch',
        severity: 'high',
        explanation: 'The configured processing purpose does not fully match the active case context.',
        recommendedAction: 'Validate the case context and re-align processing purpose.',
        blocking: true,
        resolution: 'context',
      });
    }

    if (summary.attention > 0 && summary.blocked === 0) {
      list.push({
        code: 'policy_conflict',
        issue: 'Review required',
        severity: 'medium',
        explanation: 'An exception from quarantine requires a policy-aware human review before progression.',
        recommendedAction: 'Open the file review details and resolve the flagged issue.',
        blocking: false,
        resolution: 'review',
      });
    }

    return list;
  }, [contextMissing, purposeMismatch, summary]);

  const exceptions = useMemo(
    () => derivedExceptions.filter((item) => !resolvedExceptions.includes(item.code)),
    [derivedExceptions, resolvedExceptions]
  );

  const provenanceStatus: ProvenanceStatus = useMemo(() => {
    if (summary.blocked > 0 || contextMissing || purposeMismatch) {
      return 'blocked';
    }
    if (summary.sourceUnknown > 0 || summary.attention > 0 || exceptions.some((item) => item.severity === 'high')) {
      return 'requires_attention';
    }
    if (summary.total === 0) {
      return 'incomplete';
    }
    return 'verified';
  }, [contextMissing, exceptions, purposeMismatch, summary]);

  const policyAlignment: PolicyAlignmentStatus = useMemo(() => {
    if (provenanceStatus === 'blocked' || exceptions.some((item) => item.blocking)) {
      return 'blocked';
    }
    if (provenanceStatus === 'requires_attention') {
      return 'review_required';
    }
    return 'aligned';
  }, [exceptions, provenanceStatus]);

  const isReadOnly = Boolean(session?.role === 'leadership');
  const canResolveIssues = Boolean(session && canResolve(session.role) && !isReadOnly);
  const canConfirmContext = Boolean(session && canConfirm(session.role) && !isReadOnly);

  const externalSourcePresent = records.some((item) => item.sourceType === 'Agency' || item.sourceType === 'Referral' || item.sourceType === 'Other');
  const confirmationRequiredByPolicy = externalSourcePresent;
  const canContinue = provenanceStatus === 'verified' && policyAlignment === 'aligned' && (!confirmationRequiredByPolicy || processingConfirmed);

  const experienceState: ExperienceState = useMemo(() => {
    if (isReadOnly) return 'read_only';
    if (provenanceStatus === 'blocked' || policyAlignment === 'blocked') return 'blocked';
    if (purposeMismatch) return 'purpose_mismatch';
    if (summary.sourceUnknown > 0) return 'source_unknown';
    if (policyAlignment === 'review_required') return 'policy_review';
    if (processingConfirmed) return 'processing_context_confirmed';
    if (canContinue) return 'ready_for_eligibility';
    if (provenanceStatus === 'requires_attention') return 'requires_attention';
    if (provenanceStatus === 'incomplete') return 'incomplete';
    return 'verified';
  }, [canContinue, isReadOnly, policyAlignment, processingConfirmed, provenanceStatus, purposeMismatch, summary.sourceUnknown]);

  const primaryRecord = records[0] ?? null;

  const policyItems: PolicyItem[] = useMemo(() => {
    return [
      {
        name: 'Candidate processing policy',
        state: policyAlignment === 'blocked' ? 'Review required' : 'Active',
        description: 'Processing is limited to approved recruitment workflows within the active organisation context.',
      },
      {
        name: 'Data handling policy',
        state: policyAlignment === 'review_required' ? 'Review required' : 'Active',
        description: 'Candidate information is handled according to configured access and minimisation controls.',
      },
      {
        name: 'Retention policy',
        state: 'Configured',
        description: 'Retention periods are configured per tenant and applied to this case lifecycle.',
      },
    ];
  }, [policyAlignment]);

  const timeline = useMemo(() => {
    const hasRecord = Boolean(primaryRecord);
    const isPastImport = hasRecord;
    const isPastQuarantine = records.some((item) => item.status !== 'queued' && item.status !== 'uploading');
    const isPastValidation = records.some((item) => item.status === 'processing' || item.status === 'cleared' || item.status === 'blocked' || item.status === 'requires_attention' || item.status === 'failed');
    const isPastProvenance = provenanceStatus !== 'incomplete';

    return [
      {
        label: 'Source received',
        description: primaryRecord?.importedAt ?? 'Awaiting source receipt',
        state: hasRecord ? 'done' : 'upcoming',
      },
      {
        label: 'Imported into case',
        description: hasRecord ? `${caseContext.caseId} · ${caseContext.jobTitle}` : 'Pending import context',
        state: isPastImport ? 'done' : 'upcoming',
      },
      {
        label: 'Quarantined',
        description: isPastQuarantine ? 'Quarantine checks completed or in progress' : 'Waiting for quarantine stage',
        state: isPastQuarantine ? 'done' : 'upcoming',
      },
      {
        label: 'Validation completed',
        description: isPastValidation ? 'Validation result captured' : 'Validation in progress',
        state: isPastValidation ? 'done' : 'current',
      },
      {
        label: 'Provenance established',
        description: isPastProvenance ? 'Provenance and purpose context assessed' : 'Pending provenance review',
        state: isPastProvenance ? 'done' : 'upcoming',
      },
    ] as const;
  }, [caseContext.caseId, caseContext.jobTitle, primaryRecord, provenanceStatus, records]);

  const showTransformationHistory = records.some((item) => item.status === 'processing' || item.status === 'cleared' || item.status === 'requires_attention' || item.status === 'blocked' || item.status === 'failed');

  function applySourceResolution() {
    setRecords((current) =>
      current.map((item) => {
        if (item.sourceType !== 'Unknown') {
          return item;
        }

        return {
          ...item,
          sourceType: resolvedSourceType,
          sourceReference: resolvedSourceReference.trim() || item.sourceReference,
          sourceName: resolvedSourceType === 'Configured integration' ? 'Configured integration channel' : item.sourceName,
        };
      })
    );

    setResolvedExceptions((current) => (current.includes('source_unknown') ? current : [...current, 'source_unknown']));
    setActiveResolution(null);
  }

  function resolveException(exception: ProvenanceException) {
    if (exception.resolution === 'source') {
      setActiveResolution(exception);
      return;
    }

    setResolvedExceptions((current) => (current.includes(exception.code) ? current : [...current, exception.code]));
  }

  if (!session) {
    return (
      <main className={editorStyles.page}>
        <div className={editorStyles.skeletonSurface} aria-hidden="true">
          <span className={editorStyles.skeletonLine} />
          <span className={editorStyles.skeletonBlock} />
        </div>
      </main>
    );
  }

  return (
    <main className={`${editorStyles.page} ${styles.page}`}>
      <div className={editorStyles.shell}>
        <header className={editorStyles.topBar}>
          <div className={editorStyles.topBarLeft}>
            <Image src="/Untitled design - 2026-08-10T155155.182.png" alt="Veyqor" width={146} height={38} priority className={editorStyles.mark} />
            <div className={editorStyles.topDivider} aria-hidden="true" />
            <div className={editorStyles.pageIdentity}>
              <strong>Provenance & processing purpose</strong>
              <small>Governance checkpoint before eligibility review.</small>
            </div>
          </div>
          <div className={editorStyles.topBarRight}>
            <button type="button" className={editorStyles.iconButton} aria-label="Notifications">◦</button>
            <div className={editorStyles.topMeta}>
              <span className={editorStyles.contextLabel}>Workspace context</span>
              <strong>{orgName}</strong>
              <small>{tenantName} · {roleLabel(session.role)}</small>
            </div>
            <button type="button" className={editorStyles.userButton} onClick={() => router.push('/dashboard')}>
              <span className={editorStyles.avatar}>{session.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
              <span>
                <strong>{session.fullName}</strong>
                <small>{roleLabel(session.role)}</small>
              </span>
            </button>
          </div>
        </header>

        <section className={editorStyles.headerBlock}>
          <div className={editorStyles.headerTop}>
            <div>
              <p className={styles.breadcrumb}>Cases / {caseContext.jobTitle} / Candidate ingestion / Provenance</p>
              <p className={editorStyles.kicker}>Governance stage</p>
              <h1>Candidate provenance &amp; processing purpose</h1>
              <p>Review where this candidate information came from and confirm the context in which VEYQOR is processing it.</p>
              <p className={styles.caseContext}><strong>{caseContext.jobTitle}</strong><small>{caseContext.caseId} · Criteria {caseContext.criteriaVersion} · Approved</small></p>
              <p className={styles.caseHierarchy}><span>{tenantName}</span><span>→</span><span>{orgName}</span><span>→</span><span>{caseContext.caseId}</span><span>→</span><span>{caseContext.jobTitle}</span></p>
            </div>

            <div className={styles.systemMetaTag} role="status" aria-live="polite">
              <span className={styles.systemMetaDot} aria-hidden="true" />
              <div>
                <strong>Automatically captured by VEYQOR</strong>
                <small>Provenance information is captured automatically wherever available.</small>
              </div>
            </div>
          </div>

          <div className={editorStyles.stepper} aria-label="Candidate ingestion workflow progress">
            {WORKFLOW_STEPS.map((step, index) => (
              <div key={step} className={`${editorStyles.step} ${index < 3 ? styles.stepComplete : ''} ${index === 3 ? styles.stepActive : ''}`}>
                <span>{index < 3 ? '✓' : index === 3 ? '●' : '○'}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>

        {isReadOnly ? (
          <section className={styles.readOnlyBanner} role="status">
            <strong>View only</strong>
            <p>You can review provenance, processing purpose, and policy status but cannot modify this stage.</p>
          </section>
        ) : null}

        <section className={styles.workspaceGrid}>
          <div className={styles.mainColumn}>
            <section className={styles.panel}>
              <header className={styles.panelHeader}>
                <div>
                  <h2>Candidate provenance</h2>
                  <p>VEYQOR records the origin and processing history of candidate information throughout the ingestion workflow.</p>
                </div>
                <span className={`${styles.statusBadge} ${provenanceStatus === 'verified' ? styles.statusVerified : provenanceStatus === 'incomplete' ? styles.statusIncomplete : provenanceStatus === 'blocked' ? styles.statusBlocked : styles.statusAttention}`}>
                  {provenanceStatus === 'verified' ? 'Verified' : provenanceStatus === 'blocked' ? 'Blocked' : provenanceStatus === 'incomplete' ? 'Incomplete' : 'Requires attention'}
                </span>
              </header>

              {primaryRecord ? (
                <div className={styles.metaGrid}>
                  <article className={styles.metaItem}><span>Source</span><strong>{primaryRecord.sourceType}</strong></article>
                  <article className={styles.metaItem}><span>Source reference</span><strong>{primaryRecord.sourceReference ?? 'Not available'}</strong></article>
                  <article className={styles.metaItem}><span>Imported by</span><strong>{primaryRecord.importedBy}</strong></article>
                  <article className={styles.metaItem}><span>Imported at</span><strong>{primaryRecord.importedAt}</strong></article>
                  <article className={styles.metaItem}><span>Organisation</span><strong>{primaryRecord.organisation}</strong></article>
                  <article className={styles.metaItem}><span>Case</span><strong>{caseContext.caseId}</strong></article>
                  <article className={styles.metaItem}><span>Original file</span><strong>{primaryRecord.originalFile}</strong></article>
                  <article className={styles.metaItem}><span>Candidate record</span><strong>{session.role === 'leadership' ? 'Candidate identity protected' : primaryRecord.candidateName}</strong></article>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <strong>Source unavailable</strong>
                  <p>VEYQOR could not establish the original source for this candidate information.</p>
                  <span className={`${styles.statusBadge} ${styles.statusAttention}`}>Requires attention</span>
                </div>
              )}
            </section>

            <section className={styles.panel}>
              <header className={styles.panelHeader}>
                <div>
                  <h2>Information source</h2>
                  <p>Source metadata captured from intake and quarantine workflow context.</p>
                </div>
              </header>

              {primaryRecord?.sourceType === 'Unknown' ? (
                <div className={styles.sourceUnavailable}>
                  <strong>Source unavailable</strong>
                  <p>VEYQOR could not establish the original source for this candidate information.</p>
                  <span className={`${styles.statusBadge} ${styles.statusAttention}`}>Requires attention</span>
                </div>
              ) : (
                <div className={styles.sourceCard}>
                  <div><span>Source type</span><strong>{primaryRecord?.sourceType ?? 'Not available'}</strong></div>
                  <div><span>Source name/reference</span><strong>{primaryRecord?.sourceName ?? primaryRecord?.sourceReference ?? 'Not available'}</strong></div>
                  <div><span>Received date</span><strong>{primaryRecord?.importedAt ?? 'Not available'}</strong></div>
                  <div><span>Imported by</span><strong>{primaryRecord?.importedBy ?? 'Not available'}</strong></div>
                  <div><span>Original document</span><strong>{primaryRecord?.originalFile ?? 'Not available'}</strong></div>
                </div>
              )}
            </section>

            <section className={styles.panel}>
              <header className={styles.panelHeader}>
                <div>
                  <h2>Processing purpose</h2>
                  <p>Candidate information is being processed for the approved recruitment workflow associated with this case.</p>
                </div>
              </header>

              <div className={styles.purposeGrid}>
                <article className={styles.metaItem}>
                  <span>Primary purpose</span>
                  <strong>Candidate evaluation and matching for the approved recruitment case.</strong>
                </article>
                <article className={styles.metaItem}>
                  <span>Associated role</span>
                  <strong>{caseContext.jobTitle}</strong>
                </article>
                <article className={styles.metaItem}>
                  <span>Organisation</span>
                  <strong>{orgName}</strong>
                </article>
                <article className={styles.metaItem}>
                  <span>Case</span>
                  <strong>{caseContext.caseId}</strong>
                </article>
              </div>

              <div className={styles.rulesGrid}>
                <article className={styles.rulesCard}>
                  <h3>Permitted processing</h3>
                  <ul>
                    <li>✓ Candidate eligibility assessment</li>
                    <li>✓ Candidate evaluation against approved criteria</li>
                    <li>✓ Candidate matching within this recruitment case</li>
                  </ul>
                </article>

                <article className={styles.rulesCard}>
                  <h3>Restricted processing</h3>
                  <p>This information must not be used outside the approved recruitment case or configured tenant purpose.</p>
                </article>
              </div>
            </section>

            {exceptions.length > 0 ? (
              <section className={styles.panel}>
                <header className={styles.panelHeader}>
                  <div>
                    <h2>Exceptions</h2>
                    <p>Only issues that require attention are shown here.</p>
                  </div>
                </header>

                <div className={styles.exceptionList}>
                  {exceptions.map((item) => (
                    <article key={`${item.code}-${item.issue}`} className={styles.exceptionCard}>
                      <div className={styles.exceptionHeader}>
                        <strong>{item.issue}</strong>
                        <span className={`${styles.severityBadge} ${severityTone(item.severity)}`}>{item.severity}</span>
                      </div>
                      <p>{item.explanation}</p>
                      <small>Recommended action: {item.recommendedAction}</small>
                      {canResolveIssues ? (
                        <button type="button" className={styles.secondaryAction} onClick={() => resolveException(item)}>
                          {item.resolution === 'source' ? 'Resolve provenance issue' : 'Mark reviewed'}
                        </button>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className={styles.sideColumn}>
            <section className={styles.sideCard}>
              <h3>Policy alignment</h3>
              <p>
                {policyAlignment === 'aligned'
                  ? 'The candidate information is being processed within the active organisation and case context.'
                  : policyAlignment === 'blocked'
                    ? 'Policy checks are currently blocking progression to eligibility review.'
                    : 'Policy alignment requires review before continuation.'}
              </p>
              <span className={`${styles.statusBadge} ${policyAlignment === 'aligned' ? styles.statusVerified : policyAlignment === 'blocked' ? styles.statusBlocked : styles.statusAttention}`}>
                {policyAlignment === 'aligned' ? 'Aligned' : policyAlignment === 'blocked' ? 'Blocked' : 'Review required'}
              </span>
            </section>

            <section className={styles.sideCard}>
              <h3>Organisation policy</h3>
              <div className={styles.policyList}>
                {policyItems.map((policy) => (
                  <article key={policy.name} className={styles.policyItem}>
                    <div>
                      <strong>{policy.name}</strong>
                      <p>{policy.description}</p>
                    </div>
                    <span className={`${styles.policyState} ${policyTone(policy.state)}`}>{policy.state}</span>
                  </article>
                ))}
              </div>
              <button type="button" className={styles.secondaryAction} onClick={() => setPolicyDrawerOpen(true)}>View policy details</button>
            </section>

            <section className={styles.sideCard}>
              <h3>Provenance timeline</h3>
              <ol className={styles.timeline}>
                {timeline.map((entry, index) => (
                  <li key={entry.label} className={`${styles.timelineItem} ${entry.state === 'done' ? styles.timelineDone : entry.state === 'current' ? styles.timelineCurrent : styles.timelineUpcoming}`} style={{ animationDelay: `${index * 45}ms` }}>
                    <span className={styles.timelineMarker} aria-hidden="true">{entry.state === 'done' ? '✓' : entry.state === 'current' ? '●' : '○'}</span>
                    <div>
                      <strong>{entry.label}</strong>
                      <p>{entry.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {showTransformationHistory ? (
              <section className={styles.sideCard}>
                <h3>Data transformation history</h3>
                <ol className={styles.simpleFlow}>
                  <li>Original document received</li>
                  <li>File validated</li>
                  {records.some((item) => item.status === 'cleared' || item.status === 'processing' || item.status === 'requires_attention') ? <li>Content extracted</li> : null}
                </ol>
              </section>
            ) : null}

            {canConfirmContext && confirmationRequiredByPolicy && !processingConfirmed && provenanceStatus !== 'blocked' ? (
              <section className={styles.sideCard}>
                <h3>Confirm processing context</h3>
                <p>Confirm that this candidate information is being processed for the approved recruitment case under the active organisation policy.</p>
                <button type="button" className={styles.primaryAction} onClick={() => setProcessingConfirmed(true)}>Confirm</button>
              </section>
            ) : null}

            <section className={styles.sideCard}>
              {canContinue ? (
                <>
                  <h3>Ready for eligibility review</h3>
                  <p>The candidate information has a valid source and processing context and can continue to eligibility review.</p>
                  <div className={styles.successState}>
                    <p><strong>Processing context verified</strong></p>
                    <ul>
                      <li>Provenance ✓ Verified</li>
                      <li>Processing purpose ✓ Valid</li>
                      <li>Policy alignment ✓ Aligned</li>
                    </ul>
                  </div>
                  {isReadOnly ? (
                    <p className={styles.viewOnlyNotice}>View only</p>
                  ) : (
                    <button type="button" className={styles.primaryAction} onClick={() => router.push('/eligibility-review')}>
                      Continue to eligibility review
                    </button>
                  )}
                </>
              ) : (
                <>
                  <h3>Processing blocked</h3>
                  <p>This candidate cannot continue until the outstanding provenance or processing-purpose issue is resolved.</p>
                  {canResolveIssues && exceptions.length > 0 ? (
                    <button type="button" className={styles.primaryAction} onClick={() => resolveException(exceptions[0])}>Review issue</button>
                  ) : null}
                </>
              )}
            </section>

            <section className={styles.sideCard}>
              <h3>Current state</h3>
              <p>Workflow state: <strong>{experienceState.replaceAll('_', ' ')}</strong></p>
            </section>
          </aside>
        </section>
      </div>

      {policyDrawerOpen ? (
        <>
          <div className={styles.drawerOverlay} role="presentation" onClick={() => setPolicyDrawerOpen(false)} />
          <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Organisation policy details">
            <header className={styles.drawerHeader}>
              <div>
                <h3>Organisation policy</h3>
                <p>Policy context for {orgName} in {tenantName}.</p>
              </div>
              <button type="button" className={styles.closeBtn} onClick={() => setPolicyDrawerOpen(false)} aria-label="Close policy details">×</button>
            </header>

            <div className={styles.drawerBody}>
              {policyItems.map((policy) => (
                <article key={policy.name} className={styles.drawerCard}>
                  <div className={styles.drawerCardTop}>
                    <strong>{policy.name}</strong>
                    <span className={`${styles.policyState} ${policyTone(policy.state)}`}>{policy.state}</span>
                  </div>
                  <p>{policy.description}</p>
                </article>
              ))}
            </div>
          </aside>
        </>
      ) : null}

      {activeResolution ? (
        <>
          <div className={styles.drawerOverlay} role="presentation" onClick={() => setActiveResolution(null)} />
          <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Resolve provenance issue">
            <header className={styles.drawerHeader}>
              <div>
                <h3>Resolve provenance issue</h3>
                <p>{activeResolution.explanation}</p>
              </div>
              <button type="button" className={styles.closeBtn} onClick={() => setActiveResolution(null)} aria-label="Close resolution">×</button>
            </header>

            <div className={styles.drawerBody}>
              <label className={styles.fieldLabel}>
                Source type
                <select value={resolvedSourceType} onChange={(event) => setResolvedSourceType(event.target.value as SourceType)}>
                  <option value="Direct upload">Direct upload</option>
                  <option value="Configured integration">Configured integration</option>
                  <option value="Agency">Agency</option>
                  <option value="Referral">Referral</option>
                  <option value="Internal source">Internal source</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className={styles.fieldLabel}>
                Source reference
                <input
                  type="text"
                  value={resolvedSourceReference}
                  onChange={(event) => setResolvedSourceReference(event.target.value)}
                  placeholder="Provide a source reference"
                />
              </label>

              <button type="button" className={styles.primaryAction} onClick={applySourceResolution}>Apply source</button>
            </div>
          </aside>
        </>
      ) : null}
    </main>
  );
}
