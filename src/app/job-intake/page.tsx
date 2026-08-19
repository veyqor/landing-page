'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockAuthGateway, type AuthSession } from '@/lib/auth/mockAuthGateway';
import styles from './page.module.css';

type IntakeMethod = 'paste' | 'voice' | 'upload' | 'structured';
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

type NavItem = {
  id: string;
  label: string;
  href: string;
  active?: boolean;
};

type EvidenceState = {
  title: string;
  why: string;
  excerpt: string;
  confidence: string;
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

function TabIcon({ method }: { method: IntakeMethod }) {
  if (method === 'voice') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="22"/>
      </svg>
    );
  }

  if (method === 'paste') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 4h8" />
        <path d="M9 4v3h6V4" />
        <rect x="6" y="6.5" width="12" height="14" rx="2" />
      </svg>
    );
  }

  if (method === 'upload') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 15V5" />
        <path d="M8.5 8.5L12 5l3.5 3.5" />
        <rect x="4" y="15" width="16" height="5" rx="1.5" />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 7h14" />
      <path d="M5 12h9" />
      <path d="M5 17h12" />
    </svg>
  );
}

function ShellIcon({ id }: { id: NavItem['id'] }) {
  if (id === 'dashboard') return <span aria-hidden="true">⌂</span>;
  if (id === 'cases') return <span aria-hidden="true">◫</span>;
  if (id === 'review') return <span aria-hidden="true">◎</span>;
  if (id === 'notifications') return <span aria-hidden="true">◉</span>;
  if (id === 'audit') return <span aria-hidden="true">◌</span>;
  return <span aria-hidden="true">⚙</span>;
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
  const [sourceType, setSourceType] = useState<'Pasted text' | 'Uploaded document' | 'Structured input' | 'Voice note' | ''>('');
  const [sourceName, setSourceName] = useState('');
  const [sourceTimestamp, setSourceTimestamp] = useState('');

  const [draftSavedAt, setDraftSavedAt] = useState<string>('');
  const [editingField, setEditingField] = useState<null | 'roleTitle' | 'minimumExperience' | 'location' | 'workArrangement'>(null);
  const [editDraftValue, setEditDraftValue] = useState('');
  const [generating, setGenerating] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [editingDecisionId, setEditingDecisionId] = useState<string | null>(null);
  const [activeEvidence, setActiveEvidence] = useState<EvidenceState | null>(null);
  const [expandedGroups, setExpandedGroups] = useState({
    required: false,
    preferred: false,
    experience: false,
    responsibilities: false,
    education: false,
    constraints: false,
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  function toggleVoiceRecording() {
    if (isRecording) {
      setIsRecording(false);
      if (recognition) {
        try { recognition.stop(); } catch (e) {}
      }
    } else {
      setIsRecording(true);
      if (method !== 'voice' && method !== 'paste') {
        setMethod('voice');
      }

      const SpeechRecognition = (typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
      if (SpeechRecognition) {
        try {
          const recog = new SpeechRecognition();
          recog.continuous = true;
          recog.interimResults = true;
          recog.onresult = (event: any) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript;
            }
            if (transcript.trim()) {
              setPasteText((prev) => (prev ? `${prev} ${transcript}` : transcript));
            }
          };
          recog.onerror = () => {
            simulateVoiceDictation();
          };
          recog.start();
          setRecognition(recog);
        } catch (e) {
          simulateVoiceDictation();
        }
      } else {
        simulateVoiceDictation();
      }
    }
  }

  function simulateVoiceDictation() {
    const sampleSentences = [
      'We are looking for a Senior Frontend Engineer with strong TypeScript and React experience.',
      'This role requires ownership of client platform UI and collaboration with backend API teams.',
      'Minimum of 5 years software engineering experience in a fast-paced environment is required.',
      'Hybrid work arrangement with 2 days in office and remote flexibility.',
    ];
    let sentenceIndex = 0;
    const interval = setInterval(() => {
      if (sentenceIndex < sampleSentences.length) {
        const sentence = sampleSentences[sentenceIndex];
        setPasteText((prev) => (prev ? `${prev}\n${sentence}` : sentence));
        sentenceIndex++;
      } else {
        clearInterval(interval);
      }
    }, 1200);
  }

  const missingExceptionDecisions = useMemo(
    () => exceptions.filter((item) => !exceptionAnswers[item.id]).length,
    [exceptions, exceptionAnswers]
  );

  const hasSignalInput = useMemo(() => {
    if (method === 'paste' || method === 'voice') return pasteText.trim().length >= 40;
    if (method === 'upload') return Boolean(uploadFileName);
    return Boolean(structuredRoleTitle.trim() && structuredObjective.trim());
  }, [method, pasteText, structuredRoleTitle, structuredObjective, uploadFileName]);

  const canGenerateCriteria = Boolean(signals) && missingExceptionDecisions === 0 && !processing && !generating;

  const requiredCapabilities = useMemo(
    () => signals?.capabilities.filter((item) => item.level === 'required') ?? [],
    [signals]
  );

  const preferredCapabilities = useMemo(
    () => signals?.capabilities.filter((item) => item.level === 'preferred') ?? [],
    [signals]
  );

  const resolvedDecisions = useMemo(
    () => exceptions.filter((item) => Boolean(exceptionAnswers[item.id])).length,
    [exceptionAnswers, exceptions]
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

  useEffect(() => {
    if (!mobileNavOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileNavOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!activeEvidence) {
      return;
    }

    function onEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActiveEvidence(null);
      }
    }

    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [activeEvidence]);

  function resetOutputPanels() {
    setSignals(null);
    setExceptions([]);
    setExceptionAnswers({});
    setEditingDecisionId(null);
    setActiveEvidence(null);
    setExpandedGroups({
      required: false,
      preferred: false,
      experience: false,
      responsibilities: false,
      education: false,
      constraints: false,
    });
  }

  function openEvidencePanel(payload: EvidenceState) {
    setActiveEvidence(payload);
  }

  function toggleGroup(key: keyof typeof expandedGroups) {
    setExpandedGroups((current) => ({ ...current, [key]: !current[key] }));
  }

  function clearIntake() {
    setPasteText('');
    setStructuredRoleTitle('');
    setStructuredObjective('');
    setStructuredArrangement('');
    setUploadFileName('');
    setUploadError('');
    setDraftSavedAt('');
    resetOutputPanels();
  }

  function startProcessing(source: 'Pasted text' | 'Uploaded document' | 'Structured input' | 'Voice note', sourceLabel: string) {
    if (processing) return;

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

    setGenerating(true);

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

    window.setTimeout(() => {
      router.push('/criteria-editor');
    }, 300);
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
      <div className={`${styles.appShell} ${sidebarCollapsed ? styles.appShellCollapsed : ''}`}>
        <header className={styles.mobileHeader}>
          <button
            type="button"
            className={styles.mobileMenuButton}
            aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileNavOpen((current) => !current)}
            aria-expanded={mobileNavOpen}
            aria-controls="job-intake-mobile-drawer"
          >
            <span className={styles.mobileMenuBars} aria-hidden="true" />
          </button>
          <Image src="/Untitled design - 2026-08-10T155155.182.png" alt="Veyqor" width={130} height={34} className={styles.mobileMark} priority />
          <button type="button" className={styles.mobileAvatarButton} aria-label="Account menu">
            {session.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('')}
          </button>
        </header>

        <div className={`${styles.mobileBackdrop} ${mobileNavOpen ? styles.mobileBackdropOpen : ''}`} onClick={() => setMobileNavOpen(false)} aria-hidden="true" />

        <aside
          id="job-intake-mobile-drawer"
          className={`${styles.mobileDrawer} ${mobileNavOpen ? styles.mobileDrawerOpen : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div className={styles.mobileDrawerTop}>
            <Image src="/logo.png" alt="Veyqor" width={124} height={32} className={styles.mobileDrawerMark} />
            <button type="button" className={styles.mobileDrawerClose} onClick={() => setMobileNavOpen(false)} aria-label="Close navigation menu">×</button>
          </div>

          <div className={styles.mobileWorkspace}>
            <small>Workspace context</small>
            <strong>{orgName}</strong>
            <p>{tenantName}</p>
          </div>

          <nav className={styles.mobileNav} aria-label="Mobile primary navigation">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className={`${styles.navItem} ${item.id === 'cases' ? styles.navItemActive : ''}`}
                onClick={() => setMobileNavOpen(false)}
              >
                <span className={styles.navIcon}><ShellIcon id={item.id} /></span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </aside>

        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop}>
            <div className={styles.brandRow}>
              <span className={styles.brandShield} aria-hidden="true">◈</span>
              {!sidebarCollapsed ? <Image src="/logo.png" alt="Veyqor" width={124} height={32} className={styles.sidebarMark} /> : null}
            </div>

            {!sidebarCollapsed ? (
              <div className={styles.workspaceContext}>
                <small>Workspace context</small>
                <strong>{orgName}</strong>
                <p>{tenantName}</p>
              </div>
            ) : null}
          </div>

          <nav className={styles.sidebarNav} aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              <a key={item.id} href={item.href} className={`${styles.navItem} ${item.id === 'cases' ? styles.navItemActive : ''}`} title={sidebarCollapsed ? item.label : undefined}>
                <span className={styles.navIcon}><ShellIcon id={item.id} /></span>
                {!sidebarCollapsed ? <span>{item.label}</span> : null}
              </a>
            ))}
          </nav>

          <div className={styles.sidebarFoot}>
            <button
              type="button"
              className={styles.collapseButton}
              onClick={() => setSidebarCollapsed((current) => !current)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <span aria-hidden="true">{sidebarCollapsed ? '»' : '«'}</span>
              {!sidebarCollapsed ? <span>{sidebarCollapsed ? 'Expand' : 'Collapse'}</span> : null}
            </button>
          </div>
        </aside>

        <div className={styles.mainWrap}>
          <header className={styles.topHeader}>
            <div className={styles.topHeaderLeft}>
              <button
                type="button"
                className={styles.collapseButtonInline}
                onClick={() => setSidebarCollapsed((current) => !current)}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? '»' : '«'}
              </button>
              <Image src="/Untitled design - 2026-08-10T155155.182.png" alt="Veyqor" width={134} height={34} className={styles.mark} priority />
            </div>

            <div className={styles.topHeaderRight}>
              <button type="button" className={styles.iconButton} aria-label="Notifications">◦</button>
              <div className={styles.topMeta}>
                <span className={styles.contextLabel}>Workspace</span>
                <strong>{orgName}</strong>
                <small>{tenantName}</small>
              </div>
              <button type="button" className={styles.userButton} aria-label="User menu">
                <span className={styles.avatar}>{session.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                <span className={styles.userMeta}>
                  <strong>{session.fullName}</strong>
                  <small>{roleLabel(session.role)}</small>
                </span>
                <span className={styles.userCaret} aria-hidden="true">⌄</span>
              </button>
            </div>
          </header>

          <section className={styles.contentContainer}>
            <header className={styles.pageHeader}>
              <div>
                <p className={styles.kicker}>Job Intake</p>
                <h1>Let&apos;s start with the hiring signal</h1>
                <p className={styles.pageCopy}>Provide the hiring information you have and VEYQOR will do the rest.</p>
              </div>

              <aside className={styles.aiInsight} aria-label="Automation insight">
                <span className={styles.aiIcon} aria-hidden="true">✧</span>
                <p>VEYQOR will automatically extract key requirements, identify gaps, and prepare the criteria for your review.</p>
              </aside>
            </header>

            <div className={styles.stepper} aria-label="Workflow progress">
              {WORKFLOW_STEPS.map((step, index) => (
                <div key={step} className={`${styles.step} ${index === 0 ? styles.stepActive : ''}`}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>

            <section className={styles.workspace}>
              <header className={styles.workspaceHeader}>
                <h2>How would you like to provide the hiring signal?</h2>
                <p>Start with what you have. VEYQOR structures the rest.</p>
              </header>

              <div className={styles.methodTabs} role="tablist" aria-label="Signal input method">
                {([
                  ['paste', 'Paste text', 'Paste hiring information'],
                  ['voice', 'Voice note', 'Dictate hiring request'],
                  ['upload', 'Upload document', 'Upload a file (PDF, DOCX, TXT)'],
                  ['structured', 'Structured input', 'Provide key details step-by-step'],
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
                    {method === id ? <span className={styles.methodCheck} aria-hidden="true">✓</span> : null}
                  </button>
                ))}
              </div>

              {method === 'paste' || method === 'voice' ? (
                <section className={styles.inputSurface}>
                  <div className={styles.micHeaderRow}>
                    <div>
                      <label htmlFor="paste-signal" className={styles.inputLabel}>
                        {method === 'voice' ? 'Voice note & dictation' : 'Paste hiring information'}
                      </label>
                      <p className={styles.inputHint}>
                        {method === 'voice'
                          ? 'Speak your hiring requirements. VEYQOR transcribes and structures your voice note automatically.'
                          : 'Paste your job description or speak directly using the microphone.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      className={`${styles.micButton} ${isRecording ? styles.micButtonActive : ''}`}
                      onClick={toggleVoiceRecording}
                    >
                      <span>🎙️</span>
                      <span>{isRecording ? 'Stop recording' : 'Record voice note'}</span>
                    </button>
                  </div>

                  {isRecording && (
                    <div className={styles.recordingBanner}>
                      <div className={styles.recordingLeft}>
                        <span className={styles.recDot} />
                        <span>Recording voice note... Speak your hiring requirements clearly.</span>
                      </div>
                      <div className={styles.audioWave}>
                        <span className={styles.audioBar} />
                        <span className={styles.audioBar} />
                        <span className={styles.audioBar} />
                        <span className={styles.audioBar} />
                      </div>
                    </div>
                  )}

                  <textarea
                    id="paste-signal"
                    value={pasteText}
                    onChange={(event) => {
                      setPasteText(event.target.value);
                      setUploadError('');
                    }}
                    className={styles.textarea}
                    placeholder={
                      method === 'voice'
                        ? 'Click the microphone button to start recording your voice note. Transcribed text will appear here...'
                        : 'Paste anything here... job description, role brief, requirements, goals, constraints, or dictate using the mic.'
                    }
                  />
                  <div className={styles.inputMetaRow}>
                    <p className={styles.securityLine}><span aria-hidden="true">◈</span> Your data is secure and confidential</p>
                    <small className={styles.charCount}>{pasteText.length} / 5000</small>
                  </div>
                  <div className={styles.surfaceActions}>
                    <span>{pasteText.trim().length ? `${pasteText.trim().length} characters captured` : 'No signal captured yet'}</span>
                    <button
                      type="button"
                      className={styles.analysisButton}
                      disabled={processing || pasteText.trim().length < 40}
                      onClick={() => startProcessing(method === 'voice' ? 'Voice note' : 'Pasted text', method === 'voice' ? 'Voice note intake' : 'Pasted job signal')}
                    >
                      {processing ? 'Analysing...' : 'Analyse signal'}
                    </button>
                  </div>
                </section>
              ) : null}

              {method === 'upload' ? (
                <section className={styles.inputSurface}>
                  <label className={styles.inputLabel}>Upload hiring document</label>
                  <p className={styles.inputHint}>Upload a source document and VEYQOR will extract the hiring signal automatically.</p>
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
                  <p className={styles.inputHint}>Only the essentials are required. VEYQOR infers and prepares the rest.</p>
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
                      {processing ? 'Analysing...' : 'Analyse signal'}
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

              <div className={styles.footerActions} role="group" aria-label="Workflow actions">
                <div className={`${styles.draftMeta} ${draftSavedAt ? styles.draftMetaSaved : ''}`}>
                  <span className={styles.draftStatusDot} aria-hidden="true" />
                  <span>{draftSavedAt ? `Draft will be saved automatically · Last saved ${draftSavedAt}` : 'Draft will be saved automatically'}</span>
                </div>
                <div className={styles.actionRow}>
                  <button type="button" className={styles.clearButton} onClick={clearIntake}>Clear</button>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    disabled={!canGenerateCriteria}
                    onClick={handleGenerateCriteria}
                  >
                    {generating ? 'Generating...' : 'Generate criteria →'}
                  </button>
                </div>
              </div>
            </section>

            {/* ════════════════════════════════════════════
                EXTRACTED HIRING INTELLIGENCE SECTION
                Lives as a sibling to the workspace section
                ════════════════════════════════════════════ */}
            {signals ? (
              <section className={styles.intelligenceSection}>

                {/* ── A. Section header / Role identity ── */}
                <header className={styles.intelligenceIntro}>
                  <div className={styles.intelligenceIntroTop}>
                    <p className={styles.intelligenceEyebrow}>Hiring Intelligence</p>
                    {exceptions.length ? (
                      <span className={`${styles.decisionProgress} ${resolvedDecisions === exceptions.length ? styles.decisionProgressComplete : ''}`}>
                        {resolvedDecisions === exceptions.length ? '✓ ' : ''}{resolvedDecisions} of {exceptions.length} decisions resolved
                      </span>
                    ) : null}
                  </div>
                  <div className={styles.roleIdentityRow}>
                    <h3>{signals.role.title}</h3>
                    <button
                      type="button"
                      className={styles.viewSourceLink}
                      onClick={() => openEvidencePanel({
                        title: signals.role.title,
                        why: 'This role identity was derived from the uploaded hiring signal.',
                        excerpt: 'The source references a senior product design role for enterprise workflow redesign and cross-functional leadership.',
                        confidence: signals.confidence.role,
                      })}
                    >
                      View source
                    </button>
                  </div>
                  <p className={styles.roleIdentityMeta}>{signals.role.function} · {signals.role.seniority} · {signals.role.employmentType} · {signals.role.location}</p>

                  {/* ── Executive summary ── */}
                  <p className={styles.executiveSummary}>
                    Veyqor understands you need an experienced {signals.role.function.toLowerCase()} to lead platform redesign initiatives, particularly high-impact enterprise workflow surfaces and cross-functional product decisions.
                  </p>
                </header>

                {/* ── B. Decisions needed ── */}
                {exceptions.length ? (
                  <section className={styles.decisionsSection} aria-label="Decisions needed">
                    <header className={styles.decisionsHeader}>
                      <div>
                        <h4>Decisions needed</h4>
                        <p>Resolve these items so Veyqor can generate candidate evaluation criteria.</p>
                      </div>
                      <span className={styles.decisionsBadge}>{exceptions.length - resolvedDecisions} items remaining</span>
                    </header>

                    <div className={styles.decisionList}>
                      {exceptions.map((item, idx) => {
                        const selectedOption = exceptionAnswers[item.id];
                        const compactRow = Boolean(selectedOption) && editingDecisionId !== item.id;
                        const decisionLabel = item.id === 'work-arrangement'
                          ? 'Which working model should Veyqor use?'
                          : item.id === 'experience-floor'
                            ? 'What\'s the minimum experience requirement?'
                            : 'Should this requirement influence candidate selection?';

                        return (
                          <article key={item.id} className={`${styles.decisionRow} ${idx === 0 ? styles.decisionRowFirst : ''}`}>
                            <div className={styles.decisionContent}>
                              <div className={styles.decisionLeft}>
                                <div className={`${styles.decisionIconWrap} ${item.id === 'work-arrangement' ? styles.iconAmber : item.id === 'experience-floor' ? styles.iconIndigo : styles.iconRed}`} aria-hidden="true">
                                  {item.id === 'work-arrangement' && (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                                    </svg>
                                  )}
                                  {item.id === 'experience-floor' && (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="7" r="4" /><path d="M6 21v-2a6 6 0 0 1 12 0v2" />
                                    </svg>
                                  )}
                                  {item.id === 'policy-sensitive' && (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                  )}
                                </div>
                                <div>
                                  <strong>{item.title}</strong>
                                  <p>{decisionLabel}</p>
                                </div>
                              </div>

                              {compactRow ? (
                                <div className={styles.decisionCompactRow}>
                                  <span className={styles.decisionResolvedValue}>{selectedOption} <span className={styles.decisionCheck}>✓</span></span>
                                  <button type="button" className={styles.changeDecisionButton} onClick={() => setEditingDecisionId(item.id)}>Change</button>
                                </div>
                              ) : (
                                <div className={styles.optionRow}>
                                  {item.options.map((option) => {
                                    const selected = selectedOption === option;
                                    const isPolicyRed = item.id === 'policy-sensitive' && option === 'Keep informational context';
                                    return (
                                      <button
                                        key={option}
                                        type="button"
                                        className={`${styles.optionButton} ${selected ? (isPolicyRed ? styles.optionButtonRed : styles.optionButtonActive) : ''}`}
                                        onClick={() => {
                                          setExceptionAnswers((current) => ({ ...current, [item.id]: option }));
                                          setEditingDecisionId(null);
                                        }}
                                      >
                                        {option}
                                        {selected && <span className={styles.optionCheck} aria-hidden="true">✓</span>}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              className={styles.decisionEvidenceLink}
                              onClick={() => openEvidencePanel({
                                title: item.title,
                                why: item.detail,
                                excerpt: item.id === 'work-arrangement'
                                  ? 'The source mentions both remote and office-based collaboration.'
                                  : item.id === 'experience-floor'
                                    ? 'The source references both senior and lead-level expectations.'
                                    : 'The source includes language that may require policy interpretation before selection use.',
                                confidence: item.id === 'work-arrangement' ? signals.confidence.constraints : signals.confidence.experience,
                              })}
                            >
                              Why Veyqor flagged this
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ) : null}

                {/* ── C. Role at a glance ── */}
                <section className={styles.roleAtGlance}>
                  <h4 className={styles.glanceSectionTitle}>Role at a glance</h4>
                  <div className={styles.glanceGrid}>
                    <div className={styles.glanceField}>
                      <span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                        Function
                      </span>
                      <strong>{signals.role.function}</strong>
                    </div>
                    <div className={styles.glanceField}>
                      <span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        Seniority
                      </span>
                      <strong>{signals.role.seniority}</strong>
                    </div>
                    <div className={styles.glanceField}>
                      <span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        Employment
                      </span>
                      <strong>{signals.role.employmentType}</strong>
                    </div>
                    <div className={styles.glanceField}>
                      <span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                        Location
                      </span>
                      <strong>{signals.role.location}</strong>
                    </div>
                    <div className={styles.glanceField}>
                      <span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        </svg>
                        Work arrangement
                      </span>
                      <div className={styles.glanceValueGroup}>
                        <strong className={!exceptionAnswers['work-arrangement'] ? styles.glancePending : ''}>
                          {exceptionAnswers['work-arrangement'] ?? signals.role.workArrangement}
                        </strong>
                        {!exceptionAnswers['work-arrangement'] && (
                          <span className={styles.glancePendingBadge}>Pending</span>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* ── D. What Veyqor identified ── */}
                <section className={styles.identifiedSection}>
                  <header className={styles.identifiedHeader}>
                    <div>
                      <h4>What Veyqor identified</h4>
                      <p>Key intelligence extracted from your hiring signal.</p>
                    </div>
                    <button type="button" className={styles.viewAllDetailsLink}>View all details ›</button>
                  </header>

                  <div className={styles.identifiedList}>

                    {/* Required capabilities */}
                    <article className={styles.identifiedRow}>
                      <button
                        type="button"
                        className={styles.identifiedToggle}
                        onClick={() => toggleGroup('required')}
                        aria-expanded={expandedGroups.required}
                      >
                        <div className={styles.identifiedToggleLeft}>
                          <div className={`${styles.rowIconBadge} ${styles.iconGreen}`} aria-hidden="true">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                          <div>
                            <strong>Required capabilities</strong>
                            <div className={styles.inlinePillRow}>
                              {requiredCapabilities.slice(0, 3).map((c) => (
                                <span key={c.label} className={styles.inlinePill}>{c.label}</span>
                              ))}
                              {requiredCapabilities.length > 3 && (
                                <span className={styles.inlinePillMore}>+{requiredCapabilities.length - 3} more</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={styles.identifiedToggleRight}>
                          <span className={`${styles.confidenceBadge} ${styles.confidenceHigh}`}>{signals.confidence.capabilities}</span>
                          <span className={`${styles.chevron} ${expandedGroups.required ? styles.chevronOpen : ''}`} aria-hidden="true">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                          </span>
                        </div>
                      </button>
                      {expandedGroups.required && (
                        <div className={styles.identifiedBody}>
                          <div className={styles.capabilityTags}>
                            {requiredCapabilities.map((item) => (
                              <span key={item.label} className={styles.capabilityTagRequired}>
                                {item.label}
                                {item.source === 'interpreted' && <em>AI inferred</em>}
                              </span>
                            ))}
                          </div>
                          <button
                            type="button"
                            className={styles.viewDetailLink}
                            onClick={() => openEvidencePanel({
                              title: 'Required capabilities',
                              why: 'These capabilities were identified from the hiring signal as core requirements for this role.',
                              excerpt: 'The source emphasizes product systems thinking, cross-functional influence, and accessibility as non-negotiable for the role.',
                              confidence: signals.confidence.capabilities,
                            })}
                          >
                            View source evidence
                          </button>
                        </div>
                      )}
                    </article>

                    {/* Preferred capabilities */}
                    <article className={styles.identifiedRow}>
                      <button
                        type="button"
                        className={styles.identifiedToggle}
                        onClick={() => toggleGroup('preferred')}
                        aria-expanded={expandedGroups.preferred}
                      >
                        <div className={styles.identifiedToggleLeft}>
                          <div className={`${styles.rowIconBadge} ${styles.iconBlue}`} aria-hidden="true">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </div>
                          <div>
                            <strong>Preferred capabilities</strong>
                            <div className={styles.inlinePillRow}>
                              {preferredCapabilities.map((c) => (
                                <span key={c.label} className={styles.inlinePill}>{c.label}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className={styles.identifiedToggleRight}>
                          <span className={`${styles.confidenceBadge} ${styles.confidenceMedium}`}>Medium confidence</span>
                          <span className={`${styles.chevron} ${expandedGroups.preferred ? styles.chevronOpen : ''}`} aria-hidden="true">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                          </span>
                        </div>
                      </button>
                      {expandedGroups.preferred && (
                        <div className={styles.identifiedBody}>
                          <div className={styles.capabilityTags}>
                            {preferredCapabilities.map((item) => (
                              <span key={item.label} className={styles.capabilityTagPreferred}>
                                {item.label}
                                {item.source === 'interpreted' && <em>AI inferred</em>}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </article>

                    {/* Experience */}
                    <article className={styles.identifiedRow}>
                      <button
                        type="button"
                        className={styles.identifiedToggle}
                        onClick={() => toggleGroup('experience')}
                        aria-expanded={expandedGroups.experience}
                      >
                        <div className={styles.identifiedToggleLeft}>
                          <div className={`${styles.rowIconBadge} ${styles.iconPurple}`} aria-hidden="true">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="7" r="4" /><path d="M6 21v-2a6 6 0 0 1 12 0v2" />
                            </svg>
                          </div>
                          <div>
                            <strong>Experience</strong>
                            <div className={styles.inlinePillRow}>
                              <span className={styles.inlinePill}>{signals.experience.minimum}</span>
                              <span className={styles.inlinePill}>{signals.experience.domain}</span>
                              <span className={styles.inlinePill}>Design systems</span>
                              <span className={styles.inlinePillMore}>+1 more</span>
                            </div>
                          </div>
                        </div>
                        <div className={styles.identifiedToggleRight}>
                          <span className={`${styles.confidenceBadge} ${styles.confidenceMedium}`}>{signals.confidence.experience}</span>
                          <span className={`${styles.chevron} ${expandedGroups.experience ? styles.chevronOpen : ''}`} aria-hidden="true">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                          </span>
                        </div>
                      </button>
                      {expandedGroups.experience && (
                        <div className={styles.identifiedBody}>
                          <div className={styles.intelRows}>
                            <div className={styles.intelRow}>
                              <small>Minimum experience</small>
                              <div className={styles.intelValueWrap}>
                                {editingField === 'minimumExperience' ? (
                                  <div className={styles.inlineEditor}>
                                    <input value={editDraftValue} onChange={(e) => setEditDraftValue(e.target.value)} aria-label="Edit minimum experience" />
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
                            <div className={styles.intelRow}>
                              <small>Domain context</small>
                              <strong>{signals.experience.domain}</strong>
                            </div>
                            <div className={styles.intelRow}>
                              <small>Leadership</small>
                              <strong>{signals.experience.leadership}</strong>
                            </div>
                          </div>
                        </div>
                      )}
                    </article>

                    {/* Responsibilities */}
                    <article className={styles.identifiedRow}>
                      <button
                        type="button"
                        className={styles.identifiedToggle}
                        onClick={() => toggleGroup('responsibilities')}
                        aria-expanded={expandedGroups.responsibilities}
                      >
                        <div className={styles.identifiedToggleLeft}>
                          <div className={`${styles.rowIconBadge} ${styles.iconTeal}`} aria-hidden="true">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                            </svg>
                          </div>
                          <div>
                            <strong>Responsibilities</strong>
                            <div className={styles.inlinePillRow}>
                              {signals.responsibilities.map((r) => (
                                <span key={r} className={styles.inlinePill}>{r.split(' ')[0]} {r.split(' ')[1]} {r.split(' ')[2]}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className={styles.identifiedToggleRight}>
                          <span className={`${styles.confidenceBadge} ${styles.confidenceHigh}`}>High confidence</span>
                          <span className={`${styles.chevron} ${expandedGroups.responsibilities ? styles.chevronOpen : ''}`} aria-hidden="true">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                          </span>
                        </div>
                      </button>
                      {expandedGroups.responsibilities && (
                        <div className={styles.identifiedBody}>
                          <ul className={styles.listRows}>
                            {signals.responsibilities.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </article>

                    {/* Education */}
                    {signals.education && signals.education.length ? (
                      <article className={styles.identifiedRow}>
                        <button
                          type="button"
                          className={styles.identifiedToggle}
                          onClick={() => toggleGroup('education')}
                          aria-expanded={expandedGroups.education}
                        >
                          <div className={styles.identifiedToggleLeft}>
                            <div className={`${styles.rowIconBadge} ${styles.iconAmber}`} aria-hidden="true">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                              </svg>
                            </div>
                            <div>
                              <strong>Education &amp; credentials</strong>
                              <div className={styles.inlinePillRow}>
                                <span className={styles.inlinePill}>{signals.education[0]}</span>
                              </div>
                            </div>
                          </div>
                          <div className={styles.identifiedToggleRight}>
                            <span className={`${styles.confidenceBadge} ${styles.confidenceMedium}`}>Medium confidence</span>
                            <span className={`${styles.chevron} ${expandedGroups.education ? styles.chevronOpen : ''}`} aria-hidden="true">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                            </span>
                          </div>
                        </button>
                        {expandedGroups.education && (
                          <div className={styles.identifiedBody}>
                            <ul className={styles.listRows}>
                              {signals.education.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </article>
                    ) : null}

                    {/* Constraints */}
                    <article className={`${styles.identifiedRow} ${styles.identifiedRowLast}`}>
                      <button
                        type="button"
                        className={styles.identifiedToggle}
                        onClick={() => toggleGroup('constraints')}
                        aria-expanded={expandedGroups.constraints}
                      >
                        <div className={styles.identifiedToggleLeft}>
                          <div className={`${styles.rowIconBadge} ${styles.iconRed}`} aria-hidden="true">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                          </div>
                          <div>
                            <strong>Constraints &amp; conditions</strong>
                            <div className={styles.inlinePillRow}>
                              <span className={styles.inlinePill}>Portfolio evidence required</span>
                              <span className={styles.inlinePill}>Timezone overlap with West Africa</span>
                            </div>
                          </div>
                        </div>
                        <div className={styles.identifiedToggleRight}>
                          <span className={`${styles.confidenceBadge} ${styles.confidenceAlert}`}>
                            {signals.confidence.constraints}
                          </span>
                          <span className={`${styles.chevron} ${expandedGroups.constraints ? styles.chevronOpen : ''}`} aria-hidden="true">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                          </span>
                        </div>
                      </button>
                      {expandedGroups.constraints && (
                        <div className={styles.identifiedBody}>
                          <ul className={styles.listRows}>
                            {signals.constraints.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </article>

                  </div>
                </section>

                {/* ── E. Hiring objective card ── */}
                <section className={styles.hiringObjectiveCard}>
                  <div className={styles.objectiveCardLeft}>
                    <div className={styles.objectiveTargetIcon} aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
                      </svg>
                    </div>
                    <div>
                      <span className={styles.objectiveCardLabel}>Hiring objective</span>
                      <strong className={styles.objectiveCardText}>{signals.objective}</strong>
                    </div>
                  </div>
                  <button type="button" className={styles.objectiveEditButton}>Edit objective</button>
                </section>

                {/* Bottom spacer for sticky bar */}
                <div className={styles.stickyBarSpacer} aria-hidden="true" />
              </section>
            ) : null}


            {/* ── H. Sticky action bar ── */}
            {signals ? (
              <div className={`${styles.stickyBar} ${canGenerateCriteria ? styles.stickyBarReady : ''}`} role="region" aria-label="Generate criteria action">
                <div className={styles.stickyBarInner}>
                  <div className={styles.stickyBarLeft}>
                    <span className={`${styles.stickyBarDot} ${canGenerateCriteria ? styles.stickyBarDotReady : ''}`} aria-hidden="true" />
                    <span className={styles.stickyBarStatus}>
                      {canGenerateCriteria
                        ? 'Everything required is confirmed.'
                        : `${exceptions.length - resolvedDecisions} decision${exceptions.length - resolvedDecisions !== 1 ? 's' : ''} remaining`}
                    </span>
                    <span className={styles.stickyBarProgress}>
                      {resolvedDecisions} of {exceptions.length} resolved
                    </span>
                  </div>
                  <button
                    type="button"
                    id="confirm-generate-criteria"
                    className={styles.stickyBarCta}
                    disabled={!canGenerateCriteria}
                    onClick={handleGenerateCriteria}
                  >
                    {generating ? 'Generating...' : 'Confirm & generate criteria →'}
                  </button>
                </div>
              </div>
            ) : null}

            {activeEvidence ? (
              <>
                <div className={styles.evidenceOverlay} role="presentation" onClick={() => setActiveEvidence(null)} />
                <aside className={styles.evidenceDrawer} role="dialog" aria-modal="true" aria-label="Source evidence">
                  <header className={styles.evidenceHeader}>
                    <h4>Source evidence</h4>
                    <button type="button" className={styles.evidenceClose} onClick={() => setActiveEvidence(null)} aria-label="Close source evidence">×</button>
                  </header>

                  <div className={styles.evidenceBody}>
                    <section>
                      <small>Item</small>
                      <strong>{activeEvidence.title}</strong>
                    </section>
                    <section>
                      <small>Why Veyqor needs your decision</small>
                      <p>{activeEvidence.why}</p>
                    </section>
                    <section>
                      <small>Source excerpt</small>
                      <blockquote>{activeEvidence.excerpt}</blockquote>
                    </section>
                    <section>
                      <small>Source document</small>
                      <p>{sourceName || 'Uploaded source'}</p>
                      <p>{new Date(sourceTimestamp).toLocaleString()}</p>
                    </section>
                    <section>
                      <small>Confidence</small>
                      <p>{activeEvidence.confidence}</p>
                    </section>
                  </div>
                </aside>
              </>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
