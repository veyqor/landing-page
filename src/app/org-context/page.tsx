'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  mockAuthGateway,
  type AuthSession,
  type OrganizationContext,
  type WorkspaceTenant,
} from '@/lib/auth/mockAuthGateway';
import styles from './org-context.module.css';

const TENANT_STORAGE_KEY = 'veyqor.mock.tenant-context.v1';
const ORG_STORAGE_KEY = 'veyqor.mock.org-context.v1';
const TENANT_SEARCH_THRESHOLD = 5;

type LoadState = 'loading' | 'success' | 'empty' | 'error';

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.2 4.2L19 7" />
    </svg>
  );
}

export default function OrgContextPage() {
  const router = useRouter();

  const [session, setSession] = useState<AuthSession | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState('');
  const [tenants, setTenants] = useState<WorkspaceTenant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [selectedOrganisationId, setSelectedOrganisationId] = useState('');
  const [isContinuing, setIsContinuing] = useState(false);

  const roleLabel = useMemo(() => {
    if (!session) {
      return '';
    }

    if (session.role === 'administrator') return 'Administrator';
    if (session.role === 'reviewer') return 'Reviewer';
    if (session.role === 'leadership') return 'Leadership/Oversight';
    return 'Recruitment Operator';
  }, [session]);

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === selectedTenantId) ?? null,
    [tenants, selectedTenantId]
  );

  const selectedOrganisation = useMemo(() => {
    if (!selectedTenant) {
      return null;
    }
    return selectedTenant.organisations.find((org) => org.id === selectedOrganisationId) ?? null;
  }, [selectedOrganisationId, selectedTenant]);

  const filteredTenants = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return tenants;
    }

    return tenants.filter((tenant) => {
      return (
        tenant.name.toLowerCase().includes(normalized)
        || tenant.organisationType.toLowerCase().includes(normalized)
        || tenant.descriptor.toLowerCase().includes(normalized)
      );
    });
  }, [searchTerm, tenants]);

  const canContinue = Boolean(selectedTenant && selectedOrganisation);

  const shouldShowSearch = tenants.length >= TENANT_SEARCH_THRESHOLD;

  function hydrateSelectionFromStorage(nextTenants: WorkspaceTenant[]) {
    const storedTenantId = window.localStorage.getItem(TENANT_STORAGE_KEY) ?? '';
    const fallbackTenant = nextTenants[0] ?? null;
    const activeTenant = nextTenants.find((tenant) => tenant.id === storedTenantId) ?? fallbackTenant;

    if (!activeTenant) {
      setSelectedTenantId('');
      setSelectedOrganisationId('');
      return;
    }

    setSelectedTenantId(activeTenant.id);

    const storedOrgId = window.localStorage.getItem(ORG_STORAGE_KEY) ?? '';
    const autoOrganisation = activeTenant.organisations[0] ?? null;
    const activeOrganisation = activeTenant.organisations.find((org) => org.id === storedOrgId) ?? autoOrganisation;

    setSelectedOrganisationId(activeOrganisation?.id ?? '');
  }

  async function loadWorkspaceContexts(activeSession: AuthSession) {
    setLoadState('loading');
    setLoadError('');

    const result = await mockAuthGateway.getWorkspaceContexts(activeSession);

    if (result.kind === 'error') {
      setLoadState('error');
      setLoadError(result.message);
      setTenants([]);
      return;
    }

    if (result.kind === 'empty') {
      setLoadState('empty');
      setTenants([]);
      setSelectedTenantId('');
      setSelectedOrganisationId('');
      return;
    }

    setTenants(result.tenants);
    hydrateSelectionFromStorage(result.tenants);
    setLoadState('success');
  }

  useEffect(() => {
    const activeSession = mockAuthGateway.getSession();
    if (!activeSession) {
      router.replace('/sign-in');
      return;
    }

    setSession(activeSession);
    void loadWorkspaceContexts(activeSession);
  }, [router]);

  if (!session) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.loadingSurface}>
            <span className={styles.kicker}>SESSION CHECK</span>
            <p>Verifying authenticated session...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topBar}>
          <Image
            src="/Untitled design - 2026-08-10T155155.182.png"
            alt="Veyqor"
            width={146}
            height={38}
            priority
            className={styles.mark}
          />
          <div className={styles.userMeta}>
            <span className={styles.userName}>{session.fullName}</span>
            <span className={styles.userRole}>{roleLabel}</span>
          </div>
        </header>

        <section className={styles.panel} aria-label="Tenant and organisation context selector">
          <header className={styles.header}>
            <p className={styles.kicker}>Workspace Context</p>
            <h1>Choose your workspace</h1>
            <p className={styles.subtext}>
              Select the organisation context you want to work in. Your selection determines the cases, permissions,
              policies, and activity available to you.
            </p>
            <p className={styles.subtleNote}>Workspace access is governed by your assigned permissions.</p>
          </header>

          {loadState === 'loading' ? (
            <div className={styles.skeletonStack} aria-hidden="true">
              <span className={styles.skeletonTitle} />
              <span className={styles.skeletonLine} />
              <span className={styles.skeletonCard} />
              <span className={styles.skeletonCard} />
              <span className={styles.skeletonCardSmall} />
            </div>
          ) : null}

          {loadState === 'error' ? (
            <section className={styles.feedback} role="alert" aria-live="assertive">
              <h2>We couldn&apos;t load your workspaces</h2>
              <p>{loadError || 'Try again to retrieve your available contexts.'}</p>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => {
                  void loadWorkspaceContexts(session);
                }}
              >
                Try again
              </button>
            </section>
          ) : null}

          {loadState === 'empty' ? (
            <section className={styles.feedback}>
              <h2>No workspace is available for this account</h2>
              <p>Your account is authenticated, but no tenant or organisation context is currently assigned.</p>
              <a className={styles.inlineAction} href="mailto:admin@veyqor.internal?subject=Workspace%20access%20request">
                Contact administrator
              </a>
            </section>
          ) : null}

          {loadState === 'success' ? (
            <>
              <section className={styles.block} aria-label="Tenant selection">
                <div className={styles.blockHeader}>
                  <h2>Tenant</h2>
                  <span>{tenants.length} available</span>
                </div>

                {shouldShowSearch ? (
                  <label className={styles.searchField}>
                    <SearchIcon />
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search workspace"
                    />
                  </label>
                ) : null}

                <div className={styles.tenantGrid} role="radiogroup" aria-label="Tenant choices">
                  {filteredTenants.map((tenant) => {
                    const selected = tenant.id === selectedTenantId;
                    return (
                      <button
                        key={tenant.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={`${styles.tenantCard} ${selected ? styles.tenantCardActive : ''}`}
                        onClick={() => {
                          setSelectedTenantId(tenant.id);
                          const fallbackOrg = tenant.organisations[0]?.id ?? '';
                          setSelectedOrganisationId(fallbackOrg);
                        }}
                      >
                        <div className={styles.tenantTop}>
                          <div>
                            <strong>{tenant.name}</strong>
                            <p>{tenant.descriptor}</p>
                          </div>
                          {selected ? <span className={styles.selectedBadge}><CheckIcon /> Selected</span> : null}
                        </div>
                        <div className={styles.tenantMeta}>
                          <span>{tenant.organisationType}</span>
                          <span>{tenant.environment}</span>
                          <span>{tenant.organisations.length} context{tenant.organisations.length > 1 ? 's' : ''}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {!filteredTenants.length ? <p className={styles.emptyHint}>No tenant matches your search.</p> : null}
              </section>

              {selectedTenant ? (
                <section className={styles.block} aria-label="Organisation context selection">
                  <div className={styles.blockHeader}>
                    <h2>Organisation context</h2>
                    <span>{selectedTenant.name}</span>
                  </div>

                  <div className={styles.orgList} role="radiogroup" aria-label="Organisation context choices">
                    {selectedTenant.organisations.map((org: OrganizationContext) => {
                      const selected = org.id === selectedOrganisationId;
                      return (
                        <button
                          key={org.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          className={`${styles.orgOption} ${selected ? styles.orgOptionActive : ''}`}
                          onClick={() => setSelectedOrganisationId(org.id)}
                        >
                          <div>
                            <strong>{org.name}</strong>
                            <p>{org.description}</p>
                          </div>
                          <span className={styles.orgRole}>{org.roleLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {selectedTenant && selectedOrganisation ? (
                <section className={styles.contextSummary} aria-label="Selected workspace summary">
                  <p className={styles.summaryKicker}>You&apos;re entering</p>
                  <strong>{selectedOrganisation.name}</strong>
                  <div className={styles.summaryMeta}>
                    <span><b>Tenant</b>{selectedTenant.name}</span>
                    <span><b>Access</b>{selectedOrganisation.roleLabel}</span>
                  </div>
                </section>
              ) : null}

              <div className={styles.row}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    mockAuthGateway.clearSession();
                    window.localStorage.removeItem(TENANT_STORAGE_KEY);
                    window.localStorage.removeItem(ORG_STORAGE_KEY);
                    router.replace('/sign-in');
                  }}
                  disabled={isContinuing}
                >
                  Back to sign in
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => {
                    if (!selectedTenant || !selectedOrganisation) {
                      return;
                    }

                    setIsContinuing(true);
                    window.localStorage.setItem(TENANT_STORAGE_KEY, selectedTenant.id);
                    window.localStorage.setItem(ORG_STORAGE_KEY, selectedOrganisation.id);
                    router.push('/dashboard');
                  }}
                  disabled={!canContinue || isContinuing}
                >
                  {isContinuing ? 'Entering workspace...' : 'Continue to VEYQOR'}
                </button>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}
