'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockAuthGateway, type AuthSession } from '@/lib/auth/mockAuthGateway';
import editorStyles from '../criteria-editor/page.module.css';
import styles from './page.module.css';

const TENANT_STORAGE_KEY = 'veyqor.mock.tenant-context.v1';
const ORG_STORAGE_KEY = 'veyqor.mock.org-context.v1';

function roleLabel(role: AuthSession['role']) {
  if (role === 'administrator') return 'Administrator';
  if (role === 'reviewer') return 'Reviewer';
  if (role === 'leadership') return 'Leadership/Oversight';
  return 'Recruitment Operator';
}

export default function AiSanitisationPage() {
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
      router.replace('/sign-in');
      return;
    }

    setTenantName(tenant.name);
    setOrgName(org.name);
  }, [router]);

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
              <strong>AI sanitisation</strong>
              <small>Next stage after eligibility review.</small>
            </div>
          </div>

          <div className={editorStyles.topBarRight}>
            <div className={editorStyles.topMeta}>
              <span className={editorStyles.contextLabel}>Workspace context</span>
              <strong>{orgName}</strong>
              <small>{tenantName} · {roleLabel(session.role)}</small>
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

        <section className={styles.panel}>
          <h1>AI sanitisation status</h1>
          <p>This stage follows eligibility review and prepares candidate records for AI evaluation.</p>
        </section>
      </div>
    </main>
  );
}
