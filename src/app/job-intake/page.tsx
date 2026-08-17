'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockAuthGateway, type AuthSession } from '@/lib/auth/mockAuthGateway';
import styles from './page.module.css';

type IntakeMethod = 'paste' | 'upload' | 'structured';
type ProcessingStage = 'reading' | 'extracting' | 'gaps' | 'drafting';

type ExceptionItem = {
  id: string;
  title: string;
  detail: string;
  options: string[];
  material?: boolean;
  policy?: boolean;
};

type ConfidenceLevel = 'High confidence' | 'Medium confidence' | 'Requires confirmation';

type IntelligenceCapability = {
  label: string;
  level: 'required' | 'preferred';
  source: 'detected' | 'interpreted';
};

type SignalState = {
  objective: string;
  role: {
    title: string;
    seniority: string;
    function: string;
    employmentType: string;
    location: string;
    workArrangement: string;
  };
  capabilities: IntelligenceCapability[];
  experience: {
    minimum: string;
    domain: string;
    leadership: string;
    specific: string;
  };
  education?: string[];
  responsibilities: string[];
  constraints: string[];
  confidence: {
    role: ConfidenceLevel;
    capabilities: ConfidenceLevel;
    experience: ConfidenceLevel;
    constraints: ConfidenceLevel;
  };
};

const TENANT_STORAGE_KEY = 'veyqor.mock.tenant-context.v1';
const ORG_STORAGE_KEY = 'veyqor.mock.org-context.v1';
const CASE_CONTEXT_STORAGE_KEY = 'veyqor.mock.case-context.v1';

const SUPPORTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

const WORKFLOW_STEPS = ['Signal Intake', 'Criteria', 'Approval', 'Candidate Ingestion'];

const PROCESSING_STAGE_LABEL: Record<ProcessingStage, string> = {
  reading: 'Reading document',
  extracting: 'Extracting requirements',
  gaps: 'Identifying constraints',
  drafting: 'Preparing criteria',
};

const DEFAULT_EXCEPTIONS: ExceptionItem[] = [
  {
    id: 'work-arrangement',
    title: 'Work arrangement is unclear',
    detail: 'The source references both remote and office-based collaboration.',
    options: ['Remote', 'Hybrid', 'Office-based'],
    material: true,
  },
  {
    id: 'experience-floor',
    title: 'Experience requirement needs confirmation',
    detail: 'The signal mentions both senior and lead-level expectations.',
    options: ['4+ years', '6+ years', '8+ years'],
  },
  {
    id: 'policy-sensitive',
    title: 'Policy consideration',
    detail: 'One requirement may require additional review before use as a selection criterion.',
    options: ['Mark for policy review', 'Keep as informational context'],
    policy: true,
  },
];

function roleLabel(role: AuthSession['role']) {
  if (role === 'administrator') return 'Administrator';
  if (role === 'reviewer') return 'Reviewer';
  if (role === 'leadership') return 'Leadership/Oversight';
  return 'Recruitment Operator';
}

function TabIcon({ method }: { method: IntakeMethod }) {
  if (method === 'paste') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 4h8" />
        <path d="M9 4v3h6V4" />
        <rect x="6" y="6.5" width="12" height="14" rx="2" />
      </svg>
    );
  }

  if (method === 'upload') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 15V5" />
        <path d="M8.5 8.5L12 5l3.5 3.5" />
        <rect x="4" y="15" width="16" height="5" rx="1.5" />
      </svg>
    );
  }

  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 7h14" />
      <path d="M5 12h9" />
      <path d="M5 17h12" />
    </svg>
  );
}

export default function JobSignalIntakePage() {
  const router = useRouter();
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [session, setSession] = useState<AuthSession | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [method, setMethod] = useState<IntakeMethod>('paste');

  const [pasteText, setPasteText] = useState('');
  const [structuredRoleTitle, setStructuredRoleTitle] = useState('');
  const [structuredObjective, setStructuredObjective] = useState('');
  const [structuredArrangement, setStructuredArrangement] = useState('');

  const [processing, setProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('reading');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [dragging, setDragging] = useState(false);

  const [signals, setSignals] = useState<SignalState | null>(null);
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [exceptionAnswers, setExceptionAnswers] = useState<Record<string, string>>({});
  const [sourceType, setSourceType] = useState<'Pasted text' | 'Uploaded document' | 'Structured input' | ''>('');
  const [sourceName, setSourceName] = useState('');
  const [sourceTimestamp, setSourceTimestamp] = useState('');

  const [draftSavedAt, setDraftSavedAt] = useState<string>('');
  const [editingField, setEditingField] = useState<null | 'roleTitle' | 'minimumExperience' | 'location' | 'workArrangement'>(null);
  const [editDraftValue, setEditDraftValue] = useState('');

  const missingExceptionDecisions = useMemo(
    () => exceptions.filter((item) => !exceptionAnswers[item.id]).length,
    [exceptions, exceptionAnswers]
  );

  const hasSignalInput = useMemo(() => {
    if (method === 'paste') return pasteText.trim().length >= 80;
    if (method === 'upload') return Boolean(uploadFileName);
    return Boolean(structuredRoleTitle.trim() && structuredObjective.trim());
  }, [method, pasteText, structuredRoleTitle, structuredObjective, uploadFileName]);

  const canGenerateCriteria = Boolean(signals) && missingExceptionDecisions === 0 && !processing;

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

  useEffect(() => {
    const hasDraftSource = Boolean(pasteText.trim() || structuredRoleTitle.trim() || structuredObjective.trim() || uploadFileName);
    if (!hasDraftSource) {
      return;
    }

    const timer = window.setTimeout(() => {
      setDraftSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 650);

    return () => window.clearTimeout(timer);
  }, [pasteText, structuredRoleTitle, structuredObjective, uploadFileName]);

  function resetOutputPanels() {
    setSignals(null);
    setExceptions([]);
    setExceptionAnswers({});
  }

  function startProcessing(source: 'Pasted text' | 'Uploaded document' | 'Structured input', sourceLabel: string) {
    setProcessing(true);
    setUploadError('');
    setSourceType(source);
    setSourceName(sourceLabel);
    setSourceTimestamp(new Date().toISOString());

    const stages: ProcessingStage[] = ['reading', 'extracting', 'gaps', 'drafting'];
    stages.forEach((stage, index) => {
      window.setTimeout(() => setProcessingStage(stage), index * 550);
    });

    window.setTimeout(() => {
      setSignals({
        objective: structuredObjective.trim() || 'Hire an experienced product designer to lead platform redesign initiatives.',
        role: {
          title: structuredRoleTitle.trim() || 'Senior Product Designer',
          seniority: 'Senior',
          function: 'Product Design',
          employmentType: 'Full-time',
          location: 'Lagos or remote, timezone overlap required',
          workArrangement: structuredArrangement || 'Requires confirmation',
        },
        capabilities: [
          { label: 'Product systems design', level: 'required', source: 'detected' },
          { label: 'Cross-functional collaboration', level: 'required', source: 'detected' },
          { label: 'Accessibility-first design', level: 'required', source: 'interpreted' },
          { label: 'Design operations leadership', level: 'preferred', source: 'interpreted' },
          { label: 'Enterprise workflow portfolio', level: 'preferred', source: 'detected' },
        ],
        experience: {
          minimum: '6+ years product design experience',
          domain: 'SaaS platforms with governance workflows',
          leadership: 'Ability to influence cross-functional roadmap decisions',
          specific: 'Experience shipping design systems for multi-tenant products',
        },
        education: ['Degree-level education or equivalent evidence in product design'],
        responsibilities: [
          'Lead end-to-end design for high-impact workflow surfaces',
          'Translate hiring goals into measurable design outcomes',
          'Partner with product, engineering, and governance stakeholders',
        ],
        constraints: [
          'Portfolio evidence required for enterprise product workflows',
          'Timezone overlap with West Africa operations expected',
        ],
        confidence: {
          role: 'High confidence',
          capabilities: 'High confidence',
          experience: 'Medium confidence',
          constraints: 'Requires confirmation',
        },
      });
      setExceptions(DEFAULT_EXCEPTIONS);
      setExceptionAnswers({});
      setProcessing(false);
    }, 2300);
  }

  function processUpload(file: File) {
    if (!SUPPORTED_TYPES.includes(file.type)) {
      setUploadError('This file type is not supported. Use PDF, DOCX, or TXT.');
      setUploadFileName('');
      resetOutputPanels();
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      setUploadError('This document is too large to process in one step. Please upload a smaller source document.');
      setUploadFileName('');
      resetOutputPanels();
      return;
    }

    setUploadFileName(file.name);
    resetOutputPanels();
    startProcessing('Uploaded document', file.name);
  }

  function handleGenerateCriteria() {
    if (!canGenerateCriteria) {
      return;
    }

    const sourceMoment = sourceTimestamp ? new Date(sourceTimestamp) : new Date();
    const hh = `${sourceMoment.getHours()}`.padStart(2, '0');
    const mm = `${sourceMoment.getMinutes()}`.padStart(2, '0');
    const generatedCaseId = `Case #VQ-${hh}${mm}`;
    const jobTitle = signals?.role.title?.trim() || structuredRoleTitle.trim() || 'Senior Frontend Engineer';

    window.localStorage.setItem(
      CASE_CONTEXT_STORAGE_KEY,
      JSON.stringify({
        jobTitle,
        caseId: generatedCaseId,
      })
    );

    router.push('/criteria-editor');
  }

  function beginEdit(field: 'roleTitle' | 'minimumExperience' | 'location' | 'workArrangement', value: string) {
    setEditingField(field);
    setEditDraftValue(value);
  }

  function cancelEdit() {
    setEditingField(null);
    setEditDraftValue('');
  }

  function saveInlineEdit() {
    if (!signals || !editingField) {
      return;
    }

    const nextValue = editDraftValue.trim();
    if (!nextValue) {
      return;
    }

    setSignals((current) => {
      if (!current) {
        return current;
      }

      if (editingField === 'roleTitle') {
        return { ...current, role: { ...current.role, title: nextValue } };
      }

      if (editingField === 'location') {
        return { ...current, role: { ...current.role, location: nextValue } };
      }

      if (editingField === 'workArrangement') {
        return { ...current, role: { ...current.role, workArrangement: nextValue } };
      }

      return { ...current, experience: { ...current.experience, minimum: nextValue } };
    });

    setDraftSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setEditingField(null);
    setEditDraftValue('');
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
          <Image src="/Untitled design - 2026-08-10T155155.182.png" alt="Veyqor" width={146} height={38} className={styles.mark} priority />
          <div className={styles.topMeta}>
            <span className={styles.contextLabel}>Working in</span>
            <strong>{orgName}</strong>
            <small>{tenantName} · {roleLabel(session.role)}</small>
          </div>
        </header>

        <section className={styles.headerBlock}>
          <p className={styles.kicker}>Job Intake</p>
          <h1>Start with the hiring signal</h1>
          <p>
            Provide the available hiring information and VEYQOR will extract the requirements, identify gaps, and prepare
            the criteria for review.
          </p>

          <div className={styles.stepper} aria-label="Workflow progress">
            {WORKFLOW_STEPS.map((step, index) => (
              <div key={step} className={`${styles.step} ${index === 0 ? styles.stepActive : ''}`}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.workspace}>
          <header className={styles.workspaceHeader}>
            <h2>How would you like to provide the hiring signal?</h2>
            <p>Start with what you have. VEYQOR structures the rest.</p>
          </header>

          <div className={styles.methodTabs} role="tablist" aria-label="Signal input method">
            {([
              ['paste', 'Paste text', 'Paste hiring information'],
              ['upload', 'Upload', 'Upload a document'],
              ['structured', 'Structured input', 'Provide key details'],
            ] as const).map(([id, label, hint]) => (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={method === id}
                className={`${styles.methodTab} ${method === id ? styles.methodTabActive : ''}`}
                onClick={() => {
                  setMethod(id);
                  setUploadError('');
                }}
              >
                <span className={styles.tabTop}><TabIcon method={id} /> {label}</span>
                <small>{hint}</small>
              </button>
            ))}
          </div>

          {method === 'paste' ? (
            <section className={styles.inputSurface}>
              <label htmlFor="paste-signal" className={styles.inputLabel}>Paste hiring information</label>
              <p className={styles.inputHint}>
                VEYQOR will extract role requirements, skills, experience, constraints, and other relevant signals automatically.
              </p>
              <textarea
                id="paste-signal"
                value={pasteText}
                onChange={(event) => {
                  setPasteText(event.target.value);
                  setUploadError('');
                }}
                className={styles.textarea}
                placeholder="Paste the hiring brief, job description, or recruitment request here..."
              />
              <div className={styles.surfaceActions}>
                <span>{pasteText.trim().length ? `${pasteText.trim().length} characters captured` : 'No signal captured yet'}</span>
                <button
                  type="button"
                  className={styles.analysisButton}
                  disabled={processing || pasteText.trim().length < 80}
                  onClick={() => startProcessing('Pasted text', 'Pasted job signal')}
                >
                  Analyse signal
                </button>
              </div>
            </section>
          ) : null}

          {method === 'upload' ? (
            <section className={styles.inputSurface}>
              <label className={styles.inputLabel}>Upload hiring document</label>
              <div
                className={`${styles.uploadZone} ${dragging ? styles.uploadZoneActive : ''}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  const file = event.dataTransfer.files?.[0];
                  if (file) processUpload(file);
                }}
              >
                <strong>Drop your hiring document here</strong>
                <p>PDF, DOCX, or TXT supported</p>
                <button
                  type="button"
                  className={styles.analysisButton}
                  onClick={() => uploadInputRef.current?.click()}
                >
                  Browse files
                </button>
                <input
                  ref={uploadInputRef}
                  type="file"
                  className={styles.hiddenInput}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) processUpload(file);
                  }}
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                />
                {uploadFileName ? <small className={styles.uploadMeta}>Selected source: {uploadFileName}</small> : null}
              </div>
              {uploadError ? (
                <p className={styles.uploadError} role="alert" aria-live="assertive">{uploadError}</p>
              ) : null}
            </section>
          ) : null}

          {method === 'structured' ? (
            <section className={styles.inputSurface}>
              <label className={styles.inputLabel}>Provide key details</label>
              <p className={styles.inputHint}>Only the essentials are required. VEYQOR will infer and prepare the rest.</p>
              <div className={styles.structuredGrid}>
                <label>
                  <span>Role title</span>
                  <input
                    value={structuredRoleTitle}
                    onChange={(event) => setStructuredRoleTitle(event.target.value)}
                    placeholder="e.g. Senior Product Designer"
                  />
                </label>
                <label>
                  <span>Work arrangement</span>
                  <input
                    value={structuredArrangement}
                    onChange={(event) => setStructuredArrangement(event.target.value)}
                    placeholder="Remote, hybrid, or office-based"
                  />
                </label>
                <label className={styles.structuredWide}>
                  <span>Hiring objective</span>
                  <textarea
                    value={structuredObjective}
                    onChange={(event) => setStructuredObjective(event.target.value)}
                    placeholder="Summarize what this role is expected to deliver"
                  />
                </label>
              </div>
              <div className={styles.surfaceActions}>
                <span>{structuredRoleTitle || structuredObjective ? 'Structured signal captured' : 'No signal captured yet'}</span>
                <button
                  type="button"
                  className={styles.analysisButton}
                  disabled={processing || !structuredRoleTitle.trim() || !structuredObjective.trim()}
                  onClick={() => startProcessing('Structured input', 'Structured hiring details')}
                >
                  Analyse signal
                </button>
              </div>
            </section>
          ) : null}

          {processing ? (
            <section className={styles.processingPanel} role="status" aria-live="polite">
              <div className={styles.processingTop}>
                <strong>Processing hiring signal</strong>
                <span className={styles.aiBadge}>AI activity</span>
              </div>
              <p>VEYQOR is extracting relevant requirements and identifying potential gaps.</p>
              <ul>
                {(['reading', 'extracting', 'gaps', 'drafting'] as ProcessingStage[]).map((stage) => {
                  const active = stage === processingStage;
                  return (
                    <li key={stage} className={active ? styles.stageActive : ''}>
                      <span className={styles.stageDot} />
                      {PROCESSING_STAGE_LABEL[stage]}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {signals ? (
            <section className={styles.detectedGrid}>
              <article className={`${styles.detectedPanel} ${styles.intelligencePanel}`}>
                <header className={styles.intelligenceHeader}>
                  <div>
                    <h3>Extracted hiring intelligence</h3>
                    <p>VEYQOR identified the following requirements from the provided hiring signal. Review any exceptions before generating criteria.</p>
                  </div>
                  <div className={styles.aiCompleteStatus}>
                    <span className={styles.aiCompleteIcon} aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3l1.6 3.9L18 8.5l-3.3 2.5 1.2 4-3.6-2.3-3.6 2.3 1.2-4L6 8.5l4.4-1.6L12 3z" />
                      </svg>
                    </span>
                    <div>
                      <strong>AI analysis complete</strong>
                      <small>{sourceType} · {new Date(sourceTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                  </div>
                </header>

                <div className={styles.intelligenceBody}>
                  <section className={styles.intelGroup}>
                    <header>
                      <h4>Role</h4>
                      <span className={styles.confidencePill}>{signals.confidence.role}</span>
                    </header>
                    <div className={styles.intelRows}>
                      <div className={styles.intelRow}>
                        <small>Job title</small>
                        <div className={styles.intelValueWrap}>
                          {editingField === 'roleTitle' ? (
                            <div className={styles.inlineEditor}>
                              <input value={editDraftValue} onChange={(event) => setEditDraftValue(event.target.value)} aria-label="Edit job title" />
                              <button type="button" className={styles.inlineActionPrimary} onClick={saveInlineEdit}>Save</button>
                              <button type="button" className={styles.inlineAction} onClick={cancelEdit}>Cancel</button>
                            </div>
                          ) : (
                            <>
                              <strong>{signals.role.title}</strong>
                              <button type="button" className={styles.inlineEditTrigger} onClick={() => beginEdit('roleTitle', signals.role.title)}>Edit</button>
                            </>
                          )}
                          <span className={styles.originTag}>Detected</span>
                        </div>
                      </div>
                      <div className={styles.intelRow}><small>Seniority</small><strong>{signals.role.seniority}</strong></div>
                      <div className={styles.intelRow}><small>Function</small><strong>{signals.role.function}</strong></div>
                      <div className={styles.intelRow}><small>Employment type</small><strong>{signals.role.employmentType}</strong></div>
                      <div className={styles.intelRow}>
                        <small>Location</small>
                        <div className={styles.intelValueWrap}>
                          {editingField === 'location' ? (
                            <div className={styles.inlineEditor}>
                              <input value={editDraftValue} onChange={(event) => setEditDraftValue(event.target.value)} aria-label="Edit location" />
                              <button type="button" className={styles.inlineActionPrimary} onClick={saveInlineEdit}>Save</button>
                              <button type="button" className={styles.inlineAction} onClick={cancelEdit}>Cancel</button>
                            </div>
                          ) : (
                            <>
                              <strong>{signals.role.location}</strong>
                              <button type="button" className={styles.inlineEditTrigger} onClick={() => beginEdit('location', signals.role.location)}>Edit</button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className={styles.intelRow}>
                        <small>Work arrangement</small>
                        <div className={styles.intelValueWrap}>
                          {editingField === 'workArrangement' ? (
                            <div className={styles.inlineEditor}>
                              <input value={editDraftValue} onChange={(event) => setEditDraftValue(event.target.value)} aria-label="Edit work arrangement" />
                              <button type="button" className={styles.inlineActionPrimary} onClick={saveInlineEdit}>Save</button>
                              <button type="button" className={styles.inlineAction} onClick={cancelEdit}>Cancel</button>
                            </div>
                          ) : (
                            <>
                              <strong>{signals.role.workArrangement}</strong>
                              <button type="button" className={styles.inlineEditTrigger} onClick={() => beginEdit('workArrangement', signals.role.workArrangement)}>Edit</button>
                            </>
                          )}
                          <span className={styles.originTag}>AI interpreted</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className={styles.intelGroup}>
                    <header>
                      <h4>Required capabilities</h4>
                      <span className={styles.confidencePill}>{signals.confidence.capabilities}</span>
                    </header>
                    <div className={styles.capabilitySplit}>
                      <div>
                        <p className={styles.capabilityHeading}>Required</p>
                        <div className={styles.capabilityTags}>
                          {signals.capabilities.filter((item) => item.level === 'required').map((item) => (
                            <span key={item.label} className={styles.capabilityTagRequired}>
                              {item.label}
                              <em>{item.source === 'detected' ? 'Detected' : 'AI interpreted'}</em>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className={styles.capabilityHeading}>Preferred</p>
                        <div className={styles.capabilityTags}>
                          {signals.capabilities.filter((item) => item.level === 'preferred').map((item) => (
                            <span key={item.label} className={styles.capabilityTagPreferred}>
                              {item.label}
                              <em>{item.source === 'detected' ? 'Detected' : 'AI interpreted'}</em>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className={styles.intelGroup}>
                    <header>
                      <h4>Experience</h4>
                      <span className={styles.confidencePill}>{signals.confidence.experience}</span>
                    </header>
                    <div className={styles.intelRows}>
                      <div className={styles.intelRow}>
                        <small>Minimum experience</small>
                        <div className={styles.intelValueWrap}>
                          {editingField === 'minimumExperience' ? (
                            <div className={styles.inlineEditor}>
                              <input value={editDraftValue} onChange={(event) => setEditDraftValue(event.target.value)} aria-label="Edit minimum experience" />
                              <button type="button" className={styles.inlineActionPrimary} onClick={saveInlineEdit}>Save</button>
                              <button type="button" className={styles.inlineAction} onClick={cancelEdit}>Cancel</button>
                            </div>
                          ) : (
                            <>
                              <strong>{signals.experience.minimum}</strong>
                              <button type="button" className={styles.inlineEditTrigger} onClick={() => beginEdit('minimumExperience', signals.experience.minimum)}>Edit</button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className={styles.intelRow}><small>Domain</small><strong>{signals.experience.domain}</strong></div>
                      <div className={styles.intelRow}><small>Leadership requirements</small><strong>{signals.experience.leadership}</strong></div>
                      <div className={styles.intelRow}><small>Specific role experience</small><strong>{signals.experience.specific}</strong></div>
                    </div>
                  </section>

                  {signals.education && signals.education.length ? (
                    <section className={styles.intelGroup}>
                      <header>
                        <h4>Education & credentials</h4>
                      </header>
                      <ul className={styles.listRows}>
                        {signals.education.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {signals.responsibilities.length ? (
                    <section className={styles.intelGroup}>
                      <header>
                        <h4>Responsibilities</h4>
                      </header>
                      <ul className={styles.listRows}>
                        {signals.responsibilities.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {signals.constraints.length ? (
                    <section className={styles.intelGroup}>
                      <header>
                        <h4>Constraints & conditions</h4>
                        <span className={`${styles.confidencePill} ${styles.confidenceMuted}`}>{signals.confidence.constraints}</span>
                      </header>
                      <ul className={styles.listRows}>
                        {signals.constraints.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>

                <div className={styles.objectiveBand}>
                  <small>Hiring objective</small>
                  <strong>{signals.objective}</strong>
                </div>
              </article>

              <aside className={styles.provenancePanel}>
                <h4>Source provenance</h4>
                <dl>
                  <div><dt>Source</dt><dd>{sourceType}</dd></div>
                  <div><dt>Name</dt><dd>{sourceName}</dd></div>
                  <div><dt>Operator</dt><dd>{session.fullName}</dd></div>
                  <div><dt>Captured</dt><dd>{new Date(sourceTimestamp).toLocaleString()}</dd></div>
                </dl>
              </aside>
            </section>
          ) : null}

          {exceptions.length ? (
            <section className={styles.exceptionsPanel}>
              <header>
                <h3>Needs attention</h3>
                <p>{missingExceptionDecisions} item(s) require confirmation before criteria can be generated.</p>
              </header>

              <div className={styles.exceptionList}>
                {exceptions.map((item) => (
                  <article key={item.id} className={styles.exceptionItem}>
                    <div className={styles.exceptionTop}>
                      <strong>{item.title}</strong>
                      <div className={styles.exceptionBadges}>
                        {item.material ? <span className={styles.materialBadge}>Material decision</span> : null}
                        {item.policy ? <span className={styles.policyBadge}>Policy consideration</span> : null}
                      </div>
                    </div>
                    <p>{item.detail}</p>
                    <small className={styles.exceptionActionHint}>Select one option to confirm this item.</small>
                    <div className={styles.optionRow}>
                      {item.options.map((option) => {
                        const selected = exceptionAnswers[item.id] === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            className={`${styles.optionButton} ${selected ? styles.optionButtonActive : ''}`}
                            onClick={() => setExceptionAnswers((current) => ({ ...current, [item.id]: option }))}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <div className={styles.footerActions} role="group" aria-label="Workflow actions">
            <div className={`${styles.draftMeta} ${draftSavedAt ? styles.draftMetaSaved : ''}`}>
              <span className={styles.draftStatusDot} aria-hidden="true" />
              <span>{draftSavedAt ? `Draft saved at ${draftSavedAt}` : 'Draft not saved yet'}</span>
            </div>
            <div className={styles.actionRow}>
              <button type="button" className={`${styles.secondaryButton} ${styles.backButton}`} onClick={() => router.push('/dashboard')}>Back</button>
              <button
                type="button"
                className={styles.clearButton}
                onClick={() => {
                  setPasteText('');
                  setStructuredRoleTitle('');
                  setStructuredObjective('');
                  setStructuredArrangement('');
                  setUploadFileName('');
                  setUploadError('');
                  resetOutputPanels();
                }}
              >
                Clear
              </button>
              <button type="button" className={`${styles.secondaryButton} ${styles.saveButton}`} disabled={!hasSignalInput}>Save draft</button>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={!canGenerateCriteria}
                onClick={handleGenerateCriteria}
              >
                Generate criteria
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
