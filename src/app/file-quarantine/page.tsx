'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockAuthGateway, type AuthSession } from '@/lib/auth/mockAuthGateway';
import FileStatusBadge from '@/components/candidate-ingestion/FileStatusBadge';
import ProcessingDetailsDrawer from '@/components/candidate-ingestion/ProcessingDetailsDrawer';
import ProcessingPipeline from '@/components/candidate-ingestion/ProcessingPipeline';
import type { CheckStatus, QuarantineFile, QuarantineFileStatus, ValidationCheck } from '@/components/candidate-ingestion/types';
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

type ProcessingState = 'idle' | 'processing' | 'completed' | 'attention' | 'blocked';

function roleLabel(role: AuthSession['role']) {
  if (role === 'administrator') return 'Administrator';
  if (role === 'reviewer') return 'Reviewer';
  if (role === 'leadership') return 'Leadership/Oversight';
  return 'Recruitment Operator';
}

function canManage(role: AuthSession['role']) {
  return role === 'operator' || role === 'reviewer' || role === 'administrator';
}

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function checksFor(status: QuarantineFileStatus): ValidationCheck[] {
  const map: Record<QuarantineFileStatus, CheckStatus[]> = {
    queued: ['passed', 'pending', 'pending', 'pending', 'pending'],
    uploading: ['passed', 'processing', 'pending', 'pending', 'pending'],
    quarantined: ['passed', 'passed', 'processing', 'pending', 'pending'],
    validating: ['passed', 'passed', 'processing', 'pending', 'pending'],
    processing: ['passed', 'passed', 'passed', 'processing', 'pending'],
    cleared: ['passed', 'passed', 'passed', 'passed', 'passed'],
    blocked: ['passed', 'passed', 'failed', 'failed', 'failed'],
    requires_attention: ['passed', 'passed', 'passed', 'failed', 'pending'],
    failed: ['passed', 'failed', 'failed', 'failed', 'pending'],
  };

  const labels = [
    'File received',
    'File integrity and type validation',
    'Quarantine validation',
    'Document readability and candidate detection',
    'Processing readiness',
  ];

  return labels.map((label, index) => ({ label, status: map[status][index] }));
}

function toValidation(status: QuarantineFileStatus): QuarantineFile['validation'] {
  if (status === 'cleared') return 'Passed';
  if (status === 'blocked' || status === 'failed' || status === 'requires_attention') return 'Failed';
  return 'In progress';
}

function toReason(status: QuarantineFileStatus): string {
  if (status === 'cleared') return 'Validation checks completed. File can proceed.';
  if (status === 'blocked') return 'This file could not pass required validation checks.';
  if (status === 'failed') return 'The system could not complete processing for this file.';
  if (status === 'requires_attention') return 'Automated checks found an issue that needs review.';
  if (status === 'processing') return 'VEYQOR is running ingestion checks automatically.';
  if (status === 'validating') return 'Validation checks are currently in progress.';
  if (status === 'quarantined') return 'File is isolated while quarantine checks complete.';
  if (status === 'uploading') return 'File transfer and intake registration are in progress.';
  return 'File is queued for secure processing.';
}

function normalizeStatus(raw: string, fileName: string): QuarantineFileStatus {
  if (raw === 'invalid') return 'blocked';
  if (raw === 'failed') return 'failed';
  if (raw === 'requires_attention') return 'requires_attention';
  if (raw === 'duplicate') return 'requires_attention';
  if (fileName.toLowerCase().includes('blocked')) return 'blocked';
  return 'quarantined';
}

export default function FileQuarantinePage() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [caseContext, setCaseContext] = useState<CaseContext>({
    jobTitle: 'Senior Frontend Engineer',
    caseId: 'Case #VQ-1042',
    criteriaVersion: 'v2',
  });
  const [files, setFiles] = useState<QuarantineFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

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

    const rawContext = window.localStorage.getItem(CASE_CONTEXT_STORAGE_KEY);
    if (rawContext) {
      try {
        const parsed = JSON.parse(rawContext) as Partial<CaseContext>;
        const nextJobTitle = parsed.jobTitle?.trim();
        const nextCaseId = parsed.caseId?.trim();
        const nextVersion = parsed.criteriaVersion?.trim() ?? 'v2';
        if (nextJobTitle && nextCaseId) {
          setCaseContext({ jobTitle: nextJobTitle, caseId: nextCaseId, criteriaVersion: nextVersion });
        }
      } catch {
        // Keep fallback context for malformed payload.
      }
    }

    const rawBatch = window.localStorage.getItem(CANDIDATE_BATCH_STORAGE_KEY);
    if (!rawBatch) {
      setFiles([]);
      return;
    }

    try {
      const batch = JSON.parse(rawBatch) as IntakeBatchItem[];
      const transformed = batch.map((item) => {
        const status = normalizeStatus(item.status, item.fileName);
        return {
          id: item.id,
          fileName: item.fileName,
          candidateName: item.candidateName,
          fileType: item.fileType,
          source: item.source,
          status,
          validation: toValidation(status),
          reason: toReason(status),
          uploadedBy: activeSession.fullName,
          uploadedAt: item.recordedAt || nowLabel(),
          updatedAt: 'Just now',
          checks: checksFor(status),
        } satisfies QuarantineFile;
      });
      setFiles(transformed);
    } catch {
      setFiles([]);
    }
  }, [router]);

  useEffect(() => {
    const hasInFlight = files.some((file) => file.status === 'queued' || file.status === 'uploading' || file.status === 'quarantined' || file.status === 'validating' || file.status === 'processing');
    if (!hasInFlight) {
      return;
    }

    const timer = window.setInterval(() => {
      setFiles((current) =>
        current.map((file) => {
          if (file.status === 'queued') {
            const nextStatus: QuarantineFileStatus = 'uploading';
            return { ...file, status: nextStatus, validation: toValidation(nextStatus), reason: toReason(nextStatus), checks: checksFor(nextStatus), updatedAt: 'Just now' };
          }
          if (file.status === 'uploading') {
            const nextStatus: QuarantineFileStatus = 'quarantined';
            return { ...file, status: nextStatus, validation: toValidation(nextStatus), reason: toReason(nextStatus), checks: checksFor(nextStatus), updatedAt: 'Just now' };
          }
          if (file.status === 'quarantined') {
            const nextStatus: QuarantineFileStatus = 'validating';
            return { ...file, status: nextStatus, validation: toValidation(nextStatus), reason: toReason(nextStatus), checks: checksFor(nextStatus), updatedAt: 'Just now' };
          }
          if (file.status === 'validating') {
            const nextStatus: QuarantineFileStatus = file.fileName.toLowerCase().includes('blocked') ? 'blocked' : file.fileName.toLowerCase().includes('attention') ? 'requires_attention' : 'processing';
            return { ...file, status: nextStatus, validation: toValidation(nextStatus), reason: toReason(nextStatus), checks: checksFor(nextStatus), updatedAt: 'Just now' };
          }
          if (file.status === 'processing') {
            const nextStatus: QuarantineFileStatus = 'cleared';
            return { ...file, status: nextStatus, validation: toValidation(nextStatus), reason: toReason(nextStatus), checks: checksFor(nextStatus), updatedAt: 'Just now' };
          }
          return file;
        })
      );
    }, 950);

    return () => window.clearInterval(timer);
  }, [files]);

  const isAuthorised = Boolean(session && canManage(session.role));

  const summary = useMemo(() => {
    const total = files.length;
    const cleared = files.filter((file) => file.status === 'cleared').length;
    const processing = files.filter((file) => file.status === 'queued' || file.status === 'uploading' || file.status === 'quarantined' || file.status === 'validating' || file.status === 'processing').length;
    const attention = files.filter((file) => file.status === 'requires_attention').length;
    const blocked = files.filter((file) => file.status === 'blocked' || file.status === 'failed').length;

    return { total, cleared, processing, attention, blocked };
  }, [files]);

  const overallState: ProcessingState = useMemo(() => {
    if (!files.length) return 'idle';
    if (summary.blocked > 0) return 'blocked';
    if (summary.attention > 0) return 'attention';
    if (summary.processing > 0) return 'processing';
    return 'completed';
  }, [files, summary]);

  const activeFile = useMemo(() => files.find((item) => item.id === activeFileId) ?? null, [files, activeFileId]);

  const canProceed = summary.total > 0 && summary.cleared > 0 && summary.processing === 0 && summary.blocked === 0 && summary.attention === 0;
  const hasPartialSuccess = summary.cleared > 0 && (summary.blocked > 0 || summary.attention > 0);

  function retryFile(fileId: string) {
    setFiles((current) => current.map((file) => {
      if (file.id !== fileId) return file;
      const nextStatus: QuarantineFileStatus = 'validating';
      return { ...file, status: nextStatus, validation: toValidation(nextStatus), reason: toReason(nextStatus), checks: checksFor(nextStatus), updatedAt: nowLabel() };
    }));
  }

  function replaceFile(fileId: string) {
    setFiles((current) => current.map((file) => {
      if (file.id !== fileId) return file;
      const nextStatus: QuarantineFileStatus = 'queued';
      return { ...file, status: nextStatus, validation: toValidation(nextStatus), reason: 'Replacement file received. Re-running quarantine checks.', checks: checksFor(nextStatus), updatedAt: nowLabel() };
    }));
  }

  function removeFile(fileId: string) {
    setFiles((current) => current.filter((file) => file.id !== fileId));
    if (activeFileId === fileId) {
      setActiveFileId(null);
    }
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
              <strong>File upload & quarantine</strong>
              <small>Secure ingestion control for candidate files.</small>
            </div>
          </div>

          <div className={editorStyles.topBarRight}>
            <button type="button" className={editorStyles.iconButton} aria-label="Notifications">◦</button>
            <div className={editorStyles.topMeta}>
              <span className={editorStyles.contextLabel}>Workspace context</span>
              <strong>{orgName}</strong>
              <small>{tenantName}</small>
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
              <p className={styles.breadcrumb}>Cases / {caseContext.jobTitle} / Candidate ingestion / Quarantine</p>
              <p className={editorStyles.kicker}>Quarantine stage</p>
              <h1>File upload & quarantine</h1>
              <p>VEYQOR is securely validating candidate files before they enter downstream processing.</p>
              <p className={styles.caseContext}><strong>{caseContext.jobTitle}</strong><small>{caseContext.caseId} · Criteria {caseContext.criteriaVersion} · Approved</small></p>
            </div>

            <div className={editorStyles.aiDraftReady}>
              <span className={editorStyles.aiPulseDot} aria-hidden="true" />
              <div>
                <strong>VEYQOR processing</strong>
                <small>Automation is handling ingestion checks and surfacing only exceptions</small>
              </div>
            </div>
          </div>

          <div className={editorStyles.stepper} aria-label="Candidate ingestion workflow progress">
            {WORKFLOW_STEPS.map((step, index) => (
              <div key={step} className={`${editorStyles.step} ${index < 2 ? styles.stepComplete : ''} ${index === 2 ? editorStyles.stepActive : ''}`}>
                <span>{index < 2 ? '✓' : index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.overviewGrid}>
          <article className={styles.metricCard}>
            <span>Candidate files</span>
            <strong>{summary.total}</strong>
            <p>Files received</p>
          </article>
          <article className={styles.metricCard}>
            <span>Processed</span>
            <strong>{summary.cleared}</strong>
            <p>Cleared for next stage</p>
          </article>
          <article className={styles.metricCard}>
            <span>Processing</span>
            <strong>{summary.processing}</strong>
            <p>Automated checks in progress</p>
          </article>
          <article className={styles.metricCard}>
            <span>Requires attention</span>
            <strong>{summary.attention + summary.blocked}</strong>
            <p>Exceptions to review</p>
          </article>
        </section>

        <section className={styles.workspaceGrid}>
          <div className={styles.mainColumn}>
            <section className={styles.panel}>
              <header className={styles.panelHeader}>
                <div>
                  <h2>Processing candidate files</h2>
                  <p>
                    {overallState === 'processing'
                      ? 'Automated validation is in progress.'
                      : overallState === 'completed'
                        ? 'All files have completed quarantine checks.'
                        : overallState === 'attention'
                          ? 'Some files require attention before progression.'
                          : overallState === 'blocked'
                            ? 'One or more files are blocked from continuing.'
                            : 'Waiting for candidate files from the intake stage.'}
                  </p>
                </div>
                <span className={`${styles.stateBadge} ${overallState === 'completed' ? styles.stateCompleted : overallState === 'processing' ? styles.stateProcessing : overallState === 'blocked' ? styles.stateBlocked : overallState === 'attention' ? styles.stateAttention : styles.stateIdle}`}>
                  {overallState === 'completed' ? 'Completed' : overallState === 'processing' ? 'Processing' : overallState === 'blocked' ? 'Blocked' : overallState === 'attention' ? 'Attention required' : 'Idle'}
                </span>
              </header>

              {hasPartialSuccess ? (
                <div className={styles.partialState}>
                  <strong>Import partially completed</strong>
                  <p>{summary.cleared} candidate files have completed quarantine checks. {summary.attention + summary.blocked} file(s) require attention.</p>
                  <button type="button" className={styles.secondaryAction} onClick={() => {
                    const firstException = files.find((file) => file.status === 'requires_attention' || file.status === 'blocked' || file.status === 'failed');
                    if (firstException) setActiveFileId(firstException.id);
                  }}>
                    Review exceptions
                  </button>
                </div>
              ) : null}

              {!files.length ? (
                <div className={styles.emptyState}>
                  <strong>No candidate files</strong>
                  <p>Candidate files uploaded for this case will appear here while VEYQOR validates and processes them.</p>
                  <button type="button" className={styles.secondaryAction} onClick={() => router.push('/candidate-ingestion')}>Return to candidate intake</button>
                </div>
              ) : (
                <>
                  <div className={styles.fileTableWrap}>
                    <table className={styles.fileTable}>
                      <thead>
                        <tr>
                          <th>File</th>
                          <th>Type</th>
                          <th>Source</th>
                          <th>Status</th>
                          <th>Validation</th>
                          <th>Updated</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {files.map((file) => (
                          <tr key={file.id}>
                            <td>
                              <strong>{file.fileName}</strong>
                              <p>{file.candidateName}</p>
                            </td>
                            <td>{file.fileType}</td>
                            <td>{file.source}</td>
                            <td><FileStatusBadge status={file.status} /></td>
                            <td>{file.validation}</td>
                            <td>{file.updatedAt}</td>
                            <td>
                              <button type="button" className={styles.linkAction} onClick={() => setActiveFileId(file.id)}>
                                {file.status === 'blocked' || file.status === 'requires_attention' || file.status === 'failed' ? 'Review details' : 'View'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.mobileList}>
                    {files.map((file) => (
                      <article key={file.id} className={styles.mobileCard}>
                        <strong>{file.fileName}</strong>
                        <p>{file.candidateName}</p>
                        <div className={styles.mobileMetaRow}><span>Status</span><FileStatusBadge status={file.status} /></div>
                        <div className={styles.mobileMetaRow}><span>Validation</span><strong>{file.validation}</strong></div>
                        <div className={styles.mobileMetaRow}><span>Updated</span><strong>{file.updatedAt}</strong></div>
                        <button type="button" className={styles.linkAction} onClick={() => setActiveFileId(file.id)}>View details</button>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>

          <aside className={styles.sideColumn}>
            <section className={styles.sideCard}>
              <h3>Why quarantine?</h3>
              <p>Candidate files are temporarily isolated while VEYQOR completes required validation and ingestion checks.</p>
              <div className={styles.flowLine}>Received → Validating → Cleared / Blocked</div>
            </section>

            <section className={styles.sideCard}>
              <h3>Automated check pipeline</h3>
              <p>Checks supported in this prototype intake flow.</p>
              <ProcessingPipeline checks={checksFor(overallState === 'completed' ? 'cleared' : overallState === 'blocked' ? 'blocked' : overallState === 'attention' ? 'requires_attention' : 'processing')} />
            </section>

            <section className={styles.sideCard}>
              <h3>Workflow action</h3>
              <p>
                {canProceed
                  ? 'All required quarantine checks are complete. Continue to provenance and processing purpose.'
                  : overallState === 'blocked'
                    ? 'Resolve blocked files before continuing.'
                    : 'VEYQOR will continue processing automatically. Review only surfaced exceptions.'}
              </p>
              {isAuthorised ? (
                <button type="button" className={styles.primaryAction} disabled={!canProceed} onClick={() => router.push('/provenance-processing')}>
                  Continue to provenance
                </button>
              ) : (
                <div className={styles.readOnlyBanner}>
                  <strong>Read-only access</strong>
                  <p>You can view status updates but cannot manage file exceptions or continue this workflow stage.</p>
                </div>
              )}
            </section>
          </aside>
        </section>
      </div>

      {activeFile ? (
        <ProcessingDetailsDrawer
          file={activeFile}
          canManage={isAuthorised}
          onClose={() => setActiveFileId(null)}
          onRetry={() => retryFile(activeFile.id)}
          onReplace={() => replaceFile(activeFile.id)}
          onRemove={() => removeFile(activeFile.id)}
        />
      ) : null}
    </main>
  );
}
