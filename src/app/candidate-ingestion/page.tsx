'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockAuthGateway, type AuthSession } from '@/lib/auth/mockAuthGateway';
import editorStyles from '../criteria-editor/page.module.css';
import styles from './page.module.css';

const TENANT_STORAGE_KEY = 'veyqor.mock.tenant-context.v1';
const ORG_STORAGE_KEY = 'veyqor.mock.org-context.v1';
const WORKFLOW_STEPS = ['Signal Intake', 'Criteria', 'Approval', 'Candidate Ingestion'];

function roleLabel(role: AuthSession['role']) {
  if (role === 'administrator') return 'Administrator';
  if (role === 'reviewer') return 'Reviewer';
  if (role === 'leadership') return 'Leadership/Oversight';
  return 'Recruitment Operator';
}

export default function CandidateIngestionPage() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [orgName, setOrgName] = useState('');

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

  const summary = useMemo(() => {
    if (!session) return '';
    return `${session.fullName} · ${roleLabel(session.role)}`;
  }, [session]);

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
            <Image src="/logo.png" alt="Veyqor" width={146} height={38} priority className={editorStyles.mark} />
            <div className={editorStyles.topDivider} aria-hidden="true" />
            <div className={editorStyles.pageIdentity}>
              <strong>Candidate ingestion</strong>
              <small>Candidate import begins after criteria approval.</small>
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
              <p className={editorStyles.kicker}>Workflow continuation</p>
              <h1>Candidate ingestion</h1>
              <p>Criteria approval is complete. This stage is now ready to accept candidate packets, imports, or other governed intake inputs.</p>
              <p className={editorStyles.pageIdentity}><strong>Approved workflow handoff</strong><small>{summary}</small></p>
            </div>

            <div className={editorStyles.aiDraftReady}>
              <span className={editorStyles.aiPulseDot} aria-hidden="true" />
              <div>
                <strong>Approval unlocked</strong>
                <small>The workflow can proceed without reconfiguring criteria</small>
              </div>
            </div>
          </div>

          <div className={editorStyles.stepper} aria-label="Workflow progress">
            {WORKFLOW_STEPS.map((step, index) => (
              <div key={step} className={`${editorStyles.step} ${index === 3 ? editorStyles.stepActive : ''}`}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.emptyPanel}>
          <div>
            <h2>Candidate intake is ready</h2>
            <p>Criteria approval has completed successfully for the active tenant and organisation context.</p>
          </div>

          <div className={styles.emptyState}>
            <strong>No candidate data has been loaded yet.</strong>
            <p>Import candidate packets here when you are ready to begin governed evaluation and matching.</p>
            <p>This stage intentionally stays empty until the next workflow action begins.</p>
          </div>

          <div className={styles.emptyActions}>
            <button type="button" className={styles.secondaryAction} onClick={() => router.push('/criteria-approval')}>Back to approval</button>
            <button type="button" className={styles.primaryAction} onClick={() => router.push('/dashboard')}>Open workspace dashboard</button>
          </div>
        </section>
      </div>
    </main>
  );
}
