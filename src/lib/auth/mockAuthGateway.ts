export type OperatorRole = 'operator' | 'reviewer' | 'administrator' | 'leadership';

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'account_locked'
  | 'mfa_incorrect_code'
  | 'mfa_code_expired'
  | 'mfa_challenge_missing';

export interface AuthSession {
  sessionId: string;
  userId: string;
  fullName: string;
  email: string;
  role: OperatorRole;
  signedInAt: string;
  tenantChoices: string[];
  workspaceTenants: WorkspaceTenant[];
}

export interface OrganizationContext {
  id: string;
  name: string;
  roleLabel: string;
  description: string;
}

export interface WorkspaceTenant {
  id: string;
  name: string;
  organisationType: string;
  descriptor: string;
  environment: 'Production' | 'Staging';
  organisations: OrganizationContext[];
}

export type WorkspaceContextResult =
  | { kind: 'success'; tenants: WorkspaceTenant[] }
  | { kind: 'empty' }
  | { kind: 'error'; message: string };

export interface SignInSuccess {
  kind: 'success';
  session: AuthSession;
}

export interface SignInMfaRequired {
  kind: 'mfa_required';
  challengeId: string;
  email: string;
  message: string;
}

export interface AuthFailure {
  kind: 'error';
  code: AuthErrorCode;
  message: string;
}

export type SignInResult = SignInSuccess | SignInMfaRequired | AuthFailure;
export type VerifyMfaResult = SignInSuccess | AuthFailure;

export interface AuthGateway {
  signIn(email: string, password: string): Promise<SignInResult>;
  verifyMfa(challengeId: string, code: string): Promise<VerifyMfaResult>;
  getWorkspaceContexts(session: AuthSession): Promise<WorkspaceContextResult>;
  getSession(): AuthSession | null;
  persistSession(session: AuthSession): void;
  clearSession(): void;
}

interface SeedAccount {
  userId: string;
  fullName: string;
  email: string;
  role: OperatorRole;
  password: string;
  isLocked: boolean;
  mfaEnabled: boolean;
  mfaCode?: string;
  workspaceTenants: WorkspaceTenant[];
  simulateWorkspaceLoadFailure?: boolean;
}

interface MfaChallenge {
  challengeId: string;
  email: string;
  expiresAtMs: number;
}

const SESSION_STORAGE_KEY = 'veyqor.mock.session.v1';

const SEED_ACCOUNTS: SeedAccount[] = [
  {
    userId: 'op_001',
    fullName: 'Maya Okafor',
    email: 'operator@veyqor.internal',
    role: 'operator',
    password: 'Operator#2026',
    isLocked: false,
    mfaEnabled: false,
    workspaceTenants: [
      {
        id: 'tenant_veyqor_hq',
        name: 'Veyqor HQ',
        organisationType: 'Enterprise Group',
        descriptor: 'Core governance workspace',
        environment: 'Production',
        organisations: [
          {
            id: 'org_hq_recruitment',
            name: 'Recruitment Operations',
            roleLabel: 'Recruitment Operator',
            description: 'Candidate screening and pipeline execution',
          },
          {
            id: 'org_hq_quality',
            name: 'Quality Review Office',
            roleLabel: 'Recruitment Operator',
            description: 'Exception handling and quality control',
          },
        ],
      },
      {
        id: 'tenant_northbridge',
        name: 'Northbridge Talent Group',
        organisationType: 'Partner Tenant',
        descriptor: 'Regional delivery workspace',
        environment: 'Production',
        organisations: [
          {
            id: 'org_northbridge_ops',
            name: 'Northbridge Operations',
            roleLabel: 'Recruitment Operator',
            description: 'Client delivery and shortlisting workflows',
          },
        ],
      },
    ],
  },
  {
    userId: 'rv_002',
    fullName: 'Daniel Mensah',
    email: 'reviewer@veyqor.internal',
    role: 'reviewer',
    password: 'Reviewer#2026',
    isLocked: false,
    mfaEnabled: false,
    workspaceTenants: [
      {
        id: 'tenant_veyqor_hq',
        name: 'Veyqor HQ',
        organisationType: 'Enterprise Group',
        descriptor: 'Core governance workspace',
        environment: 'Production',
        organisations: [
          {
            id: 'org_hq_review',
            name: 'Governance Review Board',
            roleLabel: 'Reviewer',
            description: 'Policy checks and adverse decision review',
          },
        ],
      },
    ],
  },
  {
    userId: 'ad_003',
    fullName: 'Lena Hoffmann',
    email: 'admin@veyqor.internal',
    role: 'administrator',
    password: 'Admin#2026',
    isLocked: false,
    mfaEnabled: true,
    mfaCode: '730241',
    workspaceTenants: [
      {
        id: 'tenant_veyqor_hq',
        name: 'Veyqor HQ',
        organisationType: 'Enterprise Group',
        descriptor: 'Core governance workspace',
        environment: 'Production',
        organisations: [
          {
            id: 'org_hq_admin',
            name: 'Platform Administration',
            roleLabel: 'Administrator',
            description: 'Policy ownership and tenant controls',
          },
          {
            id: 'org_hq_governance',
            name: 'Governance Centre',
            roleLabel: 'Administrator',
            description: 'Audit policy and decision governance configuration',
          },
        ],
      },
      {
        id: 'tenant_asteris',
        name: 'Asteris Health Group',
        organisationType: 'Healthcare Network',
        descriptor: 'Regulated hiring workspace',
        environment: 'Production',
        organisations: [
          {
            id: 'org_asteris_talent',
            name: 'Asteris Talent Acquisition',
            roleLabel: 'Administrator',
            description: 'Healthcare role intake and approvals',
          },
          {
            id: 'org_asteris_compliance',
            name: 'Asteris Compliance Office',
            roleLabel: 'Administrator',
            description: 'Regulatory gating and oversight controls',
          },
        ],
      },
      {
        id: 'tenant_northbridge',
        name: 'Northbridge Talent Group',
        organisationType: 'Partner Tenant',
        descriptor: 'Regional delivery workspace',
        environment: 'Staging',
        organisations: [
          {
            id: 'org_northbridge_admin',
            name: 'Northbridge Admin Desk',
            roleLabel: 'Administrator',
            description: 'Tenant controls and configuration validation',
          },
        ],
      },
    ],
  },
  {
    userId: 'ld_004',
    fullName: 'Samir Patel',
    email: 'leadership@veyqor.internal',
    role: 'leadership',
    password: 'Leadership#2026',
    isLocked: false,
    mfaEnabled: false,
    workspaceTenants: [
      {
        id: 'tenant_veyqor_hq',
        name: 'Veyqor HQ',
        organisationType: 'Enterprise Group',
        descriptor: 'Core governance workspace',
        environment: 'Production',
        organisations: [
          {
            id: 'org_hq_leadership',
            name: 'Executive Oversight',
            roleLabel: 'Leadership/Oversight',
            description: 'Strategic review and governance outcomes',
          },
        ],
      },
      {
        id: 'tenant_asteris',
        name: 'Asteris Health Group',
        organisationType: 'Healthcare Network',
        descriptor: 'Regulated hiring workspace',
        environment: 'Production',
        organisations: [
          {
            id: 'org_asteris_exec',
            name: 'Asteris Executive Oversight',
            roleLabel: 'Leadership/Oversight',
            description: 'Cross-organisation governance and reporting',
          },
        ],
      },
    ],
  },
  {
    userId: 'lk_005',
    fullName: 'Nora Ibrahim',
    email: 'locked@veyqor.internal',
    role: 'operator',
    password: 'Locked#2026',
    isLocked: true,
    mfaEnabled: false,
    workspaceTenants: [
      {
        id: 'tenant_veyqor_hq',
        name: 'Veyqor HQ',
        organisationType: 'Enterprise Group',
        descriptor: 'Core governance workspace',
        environment: 'Production',
        organisations: [
          {
            id: 'org_hq_recruitment',
            name: 'Recruitment Operations',
            roleLabel: 'Recruitment Operator',
            description: 'Candidate screening and pipeline execution',
          },
        ],
      },
    ],
  },
  {
    userId: 'na_006',
    fullName: 'Esi Boateng',
    email: 'noaccess@veyqor.internal',
    role: 'reviewer',
    password: 'NoAccess#2026',
    isLocked: false,
    mfaEnabled: false,
    workspaceTenants: [],
  },
  {
    userId: 'er_007',
    fullName: 'Tarek Solomon',
    email: 'error@veyqor.internal',
    role: 'operator',
    password: 'Error#2026',
    isLocked: false,
    mfaEnabled: false,
    workspaceTenants: [
      {
        id: 'tenant_veyqor_hq',
        name: 'Veyqor HQ',
        organisationType: 'Enterprise Group',
        descriptor: 'Core governance workspace',
        environment: 'Production',
        organisations: [
          {
            id: 'org_hq_recruitment',
            name: 'Recruitment Operations',
            roleLabel: 'Recruitment Operator',
            description: 'Candidate screening and pipeline execution',
          },
        ],
      },
    ],
    simulateWorkspaceLoadFailure: true,
  },
];

const mfaChallenges = new Map<string, MfaChallenge>();

function simulateLatency() {
  return new Promise((resolve) => {
    setTimeout(resolve, 850);
  });
}

function getAccountByEmail(email: string): SeedAccount | undefined {
  return SEED_ACCOUNTS.find((account) => account.email.toLowerCase() === email.toLowerCase().trim());
}

function createSession(account: SeedAccount): AuthSession {
  return {
    sessionId: `session_${Math.random().toString(36).slice(2, 11)}`,
    userId: account.userId,
    fullName: account.fullName,
    email: account.email,
    role: account.role,
    signedInAt: new Date().toISOString(),
    tenantChoices: account.workspaceTenants.map((tenant) => tenant.name),
    workspaceTenants: account.workspaceTenants,
  };
}

function cloneWorkspaceTenants(tenants: WorkspaceTenant[]): WorkspaceTenant[] {
  return tenants.map((tenant) => ({
    ...tenant,
    organisations: tenant.organisations.map((org) => ({ ...org })),
  }));
}

function createMfaChallenge(email: string): string {
  const challengeId = `mfa_${Math.random().toString(36).slice(2, 12)}`;
  const expiresAtMs = Date.now() + 3 * 60 * 1000;
  mfaChallenges.set(challengeId, { challengeId, email, expiresAtMs });
  return challengeId;
}

function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.sessionId || !parsed?.email) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeStoredSession(session: AuthSession) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function removeStoredSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export const mockAuthGateway: AuthGateway = {
  async signIn(email, password) {
    await simulateLatency();

    const account = getAccountByEmail(email);
    if (!account || account.password !== password) {
      return {
        kind: 'error',
        code: 'invalid_credentials',
        message: 'Incorrect email or password. Check your credentials and try again.',
      };
    }

    if (account.isLocked) {
      return {
        kind: 'error',
        code: 'account_locked',
        message: 'This account is locked. Contact a VEYQOR administrator to restore access.',
      };
    }

    if (account.mfaEnabled) {
      const challengeId = createMfaChallenge(account.email);
      return {
        kind: 'mfa_required',
        challengeId,
        email: account.email,
        message: 'Multi-factor verification is required for this account.',
      };
    }

    return {
      kind: 'success',
      session: createSession(account),
    };
  },

  async verifyMfa(challengeId, code) {
    await simulateLatency();

    const challenge = mfaChallenges.get(challengeId);
    if (!challenge) {
      return {
        kind: 'error',
        code: 'mfa_challenge_missing',
        message: 'Verification session expired. Return to sign-in and try again.',
      };
    }

    if (Date.now() > challenge.expiresAtMs) {
      mfaChallenges.delete(challengeId);
      return {
        kind: 'error',
        code: 'mfa_code_expired',
        message: 'This verification code has expired. Request a new sign-in attempt.',
      };
    }

    const account = getAccountByEmail(challenge.email);
    if (!account || !account.mfaCode) {
      mfaChallenges.delete(challengeId);
      return {
        kind: 'error',
        code: 'mfa_challenge_missing',
        message: 'Verification session expired. Return to sign-in and try again.',
      };
    }

    if (account.mfaCode !== code.trim()) {
      return {
        kind: 'error',
        code: 'mfa_incorrect_code',
        message: 'Incorrect verification code. Confirm the code and try again.',
      };
    }

    mfaChallenges.delete(challengeId);
    return {
      kind: 'success',
      session: createSession(account),
    };
  },

  async getWorkspaceContexts(session) {
    await simulateLatency();

    const account = getAccountByEmail(session.email);
    if (!account) {
      return {
        kind: 'error',
        message: "We couldn't validate your workspace access. Sign in again and retry.",
      };
    }

    if (account.simulateWorkspaceLoadFailure) {
      return {
        kind: 'error',
        message: "We couldn't load your workspaces right now.",
      };
    }

    if (!account.workspaceTenants.length) {
      return { kind: 'empty' };
    }

    return {
      kind: 'success',
      tenants: cloneWorkspaceTenants(account.workspaceTenants),
    };
  },

  getSession() {
    return readStoredSession();
  },

  persistSession(session) {
    writeStoredSession(session);
  },

  clearSession() {
    removeStoredSession();
  },
};

export function listPrototypeAccounts() {
  return SEED_ACCOUNTS.map(({ email, password, role, isLocked, mfaEnabled, mfaCode, workspaceTenants, simulateWorkspaceLoadFailure }) => ({
    email,
    password,
    role,
    isLocked,
    mfaEnabled,
    mfaCode: mfaEnabled ? mfaCode : undefined,
    tenantCount: workspaceTenants.length,
    simulateWorkspaceLoadFailure: Boolean(simulateWorkspaceLoadFailure),
  }));
}
