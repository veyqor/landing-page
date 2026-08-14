'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockAuthGateway, type AuthSession } from '@/lib/auth/mockAuthGateway';
import editorStyles from '../criteria-editor/page.module.css';
import styles from './page.module.css';

type Priority = 'required' | 'preferred';
type CriterionOrigin = 'ai' | 'human';
type ReviewState = 'ai-generated' | 'human-reviewed' | 'modified';
type ExceptionStatus = 'open' | 'resolved';

type Criterion = {
  id: string;
  title: string;
  basis: string;
  sourceSnippet: string;
  priority: Priority;
  confidence: 'High' | 'Medium' | 'Low';
  origin: CriterionOrigin;
  reviewState: ReviewState;
  notes: string;
};

type CriterionDraft = {
  title: string;
  basis: string;
  priority: Priority;
  notes: string;
};

type VersionChange = {
  type: 'added' | 'modified' | 'reclassified';
  label: string;
  detail: string;
};

type VersionRecord = {
  id: string;
  version: string;
  createdAt: string;
  creator: string;
  changeType: string;
  reviewState: string;
  status: string;
  summary: string;
  changes: VersionChange[];
};

type ExceptionItem = {
  id: string;
  title: string;
  detail: string;
  action: string;
  blocking: boolean;
  status: ExceptionStatus;
};

const TENANT_STORAGE_KEY = 'veyqor.mock.tenant-context.v1';
const ORG_STORAGE_KEY = 'veyqor.mock.org-context.v1';
const WORKFLOW_STEPS = ['Signal Intake', 'Criteria', 'Approval', 'Candidate Ingestion'];

const INITIAL_CRITERIA: Criterion[] = [
  {
    id: 'criterion-qualification',
    title: 'Qualification',
    basis: 'Review relevant education or equivalent professional experience in front-end engineering.',
    sourceSnippet: 'Senior frontend engineer with strong ownership and delivery history.',
    priority: 'required',
    confidence: 'High',
    origin: 'ai',
    reviewState: 'modified',
    notes: 'Broadened to cover equivalent professional experience.',
  },
  {
    id: 'criterion-technical',
    title: 'Technical capability',
    basis: 'Assess demonstrated proficiency in the required technical capabilities.',
    sourceSnippet: 'Need to own front-end execution and integrate with platform services.',
    priority: 'required',
    confidence: 'High',
    origin: 'ai',
    reviewState: 'ai-generated',
    notes: '',
  },
  {
    id: 'criterion-domain',
    title: 'Domain experience',
    basis: 'Relevant experience within the target domain and similar governed workflows.',
    sourceSnippet: 'Sensitive hiring workflows need explainability and controls.',
    priority: 'required',
    confidence: 'Medium',
    origin: 'ai',
    reviewState: 'modified',
    notes: 'Reclassified from preferred to required based on the source signal.',
  },
  {
    id: 'criterion-policy',
    title: 'Policy alignment',
    basis: 'Confirm the criteria do not introduce undue or unapproved screening constraints.',
    sourceSnippet: 'Work must remain governed and explainable.',
    priority: 'required',
    confidence: 'High',
    origin: 'ai',
    reviewState: 'ai-generated',
    notes: '',
  },
  {
    id: 'criterion-arrangement',
    title: 'Work arrangement',
    basis: 'Validate the candidate can work within the approved engagement model.',
    sourceSnippet: 'Hybrid and remote signals coexist in the source content.',
    priority: 'preferred',
    confidence: 'Medium',
    origin: 'ai',
    reviewState: 'human-reviewed',
    notes: 'Added as a preferred criterion after review.',
  },
];

const INITIAL_EXCEPTIONS: ExceptionItem[] = [
  {
    id: 'exception-experience',
    title: 'Ambiguous experience requirement',
    detail: 'The source signal does not clearly specify the minimum years of experience required.',
    action: 'Resolve',
    blocking: true,
    status: 'open',
  },
  {
    id: 'exception-arrangement',
    title: 'Work arrangement needs policy review',
    detail: 'Hybrid and remote language both appear in the source signal. Confirm the final evaluation rule.',
    action: 'Review',
    blocking: false,
    status: 'open',
  },
];

const VERSION_HISTORY: VersionRecord[] = [
  {
    id: 'version-1',
    version: '1',
    createdAt: 'Today · 10:42',
    creator: 'VEYQOR AI',
    changeType: 'Generated',
    reviewState: 'Pending review',
    status: 'Initial version',
    summary: 'Generated from the job signal',
    changes: [],
  },
  {
    id: 'version-2',
    version: '2',
    createdAt: 'Today · 11:18',
    creator: 'Maya Okafor',
    changeType: 'Modified',
    reviewState: 'Ready for approval',
    status: 'Current draft',
    summary: '1 criterion added · 1 criterion modified · 1 criterion reclassified',
    changes: [
      {
        type: 'added',
        label: 'Added work arrangement',
        detail: 'Introduced as a preferred criterion to reflect the approved engagement model.',
      },
      {
        type: 'modified',
        label: 'Modified qualification basis',
        detail: 'Expanded the qualification language to include equivalent professional experience.',
      },
      {
        type: 'reclassified',
        label: 'Reclassified domain experience',
        detail: 'Moved from preferred to required to match the governed evaluation basis.',
      },
    ],
  },
];

function roleLabel(role: AuthSession['role']) {
  if (role === 'administrator') return 'Administrator';
  if (role === 'reviewer') return 'Reviewer';
  if (role === 'leadership') return 'Leadership/Oversight';
  return 'Recruitment Operator';
}

function SparkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
    </svg>
  );
}

export default function CriteriaApprovalPage() {
  const router = useRouter();

  const [session, setSession] = useState<AuthSession | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [criteria, setCriteria] = useState<Criterion[]>(INITIAL_CRITERIA);
  const [exceptions, setExceptions] = useState<ExceptionItem[]>(INITIAL_EXCEPTIONS);
  const [selectedVersionId, setSelectedVersionId] = useState('version-2');
  const [editingCriterionId, setEditingCriterionId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<CriterionDraft | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approved, setApproved] = useState(false);
  const [approvedAt, setApprovedAt] = useState('');

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
  }, [router]);

  const requiredCriteria = useMemo(() => criteria.filter((item) => item.priority === 'required'), [criteria]);
  const preferredCriteria = useMemo(() => criteria.filter((item) => item.priority === 'preferred'), [criteria]);
  const openExceptions = useMemo(() => exceptions.filter((item) => item.status === 'open'), [exceptions]);
  const blockingExceptions = useMemo(() => openExceptions.filter((item) => item.blocking), [openExceptions]);
  const selectedVersion = useMemo(
    () => VERSION_HISTORY.find((item) => item.id === selectedVersionId) ?? VERSION_HISTORY[VERSION_HISTORY.length - 1],
    [selectedVersionId]
  );

  const isAuthorizedApprover = Boolean(session && session.role !== 'operator');
  const approvalReady = isAuthorizedApprover && openExceptions.length === 0;

  const approvalStatus = approved
    ? 'approved'
    : !isAuthorizedApprover
      ? 'blocked'
      : blockingExceptions.length > 0
        ? 'blocked'
        : openExceptions.length > 0
          ? 'review'
          : 'ready';

  const approvalLabel = approved
    ? 'Criteria approved'
    : approvalStatus === 'blocked'
      ? 'Blocked'
      : approvalStatus === 'review'
        ? 'Review required'
        : 'Ready for approval';

  const approvalDescription = approved
    ? 'The approved criteria are now ready for candidate ingestion and evaluation.'
    : !isAuthorizedApprover
      ? 'Your current role does not permit criteria approval.'
      : blockingExceptions.length > 0
        ? 'Resolve the blocking exception before approval can proceed.'
        : openExceptions.length > 0
          ? 'Some criteria or policy exceptions still require attention before approval.'
          : 'All required criteria have been generated and validated.';

  const validationItems = [
    { label: 'Criteria completeness', value: 'Ready', tone: 'ready', detail: `${criteria.length} structured criteria` },
    { label: 'Requirement consistency', value: 'Ready', tone: 'ready', detail: 'Required and preferred criteria remain coherent' },
    { label: 'Ambiguity detection', value: openExceptions.length ? `${openExceptions.length} open` : 'None detected', tone: openExceptions.length ? 'review' : 'ready', detail: 'Material ambiguities are surfaced above' },
    { label: 'Missing information', value: blockingExceptions.length ? 'Attention required' : 'None detected', tone: blockingExceptions.length ? 'blocked' : 'ready', detail: 'Only governed gaps are surfaced' },
    { label: 'Policy considerations', value: openExceptions.length ? 'Review required' : 'Passed', tone: openExceptions.length ? 'review' : 'ready', detail: 'No prohibited approval rules are introduced' },
    { label: 'AI confidence', value: 'High', tone: 'high', detail: 'Criteria are supported by structured source signals' },
  ] as const;

  const approvalRequirements = [
    { label: 'Criteria generated', met: true },
    { label: 'Required criteria validated', met: requiredCriteria.length > 0 && requiredCriteria.every((item) => item.basis.trim().length > 0) },
    { label: 'No blocking exceptions', met: blockingExceptions.length === 0 },
    { label: 'Policy checks completed', met: openExceptions.length === 0 },
    { label: 'Authorised reviewer', met: isAuthorizedApprover },
  ];

  function beginEditing(item: Criterion) {
    if (approved) return;

    setEditingCriterionId(item.id);
    setEditingDraft({
      title: item.title,
      basis: item.basis,
      priority: item.priority,
      notes: item.notes,
    });
  }

  function cancelEditing() {
    setEditingCriterionId(null);
    setEditingDraft(null);
  }

  function saveEditing() {
    if (!editingCriterionId || !editingDraft) {
      return;
    }

    const nextTitle = editingDraft.title.trim();
    const nextBasis = editingDraft.basis.trim();
    const nextNotes = editingDraft.notes.trim();

    if (!nextTitle || !nextBasis) {
      return;
    }

    setCriteria((current) =>
      current.map((item) => {
        if (item.id !== editingCriterionId) return item;
        return {
          ...item,
          title: nextTitle,
          basis: nextBasis,
          priority: editingDraft.priority,
          notes: nextNotes,
          origin: 'human',
          reviewState: 'modified',
        };
      })
    );

    cancelEditing();
  }

  function resolveException(exceptionId: string) {
    setExceptions((current) =>
      current.map((item) => (item.id === exceptionId ? { ...item, status: 'resolved' } : item))
    );
  }

  function openApprovalModal() {
    if (!approvalReady) {
      return;
    }

    setShowApprovalModal(true);
  }

  function approveCriteria() {
    setApproved(true);
    setApprovedAt(new Date().toLocaleString());
    setShowApprovalModal(false);
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
              <strong>Criteria approval</strong>
              <small>Review the final evaluation criteria before approving them for candidate assessment.</small>
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
              <p className={editorStyles.kicker}>Governance checkpoint</p>
              <h1>Criteria approval</h1>
              <p>VEYQOR generated and validated the criteria. Review the final output, inspect the version history, and approve only when the governed decision is ready.</p>
              <p className={editorStyles.pageIdentity}><strong>Senior Frontend Engineer · Criteria v2</strong><small>Authorised review before candidate ingestion</small></p>
            </div>

            <div className={editorStyles.aiDraftReady}>
              <span className={editorStyles.aiPulseDot} aria-hidden="true" />
              <div>
                <strong>AI validated</strong>
                <small>Generated by VEYQOR and surfaced for human approval</small>
              </div>
            </div>
          </div>

          <div className={editorStyles.stepper} aria-label="Workflow progress">
            {WORKFLOW_STEPS.map((step, index) => (
              <div key={step} className={`${editorStyles.step} ${index === 2 ? editorStyles.stepActive : ''}`}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.approvalStatus} aria-live="polite">
          <div className={styles.approvalStatusLeft}>
            <span className={`${styles.statusDot} ${approvalStatus === 'approved' ? styles.statusApproved : approvalStatus === 'blocked' ? styles.statusBlocked : approvalStatus === 'review' ? styles.statusReview : styles.statusReady}`} aria-hidden="true" />
            <div className={styles.statusCopy}>
              <strong>{approvalLabel}</strong>
              <small>{approvalDescription}</small>
            </div>
          </div>
          <div className={styles.statusMetaRow}>
            <span className={styles.statusMetaPill}>Version {selectedVersion.version}</span>
            <span className={`${styles.statusMetaPill} ${styles.statusMetaPillGold}`}>{selectedVersion.status}</span>
            <span className={styles.statusMetaPill}>{roleLabel(session.role)}</span>
          </div>
        </section>

        <section className={editorStyles.workspace}>
          <div className={`${editorStyles.mainGrid} ${styles.mainGrid}`}>
            <div className={editorStyles.leftColumn}>
              <section className={editorStyles.panel}>
                <header className={editorStyles.panelHeader}>
                  <div>
                    <h2>Final evaluation criteria</h2>
                    <p>These criteria will be used by VEYQOR during candidate evaluation and matching.</p>
                  </div>
                  <div className={styles.criteriaHeaderMeta}>
                    <button type="button" className={editorStyles.textAction} onClick={() => router.push('/criteria-editor')}>Edit criteria</button>
                    <span className={editorStyles.aiGeneratedFlag}>
                      <SparkIcon />
                      AI generated
                    </span>
                  </div>
                </header>

                <div className={styles.criteriaSummary}>
                  <div className={styles.criteriaSummaryTop}>
                    <p>VEYQOR has normalised the signal into a governed evaluation basis. This is the approved criteria set unless the reviewer makes a deliberate change.</p>
                    <span className={editorStyles.exceptionCount}>{openExceptions.length} open exception{openExceptions.length === 1 ? '' : 's'}</span>
                  </div>
                  <div className={styles.summaryChipRow}>
                    <span className={styles.summaryChip}><strong>{requiredCriteria.length}</strong> required</span>
                    <span className={styles.summaryChip}><strong>{preferredCriteria.length}</strong> preferred</span>
                    <span className={styles.summaryChip}><strong>{criteria.filter((item) => item.reviewState === 'modified' || item.reviewState === 'human-reviewed').length}</strong> human reviewed</span>
                    <span className={styles.summaryChip}><strong>{criteria.filter((item) => item.origin === 'ai').length}</strong> AI generated</span>
                  </div>
                </div>

                <article className={`${editorStyles.groupCard} ${styles.criteriaGroup}`}>
                  <button type="button" className={editorStyles.groupToggle} onClick={() => router.push('/criteria-editor')}>
                    <div>
                      <h3>Required</h3>
                      <small>Final basis for mandatory evaluation criteria</small>
                    </div>
                    <span>Review in editor</span>
                  </button>

                  <div className={styles.criteriaList}>
                    {requiredCriteria.map((item) => (
                      <article key={item.id} className={styles.criterionCard}>
                        <header className={styles.criterionHeader}>
                          <div>
                            <h3 className={styles.criterionTitle}>{item.title}</h3>
                            <div className={styles.criterionMeta}>
                              <span className={`${styles.metaPill} ${styles.metaRequired}`}>Required</span>
                              <span className={`${styles.metaPill} ${styles.metaAi}`}>{item.origin === 'ai' ? 'AI generated' : 'Human reviewed'}</span>
                              <span className={`${styles.metaPill} ${styles.metaAi}`}>{item.confidence} confidence</span>
                              <span className={`${styles.metaPill} ${item.reviewState === 'modified' ? styles.metaModified : styles.metaHuman}`}>{item.reviewState === 'modified' ? 'Modified' : 'Human reviewed'}</span>
                            </div>
                          </div>
                          <div className={styles.criterionActions}>
                            <button type="button" className={editorStyles.textAction} onClick={() => beginEditing(item)}>Edit</button>
                          </div>
                        </header>

                        <div className={styles.criterionBody}>
                          <p className={styles.criterionLabel}>Evaluation basis</p>
                          <p className={styles.criterionBasis}>{item.basis}</p>
                          <p className={styles.sourceLine}>Source: {item.sourceSnippet}</p>
                          {item.notes ? <p className={styles.criterionLabel}>Review note: {item.notes}</p> : null}
                        </div>

                        {editingCriterionId === item.id && editingDraft ? (
                          <div className={styles.editorSurface}>
                            <div className={styles.editorGrid}>
                              <label className={styles.editorField}>
                                <span>Criterion title</span>
                                <input value={editingDraft.title} onChange={(event) => setEditingDraft({ ...editingDraft, title: event.target.value })} />
                              </label>
                              <label className={styles.editorField}>
                                <span>Required / Preferred</span>
                                <select value={editingDraft.priority} onChange={(event) => setEditingDraft({ ...editingDraft, priority: event.target.value as Priority })}>
                                  <option value="required">Required</option>
                                  <option value="preferred">Preferred</option>
                                </select>
                              </label>
                              <label className={`${styles.editorField} ${styles.editorFieldWide}`}>
                                <span>Evaluation basis</span>
                                <textarea value={editingDraft.basis} onChange={(event) => setEditingDraft({ ...editingDraft, basis: event.target.value })} />
                              </label>
                              <label className={`${styles.editorField} ${styles.editorFieldWide}`}>
                                <span>Review note</span>
                                <textarea value={editingDraft.notes} onChange={(event) => setEditingDraft({ ...editingDraft, notes: event.target.value })} placeholder="Add human review rationale" />
                              </label>
                            </div>
                            <div className={styles.editorActions}>
                              <button type="button" className={editorStyles.secondaryButton} onClick={cancelEditing}>Cancel</button>
                              <button type="button" className={editorStyles.primaryButtonSmall} onClick={saveEditing}>Save updates</button>
                            </div>
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </article>

                <article className={`${editorStyles.groupCard} ${styles.changesPanel}`}>
                  <button type="button" className={editorStyles.groupToggle} onClick={() => setSelectedVersionId('version-2')}>
                    <div>
                      <h3>Changes since previous version</h3>
                      <small>Compact governance summary of the latest iteration</small>
                    </div>
                    <span>{selectedVersion.summary}</span>
                  </button>

                  <div className={styles.changeDetails}>
                    {selectedVersion.id === 'version-1' ? (
                      <p>Initial version.</p>
                    ) : (
                      <>
                        <p>Version 2 refined the governed evaluation basis without reintroducing manual configuration work.</p>
                        <div className={styles.changeSummary}>
                          <span className={`${styles.changePill} ${styles.changePillAdded}`}><strong>1</strong> added</span>
                          <span className={`${styles.changePill} ${styles.changePillModified}`}><strong>1</strong> modified</span>
                          <span className={`${styles.changePill} ${styles.changePillReclassified}`}><strong>1</strong> reclassified</span>
                        </div>
                        <div className={styles.changeList}>
                          {selectedVersion.changes.map((change) => (
                            <article
                              key={change.label}
                              className={`${styles.versionChangeItem} ${change.type === 'added' ? styles.changeAdded : change.type === 'modified' ? styles.changeModified : styles.changeReclassified}`}
                            >
                              <div className={styles.changeItemTop}>
                                <strong>{change.label}</strong>
                                <span>{change.type}</span>
                              </div>
                              <p>{change.detail}</p>
                            </article>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </article>
              </section>
            </div>

            <div className={editorStyles.rightColumn}>
              <aside className={styles.validationStack}>
                <section className={styles.stackCard}>
                  <header className={styles.stackHeader}>
                    <div>
                      <h2>AI validation</h2>
                      <p>VEYQOR validates the criteria before they are approved for candidate assessment.</p>
                    </div>
                    <span className={`${styles.validationPill} ${approvalStatus === 'blocked' ? styles.validationBlocked : approvalStatus === 'review' ? styles.validationReview : styles.validationReady}`}>{approvalLabel}</span>
                  </header>

                  <div className={styles.validationList}>
                    {validationItems.map((item) => (
                      <article key={item.label} className={styles.validationItem}>
                        <div>
                          <strong>{item.label}</strong>
                          <p>{item.detail}</p>
                        </div>
                        <span className={`${styles.validationPill} ${item.tone === 'blocked' ? styles.validationBlocked : item.tone === 'review' ? styles.validationReview : item.tone === 'high' ? styles.validationHigh : styles.validationReady}`}>{item.value}</span>
                      </article>
                    ))}
                  </div>
                </section>

                <section className={styles.stackCard}>
                  <header className={styles.stackHeader}>
                    <div>
                      <h3>Attention required</h3>
                      <p>Exceptions stay visible until a reviewer resolves them or returns the criteria for revision.</p>
                    </div>
                  </header>

                  <div className={styles.exceptionList}>
                    {exceptions.map((item) => (
                      <article key={item.id} className={styles.exceptionItem}>
                        <div className={styles.exceptionTop}>
                          <strong>{item.title}</strong>
                          <span className={`${styles.exceptionLabel} ${item.status === 'resolved' ? styles.exceptionResolved : item.blocking ? styles.exceptionBlocking : styles.exceptionReview}`}>{item.status === 'resolved' ? 'Resolved' : item.blocking ? 'Blocking' : 'Review'}</span>
                        </div>
                        <p>{item.detail}</p>
                        <div className={styles.exceptionActions}>
                          <button type="button" className={editorStyles.textAction} onClick={() => resolveException(item.id)} disabled={approved || item.status === 'resolved'}>{item.action}</button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className={styles.stackCard}>
                  <header className={styles.stackHeader}>
                    <div>
                      <h3>Approval requirements</h3>
                      <p>These are the governing conditions for approval in this workspace.</p>
                    </div>
                  </header>

                  <div className={styles.requirementsList}>
                    {approvalRequirements.map((item) => (
                      <div key={item.label} className={styles.requirementItem}>
                        <span className={`${styles.requirementIcon} ${item.met ? styles.requirementPass : styles.requirementPending}`}>{item.met ? '✓' : '!'}</span>
                        <div>
                          <strong>{item.label}</strong>
                          <small>{item.met ? 'Satisfied' : 'Pending'}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={styles.stackCard}>
                  <header className={styles.stackHeader}>
                    <div>
                      <h3>Approver</h3>
                      <p>Decision authority is restricted to the active tenant and organisation context.</p>
                    </div>
                  </header>

                  <div className={styles.approverGrid}>
                    <div className={styles.approverItem}>
                      <span>Current operator</span>
                      <strong>{session.fullName}</strong>
                      <p>{roleLabel(session.role)}</p>
                    </div>
                    <div className={styles.approverItem}>
                      <span>Organisation</span>
                      <strong>{orgName}</strong>
                      <p>{tenantName}</p>
                    </div>
                    <div className={styles.approverItem}>
                      <span>Session</span>
                      <strong>{session.signedInAt}</strong>
                      <p>Approval remains tenant-scoped and auditable.</p>
                    </div>
                  </div>
                </section>

                <section className={styles.stackCard}>
                  <header className={styles.stackHeader}>
                    <div>
                      <h3>Version history</h3>
                      <p>Select a version to inspect its governance state and differences.</p>
                    </div>
                  </header>

                  <div className={styles.versionList}>
                    {VERSION_HISTORY.map((version) => (
                      <button
                        key={version.id}
                        type="button"
                        className={`${styles.versionButton} ${selectedVersion.id === version.id ? styles.versionButtonActive : ''}`}
                        onClick={() => setSelectedVersionId(version.id)}
                      >
                        <div className={styles.versionButtonTop}>
                          <strong>Version {version.version}</strong>
                          <span className={version.id === 'version-2' ? styles.versionCurrent : styles.validationReady}>{version.changeType}</span>
                        </div>
                        <div className={styles.versionCreated}>{version.creator} · {version.createdAt}</div>
                        <div className={styles.versionCreated}>{version.reviewState}</div>
                      </button>
                    ))}
                  </div>

                  <div className={styles.versionDetail}>
                    <div className={styles.versionDetailTop}>
                      <div>
                        <strong>Version {selectedVersion.version}</strong>
                        <p>{selectedVersion.status} · {selectedVersion.summary}</p>
                      </div>
                      <span className={selectedVersion.id === 'version-2' ? styles.versionPending : styles.versionApproved}>{selectedVersion.creator}</span>
                    </div>

                    <div className={styles.auditGrid}>
                      <div className={styles.auditItem}><span>Created</span><strong>{selectedVersion.createdAt}</strong></div>
                      <div className={styles.auditItem}><span>Change type</span><strong>{selectedVersion.changeType}</strong></div>
                      <div className={styles.auditItem}><span>Review state</span><strong>{selectedVersion.reviewState}</strong></div>
                      <div className={styles.auditItem}><span>Tenant</span><strong>{tenantName}</strong></div>
                    </div>

                    <div className={styles.versionChanges}>
                      {selectedVersion.changes.length ? selectedVersion.changes.map((change) => (
                        <article key={change.label} className={`${styles.versionChangeItem} ${change.type === 'added' ? styles.changeAdded : change.type === 'modified' ? styles.changeModified : styles.changeReclassified}`}>
                          <div className={styles.changeItemTop}>
                            <strong>{change.label}</strong>
                            <span>{change.type}</span>
                          </div>
                          <p>{change.detail}</p>
                        </article>
                      )) : <div className={styles.auditItem}><strong>Initial version</strong><p>This version was generated by VEYQOR AI and has no prior comparison.</p></div>}
                    </div>
                  </div>
                </section>
              </aside>
            </div>
          </div>

          {approved ? (
            <section className={styles.successPanel} role="status" aria-live="polite">
              <div className={styles.approvedBanner}>Criteria approved by {session.fullName} · {approvedAt}</div>
              <div>
                <h2>Criteria approved</h2>
                <p>The approved criteria are now ready for candidate ingestion and evaluation.</p>
              </div>

              <div className={styles.successMetaGrid}>
                <div className={styles.successMetaItem}><span>Approved by</span><strong>{session.fullName}</strong></div>
                <div className={styles.successMetaItem}><span>Approved at</span><strong>{approvedAt}</strong></div>
                <div className={styles.successMetaItem}><span>Approved version</span><strong>Version {selectedVersion.version}</strong></div>
                <div className={styles.successMetaItem}><span>Tenant / organisation</span><strong>{tenantName} · {orgName}</strong></div>
              </div>

              <div className={styles.successActionRow}>
                <button type="button" className={styles.primaryAction} onClick={() => router.push('/candidate-ingestion')}>
                  Continue to candidate ingestion
                </button>
              </div>
            </section>
          ) : (
            <div className={styles.actionBar} role="group" aria-label="Criteria approval actions">
              <div className={styles.actionStatus}>
                <span className={`${styles.statusDot} ${approvalStatus === 'approved' ? styles.statusApproved : approvalStatus === 'blocked' ? styles.statusBlocked : approvalStatus === 'review' ? styles.statusReview : styles.statusReady}`} aria-hidden="true" />
                <div>
                  <strong>{approvalLabel}</strong>
                  <small>{approvalDescription}</small>
                  <p>Audit trail: version {selectedVersion.version} · {tenantName} · {orgName}</p>
                </div>
              </div>

              <div className={styles.actionRow}>
                <button type="button" className={styles.secondaryAction} onClick={() => router.push('/criteria-editor')}>Return for revision</button>
                <button type="button" className={styles.secondaryAction} onClick={() => beginEditing(requiredCriteria[0] ?? criteria[0])} disabled={approved}>Edit criteria</button>
                <button type="button" className={styles.primaryAction} onClick={openApprovalModal} disabled={!approvalReady || approved}>
                  Approve criteria
                </button>
              </div>
            </div>
          )}
        </section>

        {showApprovalModal ? (
          <div className={styles.modalOverlay} role="presentation" onClick={() => setShowApprovalModal(false)}>
            <div className={styles.modalCard} role="dialog" aria-modal="true" aria-label="Approve criteria" onClick={(event) => event.stopPropagation()}>
              <div className={styles.modalHeader}>
                <p className={editorStyles.kicker}>Approval checkpoint</p>
                <h2>Approve these criteria?</h2>
                <p>These criteria will become the evaluation basis for candidate assessment and matching.</p>
              </div>

              <div className={styles.modalBody}>
                <strong>Governed decision</strong>
                <p>Approval is recorded against the active tenant, organisation, version, and operator context.</p>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryAction} onClick={() => setShowApprovalModal(false)}>Cancel</button>
                <button type="button" className={styles.primaryAction} onClick={approveCriteria}>Approve criteria</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
