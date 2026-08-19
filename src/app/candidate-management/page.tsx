'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockAuthGateway, type AuthSession } from '@/lib/auth/mockAuthGateway';
import intakeStyles from '../job-intake/page.module.css';
import styles from './page.module.css';

type NavItem = {
  id: string;
  label: string;
  href: string;
};

type PipelineStage = 'shortlisted' | 'contacted' | 'screening' | 'interviewing' | 'decision';

type SortKey = 'best_match' | 'most_recent' | 'most_experience' | 'recently_updated';

type MatchCategory = 'strong' | 'good' | 'potential' | 'low';
type ExperienceRange = '8+' | '6-7' | '4-5' | 'under4';
type WorkArrangement = 'remote' | 'hybrid' | 'office';

type ActiveFilters = {
  match: Set<MatchCategory>;
  experience: Set<ExperienceRange>;
  workArrangement: Set<WorkArrangement>;
};

type CandidateItem = {
  id: string;
  name: string;
  initials: string;
  title: string;
  experience: string;
  experienceYears: number;
  location: string;
  matchScore: number;
  stage: PipelineStage;
  nextAction: string;
  updatedAt: string;
  updatedSort: number;
  skills: string[];
  whyMatchBullets: string[];
};

const WORKFLOW_STEPS = [
  'Signal Intake',
  'Criteria',
  'Approval',
  'Candidate Intake',
  'Processing',
  'Review',
  'Candidate Management',
];

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'cases', label: 'Cases', href: '#' },
  { id: 'review', label: 'Review queues', href: '#' },
  { id: 'notifications', label: 'Notifications', href: '#' },
  { id: 'audit', label: 'Audit', href: '#' },
  { id: 'settings', label: 'Settings', href: '#' },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'best_match', label: 'Best match' },
  { key: 'most_recent', label: 'Most recent' },
  { key: 'most_experience', label: 'Most experience' },
  { key: 'recently_updated', label: 'Recently updated' },
];

function getMatchCategory(score: number): MatchCategory {
  if (score >= 90) return 'strong';
  if (score >= 80) return 'good';
  if (score >= 70) return 'potential';
  return 'low';
}

function getMatchLabel(cat: MatchCategory): string {
  if (cat === 'strong') return 'Strong match';
  if (cat === 'good') return 'Good match';
  if (cat === 'potential') return 'Potential match';
  return 'Low match';
}

function getExperienceRange(years: number): ExperienceRange {
  if (years >= 8) return '8+';
  if (years >= 6) return '6-7';
  if (years >= 4) return '4-5';
  return 'under4';
}

function getWorkArrangement(location: string): WorkArrangement {
  const loc = location.toLowerCase();
  if (loc.includes('hybrid')) return 'hybrid';
  if (loc.includes('remote')) return 'remote';
  return 'office';
}

const INITIAL_CANDIDATES: CandidateItem[] = [
  {
    id: 'c1',
    name: 'Ada Nwosu',
    initials: 'AN',
    title: 'Product Designer',
    experience: '8 years',
    experienceYears: 8,
    location: 'Lagos / Remote',
    matchScore: 94,
    stage: 'shortlisted',
    nextAction: 'Contact',
    updatedAt: '18 Aug · 12:35',
    updatedSort: 6,
    skills: ['Product systems', 'Accessibility', 'Design systems', 'Cross-functional'],
    whyMatchBullets: [
      'Strong product design and UX experience',
      'Enterprise SaaS experience',
      'Cross-functional collaboration experience',
    ],
  },
  {
    id: 'c2',
    name: 'David Kalu',
    initials: 'DK',
    title: 'Senior Product Designer',
    experience: '7 years',
    experienceYears: 7,
    location: 'Lagos / Remote',
    matchScore: 91,
    stage: 'contacted',
    nextAction: 'Follow up',
    updatedAt: '18 Aug · 11:10',
    updatedSort: 5,
    skills: ['Product Strategy', 'Design Systems', 'Micro-interactions'],
    whyMatchBullets: [
      'Proven lead designer across multiple fintech products',
      'Solid systems architecture background',
      'High collaboration scores',
    ],
  },
  {
    id: 'c3',
    name: 'Sarah Kalu',
    initials: 'SK',
    title: 'Product Designer',
    experience: '6 years',
    experienceYears: 6,
    location: 'Remote',
    matchScore: 88,
    stage: 'screening',
    nextAction: 'Review response',
    updatedAt: '18 Aug · 10:45',
    updatedSort: 4,
    skills: ['UX Research', 'Figma', 'Prototyping'],
    whyMatchBullets: [
      'Extensive research focus',
      'Strong portfolio of workflow optimizations',
    ],
  },
  {
    id: 'c4',
    name: 'Michael Adebayo',
    initials: 'MA',
    title: 'Senior UX Specialist',
    experience: '8 years',
    experienceYears: 8,
    location: 'Lagos / Hybrid',
    matchScore: 86,
    stage: 'shortlisted',
    nextAction: 'Contact',
    updatedAt: '17 Aug · 16:20',
    updatedSort: 3,
    skills: ['Design Tokens', 'Design Systems', 'SaaS'],
    whyMatchBullets: [
      'Deep expertise in tokenized design workflows',
      'Strong technical coordination',
    ],
  },
  {
    id: 'c5',
    name: 'Elena Rostova',
    initials: 'ER',
    title: 'Lead Product Designer',
    experience: '9 years',
    experienceYears: 9,
    location: 'Remote',
    matchScore: 92,
    stage: 'contacted',
    nextAction: 'Follow up',
    updatedAt: '17 Aug · 14:15',
    updatedSort: 2,
    skills: ['Design Systems', 'UX Architecture', 'B2B Platforms'],
    whyMatchBullets: [
      'Extensive B2B platform architecture',
      'Strong design system governance experience',
    ],
  },
  {
    id: 'c6',
    name: 'Marcus Vance',
    initials: 'MV',
    title: 'Staff Product Architect',
    experience: '10 years',
    experienceYears: 10,
    location: 'Remote',
    matchScore: 89,
    stage: 'shortlisted',
    nextAction: 'Contact',
    updatedAt: '17 Aug · 09:30',
    updatedSort: 1,
    skills: ['Enterprise SaaS', 'Complex workflows', 'Design Operations'],
    whyMatchBullets: [
      'Over 10 years experience in complex SaaS platforms',
      'Strong audit and compliance workflow design',
    ],
  },
];

const EMPTY_FILTERS: ActiveFilters = {
  match: new Set(),
  experience: new Set(),
  workArrangement: new Set(),
};

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

export default function CandidateManagementPage() {
  const router = useRouter();

  const [session, setSession] = useState<AuthSession | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [orgName, setOrgName] = useState('');

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [candidates] = useState<CandidateItem[]>(INITIAL_CANDIDATES);
  const [activeStageTab, setActiveStageTab] = useState<PipelineStage | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [activeDrawerCandidate, setActiveDrawerCandidate] = useState<CandidateItem | null>(null);
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>('best_match');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Filter state
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ActiveFilters>(EMPTY_FILTERS);
  const [pendingFilters, setPendingFilters] = useState<ActiveFilters>(EMPTY_FILTERS);

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

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!showSortDropdown) return;
    const handler = () => setShowSortDropdown(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showSortDropdown]);

  const counts = useMemo(() => {
    return {
      shortlisted: candidates.filter((c) => c.stage === 'shortlisted').length,
      contacted: candidates.filter((c) => c.stage === 'contacted').length,
      screening: candidates.filter((c) => c.stage === 'screening').length,
      interviewing: candidates.filter((c) => c.stage === 'interviewing').length,
      decision: candidates.filter((c) => c.stage === 'decision').length,
    };
  }, [candidates]);

  const activeFilterCount = useMemo(() => {
    return appliedFilters.match.size + appliedFilters.experience.size + appliedFilters.workArrangement.size;
  }, [appliedFilters]);

  const activeFilterChips = useMemo(() => {
    const chips: { label: string; group: keyof ActiveFilters; value: string }[] = [];
    appliedFilters.match.forEach((v) => chips.push({ label: getMatchLabel(v), group: 'match', value: v }));
    appliedFilters.experience.forEach((v) => {
      const labels: Record<ExperienceRange, string> = { '8+': '8+ years', '6-7': '6–7 years', '4-5': '4–5 years', 'under4': 'Under 4 years' };
      chips.push({ label: labels[v], group: 'experience', value: v });
    });
    appliedFilters.workArrangement.forEach((v) => {
      const labels: Record<WorkArrangement, string> = { remote: 'Remote', hybrid: 'Hybrid', office: 'Office-based' };
      chips.push({ label: labels[v], group: 'workArrangement', value: v });
    });
    return chips;
  }, [appliedFilters]);

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let result = candidates.filter((c) => {
      // Stage tab
      if (activeStageTab !== 'all' && c.stage !== activeStageTab) return false;
      // Search
      if (q) {
        const haystack = [c.name, c.title, c.location, ...c.skills].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      // Match filter
      if (appliedFilters.match.size > 0 && !appliedFilters.match.has(getMatchCategory(c.matchScore))) return false;
      // Experience filter
      if (appliedFilters.experience.size > 0 && !appliedFilters.experience.has(getExperienceRange(c.experienceYears))) return false;
      // Work arrangement filter
      if (appliedFilters.workArrangement.size > 0 && !appliedFilters.workArrangement.has(getWorkArrangement(c.location))) return false;
      return true;
    });

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case 'best_match': return b.matchScore - a.matchScore;
        case 'most_recent': return b.updatedSort - a.updatedSort;
        case 'most_experience': return b.experienceYears - a.experienceYears;
        case 'recently_updated': return b.updatedSort - a.updatedSort;
        default: return 0;
      }
    });
    return result;
  }, [candidates, activeStageTab, searchQuery, appliedFilters, sortKey]);

  const hasAnyFilter = activeFilterCount > 0 || searchQuery.trim() !== '';

  function togglePendingFilter<K extends keyof ActiveFilters>(group: K, value: ActiveFilters[K] extends Set<infer U> ? U : never) {
    setPendingFilters((prev) => {
      const next = { ...prev, [group]: new Set(prev[group]) };
      const s = next[group] as Set<typeof value>;
      if (s.has(value)) s.delete(value); else s.add(value);
      return next;
    });
  }

  function applyFilters() {
    setAppliedFilters(pendingFilters);
    setShowFilterPopover(false);
  }

  function openFilterPopover() {
    setPendingFilters({
      match: new Set(appliedFilters.match),
      experience: new Set(appliedFilters.experience),
      workArrangement: new Set(appliedFilters.workArrangement),
    });
    setShowFilterPopover(true);
  }

  const clearAllFilters = useCallback(() => {
    setAppliedFilters(EMPTY_FILTERS);
    setPendingFilters(EMPTY_FILTERS);
  }, []);

  function removeFilterChip(group: keyof ActiveFilters, value: string) {
    setAppliedFilters((prev) => {
      const next = { ...prev, [group]: new Set(prev[group]) };
      (next[group] as Set<string>).delete(value);
      return next;
    });
  }

  function toggleSelectCandidate(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleActionClick(candidate: CandidateItem, e: React.MouseEvent) {
    e.stopPropagation();
    setActiveDrawerCandidate(candidate);
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
        {/* MOBILE HEADER */}
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
                const isComplete = index < 6;
                const isActive = index === 6;
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
              <span className={styles.eyebrow}>CANDIDATE MANAGEMENT</span>
              <h1 className={styles.mainTitle}>Candidates</h1>
              <p className={styles.mainSubtitle}>
                Manage your shortlisted candidates and move them through the hiring process.
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
                <span>Lagos or remote</span>
              </div>
            </header>

            {/* CANDIDATE SUMMARY SURFACE */}
            <div className={styles.summarySurface}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryNumber}>{counts.shortlisted}</span>
                <span className={styles.summaryLabel}>Shortlisted</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryNumber}>{counts.contacted}</span>
                <span className={styles.summaryLabel}>Contacted</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryNumber}>{counts.screening}</span>
                <span className={styles.summaryLabel}>Screening</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryNumber}>{counts.interviewing}</span>
                <span className={styles.summaryLabel}>Interviewing</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryNumber}>{counts.decision}</span>
                <span className={styles.summaryLabel}>Decision</span>
              </div>
            </div>

            {/* NEEDS YOUR ATTENTION BOX */}
            <div className={styles.attentionBanner}>
              <div className={styles.attentionLeft}>
                <span className={styles.attentionIcon}>!</span>
                <div>
                  <h4 className={styles.attentionTitle}>Needs your attention</h4>
                  <p className={styles.attentionDesc}>
                    2 candidates need action: 1 candidate replied &amp; 1 follow-up is due.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.reviewNowBtn}
                onClick={() => setActiveStageTab('screening')}
              >
                Review now →
              </button>
            </div>

            {/* MAIN CANDIDATE PIPELINE WORKSPACE */}
            <div className={styles.pipelineWorkspace}>
              <div className={styles.pipelineHeaderRow}>
                <div className={styles.pipelineHeaderLeft}>
                  <h2>Candidate pipeline</h2>
                  <p>Ranked by match to your approved hiring criteria.</p>
                </div>
                <div className={styles.pipelineControls}>
                  <input
                    type="text"
                    placeholder="Search candidates..."
                    className={styles.searchInput}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  {/* SORT DROPDOWN */}
                  <div className={styles.sortWrapper}>
                    <button
                      type="button"
                      className={styles.sortBtn}
                      onClick={(e) => { e.stopPropagation(); setShowSortDropdown((p) => !p); }}
                    >
                      <span>Sort: {SORT_OPTIONS.find((o) => o.key === sortKey)?.label}</span>
                      <span style={{ fontSize: '10px' }}>▼</span>
                    </button>
                    {showSortDropdown ? (
                      <div className={styles.sortDropdown} onClick={(e) => e.stopPropagation()}>
                        {SORT_OPTIONS.map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            className={`${styles.sortOption} ${sortKey === opt.key ? styles.sortOptionActive : ''}`}
                            onClick={() => { setSortKey(opt.key); setShowSortDropdown(false); }}
                          >
                            <span>{opt.label}</span>
                            {sortKey === opt.key ? <span>✓</span> : null}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {/* FILTER BUTTON */}
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className={`${styles.filterBtn} ${activeFilterCount > 0 ? styles.filterBtnActive : ''}`}
                      onClick={openFilterPopover}
                    >
                      Filter
                      {activeFilterCount > 0 ? <span className={styles.filterBadgeCount}>{activeFilterCount}</span> : null}
                    </button>

                    {/* FILTER POPOVER */}
                    {showFilterPopover ? (
                      <>
                        <div className={styles.filterPopoverBackdrop} onClick={() => setShowFilterPopover(false)} />
                        <div className={styles.filterPopover}>
                          <div className={styles.filterPopoverHeader}>
                            <span className={styles.filterPopoverTitle}>Filters</span>
                            <button type="button" className={styles.filterClearAllBtn} onClick={() => setPendingFilters(EMPTY_FILTERS)}>Clear all</button>
                          </div>

                          <div className={styles.filterPopoverBody}>
                            {/* MATCH FILTER GROUP */}
                            <div className={styles.filterGroup}>
                              <span className={styles.filterGroupLabel}>Match</span>
                              {(['strong', 'good', 'potential', 'low'] as MatchCategory[]).map((val) => (
                                <label key={val} className={styles.filterCheckboxRow}>
                                  <input
                                    type="checkbox"
                                    checked={pendingFilters.match.has(val)}
                                    onChange={() => togglePendingFilter('match', val)}
                                  />
                                  <span>{getMatchLabel(val)}</span>
                                </label>
                              ))}
                            </div>

                            {/* EXPERIENCE FILTER GROUP */}
                            <div className={styles.filterGroup}>
                              <span className={styles.filterGroupLabel}>Experience</span>
                              {([['8+', '8+ years'], ['6-7', '6–7 years'], ['4-5', '4–5 years'], ['under4', 'Under 4 years']] as [ExperienceRange, string][]).map(([val, label]) => (
                                <label key={val} className={styles.filterCheckboxRow}>
                                  <input
                                    type="checkbox"
                                    checked={pendingFilters.experience.has(val)}
                                    onChange={() => togglePendingFilter('experience', val)}
                                  />
                                  <span>{label}</span>
                                </label>
                              ))}
                            </div>

                            {/* WORK ARRANGEMENT FILTER GROUP */}
                            <div className={styles.filterGroup}>
                              <span className={styles.filterGroupLabel}>Work arrangement</span>
                              {([['remote', 'Remote'], ['hybrid', 'Hybrid'], ['office', 'Office-based']] as [WorkArrangement, string][]).map(([val, label]) => (
                                <label key={val} className={styles.filterCheckboxRow}>
                                  <input
                                    type="checkbox"
                                    checked={pendingFilters.workArrangement.has(val)}
                                    onChange={() => togglePendingFilter('workArrangement', val)}
                                  />
                                  <span>{label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className={styles.filterPopoverFooter}>
                            <button type="button" className={styles.filterClearAllBtn} onClick={() => setPendingFilters(EMPTY_FILTERS)}>Clear all</button>
                            <button type="button" className={styles.applyFiltersBtn} onClick={applyFilters}>Apply filters</button>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    className={styles.addCandidateBtn}
                    onClick={() => router.push('/candidate-ingestion')}
                  >
                    + Add candidates
                  </button>
                </div>
              </div>

              {/* HORIZONTAL STAGE TABS */}
              <div className={styles.stageTabsRow} role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeStageTab === 'all'}
                  className={`${styles.stageTabBtn} ${activeStageTab === 'all' ? styles.stageTabBtnActive : ''}`}
                  onClick={() => setActiveStageTab('all')}
                >
                  <span>All</span>
                  <span className={`${styles.stageBadge} ${activeStageTab === 'all' ? styles.stageBadgeActive : ''}`}>
                    {candidates.length}
                  </span>
                </button>
                {(['shortlisted', 'contacted', 'screening', 'interviewing', 'decision'] as const).map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    role="tab"
                    aria-selected={activeStageTab === stage}
                    className={`${styles.stageTabBtn} ${activeStageTab === stage ? styles.stageTabBtnActive : ''}`}
                    onClick={() => setActiveStageTab(stage)}
                  >
                    <span>{stage.charAt(0).toUpperCase() + stage.slice(1)}</span>
                    <span className={`${styles.stageBadge} ${activeStageTab === stage ? styles.stageBadgeActive : ''}`}>
                      {counts[stage]}
                    </span>
                  </button>
                ))}
              </div>

              {/* ACTIVE FILTER CHIPS */}
              {activeFilterChips.length > 0 ? (
                <div className={styles.filterChipsRow}>
                  {activeFilterChips.map((chip) => (
                    <span key={`${chip.group}-${chip.value}`} className={styles.filterChip}>
                      {chip.label}
                      <button type="button" className={styles.chipRemove} onClick={() => removeFilterChip(chip.group, chip.value)} aria-label={`Remove ${chip.label} filter`}>×</button>
                    </span>
                  ))}
                  <button type="button" className={styles.chipClearAll} onClick={clearAllFilters}>Clear all</button>
                </div>
              ) : null}

              {/* CANDIDATE COUNT */}
              <div className={styles.candidateCountRow}>
                <span className={styles.candidateCountText}>
                  <strong>{filteredCandidates.length}</strong>
                  {hasAnyFilter || activeStageTab !== 'all'
                    ? ` of ${candidates.length} candidates`
                    : ' candidates'}
                  {searchQuery.trim() ? ` matching "${searchQuery.trim()}"` : ''}
                </span>
              </div>

              {/* CANDIDATE LIST ROWS */}
              <div className={styles.candidateList}>
                {filteredCandidates.map((candidate) => {
                  const isSelected = selectedIds.has(candidate.id);
                  const matchCat = getMatchCategory(candidate.matchScore);
                  return (
                    <div
                      key={candidate.id}
                      className={styles.candidateRow}
                      onClick={() => setActiveDrawerCandidate(candidate)}
                    >
                      <div className={styles.candidateIdentity}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={isSelected}
                          onChange={() => { /* controlled */ }}
                          onClick={(e) => toggleSelectCandidate(candidate.id, e)}
                          aria-label={`Select ${candidate.name}`}
                        />
                        <div className={styles.avatar}>{candidate.initials}</div>
                        <div className={styles.nameMeta}>
                          <h4>{candidate.name}</h4>
                          <p>{candidate.title} • {candidate.experience} • {candidate.location}</p>
                        </div>
                      </div>

                      <div className={styles.matchBox}>
                        <div className={styles.matchCircle}>{candidate.matchScore}%</div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: matchCat === 'strong' ? '#059669' : matchCat === 'good' ? '#0284c7' : '#b45309' }}>
                          {getMatchLabel(matchCat)}
                        </span>
                      </div>

                      <div>
                        <span className={styles.stagePill}>
                          {candidate.stage.charAt(0).toUpperCase() + candidate.stage.slice(1)}
                        </span>
                      </div>

                      <div>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={(e) => handleActionClick(candidate, e)}
                        >
                          {candidate.nextAction}
                        </button>
                      </div>

                      <span className={styles.updatedText}>{candidate.updatedAt}</span>

                      <span style={{ color: '#94a3b8', fontSize: '14px' }}>•••</span>
                    </div>
                  );
                })}

                {filteredCandidates.length === 0 ? (
                  <div className={styles.emptyFilterState}>
                    <h4 className={styles.emptyFilterTitle}>No candidates match these filters</h4>
                    <p className={styles.emptyFilterDesc}>
                      Try removing a filter or broadening your search.
                    </p>
                    <button type="button" className={styles.clearFiltersBtn} onClick={() => { clearAllFilters(); setSearchQuery(''); setActiveStageTab('all'); }}>Clear filters</button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* CANDIDATE DETAILS DRAWER */}
        {activeDrawerCandidate ? (
          <>
            <div
              className={styles.drawerBackdrop}
              onClick={() => setActiveDrawerCandidate(null)}
              aria-hidden="true"
            />
            <div className={styles.drawer} role="dialog" aria-modal="true">
              <div className={styles.drawerHeader}>
                <div className={styles.drawerTitleArea}>
                  <h3>{activeDrawerCandidate.name}</h3>
                  <p>{activeDrawerCandidate.title} • {activeDrawerCandidate.experience} • {activeDrawerCandidate.location}</p>
                  <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '12px', fontWeight: 700, color: '#059669' }}>
                    {activeDrawerCandidate.matchScore}% match
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.drawerCloseBtn}
                  onClick={() => setActiveDrawerCandidate(null)}
                >
                  ✕
                </button>
              </div>

              <div className={styles.drawerBody}>
                {/* RECOMMENDED NEXT STEP */}
                <div className={styles.nextStepBox}>
                  <span className={styles.nextStepTitle}>Recommended next step</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#10131d' }}>
                    {activeDrawerCandidate.nextAction} candidate
                  </span>
                  <p className={styles.nextStepDesc}>
                    Introduce the opportunity and invite {activeDrawerCandidate.name.split(' ')[0]} to continue.
                  </p>
                  <button type="button" className={styles.purplePrimaryBtn}>
                    {activeDrawerCandidate.nextAction} candidate →
                  </button>
                </div>

                {/* WHY THEY MATCH */}
                <div className={styles.whyMatchSection}>
                  <h4>Why they match</h4>
                  <div className={styles.whyMatchBullets}>
                    {activeDrawerCandidate.whyMatchBullets.map((bullet) => (
                      <div key={bullet} style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PROGRESSIVE DISCLOSURE ACCORDIONS */}
                <div style={{ display: 'grid', gap: '10px' }}>
                  {/* ACCORDION 1: EXPERIENCE */}
                  <div className={styles.drawerAccordion}>
                    <button
                      type="button"
                      className={styles.drawerAccordionHeader}
                      onClick={() => setExpandedAccordion((prev) => (prev === 'exp' ? null : 'exp'))}
                    >
                      <span>Experience</span>
                      <span>{expandedAccordion === 'exp' ? '▲' : '▼'}</span>
                    </button>
                    {expandedAccordion === 'exp' ? (
                      <div className={styles.drawerAccordionBody}>
                        <p><strong>{activeDrawerCandidate.experience} product design experience</strong></p>
                        <p>Enterprise SaaS platforms &amp; complex workflows.</p>
                      </div>
                    ) : null}
                  </div>

                  {/* ACCORDION 2: SKILLS */}
                  <div className={styles.drawerAccordion}>
                    <button
                      type="button"
                      className={styles.drawerAccordionHeader}
                      onClick={() => setExpandedAccordion((prev) => (prev === 'skills' ? null : 'skills'))}
                    >
                      <span>Skills</span>
                      <span>{expandedAccordion === 'skills' ? '▲' : '▼'}</span>
                    </button>
                    {expandedAccordion === 'skills' ? (
                      <div className={styles.drawerAccordionBody}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {activeDrawerCandidate.skills.map((s) => (
                            <span key={s} style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontSize: '12px' }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* ACCORDION 3: EVALUATION SUMMARY */}
                  <div className={styles.drawerAccordion}>
                    <button
                      type="button"
                      className={styles.drawerAccordionHeader}
                      onClick={() => setExpandedAccordion((prev) => (prev === 'eval' ? null : 'eval'))}
                    >
                      <span>Evaluation summary</span>
                      <span>{expandedAccordion === 'eval' ? '▲' : '▼'}</span>
                    </button>
                    {expandedAccordion === 'eval' ? (
                      <div className={styles.drawerAccordionBody}>
                        <p>Strong alignment with the approved product design criteria.</p>
                        <p>4 of 5 required criteria verified.</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {/* CONTEXTUAL BULK ACTION BAR */}
        {selectedIds.size > 0 ? (
          <div className={styles.bulkActionBar}>
            <span className={styles.bulkCount}>{selectedIds.size} candidates selected</span>
            <button type="button" className={styles.bulkBtn}>Contact</button>
            <button type="button" className={styles.bulkBtn}>Move stage</button>
            <button type="button" className={styles.bulkBtn} onClick={() => setSelectedIds(new Set())}>
              Deselect
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
