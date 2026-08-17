'use client';

import Image from 'next/image';
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockAuthGateway, type AuthSession } from '@/lib/auth/mockAuthGateway';
import editorStyles from '../criteria-editor/page.module.css';
import styles from './page.module.css';

const TENANT_STORAGE_KEY = 'veyqor.mock.tenant-context.v1';
const ORG_STORAGE_KEY = 'veyqor.mock.org-context.v1';
const CASE_CONTEXT_STORAGE_KEY = 'veyqor.mock.case-context.v1';
const CANDIDATE_BATCH_STORAGE_KEY = 'veyqor.mock.candidate-intake.batch.v1';
const WORKFLOW_STEPS = ['Criteria Approval', 'Candidate Intake', 'Quarantine', 'Provenance', 'Eligibility'];
const SUPPORTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

type ImportState =
  | 'idle'
  | 'queued'
  | 'uploading'
  | 'validating'
  | 'quarantined'
  | 'processing'
  | 'ready'
  | 'requires_attention'
  | 'duplicate'
  | 'invalid'
  | 'failed';

type SourceType = 'Direct upload' | 'Referral' | 'Agency' | 'Integration' | 'Internal source' | 'Other';

type QueueItem = {
  id: string;
  fileName: string;
  candidateName: string;
  fileType: string;
  source: SourceType;
  status: ImportState;
  progress: number;
  detail: string;
};

type CaseContext = {
  jobTitle: string;
  caseId: string;
  criteriaVersion: string;
};

type BatchNoticeTone = 'neutral' | 'success' | 'warning' | 'error';

type BatchNotice = {
  tone: BatchNoticeTone;
  message: string;
};

function roleLabel(role: AuthSession['role']) {
  if (role === 'administrator') return 'Administrator';
  if (role === 'reviewer') return 'Reviewer';
  if (role === 'leadership') return 'Leadership/Oversight';
  return 'Recruitment Operator';
}

function isImportAuthorized(role: AuthSession['role']) {
  return role === 'operator' || role === 'administrator' || role === 'reviewer';
}

function typeLabel(fileName: string) {
  return fileName.split('.').pop()?.toUpperCase() ?? 'UNKNOWN';
}

function toCandidateName(fileName: string) {
  const base = fileName.replace(/\.[^/.]+$/, '').trim();
  const normalized = base.replace(/[\-_]+/g, ' ').replace(/\s+/g, ' ');
  if (!normalized) {
    return 'Candidate document';
  }

  return normalized
    .split(' ')
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join(' ');
}

function describeStatus(status: ImportState) {
  if (status === 'queued') return 'Queued';
  if (status === 'uploading') return 'Uploading';
  if (status === 'validating') return 'Validating';
  if (status === 'quarantined') return 'Quarantined';
  if (status === 'processing') return 'Processing';
  if (status === 'ready') return 'Ready for eligibility review';
  if (status === 'requires_attention') return 'Requires attention';
  if (status === 'duplicate') return 'Possible duplicate';
  if (status === 'invalid') return 'Invalid file';
  if (status === 'failed') return 'Failed';
  return 'Idle';
}

function statusClass(status: ImportState) {
  if (status === 'ready') return styles.statusReady;
  if (status === 'uploading' || status === 'validating' || status === 'quarantined' || status === 'processing' || status === 'queued') return styles.statusProcessing;
  if (status === 'duplicate' || status === 'requires_attention') return styles.statusWarning;
  if (status === 'invalid' || status === 'failed') return styles.statusError;
  return styles.statusIdle;
}

export default function CandidateIngestionPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const [session, setSession] = useState<AuthSession | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [caseContext, setCaseContext] = useState<CaseContext>({
    jobTitle: 'Senior Frontend Engineer',
    caseId: 'Case #VQ-1042',
    criteriaVersion: 'v2',
  });

  const [source, setSource] = useState<SourceType>('Direct upload');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
  const [notice, setNotice] = useState<BatchNotice>({ tone: 'neutral', message: 'Add candidates to begin secure intake.' });

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
    if (!rawContext) {
      return;
    }

    try {
      const parsed = JSON.parse(rawContext) as Partial<CaseContext>;
      const nextJobTitle = parsed.jobTitle?.trim();
      const nextCaseId = parsed.caseId?.trim();
      const nextVersion = parsed.criteriaVersion?.trim() ?? 'v2';
      if (!nextJobTitle || !nextCaseId) {
        return;
      }

      setCaseContext({ jobTitle: nextJobTitle, caseId: nextCaseId, criteriaVersion: nextVersion });
    } catch {
      // Ignore malformed prototype context payloads.
    }
  }, [router]);

  useEffect(() => {
    const hasActivePipeline = queue.some((item) =>
      item.status === 'queued'
      || item.status === 'uploading'
      || item.status === 'validating'
      || item.status === 'quarantined'
      || item.status === 'processing'
    );

    if (!hasActivePipeline) {
      return;
    }

    const timer = window.setInterval(() => {
      setQueue((current) =>
        current.map((item) => {
          if (item.status === 'queued') {
            return { ...item, status: 'uploading', progress: 12, detail: 'Upload secured in transit to intake gateway.' };
          }

          if (item.status === 'uploading') {
            const next = Math.min(item.progress + 14, 30);
            return next >= 30
              ? { ...item, status: 'validating', progress: 32, detail: 'Validating file type and integrity.' }
              : { ...item, progress: next };
          }

          if (item.status === 'validating') {
            const next = Math.min(item.progress + 13, 56);
            return next >= 56
              ? { ...item, status: 'quarantined', progress: 58, detail: 'Placed in quarantine for controlled inspection.' }
              : { ...item, progress: next };
          }

          if (item.status === 'quarantined') {
            const next = Math.min(item.progress + 12, 76);
            return next >= 76
              ? { ...item, status: 'processing', progress: 78, detail: 'Extracting candidate document structure.' }
              : { ...item, progress: next };
          }

          if (item.status === 'processing') {
            const next = Math.min(item.progress + 14, 100);
            if (next < 100) {
              return { ...item, progress: next };
            }

            if (item.fileName.toLowerCase().includes('attention')) {
              return { ...item, status: 'requires_attention', progress: 100, detail: 'Manual review required before eligibility.' };
            }

            return { ...item, status: 'ready', progress: 100, detail: 'Validated and ready for eligibility review.' };
          }

          return item;
        })
      );
    }, 700);

    return () => window.clearInterval(timer);
  }, [queue]);

  const summary = useMemo(() => {
    if (!session) return '';
    return `${session.fullName} · ${roleLabel(session.role)}`;
  }, [session]);

  const canImport = useMemo(() => {
    if (!session) {
      return false;
    }
    return isImportAuthorized(session.role);
  }, [session]);

  const queueSummary = useMemo(() => {
    const total = queue.length;
    const successful = queue.filter((item) => item.status === 'ready').length;
    const duplicates = queue.filter((item) => item.status === 'duplicate').length;
    const invalid = queue.filter((item) => item.status === 'invalid').length;
    const failed = queue.filter((item) => item.status === 'failed').length;
    const requiresAttention = queue.filter((item) => item.status === 'requires_attention').length;
    const active = queue.filter((item) => item.status === 'queued' || item.status === 'uploading' || item.status === 'validating' || item.status === 'quarantined' || item.status === 'processing').length;

    return { total, successful, duplicates, invalid, failed, requiresAttention, active };
  }, [queue]);

  const hasPartialSuccess = queueSummary.successful > 0 && (queueSummary.duplicates + queueSummary.invalid + queueSummary.failed + queueSummary.requiresAttention) > 0;
  const canContinue = queueSummary.successful > 0;

  useEffect(() => {
    if (!queue.length) {
      return;
    }

    if (queueSummary.active > 0) {
      setNotice({ tone: 'neutral', message: 'VEYQOR is validating your files before candidate data is released to downstream stages.' });
      return;
    }

    if (hasPartialSuccess) {
      setNotice({ tone: 'warning', message: `Import partially completed: ${queueSummary.successful} accepted, ${queueSummary.duplicates + queueSummary.invalid + queueSummary.failed + queueSummary.requiresAttention} require attention.` });
      return;
    }

    if (queueSummary.successful > 0) {
      setNotice({ tone: 'success', message: `Import completed: ${queueSummary.successful} candidate file${queueSummary.successful === 1 ? '' : 's'} ready for eligibility review.` });
      return;
    }

    setNotice({ tone: 'error', message: 'Upload completed but no files are ready yet. Resolve exceptions to continue.' });
  }, [queue, queueSummary, hasPartialSuccess]);

  function buildQueueItems(files: FileList | File[]) {
    const existingNames = new Set(queue.map((item) => item.candidateName.toLowerCase()));

    return Array.from(files).map((file) => {
      const id = `cand_${Math.random().toString(36).slice(2, 10)}`;
      const candidateName = toCandidateName(file.name);
      const normalized = candidateName.toLowerCase();

      if (!SUPPORTED_TYPES.includes(file.type)) {
        return {
          id,
          fileName: file.name,
          candidateName,
          fileType: typeLabel(file.name),
          source,
          status: 'invalid' as ImportState,
          progress: 0,
          detail: 'Unsupported file format for intake. Use PDF, DOCX, or DOC.',
        };
      }

      if (file.size === 0) {
        return {
          id,
          fileName: file.name,
          candidateName,
          fileType: typeLabel(file.name),
          source,
          status: 'failed' as ImportState,
          progress: 0,
          detail: 'File appears corrupted or empty. Replace and retry.',
        };
      }

      if (existingNames.has(normalized)) {
        return {
          id,
          fileName: file.name,
          candidateName,
          fileType: typeLabel(file.name),
          source,
          status: 'duplicate' as ImportState,
          progress: 0,
          detail: 'This candidate may already exist in this case.',
        };
      }

      existingNames.add(normalized);
      return {
        id,
        fileName: file.name,
        candidateName,
        fileType: typeLabel(file.name),
        source,
        status: 'queued' as ImportState,
        progress: 0,
        detail: 'Queued for secure upload and intake checks.',
      };
    });
  }

  function handleSelectedFiles(files: FileList | null) {
    if (!files || !files.length || !canImport) {
      return;
    }

    const items = buildQueueItems(files);
    setQueue((current) => [...current, ...items]);
    setNotice({ tone: 'neutral', message: `Upload started for ${items.length} file${items.length === 1 ? '' : 's'}. VEYQOR will process intake automatically.` });
  }

  function handleChooseFiles() {
    fileInputRef.current?.click();
  }

  function onFileInput(event: ChangeEvent<HTMLInputElement>) {
    handleSelectedFiles(event.target.files);
    event.target.value = '';
  }

  function onReplaceInput(event: ChangeEvent<HTMLInputElement>) {
    const replacement = event.target.files?.[0];
    if (!replacement || !replaceTargetId) {
      event.target.value = '';
      return;
    }

    const [nextItem] = buildQueueItems([replacement]);
    setQueue((current) => current.map((item) => (item.id === replaceTargetId ? { ...nextItem, id: item.id } : item)));
    setReplaceTargetId(null);
    event.target.value = '';
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    if (!canImport) {
      return;
    }
    handleSelectedFiles(event.dataTransfer.files);
  }

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!canImport) {
      return;
    }
    setDragActive(true);
  }

  function onDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
  }

  function keepBoth(id: string) {
    setQueue((current) => current.map((item) => (
      item.id === id
        ? { ...item, status: 'queued', progress: 0, detail: 'Reviewer accepted duplicate risk. Re-queued for processing.' }
        : item
    )));
  }

  function cancelImport(id: string) {
    setQueue((current) => current.filter((item) => item.id !== id));
  }

  function retryProcessing(id: string) {
    setQueue((current) => current.map((item) => (
      item.id === id
        ? { ...item, status: 'queued', progress: 0, detail: 'Retry queued for automated processing.' }
        : item
    )));
  }

  function replaceFile(id: string) {
    setReplaceTargetId(id);
    replaceInputRef.current?.click();
  }

  function resolveAttention(id: string) {
    setQueue((current) => current.map((item) => (
      item.id === id
        ? { ...item, status: 'ready', detail: 'Manual review complete. Ready for eligibility review.' }
        : item
    )));
  }

  function continueToQuarantine() {
    const payload = queue.map((item) => ({
      id: item.id,
      fileName: item.fileName,
      candidateName: item.candidateName,
      fileType: item.fileType,
      source: item.source,
      status: item.status,
      detail: item.detail,
      recordedAt: new Date().toLocaleString(),
    }));

    window.localStorage.setItem(CANDIDATE_BATCH_STORAGE_KEY, JSON.stringify(payload));
    router.push('/file-quarantine');
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
              <strong>Candidate intake</strong>
              <small>Secure import for the active recruitment case.</small>
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
              <p className={styles.breadcrumb}>Cases / {caseContext.jobTitle} / Candidate intake</p>
              <p className={editorStyles.kicker}>Candidate ingestion gateway</p>
              <h1>Candidate intake</h1>
              <p>Import candidate information into this case and let VEYQOR securely validate and process it.</p>
              <p className={styles.caseContext}><strong>{caseContext.jobTitle}</strong><small>{caseContext.caseId} · Criteria approved · {caseContext.criteriaVersion} · {summary}</small></p>
            </div>

            <div className={editorStyles.aiDraftReady}>
              <span className={editorStyles.aiPulseDot} aria-hidden="true" />
              <div>
                <strong>Secure intake</strong>
                <small>Files are quarantined and validated before downstream use</small>
              </div>
            </div>
          </div>

          <div className={editorStyles.stepper} aria-label="Ingestion workflow progress">
            {WORKFLOW_STEPS.map((step, index) => (
              <div key={step} className={`${editorStyles.step} ${index < 1 ? styles.stepComplete : ''} ${index === 1 ? editorStyles.stepActive : ''}`}>
                <span>{index < 1 ? '✓' : index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>

        {!canImport ? (
          <section className={styles.permissionPanel} role="status">
            <h2>Import unavailable</h2>
            <p>You do not have permission to add candidates to this case.</p>
            <p>Import actions are available to authorised operators, reviewers, and administrators in this tenant context.</p>
          </section>
        ) : (
          <section className={styles.workspaceGrid}>
            <div className={styles.mainColumn}>
              <section className={styles.panel}>
                <header className={styles.panelHeader}>
                  <div>
                    <h2>Add candidates</h2>
                    <p>Bring candidate files into VEYQOR for secure ingestion and automated validation.</p>
                  </div>
                </header>

                <div
                  className={`${styles.uploadZone} ${dragActive ? styles.uploadZoneActive : ''}`}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  aria-label="Candidate file upload zone"
                >
                  <div className={styles.uploadIcon} aria-hidden="true">⬆</div>
                  <h3>Drop candidate files here</h3>
                  <p>or choose files from your device</p>
                  <button type="button" className={styles.primaryAction} onClick={handleChooseFiles}>Choose files</button>
                  <small className={styles.uploadHint}>Bulk import is supported. Upload once and VEYQOR manages the intake pipeline automatically.</small>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className={styles.hiddenInput}
                  onChange={onFileInput}
                />
                <input
                  ref={replaceInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className={styles.hiddenInput}
                  onChange={onReplaceInput}
                />

                <div className={styles.metadataRow}>
                  <div className={styles.metaBlock}>
                    <strong>Supported files</strong>
                    <p>PDF · DOCX · DOC</p>
                  </div>
                  <div className={styles.metaBlock}>
                    <strong>Bulk import</strong>
                    <p>Upload multiple files and VEYQOR will process candidate intake automatically.</p>
                  </div>
                  <label className={styles.sourceField}>
                    <span>Source / provenance</span>
                    <select value={source} onChange={(event) => setSource(event.target.value as SourceType)}>
                      <option>Direct upload</option>
                      <option>Referral</option>
                      <option>Agency</option>
                      <option>Integration</option>
                      <option>Internal source</option>
                      <option>Other</option>
                    </select>
                  </label>
                </div>

                <div className={styles.purposeCard}>
                  <strong>Processing purpose</strong>
                  <p>Candidate evaluation for the approved recruitment case. Candidate information is processed only for this workflow and active tenant policies.</p>
                </div>
              </section>

              <section className={styles.panel}>
                <header className={styles.panelHeader}>
                  <div>
                    <h2>Import queue</h2>
                    <p>VEYQOR automatically inspects files, detects duplicates, quarantines uploads, and surfaces exceptions only when needed.</p>
                  </div>
                </header>

                {!queue.length ? (
                  <div className={styles.emptyQueue}>
                    <strong>Add candidates to this case</strong>
                    <p>Upload candidate files to begin secure ingestion. VEYQOR will automatically validate and process them.</p>
                  </div>
                ) : (
                  <div className={styles.queueList}>
                    {queue.map((item) => (
                      <article key={item.id} className={styles.queueItem}>
                        <div className={styles.queueTop}>
                          <div>
                            <strong>{item.candidateName}</strong>
                            <p>{item.fileName}</p>
                          </div>
                          <span className={`${styles.statusPill} ${statusClass(item.status)}`}>{describeStatus(item.status)}</span>
                        </div>

                        <div className={styles.queueMeta}>
                          <span>Type: {item.fileType}</span>
                          <span>Source: {item.source}</span>
                          <span>Progress: {item.progress}%</span>
                        </div>

                        <p className={styles.queueDetail}>{item.detail}</p>

                        <div className={styles.progressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.progress} aria-label={`${item.fileName} intake progress`}>
                          <span style={{ width: `${item.progress}%` }} />
                        </div>

                        <div className={styles.queueActions}>
                          {item.status === 'duplicate' ? (
                            <>
                              <button type="button" className={styles.secondaryAction} onClick={() => resolveAttention(item.id)}>Review</button>
                              <button type="button" className={styles.secondaryAction} onClick={() => keepBoth(item.id)}>Keep both</button>
                              <button type="button" className={styles.secondaryAction} onClick={() => cancelImport(item.id)}>Cancel import</button>
                            </>
                          ) : null}

                          {item.status === 'invalid' ? (
                            <>
                              <button type="button" className={styles.secondaryAction} onClick={() => replaceFile(item.id)}>Replace file</button>
                              <button type="button" className={styles.secondaryAction} onClick={() => cancelImport(item.id)}>Remove</button>
                            </>
                          ) : null}

                          {item.status === 'failed' ? (
                            <>
                              <button type="button" className={styles.secondaryAction} onClick={() => retryProcessing(item.id)}>Retry processing</button>
                              <button type="button" className={styles.secondaryAction} onClick={() => cancelImport(item.id)}>Remove</button>
                            </>
                          ) : null}

                          {item.status === 'requires_attention' ? (
                            <button type="button" className={styles.secondaryAction} onClick={() => resolveAttention(item.id)}>Review</button>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className={styles.sideColumn}>
              <section className={styles.sideCard} aria-live="polite">
                <h3>VEYQOR processing</h3>
                <p>Files are checked before candidate information is made available for further processing.</p>
                <div className={`${styles.notice} ${notice.tone === 'success' ? styles.noticeSuccess : notice.tone === 'warning' ? styles.noticeWarning : notice.tone === 'error' ? styles.noticeError : styles.noticeNeutral}`}>{notice.message}</div>
              </section>

              <section className={styles.sideCard}>
                <h3>Import summary</h3>
                <div className={styles.summaryList}>
                  <div><span>Files received</span><strong>{queueSummary.total}</strong></div>
                  <div><span>Processed successfully</span><strong>{queueSummary.successful}</strong></div>
                  <div><span>Possible duplicates</span><strong>{queueSummary.duplicates}</strong></div>
                  <div><span>Require attention</span><strong>{queueSummary.requiresAttention + queueSummary.invalid + queueSummary.failed}</strong></div>
                </div>

                {hasPartialSuccess ? (
                  <p className={styles.partialFlag}>Import partially completed.</p>
                ) : null}
              </section>

              <section className={styles.sideCard}>
                <h3>Secure candidate intake</h3>
                <ul className={styles.securityList}>
                  <li>Files are quarantined and validated before processing.</li>
                  <li>Candidate data remains scoped to the active tenant and organisation context.</li>
                  <li>Ingestion follows configured processing purpose and policy controls.</li>
                </ul>
              </section>

              <section className={styles.sideCard}>
                <h3>Candidates received</h3>
                <p>VEYQOR has securely received candidate information and completed initial intake checks.</p>
                <button type="button" className={styles.primaryAction} disabled={!canContinue} onClick={continueToQuarantine}>
                  Continue to quarantine
                </button>
              </section>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}
