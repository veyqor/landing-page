'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockAuthGateway, type AuthSession } from '@/lib/auth/mockAuthGateway';
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

const POLICY_CONSIDERATIONS = [
  'Criteria should avoid proxy characteristics that may create unfair screening outcomes.',
  'Any location-based requirement should be linked to operational necessity.',
  'Experience filters should be reviewed for proportionality before release.',
];

type EditingDraft = {
  text: string;
  category: string;
  priority: Priority;
  evaluationBasis: string;
  notes: string;
};

function roleLabel(role: AuthSession['role']) {
  if (role === 'administrator') return 'Administrator';
  if (role === 'reviewer') return 'Reviewer';
  if (role === 'leadership') return 'Leadership/Oversight';
  return 'Recruitment Operator';
}

export default function CriteriaEditorPage() {
  const router = useRouter();

  const [session, setSession] = useState<AuthSession | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [draftVersion] = useState('v1');
  const [generatedAt] = useState(() => new Date());
  const [lastReviewedAt, setLastReviewedAt] = useState<string>('Not yet reviewed');
  const [draftSavedAt, setDraftSavedAt] = useState<string>('Not yet saved');

  const [requirements, setRequirements] = useState<GeneratedRequirement[]>(INITIAL_REQUIREMENTS);
  const [exceptions, setExceptions] = useState<ExceptionItem[]>(INITIAL_EXCEPTIONS);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    qualifications: true,
    skills: true,
    experience: true,
    evaluation: true,
  });

  const [editingRequirementId, setEditingRequirementId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<EditingDraft | null>(null);
  const [sourceViewId, setSourceViewId] = useState<string | null>(null);
  const [showTabletInsights, setShowTabletInsights] = useState(false);

  const requiredCriteriaCount = useMemo(
    () => requirements.filter((item) => item.priority === 'required').length,
    [requirements]
  );

  const preferredCriteriaCount = useMemo(
    () => requirements.filter((item) => item.priority === 'preferred').length,
    [requirements]
  );

  const openExceptions = useMemo(
    () => exceptions.filter((item) => item.status === 'open'),
    [exceptions]
  );

  const reviewedCriteriaCount = useMemo(
    () => requirements.filter((item) => item.reviewed).length,
    [requirements]
  );

  const allRequiredReviewed = useMemo(
    () => requirements.filter((item) => item.priority === 'required').every((item) => item.reviewed),
    [requirements]
  );

  const readyForValidation = openExceptions.length === 0 && allRequiredReviewed;

  const averageConfidence = useMemo(() => {
    const score = requirements.reduce((total, item) => {
      if (item.confidence === 'High') return total + 3;
      if (item.confidence === 'Medium') return total + 2;
      return total + 1;
    }, 0);

    if (!requirements.length) return 'Low';

    const value = score / requirements.length;
    if (value >= 2.6) return 'High';
    if (value >= 1.8) return 'Medium';
    return 'Low';
  }, [requirements]);

  const missingInformation = useMemo(() => {
    const items: string[] = [];
    if (!requirements.some((item) => item.category.toLowerCase().includes('certification'))) {
      items.push('Required certification not specified in source signal');
    }
    if (!requirements.some((item) => item.text.toLowerCase().includes('years'))) {
      items.push('Minimum years of experience not explicitly defined');
    }
    if (!requirements.some((item) => item.text.toLowerCase().includes('location'))) {
      items.push('Location constraints not clearly structured in criteria');
    }
    return items;
  }, [requirements]);

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

  function toggleGroup(groupId: string) {
    setExpandedGroups((current) => ({ ...current, [groupId]: !current[groupId] }));
  }

  function startEditing(item: GeneratedRequirement) {
    setEditingRequirementId(item.id);
    setEditingDraft({
      text: item.text,
      category: item.category,
      priority: item.priority,
      evaluationBasis: item.evaluationBasis,
      notes: item.notes,
    });
  }

  function cancelEditing() {
    setEditingRequirementId(null);
    setEditingDraft(null);
  }

  function saveEditing() {
    if (!editingRequirementId || !editingDraft) {
      return;
    }

    const nextText = editingDraft.text.trim();
    const nextCategory = editingDraft.category.trim();
    const nextBasis = editingDraft.evaluationBasis.trim();
    if (!nextText || !nextCategory || !nextBasis) {
      return;
    }

    setRequirements((current) =>
      current.map((item) =>
        item.id === editingRequirementId
          ? {
              ...item,
              text: nextText,
              category: nextCategory,
              priority: editingDraft.priority,
              evaluationBasis: nextBasis,
              notes: editingDraft.notes.trim(),
              origin: 'human',
              reviewed: true,
            }
          : item
      )
    );

    setLastReviewedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setDraftSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setEditingRequirementId(null);
    setEditingDraft(null);
  }

  function markReviewed(requirementId: string) {
    setRequirements((current) =>
      current.map((item) => (item.id === requirementId ? { ...item, reviewed: true } : item))
    );
    setLastReviewedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }

  function togglePriority(requirementId: string) {
    setRequirements((current) =>
      current.map((item) =>
        item.id === requirementId
          ? {
              ...item,
              priority: item.priority === 'required' ? 'preferred' : 'required',
              origin: 'human',
            }
          : item
      )
    );
  }

  function updateExceptionStatus(exceptionId: string, status: ExceptionStatus) {
    setExceptions((current) => current.map((item) => (item.id === exceptionId ? { ...item, status } : item)));
  }

  function resolveAllExceptions() {
    setExceptions((current) =>
      current.map((item) => (item.status === 'open' ? { ...item, status: 'resolved' } : item))
    );
  }

  function saveDraft() {
    setDraftSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }

  if (!session) {
    return (
      <main className={styles.page}>
        <div className={styles.skeletonSurface}>
          <span className={styles.skeletonLine} />
          <span className={styles.skeletonBlock} />
          <span className={styles.skeletonBlock} />
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <Image src="/Untitled design - 2026-08-10T155155.182.png" alt="Veyqor" width={146} height={38} className={styles.mark} priority />
            <div className={styles.topDivider} aria-hidden="true" />
            <div className={styles.pageIdentity}>
              <strong>Job requirements & criteria</strong>
              <small>Case JOB-2419 · Draft {draftVersion}</small>
            </div>
          </div>

          <div className={styles.topBarRight}>
            <div className={styles.topMeta}>
              <span className={styles.contextLabel}>Working in</span>
              <strong>{orgName}</strong>
              <small>{tenantName} · {roleLabel(session.role)}</small>
            </div>
            <div className={styles.controlRow}>
              <button type="button" className={styles.iconButton} aria-label="Notifications">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
              </button>
              <button type="button" className={styles.iconButton} aria-label="Accessibility controls">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="5" r="2" />
                  <path d="M12 7v5" />
                  <path d="M9 12h6" />
                  <path d="M12 12l-3 7" />
                  <path d="M12 12l3 7" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <section className={styles.headerBlock}>
          <div className={styles.headerTop}>
            <div>
              <p className={styles.kicker}>Criteria workspace</p>
              <h1>Job requirements & criteria</h1>
              <p>
                VEYQOR has converted the hiring signal into structured requirements and evaluation criteria. Review the generated criteria and resolve any exceptions before approval.
              </p>
            </div>
            <div className={styles.aiDraftReady}>
              <span className={styles.aiPulseDot} aria-hidden="true" />
              <div>
                <strong>AI draft ready</strong>
                <small>Generated {generatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
              </div>
            </div>
          </div>

          <div className={styles.stepper} aria-label="Workflow progress">
            {WORKFLOW_STEPS.map((step, index) => (
              <div key={step} className={`${styles.step} ${index === 1 ? styles.stepActive : ''}`}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.workspace}>
          <div className={styles.mainGrid}>
            <div className={styles.leftColumn}>
              <section className={styles.panel}>
                <header className={styles.panelHeader}>
                  <div>
                    <h2>Generated requirements</h2>
                    <p>VEYQOR automatically extracted and structured the requirements from the hiring signal.</p>
                  </div>
                  <div className={styles.aiGeneratedFlag}>
                    <span className={styles.aiFlagDot} aria-hidden="true" />
                    AI-generated
                  </div>
                </header>

                <div className={styles.summaryRow}>
                  <span><strong>{requiredCriteriaCount}</strong> required criteria</span>
                  <span><strong>{preferredCriteriaCount}</strong> preferred criteria</span>
                  <span><strong>{CORE_SKILLS.length}</strong> skills detected</span>
                  <span><strong>{openExceptions.length}</strong> items need review</span>
                </div>

                <article className={styles.groupCard}>
                  <button type="button" className={styles.groupToggle} onClick={() => toggleGroup('qualifications')}>
                    <div>
                      <h3>Required qualifications</h3>
                      <small>AI suggestions with human override controls</small>
                    </div>
                    <span>{expandedGroups.qualifications ? 'Collapse' : 'Expand'}</span>
                  </button>

                  {expandedGroups.qualifications ? (
                    <div className={styles.groupBody}>
                      {requirements.map((item) => (
                        <article key={item.id} className={styles.requirementItem}>
                          <header className={styles.requirementHead}>
                            <div>
                              <p className={styles.requirementText}>{item.text}</p>
                              <div className={styles.metaLine}>
                                <span>{item.category}</span>
                                <span className={item.priority === 'required' ? styles.requiredPill : styles.preferredPill}>
                                  {item.priority === 'required' ? 'Required' : 'Preferred'}
                                </span>
                                <span className={styles.confidenceTag}>{item.confidence} confidence</span>
                                <span className={item.origin === 'ai' ? styles.aiTag : styles.humanTag}>
                                  {item.origin === 'ai' ? 'AI suggestion' : 'Human reviewed'}
                                </span>
                              </div>
                            </div>
                            <div className={styles.requirementActions}>
                              <button type="button" className={styles.textAction} onClick={() => setSourceViewId(sourceViewId === item.id ? null : item.id)}>
                                View source
                              </button>
                              <button type="button" className={styles.textAction} onClick={() => startEditing(item)}>
                                Edit
                              </button>
                              <button type="button" className={styles.textAction} onClick={() => togglePriority(item.id)}>
                                Mark as {item.priority === 'required' ? 'preferred' : 'required'}
                              </button>
                              <button type="button" className={styles.textAction} onClick={() => markReviewed(item.id)}>
                                {item.reviewed ? 'Reviewed' : 'Confirm'}
                              </button>
                            </div>
                          </header>

                          <p className={styles.evaluationBasis}><strong>Evaluation basis:</strong> {item.evaluationBasis}</p>

                          {sourceViewId === item.id ? (
                            <div className={styles.sourcePreview}>
                              <small>Traceability · Source excerpt</small>
                              <p>{item.sourceSnippet}</p>
                            </div>
                          ) : null}

                          {editingRequirementId === item.id && editingDraft ? (
                            <div className={styles.editorSurface}>
                              <div className={styles.editorGrid}>
                                <label>
                                  <span>Requirement description</span>
                                  <textarea
                                    value={editingDraft.text}
                                    onChange={(event) => setEditingDraft({ ...editingDraft, text: event.target.value })}
                                  />
                                </label>
                                <label>
                                  <span>Category</span>
                                  <input
                                    value={editingDraft.category}
                                    onChange={(event) => setEditingDraft({ ...editingDraft, category: event.target.value })}
                                  />
                                </label>
                                <label>
                                  <span>Required / Preferred</span>
                                  <select
                                    value={editingDraft.priority}
                                    onChange={(event) => setEditingDraft({ ...editingDraft, priority: event.target.value as Priority })}
                                  >
                                    <option value="required">Required</option>
                                    <option value="preferred">Preferred</option>
                                  </select>
                                </label>
                                <label>
                                  <span>Evaluation method</span>
                                  <textarea
                                    value={editingDraft.evaluationBasis}
                                    onChange={(event) => setEditingDraft({ ...editingDraft, evaluationBasis: event.target.value })}
                                  />
                                </label>
                                <label className={styles.editorWide}>
                                  <span>Notes / rationale</span>
                                  <textarea
                                    value={editingDraft.notes}
                                    onChange={(event) => setEditingDraft({ ...editingDraft, notes: event.target.value })}
                                    placeholder="Add reviewer rationale if needed"
                                  />
                                </label>
                              </div>
                              <div className={styles.editorActions}>
                                <button type="button" className={styles.secondaryButton} onClick={cancelEditing}>Cancel</button>
                                <button type="button" className={styles.primaryButtonSmall} onClick={saveEditing}>Save updates</button>
                              </div>
                            </div>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  ) : null}
                </article>

                <article className={styles.groupCard}>
                  <button type="button" className={styles.groupToggle} onClick={() => toggleGroup('skills')}>
                    <div>
                      <h3>Core skills</h3>
                      <small>Extracted from hiring signal</small>
                    </div>
                    <span>{expandedGroups.skills ? 'Collapse' : 'Expand'}</span>
                  </button>

                  {expandedGroups.skills ? (
                    <div className={styles.skillsWrap}>
                      {CORE_SKILLS.map((skill) => (
                        <span key={skill} className={styles.skillChip}>
                          {skill}
                          <em>AI</em>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>

                <article className={styles.groupCard}>
                  <button type="button" className={styles.groupToggle} onClick={() => toggleGroup('experience')}>
                    <div>
                      <h3>Experience</h3>
                      <small>Structured role expectations</small>
                    </div>
                    <span>{expandedGroups.experience ? 'Collapse' : 'Expand'}</span>
                  </button>

                  {expandedGroups.experience ? (
                    <div className={styles.experienceGrid}>
                      <div><small>Minimum experience</small><strong>Not specified</strong></div>
                      <div><small>Relevant experience</small><strong>Enterprise software delivery</strong></div>
                      <div><small>Domain experience</small><strong>Regulated environments preferred</strong></div>
                      <div><small>Leadership requirement</small><strong>Cross-functional collaboration expected</strong></div>
                    </div>
                  ) : null}
                </article>

                <article className={styles.groupCard}>
                  <button type="button" className={styles.groupToggle} onClick={() => toggleGroup('evaluation')}>
                    <div>
                      <h3>Evaluation criteria</h3>
                      <small>Automatically generated by VEYQOR</small>
                    </div>
                    <span>{expandedGroups.evaluation ? 'Collapse' : 'Expand'}</span>
                  </button>

                  {expandedGroups.evaluation ? (
                    <div className={styles.evaluationList}>
                      {requirements.map((item) => (
                        <article key={`ev-${item.id}`} className={styles.evaluationItem}>
                          <h4 className={styles.evaluationTitle}>{item.category}</h4>

                          <div className={styles.evaluationField}>
                            <small className={styles.evaluationLabel}>Evaluation basis</small>
                            <p className={styles.evaluationValue}>{item.evaluationBasis}</p>
                          </div>

                          <div className={styles.evaluationField}>
                            <small className={styles.evaluationLabel}>Importance</small>
                            <span
                              className={
                                item.priority === 'required'
                                  ? `${styles.evaluationValue} ${styles.importanceRequired}`
                                  : `${styles.evaluationValue} ${styles.importancePreferred}`
                              }
                            >
                              {item.priority === 'required' ? 'Required' : 'Preferred'}
                            </span>
                          </div>

                          <div className={styles.evaluationField}>
                            <small className={styles.evaluationLabel}>Source</small>
                            <span
                              className={
                                item.origin === 'ai'
                                  ? `${styles.evaluationValue} ${styles.sourceAi}`
                                  : `${styles.evaluationValue} ${styles.sourceHuman}`
                              }
                            >
                              {item.origin === 'ai' ? 'AI-generated from job signal' : 'Human reviewed update'}
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </article>
              </section>
            </div>

            <div className={styles.rightColumn}>
              <button
                type="button"
                className={styles.tabletInsightsToggle}
                onClick={() => setShowTabletInsights((current) => !current)}
                aria-expanded={showTabletInsights}
              >
                AI analysis panel
              </button>

              <aside className={`${styles.sideStack} ${showTabletInsights ? styles.sideStackOpen : ''}`}>
                <section className={styles.sidePanel}>
                  <header className={styles.sideHeader}>
                    <h2>AI analysis</h2>
                    <span className={styles.aiGeneratedFlag}>Assistant layer</span>
                  </header>

                  <div className={styles.insightRows}>
                    <div>
                      <small>Extraction confidence</small>
                      <strong>{averageConfidence}</strong>
                    </div>
                    <div>
                      <small>Requirements detected</small>
                      <strong>{requirements.length} structured criteria</strong>
                    </div>
                    <div>
                      <small>Ambiguities</small>
                      <strong>{openExceptions.length} item(s) requiring attention</strong>
                    </div>
                  </div>

                  <article className={styles.sideSubsection}>
                    <h3>Missing information</h3>
                    <ul>
                      {missingInformation.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className={styles.sideSubsection}>
                    <h3>Policy considerations</h3>
                    <ul>
                      {POLICY_CONSIDERATIONS.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                </section>

                <section className={styles.sidePanel}>
                  <header className={styles.sideHeader}>
                    <h2>Needs attention</h2>
                    <span className={styles.exceptionCount}>{openExceptions.length} open</span>
                  </header>

                  <div className={styles.exceptionList}>
                    {exceptions.map((item) => (
                      <article key={item.id} className={styles.exceptionItem}>
                        <div className={styles.exceptionTop}>
                          <strong>{item.title}</strong>
                          <span className={item.status === 'open' ? styles.exceptionOpen : styles.exceptionResolved}>
                            {item.status === 'open' ? 'Needs review' : item.status === 'resolved' ? 'Resolved' : 'Dismissed'}
                          </span>
                        </div>
                        <p>{item.detail}</p>
                        <div className={styles.exceptionActions}>
                          <button type="button" className={styles.textAction} onClick={() => updateExceptionStatus(item.id, 'resolved')}>Resolve</button>
                          <button type="button" className={styles.textAction} onClick={() => updateExceptionStatus(item.id, 'open')}>Edit</button>
                          <button type="button" className={styles.textAction} onClick={() => updateExceptionStatus(item.id, 'dismissed')}>Dismiss</button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className={styles.sidePanel}>
                  <header className={styles.sideHeader}>
                    <h2>Version & audit</h2>
                  </header>
                  <dl className={styles.auditList}>
                    <div><dt>Draft version</dt><dd>{draftVersion}</dd></div>
                    <div><dt>Generated</dt><dd>{generatedAt.toLocaleString()}</dd></div>
                    <div><dt>Last reviewed</dt><dd>{lastReviewedAt}</dd></div>
                    <div><dt>Generated by</dt><dd>VEYQOR AI</dd></div>
                  </dl>
                </section>
              </aside>
            </div>
          </div>

          <div className={styles.actionBar} role="group" aria-label="Criteria workflow actions">
            <div className={styles.validationStatus}>
              <span className={`${styles.statusDot} ${readyForValidation ? styles.statusReady : styles.statusBlocked}`} aria-hidden="true" />
              <div>
                <strong>{readyForValidation ? 'Ready for validation' : 'Review required'}</strong>
                <small>
                  {readyForValidation
                    ? 'All required criteria have been generated and reviewed.'
                    : `${openExceptions.length} exception(s) require attention before continuation.`}
                </small>
              </div>
              <p>Draft saved: {draftSavedAt}</p>
            </div>

            <div className={styles.actionRow}>
              <button type="button" className={styles.secondaryButton} onClick={() => router.push('/job-intake')}>Back</button>
              <button type="button" className={styles.secondaryButton} onClick={saveDraft}>Save draft</button>
              <button type="button" className={styles.secondaryButton} onClick={resolveAllExceptions} disabled={openExceptions.length === 0}>Resolve exceptions</button>
              <button type="button" className={styles.primaryButton} disabled={!readyForValidation} onClick={() => router.push('/criteria-approval')}>Continue to approval</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
