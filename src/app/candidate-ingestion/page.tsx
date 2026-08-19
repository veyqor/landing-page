'use client';

import Image from 'next/image';
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockAuthGateway, type AuthSession } from '@/lib/auth/mockAuthGateway';
import intakeStyles from '../job-intake/page.module.css';
import styles from './page.module.css';

const TENANT_STORAGE_KEY = 'veyqor.mock.tenant-context.v1';
const ORG_STORAGE_KEY = 'veyqor.mock.org-context.v1';
const CASE_CONTEXT_STORAGE_KEY = 'veyqor.mock.case-context.v1';

type NavItem = {
  id: string;
  label: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'cases', label: 'Cases', href: '#' },
  { id: 'review', label: 'Review queues', href: '#' },
  { id: 'notifications', label: 'Notifications', href: '#' },
  { id: 'audit', label: 'Audit', href: '#' },
  { id: 'settings', label: 'Settings', href: '#' },
];

type RecentUpload = {
  id: string;
  fileName: string;
  uploadedBy: string;
  date: string;
  status: 'Completed' | 'Processing';
  candidatesCount: number;
};

const INITIAL_RECENT_UPLOADS: RecentUpload[] = [
  {
    id: 'batch-01',
    fileName: 'Frontend Engineers Batch.pdf',
    uploadedBy: 'Tolu Adedayo',
    date: 'May 18, 2025 10:24 AM',
    status: 'Completed',
    candidatesCount: 142,
  },
  {
    id: 'batch-02',
    fileName: 'Product Designers Batch 02.pdf',
    uploadedBy: 'Tolu Adedayo',
    date: 'May 15, 2025 04:12 PM',
    status: 'Completed',
    candidatesCount: 88,
  },
  {
    id: 'batch-03',
    fileName: 'Senior Backend Candidates.docx',
    uploadedBy: 'Sarah Chen',
    date: 'May 10, 2025 09:30 AM',
    status: 'Completed',
    candidatesCount: 64,
  },
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

export default function CandidateIngestionPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [session, setSession] = useState<AuthSession | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [orgName, setOrgName] = useState('');

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>(INITIAL_RECENT_UPLOADS);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingStats, setProcessingStats] = useState({
    total: 142,
    eligible: 126,
    potential: 12,
    attention: 4,
  });

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

  function handleChooseFiles() {
    fileInputRef.current?.click();
  }

  function onFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(true);
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function startProcessing() {
    router.push('/candidate-processing');
  }

  function goToReview() {
    router.push('/candidate-processing');
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

          <div style={{ padding: '24px 32px' }}>
            <section className={styles.contentContainer}>
              
              {/* PAGE HEADER */}
              <header className={styles.pageHeader}>
                <div className={styles.headerTop}>
                  <div>
                    <p className={styles.kicker}>CANDIDATE INTAKE</p>
                    <h1 className={styles.mainTitle}>Add candidates</h1>
                    <p className={styles.mainSubtitle}>
                      Upload or import candidates and VEYQOR will automatically process, protect, and evaluate them against the approved criteria.
                    </p>
                  </div>
                  <div className={styles.approvedCriteriaTag}>
                    <span>Approved criteria: <strong>Senior Product Designer</strong></span>
                    <span>· 3 required criteria · 1 preferred</span>
                    <button type="button" className={styles.viewCriteriaLink} onClick={() => router.push('/criteria-approval')}>
                      View criteria →
                    </button>
                  </div>
                </div>

                {/* REASSURANCE BANNER */}
                <div className={styles.reassuranceBanner}>
                  <div className={styles.reassuranceIcon}>✨</div>
                  <p className={styles.reassuranceText}>
                    All candidates will be automatically screened for eligibility, privacy-protected, and matched using your approved criteria.
                  </p>
                </div>
              </header>

              {/* MAIN LAYOUT GRID */}
              <div className={styles.layoutGrid}>
                
                {/* LEFT COLUMN */}
                <div className={styles.leftColumn}>
                  
                  {/* 2 ACTION CARDS */}
                  <div className={styles.cardsRow}>
                    
                    {/* CARD 1: UPLOAD */}
                    <div
                      className={`${styles.actionCard} ${styles.actionCardPrimary}`}
                      onDrop={onDrop}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                    >
                      <div className={`${styles.cardIconCircle} ${styles.iconCirclePurple}`}>
                        ⬆
                      </div>
                      <h2 className={styles.cardTitle}>Upload candidates</h2>
                      <p className={styles.cardSubtitle}>
                        Drag and drop files here or click to browse
                      </p>

                      <button
                        type="button"
                        className={styles.goldButton}
                        onClick={handleChooseFiles}
                      >
                        <span style={{ fontSize: 16 }}>⬆</span> Choose files
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.txt"
                        className={styles.hiddenInput}
                        onChange={onFileInputChange}
                      />

                      <p className={styles.cardFootnote}>
                        PDF, DOCX, TXT • Max 50MB per file
                      </p>
                      <p className={styles.cardCheckItem}>
                        <span className={styles.checkIcon}>✓</span> Upload multiple files at once
                      </p>
                    </div>

                    {/* CARD 2: IMPORT */}
                    <div className={`${styles.actionCard} ${styles.actionCardSecondary}`}>
                      <div className={`${styles.cardIconCircle} ${styles.iconCircleGold}`}>
                        👥
                      </div>
                      <h2 className={styles.cardTitle}>Import from source</h2>
                      <p className={styles.cardSubtitle}>
                        Import candidates from your connected sources
                      </p>

                      <button type="button" className={styles.secondaryDropdown}>
                        Choose source <span>⌄</span>
                      </button>

                      <p className={styles.cardFootnote} style={{ marginTop: 24 }}>
                        LinkedIn Recruiter, ATS, CSV and more
                      </p>
                    </div>

                  </div>

                  {/* SELECTED FILES QUEUE (IF FILES ADDED) */}
                  {selectedFiles.length > 0 && (
                    <div className={styles.fileQueueCard}>
                      <div className={styles.fileQueueHeader}>
                        <h3 className={styles.fileQueueTitle}>Selected files for intake</h3>
                        <span className={styles.fileQueueCount}>{selectedFiles.length} file{selectedFiles.length === 1 ? '' : 's'} ready</span>
                      </div>
                      <div className={styles.fileList}>
                        {selectedFiles.map((file, index) => (
                          <div key={`${file.name}-${index}`} className={styles.fileItem}>
                            <div className={styles.fileItemLeft}>
                              <span className={styles.fileIcon}>📄</span>
                              <div>
                                <div className={styles.fileName}>{file.name}</div>
                                <div className={styles.fileMeta}>{(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'Document'}</div>
                              </div>
                            </div>
                            <button type="button" className={styles.removeFileBtn} onClick={() => removeFile(index)} title="Remove file">
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* RECENT UPLOADS */}
                  <div className={styles.recentSection}>
                    <div className={styles.recentHeader}>
                      <h3 className={styles.recentTitle}>Recent uploads</h3>
                    </div>

                    <div className={styles.recentTableWrap}>
                      <table className={styles.recentTable}>
                        <thead>
                          <tr>
                            <th>File name</th>
                            <th>Uploaded by</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Candidates</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentUploads.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <div className={styles.fileNameCell}>
                                  <span className={styles.pdfIcon}>📄</span>
                                  {item.fileName}
                                </div>
                              </td>
                              <td>{item.uploadedBy}</td>
                              <td>{item.date}</td>
                              <td>
                                <span className={item.status === 'Completed' ? styles.statusPillCompleted : styles.statusPillProcessing}>
                                  {item.status}
                                </span>
                              </td>
                              <td>{item.candidatesCount}</td>
                              <td>
                                <span className={styles.actionChevron} onClick={goToReview}>›</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <button type="button" className={styles.viewAllLink} onClick={goToReview}>
                        View all uploads →
                      </button>
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: WHAT HAPPENS NEXT */}
                <div className={styles.rightColumn}>
                  <div className={styles.whatHappensCard}>
                    <h3 className={styles.whatHappensTitle}>What happens next?</h3>

                    <div className={styles.stepsList}>
                      <div className={styles.stepItem}>
                        <div className={styles.stepIconCircle}>📄</div>
                        <div className={styles.stepContent}>
                          <h4>1. We process</h4>
                          <p>We extract and organize candidate information securely.</p>
                        </div>
                      </div>

                      <div className={styles.stepItem}>
                        <div className={styles.stepIconCircle}>🛡️</div>
                        <div className={styles.stepContent}>
                          <h4>2. We protect</h4>
                          <p>Personal data is anonymized based on your settings.</p>
                        </div>
                      </div>

                      <div className={styles.stepItem}>
                        <div className={styles.stepIconCircle}>🎯</div>
                        <div className={styles.stepContent}>
                          <h4>3. We evaluate</h4>
                          <p>Candidates are screened against your approved criteria.</p>
                        </div>
                      </div>

                      <div className={styles.stepItem}>
                        <div className={styles.stepIconCircle}>👥</div>
                        <div className={styles.stepContent}>
                          <h4>4. You review</h4>
                          <p>Review results, handle exceptions, and move forward.</p>
                        </div>
                      </div>
                    </div>

                    <div className={styles.securityBox}>
                      <span className={styles.lockIcon}>🔒</span>
                      <div className={styles.securityText}>
                        <h5>Your data is secure and confidential.</h5>
                        <p>We follow industry-leading security and privacy standards.</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </section>
          </div>
        </div>
      </div>

      {/* BOTTOM FLOATING STICKY BAR */}
      <div className={styles.bottomStickyBar}>
        <div className={styles.stickyLeft}>
          <div className={styles.clockIcon}>🕒</div>
          <div className={styles.stickyText}>
            <strong>You can leave this page.</strong>
            <p>We'll notify you when processing is complete.</p>
          </div>
        </div>

        <button
          type="button"
          className={styles.stickyGoldButton}
          onClick={startProcessing}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing candidates...' : 'Start processing →'}
        </button>
      </div>

      {/* COMPLETED RESULTS MODAL */}
      {processingComplete && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.modalIcon}>✓</div>
            <div>
              <h2 className={styles.modalTitle}>Candidate processing complete</h2>
              <p className={styles.modalSubtitle}>
                {processingStats.total} candidates processed and evaluated against approved criteria.
              </p>
            </div>

            <div className={styles.statGrid}>
              <div className={styles.statBox}>
                <span className={styles.statNumber} style={{ color: '#10b981' }}>{processingStats.eligible}</span>
                <span className={styles.statLabel}>Eligible</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNumber} style={{ color: '#d97706' }}>{processingStats.potential}</span>
                <span className={styles.statLabel}>Potential</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNumber} style={{ color: '#ef4444' }}>{processingStats.attention}</span>
                <span className={styles.statLabel}>Attention</span>
              </div>
            </div>

            <button
              type="button"
              className={styles.goldButton}
              style={{ width: '100%', maxWidth: 'none', minHeight: 48, fontSize: 15 }}
              onClick={goToReview}
            >
              Review candidates →
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
