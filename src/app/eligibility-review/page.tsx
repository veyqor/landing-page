'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockAuthGateway, type AuthSession } from '@/lib/auth/mockAuthGateway';
import intakeStyles from '../job-intake/page.module.css';
import styles from './page.module.css';

type NavItem = {
  id: string;
  label: string;
  href: string;
};

type MatchCategory = 'recommended' | 'potential' | 'attention';

type Candidate = {
  id: string;
  code: string;
  name: string;
  initials: string;
  role: string;
  experience: string;
  skills: string[];
  matchScore: number;
  matchCategory: MatchCategory;
  requiredCriteriaResult: string;
  confidence: string;
  shortlisted: boolean;
  whyRecommended: string;
  criteriaChecklist: {
    id: string;
    title: string;
    status: 'passed' | 'attention';
    desc: string;
    evidence?: string;
  }[];
  attentionReason?: string;
};

const WORKFLOW_STEPS = [
  'Signal Intake',
  'Criteria',
  'Approval',
  'Candidate Intake',
  'Processing',
  'Review',
];

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'cases', label: 'Cases', href: '#' },
  { id: 'review', label: 'Review queues', href: '#' },
  { id: 'notifications', label: 'Notifications', href: '#' },
  { id: 'audit', label: 'Audit', href: '#' },
  { id: 'settings', label: 'Settings', href: '#' },
];

const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: 'cand-024',
    code: 'Candidate 024',
    name: 'Alexandre Morgan',
    initials: 'AM',
    role: 'Senior Product Designer',
    experience: '8+ years experience',
    skills: ['Product systems', 'SaaS', 'Design systems', 'Cross-functional leadership', 'Figma', 'TypeScript'],
    matchScore: 94,
    matchCategory: 'recommended',
    requiredCriteriaResult: '5 / 5 required criteria',
    confidence: 'High confidence',
    shortlisted: true,
    whyRecommended: 'Strong evidence of leading product systems across enterprise SaaS products, with demonstrated cross-functional leadership and delivery impact.',
    criteriaChecklist: [
      {
        id: 'c1',
        title: 'Qualification & Background',
        status: 'passed',
        desc: 'B.Sc in Human-Computer Interaction & 8+ years leading enterprise product design teams.',
        evidence: 'Verified transcript from University of Waterloo & verified reference from Stripe design leadership.',
      },
      {
        id: 'c2',
        title: 'Technical capability & Systems design',
        status: 'passed',
        desc: 'Hands-on experience with TypeScript, React component libraries, and tokenized design systems.',
        evidence: 'Authored multi-brand design tokens used across 14 product modules at previous enterprise role.',
      },
      {
        id: 'c3',
        title: 'Domain experience (B2B SaaS)',
        status: 'passed',
        desc: '6+ years designing complex workflow interfaces for governance and compliance platforms.',
        evidence: 'Led redesign of workflow intake module resulting in 42% faster decision turnaround.',
      },
      {
        id: 'c4',
        title: 'Product design leadership',
        status: 'passed',
        desc: 'Mentored 5 junior designers and established cross-functional design review standards.',
      },
      {
        id: 'c5',
        title: 'Policy & security alignment',
        status: 'passed',
        desc: 'Full compliance with data privacy regulations and role access control standards.',
      },
    ],
  },
  {
    id: 'cand-012',
    code: 'Candidate 012',
    name: 'Elena Rostova',
    initials: 'ER',
    role: 'Lead Product Designer',
    experience: '9+ years experience',
    skills: ['Design systems', 'UX Architecture', 'B2B Platforms', 'Prototyping', 'Accessibility'],
    matchScore: 91,
    matchCategory: 'recommended',
    requiredCriteriaResult: '5 / 5 required criteria',
    confidence: 'High confidence',
    shortlisted: false,
    whyRecommended: 'Extensive track record of architecting scalable design systems for financial and recruiting software.',
    criteriaChecklist: [
      {
        id: 'c1',
        title: 'Qualification & Background',
        status: 'passed',
        desc: 'Master of Fine Arts in Digital Design. 9+ years industry practice.',
      },
      {
        id: 'c2',
        title: 'Technical capability',
        status: 'passed',
        desc: 'Proficient in CSS architecture, Web Components, and React prototyping.',
      },
      {
        id: 'c3',
        title: 'Domain experience',
        status: 'passed',
        desc: 'Designed enterprise hiring intake portals and candidate workflow systems.',
      },
    ],
  },
  {
    id: 'cand-038',
    code: 'Candidate 038',
    name: 'Marcus Vance',
    initials: 'MV',
    role: 'Staff Product Architect',
    experience: '10+ years experience',
    skills: ['Enterprise SaaS', 'Complex workflows', 'User Research', 'Design Operations'],
    matchScore: 89,
    matchCategory: 'recommended',
    requiredCriteriaResult: '5 / 5 required criteria',
    confidence: 'High confidence',
    shortlisted: false,
    whyRecommended: 'Deep experience designing high-throughput administrative platforms with strict audit requirements.',
    criteriaChecklist: [
      {
        id: 'c1',
        title: 'Qualification & Background',
        status: 'passed',
        desc: 'B.Sc Computer Science & 10 years experience.',
      },
    ],
  },
  {
    id: 'cand-019',
    code: 'Candidate 019',
    name: 'Sophia Chen',
    initials: 'SC',
    role: 'Senior UI/UX Specialist',
    experience: '6+ years experience',
    skills: ['Figma', 'UI Animation', 'Design Tokens', 'User Testing'],
    matchScore: 85,
    matchCategory: 'potential',
    requiredCriteriaResult: '4 / 5 required criteria',
    confidence: 'Medium confidence',
    shortlisted: false,
    whyRecommended: 'Strong UI craft and visual polish; requires minor verification on complex backend workflow depth.',
    criteriaChecklist: [
      {
        id: 'c1',
        title: 'Qualification & Background',
        status: 'passed',
        desc: 'B.A. Graphic Communication.',
      },
      {
        id: 'c2',
        title: 'Domain experience',
        status: 'attention',
        desc: 'Primary background in consumer fintech rather than B2B compliance software.',
      },
    ],
  },
  {
    id: 'cand-008',
    code: 'Candidate 008',
    name: 'David Kalu',
    initials: 'DK',
    role: 'Senior Product Designer',
    experience: '7+ years experience',
    skills: ['Product Strategy', 'Design Systems', 'Micro-interactions'],
    matchScore: 78,
    matchCategory: 'attention',
    requiredCriteriaResult: '3 / 5 required criteria',
    confidence: 'Requires review',
    shortlisted: false,
    attentionReason: 'Qualification evidence unclear',
    whyRecommended: 'Solid experience portfolio, but degree credentials require manual verification.',
    criteriaChecklist: [
      {
        id: 'c1',
        title: 'Qualification & Background',
        status: 'attention',
        desc: 'Submitted transcript document quality requires manual review before final approval.',
        evidence: 'Document scan has low contrast on university seal.',
      },
    ],
  },
  {
    id: 'cand-031',
    code: 'Candidate 031',
    name: 'Tariq Al-Mansoor',
    initials: 'TA',
    role: 'UX Designer & Researcher',
    experience: '5–8 years experience',
    skills: ['User Research', 'Prototyping', 'Usability Testing'],
    matchScore: 76,
    matchCategory: 'attention',
    requiredCriteriaResult: '4 / 5 required criteria',
    confidence: 'Requires review',
    shortlisted: false,
    attentionReason: 'Experience range ambiguous',
    whyRecommended: 'Strong user research skills; resume lists overlapping freelance and full-time dates.',
    criteriaChecklist: [
      {
        id: 'c1',
        title: 'Experience floor verification',
        status: 'attention',
        desc: 'Overlapping timeline dates between contract and full-time roles require clarification.',
      },
    ],
  },
  {
    id: 'cand-064',
    code: 'Candidate 064',
    name: 'Rachel Adams',
    initials: 'RA',
    role: 'Senior Product Designer',
    experience: '6+ years experience',
    skills: ['Design Systems', 'SaaS', 'Figma'],
    matchScore: 74,
    matchCategory: 'attention',
    requiredCriteriaResult: '3 / 5 required criteria',
    confidence: 'Requires review',
    shortlisted: false,
    attentionReason: 'Document quality issue',
    whyRecommended: 'Work samples demonstrate strong design quality; document formatting was partially unparseable.',
    criteriaChecklist: [
      {
        id: 'c1',
        title: 'Document integrity',
        status: 'attention',
        desc: 'Page 3 of submitted PDF contains unformatted text fragments.',
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

function ShellIcon({ id }: { id: NavItem['id'] }) {
  if (id === 'dashboard') return <span aria-hidden="true">⌂</span>;
  if (id === 'cases') return <span aria-hidden="true">◫</span>;
  if (id === 'review') return <span aria-hidden="true">◎</span>;
  if (id === 'notifications') return <span aria-hidden="true">◉</span>;
  if (id === 'audit') return <span aria-hidden="true">◌</span>;
  return <span aria-hidden="true">⚙</span>;
}

export default function CandidateReviewPage() {
  const router = useRouter();

  const [session, setSession] = useState<AuthSession | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [orgName, setOrgName] = useState('');

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [activeTab, setActiveTab] = useState<MatchCategory>('recommended');
  const [sortOption, setSortOption] = useState<'strongest' | 'experience' | 'recent'>('strongest');

  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  const [activeDrawerCandidate, setActiveDrawerCandidate] = useState<Candidate | null>(null);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'profile' | 'evidence' | 'files'>('overview');
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(null);

  useEffect(() => {
    const activeSession = mockAuthGateway.getSession();
    if (!activeSession) {
      router.replace('/sign-in');
      return;
    }
    setSession(activeSession);
    setTenantName('Acme Global Operations');
    setOrgName('Product & Engineering Workspace');
  }, [router]);

  const categoryCounts = useMemo(() => {
    return {
      recommended: candidates.filter((c) => c.matchCategory === 'recommended').length,
      potential: candidates.filter((c) => c.matchCategory === 'potential').length,
      attention: candidates.filter((c) => c.matchCategory === 'attention').length,
    };
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    let list = candidates.filter((c) => c.matchCategory === activeTab);
    if (sortOption === 'strongest') {
      list = [...list].sort((a, b) => b.matchScore - a.matchScore);
    } else if (sortOption === 'experience') {
      list = [...list].sort((a, b) => b.experience.localeCompare(a.experience));
    }
    return list;
  }, [candidates, activeTab, sortOption]);

  function toggleShortlist(id: string) {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, shortlisted: !c.shortlisted } : c))
    );
    if (activeDrawerCandidate?.id === id) {
      setActiveDrawerCandidate((prev) => (prev ? { ...prev, shortlisted: !prev.shortlisted } : null));
    }
  }

  function toggleSelectCandidate(id: string) {
    setSelectedCandidateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleBulkShortlist() {
    setCandidates((prev) =>
      prev.map((c) => (selectedCandidateIds.has(c.id) ? { ...c, shortlisted: true } : c))
    );
    setSelectedCandidateIds(new Set());
  }

  if (!session) {
    return (
      <main className={intakeStyles.page}>
        <div className={intakeStyles.skeletonSurface}>
          <span className={intakeStyles.skeletonLine} />
          <span className={intakeStyles.skeletonBlock} />
        </div>
      </main>
    );
  }

  return (
    <main className={intakeStyles.page}>
      <div className={`${intakeStyles.appShell} ${sidebarCollapsed ? intakeStyles.appShellCollapsed : ''}`}>
        {/* MOBILE HEADER & DRAWER */}
        <header className={intakeStyles.mobileHeader}>
          <button
            type="button"
            className={intakeStyles.mobileMenuButton}
            onClick={() => setMobileNavOpen((current) => !current)}
            aria-label="Open menu"
          >
            <span className={intakeStyles.mobileMenuBars} aria-hidden="true" />
          </button>
          <Image src="/Untitled design - 2026-08-10T155155.182.png" alt="Veyqor" width={130} height={34} className={intakeStyles.mobileMark} priority />
        </header>

        {/* SIDEBAR */}
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

          <nav className={intakeStyles.sidebarNav} aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className={`${intakeStyles.navItem} ${item.id === 'cases' ? intakeStyles.navItemActive : ''}`}
              >
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
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <span aria-hidden="true">{sidebarCollapsed ? '»' : '«'}</span>
            </button>
          </div>
        </aside>

        {/* MAIN WORKSPACE WRAPPER */}
        <div className={intakeStyles.mainWrap}>
          {/* TOP APPLICATION HEADER */}
          <header className={intakeStyles.topHeader}>
            <div className={intakeStyles.topHeaderLeft}>
              <button
                type="button"
                className={intakeStyles.collapseButtonInline}
                onClick={() => setSidebarCollapsed((current) => !current)}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? '»' : '«'}
              </button>
              <Image src="/Untitled design - 2026-08-10T155155.182.png" alt="Veyqor" width={134} height={34} className={intakeStyles.mark} priority />
            </div>

            <div className={intakeStyles.topHeaderRight}>
              <button type="button" className={intakeStyles.iconButton} aria-label="Notifications">◦</button>
              <div className={intakeStyles.topMeta}>
                <span className={intakeStyles.contextLabel}>Workspace</span>
                <strong>{orgName}</strong>
                <small>{tenantName}</small>
              </div>
              <button type="button" className={intakeStyles.userButton} aria-label="User menu">
                <span className={intakeStyles.avatar}>{session.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                <span className={intakeStyles.userMeta}>
                  <strong>{session.fullName}</strong>
                  <small>{roleLabel(session.role)}</small>
                </span>
                <span className={intakeStyles.userCaret} aria-hidden="true">⌄</span>
              </button>
            </div>
          </header>

          <div className={styles.contentContainer}>
            {/* WORKFLOW PROGRESS STEPPER */}
            <div className={intakeStyles.stepper} aria-label="Workflow progress">
              {WORKFLOW_STEPS.map((step, index) => {
                const isComplete = index < 5;
                const isActive = index === 5;
                return (
                  <div
                    key={step}
                    className={`${intakeStyles.step} ${isComplete ? intakeStyles.stepComplete : ''} ${isActive ? intakeStyles.stepActive : ''}`}
                  >
                    <span>{isComplete ? '✓' : index + 1}</span>
                    <p>{step}</p>
                  </div>
                );
              })}
            </div>

            {/* PAGE HEADER */}
            <header className={styles.pageHeader}>
              <span className={styles.breadcrumb}>Job Intake / Candidate Review</span>
              <h1 className={styles.mainTitle}>Review your candidates</h1>
              <p className={styles.mainSubtitle}>
                VEYQOR has evaluated the processed candidates against the approved criteria and ranked the strongest matches for your review.
              </p>
              <div className={styles.jobContextRow}>
                <span className={styles.jobTitleBadge}>Senior Product Designer</span>
                <span className={styles.contextDot}>•</span>
                <span>Product Design</span>
                <span className={styles.contextDot}>•</span>
                <span>Senior level</span>
                <span className={styles.contextDot}>•</span>
                <span>Full-time</span>
                <span className={styles.contextDot}>•</span>
                <span>Lagos or Remote</span>
              </div>
            </header>

            {/* HIGH-LEVEL PROCESSING SUMMARY BANNER */}
            <section className={styles.summaryBanner} aria-label="Processing Summary">
              <div className={styles.summaryBannerLeft}>
                <div className={styles.summaryIcon}>✓</div>
                <div>
                  <h2 className={styles.summaryTitle}>Ready for review</h2>
                  <p className={styles.summaryDesc}>
                    Candidate processing is complete. VEYQOR identified the strongest matches against the approved hiring criteria.
                  </p>
                </div>
              </div>
              <div className={styles.summaryBannerRight}>
                <div className={styles.summaryStatItem}>
                  <strong>142</strong>
                  <span>Processed</span>
                </div>
                <div className={styles.summaryStatItem}>
                  <strong style={{ color: '#059669' }}>18</strong>
                  <span>Strong matches</span>
                </div>
                <div className={styles.summaryStatItem}>
                  <strong style={{ color: '#b45309' }}>7</strong>
                  <span>Potential</span>
                </div>
                <div className={styles.summaryStatItem}>
                  <strong style={{ color: '#b42318' }}>3</strong>
                  <span>Need attention</span>
                </div>
              </div>
            </section>

            {/* MAIN WORKSPACE LAYOUT GRID */}
            <div className={styles.layoutGrid}>
              {/* LEFT CANDIDATE WORKSPACE */}
              <div className={styles.leftWorkspace}>
                {/* CANDIDATE TABS & CONTROLS */}
                <div className={styles.controlsRow}>
                  <div className={styles.tabsGroup} role="tablist" aria-label="Candidate category tabs">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'recommended'}
                      className={`${styles.tabButton} ${activeTab === 'recommended' ? styles.tabButtonActive : ''}`}
                      onClick={() => setActiveTab('recommended')}
                    >
                      <span>Recommended</span>
                      <span className={`${styles.tabBadge} ${activeTab === 'recommended' ? styles.tabBadgeActive : ''}`}>
                        {categoryCounts.recommended}
                      </span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'potential'}
                      className={`${styles.tabButton} ${activeTab === 'potential' ? styles.tabButtonActive : ''}`}
                      onClick={() => setActiveTab('potential')}
                    >
                      <span>Potential</span>
                      <span className={`${styles.tabBadge} ${activeTab === 'potential' ? styles.tabBadgeActive : ''}`}>
                        {categoryCounts.potential}
                      </span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'attention'}
                      className={`${styles.tabButton} ${activeTab === 'attention' ? styles.tabButtonActive : ''}`}
                      onClick={() => setActiveTab('attention')}
                    >
                      <span>Needs attention</span>
                      <span className={`${styles.tabBadge} ${activeTab === 'attention' ? styles.tabBadgeActive : ''}`}>
                        {categoryCounts.attention}
                      </span>
                    </button>
                  </div>

                  <div className={styles.filterControls}>
                    <select
                      className={styles.selectDropdown}
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as any)}
                      aria-label="Sort candidates"
                    >
                      <option value="strongest">Sort: Strongest match</option>
                      <option value="experience">Sort: Most experience</option>
                      <option value="recent">Sort: Recently processed</option>
                    </select>
                  </div>
                </div>

                {/* CANDIDATE LIST SURFACE */}
                <div className={styles.candidateSurface}>
                  <div className={styles.candidateList}>
                    {filteredCandidates.map((candidate) => {
                      const isSelected = selectedCandidateIds.has(candidate.id);
                      return (
                        <div
                          key={candidate.id}
                          className={`${styles.candidateRow} ${isSelected ? styles.candidateRowSelected : ''}`}
                        >
                          <div className={styles.candidateLeft}>
                            <input
                              type="checkbox"
                              className={styles.candidateCheckbox}
                              checked={isSelected}
                              onChange={() => toggleSelectCandidate(candidate.id)}
                              aria-label={`Select ${candidate.code}`}
                            />
                            <div className={styles.candidateAvatar}>{candidate.initials}</div>
                            <div className={styles.candidateNameInfo}>
                              <h4>{candidate.code}</h4>
                              <p>{candidate.role} • {candidate.experience}</p>
                            </div>
                          </div>

                          <div className={styles.skillsTags}>
                            {candidate.skills.slice(0, 3).map((skill) => (
                              <span key={skill} className={styles.skillTag}>{skill}</span>
                            ))}
                            {candidate.skills.length > 3 ? (
                              <span className={styles.moreSkillsTag}>+{candidate.skills.length - 3} more</span>
                            ) : null}
                          </div>

                          <div className={styles.matchScoreBox}>
                            <div
                              className={`${styles.scoreCircle} ${
                                candidate.matchCategory === 'potential'
                                  ? styles.scoreCirclePotential
                                  : candidate.matchCategory === 'attention'
                                  ? styles.scoreCircleAttention
                                  : ''
                              }`}
                            >
                              {candidate.matchScore}%
                            </div>
                            <span
                              className={`${styles.matchLabel} ${
                                candidate.matchCategory === 'potential'
                                  ? styles.labelPotential
                                  : candidate.matchCategory === 'attention'
                                  ? styles.labelAttention
                                  : styles.labelEligible
                              }`}
                            >
                              {candidate.matchCategory === 'recommended'
                                ? 'Strong match'
                                : candidate.matchCategory === 'potential'
                                ? 'Potential'
                                : 'Attention'}
                            </span>
                          </div>

                          <div className={styles.criteriaSummaryCell}>
                            <strong>{candidate.requiredCriteriaResult}</strong>
                            <small>{candidate.confidence}</small>
                          </div>

                          <div className={styles.rowActions}>
                            <button
                              type="button"
                              className={styles.viewButton}
                              onClick={() => setActiveDrawerCandidate(candidate)}
                            >
                              View candidate →
                            </button>
                            <button
                              type="button"
                              className={`${styles.shortlistButton} ${candidate.shortlisted ? styles.shortlistButtonActive : ''}`}
                              onClick={() => toggleShortlist(candidate.id)}
                            >
                              {candidate.shortlisted ? 'Shortlisted ✓' : 'Shortlist'}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {filteredCandidates.length === 0 ? (
                      <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                        <p style={{ fontWeight: 600, fontSize: '14px' }}>No candidates in this view</p>
                        <p style={{ fontSize: '12px', marginTop: '4px' }}>Select another tab above or ingest more candidates.</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* RIGHT SUPPORTING SUMMARY COLUMN */}
              <aside className={styles.rightSummaryColumn}>
                {/* REVIEW PROGRESS CARD */}
                <div className={styles.sideCard}>
                  <h3 className={styles.sideCardTitle}>Review progress</h3>
                  <div className={styles.progressStatsRow}>
                    <span>28 total evaluated</span>
                    <strong style={{ color: '#059669' }}>18 Recommended</strong>
                  </div>
                </div>

                {/* ATTENTION ITEMS CARD */}
                <div className={styles.sideCard}>
                  <h3 className={styles.sideCardTitle}>Attention items</h3>
                  <div className={styles.attentionItemsList}>
                    <div className={styles.attentionItemBox}>
                      <span className={styles.attentionText}>1 candidate qualification unverified</span>
                      <button type="button" className={styles.attentionBtn} onClick={() => setActiveTab('attention')}>
                        Review →
                      </button>
                    </div>
                    <div className={styles.attentionItemBox}>
                      <span className={styles.attentionText}>1 experience timeline overlap</span>
                      <button type="button" className={styles.attentionBtn} onClick={() => setActiveTab('attention')}>
                        Review →
                      </button>
                    </div>
                    <div className={styles.attentionItemBox}>
                      <span className={styles.attentionText}>1 document quality scan issue</span>
                      <button type="button" className={styles.attentionBtn} onClick={() => setActiveTab('attention')}>
                        Review →
                      </button>
                    </div>
                  </div>
                </div>

                {/* NEXT STEPS CARD */}
                <div className={styles.nextStepBox}>
                  <h3 className={styles.sideCardTitle}>What would you like to do next?</h3>
                  <button
                    type="button"
                    className={styles.goldPrimaryBtn}
                    onClick={() => router.push('/shortlist-review')}
                  >
                    <span>Review shortlisted candidates</span>
                    <span>→</span>
                  </button>
                  <button
                    type="button"
                    className={styles.outlineSecondaryBtn}
                    onClick={() => router.push('/candidate-ingestion')}
                  >
                    Ingest more candidates
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </div>

        {/* CANDIDATE DETAIL DRAWER */}
        {activeDrawerCandidate ? (
          <>
            <div
              className={styles.drawerBackdrop}
              onClick={() => setActiveDrawerCandidate(null)}
              aria-hidden="true"
            />
            <div className={styles.drawer} role="dialog" aria-modal="true" aria-label="Candidate details">
              <div className={styles.drawerHeader}>
                <div className={styles.drawerTitleArea}>
                  <h3>{activeDrawerCandidate.code}</h3>
                  <p>{activeDrawerCandidate.role} • {activeDrawerCandidate.experience}</p>
                </div>
                <button
                  type="button"
                  className={styles.drawerCloseBtn}
                  onClick={() => setActiveDrawerCandidate(null)}
                  aria-label="Close details"
                >
                  ✕
                </button>
              </div>

              <div className={styles.drawerTabs}>
                {(['overview', 'profile', 'evidence', 'files'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`${styles.drawerTabBtn} ${drawerTab === t ? styles.drawerTabBtnActive : ''}`}
                    onClick={() => setDrawerTab(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              <div className={styles.drawerBody}>
                {drawerTab === 'overview' ? (
                  <>
                    <div className={styles.whySection}>
                      <h4>Why VEYQOR recommended this candidate</h4>
                      <p>{activeDrawerCandidate.whyRecommended}</p>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '12px' }}>Criteria match results</h4>
                      <div className={styles.criteriaChecklist}>
                        {activeDrawerCandidate.criteriaChecklist.map((item) => (
                          <div key={item.id} className={styles.checklistRow}>
                            <div className={styles.checkTitleRow}>
                              <span style={{ color: item.status === 'passed' ? '#10b981' : '#f59e0b' }}>
                                {item.status === 'passed' ? '✓' : '●'}
                              </span>
                              <span>{item.title}</span>
                            </div>
                            <p className={styles.checkDesc}>{item.desc}</p>

                            {item.evidence ? (
                              <div>
                                <button
                                  type="button"
                                  className={styles.evidenceToggle}
                                  onClick={() =>
                                    setExpandedEvidenceId((prev) => (prev === item.id ? null : item.id))
                                  }
                                >
                                  {expandedEvidenceId === item.id ? 'Hide evidence ↑' : 'View evidence ↓'}
                                </button>
                                {expandedEvidenceId === item.id ? (
                                  <div
                                    style={{
                                      background: '#f8fafc',
                                      border: '1px solid rgba(60,66,78,0.1)',
                                      borderRadius: '8px',
                                      padding: '10px 12px',
                                      marginTop: '6px',
                                      marginLeft: '24px',
                                      fontSize: '12px',
                                      color: '#475569',
                                    }}
                                  >
                                    <strong>Source evidence:</strong> {item.evidence}
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '20px', color: '#64748b', fontSize: '13px' }}>
                    <p>Detailed {drawerTab} records available in candidate vault.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}

        {/* CONTEXTUAL BULK ACTION BAR */}
        {selectedCandidateIds.size > 0 ? (
          <div className={styles.bulkActionBar}>
            <span className={styles.bulkCount}>{selectedCandidateIds.size} candidates selected</span>
            <button type="button" className={`${styles.bulkBtn} ${styles.bulkBtnGold}`} onClick={handleBulkShortlist}>
              Shortlist selected
            </button>
            <button type="button" className={styles.bulkBtn} onClick={() => setSelectedCandidateIds(new Set())}>
              Deselect
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
