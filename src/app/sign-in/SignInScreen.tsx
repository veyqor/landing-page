'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockAuthGateway, type AuthErrorCode } from '@/lib/auth/mockAuthGateway';
import styles from './sign-in.module.css';

type SignInStep = 'credentials' | 'mfa';

type ScreenError = {
  code: AuthErrorCode;
  message: string;
  scope: SignInStep;
};

function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8.5v4.5" />
      <path d="M12 16.6h.01" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.5l7 2.7v5.7c0 4.7-2.9 8-7 9.8-4.1-1.8-7-5.1-7-9.8V6.2l7-2.7z" />
      <path d="M9.2 12.4l1.9 1.9 3.8-3.9" />
    </svg>
  );
}

function FlowIcon({ kind }: { kind: 'ai' | 'gate' | 'human' | 'audit' }) {
  if (kind === 'ai') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="4.5" y="4.5" width="15" height="15" rx="3" />
        <path d="M8 12h8" />
        <path d="M12 8v8" />
      </svg>
    );
  }

  if (kind === 'gate') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3.5l7 2.7v5.7c0 4.7-2.9 8-7 9.8-4.1-1.8-7-5.1-7-9.8V6.2l7-2.7z" />
      </svg>
    );
  }

  if (kind === 'human') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 18.2c1.8-3.2 4.2-4.8 6.5-4.8s4.7 1.6 6.5 4.8" />
      </svg>
    );
  }

  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v16" />
      <path d="M7 8h10" />
      <path d="M7 16h10" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg className={`${styles.eyeIcon} ${open ? styles.eyeIconOpen : ''}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="3" />
      <path className={styles.eyeSlash} d="M4 4l16 16" />
    </svg>
  );
}

export default function SignInScreen() {
  const router = useRouter();

  const [step, setStep] = useState<SignInStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenError, setScreenError] = useState<ScreenError | null>(null);

  const normalizedEmail = useMemo(
    () => email.trim().replace(/^[\[\(\{<"']+/, '').replace(/[\]\)\}>"']+$/, ''),
    [email]
  );
  const emailIsValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail), [normalizedEmail]);
  const credentialFormValid = emailIsValid && password.length > 0;
  const mfaFormValid = mfaCode.trim().length >= 6;

  const shouldShowError = screenError?.scope === step;

  async function handleCredentialSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    if (!credentialFormValid) {
      setScreenError({
        code: 'invalid_credentials',
        message: 'Enter a valid email address and password to continue.',
        scope: 'credentials',
      });
      return;
    }

    setIsSubmitting(true);
    setScreenError(null);

    const result = await mockAuthGateway.signIn(normalizedEmail, password);

    if (result.kind === 'success') {
      mockAuthGateway.persistSession(result.session);
      router.push('/org-context');
      return;
    }

    if (result.kind === 'mfa_required') {
      setStep('mfa');
      setChallengeId(result.challengeId);
      setMfaCode('');
      setScreenError(null);
      setIsSubmitting(false);
      return;
    }

    setScreenError({
      code: result.code,
      message: result.message,
      scope: 'credentials',
    });
    setIsSubmitting(false);
  }

  async function handleMfaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    if (!challengeId || !mfaFormValid) {
      setScreenError({
        code: 'mfa_incorrect_code',
        message: 'Enter the 6-digit verification code to continue.',
        scope: 'mfa',
      });
      return;
    }

    setIsSubmitting(true);
    setScreenError(null);

    const result = await mockAuthGateway.verifyMfa(challengeId, mfaCode);

    if (result.kind === 'success') {
      mockAuthGateway.persistSession(result.session);
      router.push('/org-context');
      return;
    }

    setScreenError({
      code: result.code,
      message: result.message,
      scope: 'mfa',
    });
    setIsSubmitting(false);
  }

  return (
    <main className={styles.pageRoot}>
      <div className={styles.shell}>
        <aside className={styles.leftPanel}>
          <div className={styles.ambientOrbOne} aria-hidden="true" />
          <div className={styles.ambientOrbTwo} aria-hidden="true" />
          <div className={styles.leftGrid} aria-hidden="true" />
          <div className={styles.leftNoise} aria-hidden="true" />

          <div className={styles.leftInner}>
            <Image
              src="/logo.png"
              alt="Veyqor"
              width={154}
              height={40}
              priority
              className={styles.mark}
            />

            <div className={styles.statementBlock}>
              <h1>
                AI can recommend.
                <br />
                It cannot <span className={styles.goldWord}>decide.</span>
              </h1>
              <p>
                Recommendations are evidence-based, human-reviewed, and governed.
              </p>
              <p>
                Every action is logged to the audit trail from sign-in onward.
              </p>
            </div>

            <div className={styles.governanceFlow} aria-hidden="true">
              <div className={styles.flowStep}>
                <span className={styles.flowIcon}><FlowIcon kind="ai" /></span>
                <span className={styles.flowLabel}>AI Recommendation</span>
              </div>
              <span className={styles.flowConnector} />
              <div className={styles.flowStep}>
                <span className={styles.flowIcon}><FlowIcon kind="gate" /></span>
                <span className={styles.flowLabel}>Governance Gate</span>
              </div>
              <span className={styles.flowConnector} />
              <div className={styles.flowStep}>
                <span className={styles.flowIcon}><FlowIcon kind="human" /></span>
                <span className={styles.flowLabel}>Human Oversight</span>
              </div>
              <span className={styles.flowConnector} />
              <div className={styles.flowStep}>
                <span className={styles.flowIcon}><FlowIcon kind="audit" /></span>
                <span className={styles.flowLabel}>Audit Evidence</span>
              </div>
            </div>

            <div className={styles.systemStatus}>● SYSTEM STATUS: AUDIT TRAIL ENABLED</div>
          </div>
        </aside>

        <section className={styles.rightPanel} aria-label="Operator sign-in">
          <div className={styles.formShell}>
            <header className={styles.formHeader}>
              <h2>Sign in</h2>
              <p>For authorised VEYQOR operators. Access is provisioned by your administrator.</p>
            </header>

            <div className={styles.stageWrap}>
              <div key={step} className={styles.stage}>
                {step === 'credentials' ? (
                  <form className={styles.form} onSubmit={handleCredentialSubmit} noValidate>
                    {shouldShowError ? (
                      <div className={styles.errorBanner} role="alert" aria-live="assertive" id="signin-error">
                        <AlertIcon />
                        <span>{screenError?.message}</span>
                      </div>
                    ) : null}

                    <div className={styles.field}>
                      <label htmlFor="email">Email</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setScreenError(null);
                        }}
                        disabled={isSubmitting}
                        className={`${styles.input} ${shouldShowError ? styles.inputError : ''}`}
                        aria-invalid={shouldShowError ? true : undefined}
                        aria-describedby={shouldShowError ? 'signin-error' : undefined}
                        required
                      />
                    </div>

                    <div className={styles.field}>
                      <div className={styles.labelRow}>
                        <label htmlFor="password">Password</label>
                        <a className={styles.link} href="mailto:admin@veyqor.internal?subject=Password%20reset%20request">
                          Forgot password
                        </a>
                      </div>
                      <div className={styles.passwordWrap}>
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          value={password}
                          onChange={(event) => {
                            setPassword(event.target.value);
                            setScreenError(null);
                          }}
                          disabled={isSubmitting}
                          className={`${styles.input} ${styles.passwordInput} ${shouldShowError ? styles.inputError : ''}`}
                          aria-invalid={shouldShowError ? true : undefined}
                          aria-describedby={shouldShowError ? 'signin-error' : undefined}
                          required
                        />
                        <button
                          type="button"
                          className={styles.passwordToggle}
                          onClick={() => setShowPassword((current) => !current)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          aria-pressed={showPassword}
                          disabled={isSubmitting}
                        >
                          <EyeIcon open={showPassword} />
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className={styles.primaryButton}
                      disabled={isSubmitting}
                      aria-busy={isSubmitting}
                    >
                      {isSubmitting ? <span className={styles.spinner} aria-hidden="true" /> : <span>Sign in</span>}
                    </button>

                    <div className={styles.securityNotice}>
                      <div className={styles.securityIcon}>
                        <ShieldIcon />
                      </div>
                      <p className={styles.disclosure}>
                        For security and compliance, sign-in activity and session actions are logged and auditable.
                      </p>
                    </div>
                  </form>
                ) : (
                  <form className={styles.form} onSubmit={handleMfaSubmit} noValidate>
                    {shouldShowError ? (
                      <div className={styles.errorBanner} role="alert" aria-live="assertive" id="mfa-error">
                        <AlertIcon />
                        <span>{screenError?.message}</span>
                      </div>
                    ) : null}

                    <div className={styles.mfaHeader}>
                      <h3>Verify your sign-in</h3>
                      <p>Enter the 6-digit verification code from your authenticator app.</p>
                    </div>

                    <div className={styles.field}>
                      <label htmlFor="mfa">Verification code</label>
                      <input
                        id="mfa"
                        name="mfa"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={mfaCode}
                        onChange={(event) => {
                          setMfaCode(event.target.value.replace(/\D+/g, '').slice(0, 6));
                          setScreenError(null);
                        }}
                        disabled={isSubmitting}
                        className={`${styles.input} ${styles.mfaInput} ${shouldShowError ? styles.inputError : ''}`}
                        aria-invalid={shouldShowError ? true : undefined}
                        aria-describedby={shouldShowError ? 'mfa-error' : undefined}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className={styles.primaryButton}
                      disabled={isSubmitting}
                      aria-busy={isSubmitting}
                    >
                      {isSubmitting ? <span className={styles.spinner} aria-hidden="true" /> : <span>Verify</span>}
                    </button>

                    <button
                      type="button"
                      className={styles.backButton}
                      onClick={() => {
                        setStep('credentials');
                        setChallengeId(null);
                        setMfaCode('');
                        setScreenError(null);
                        setIsSubmitting(false);
                      }}
                      disabled={isSubmitting}
                    >
                      Back to sign in
                    </button>

                    <div className={styles.securityNotice}>
                      <div className={styles.securityIcon}>
                        <ShieldIcon />
                      </div>
                      <p className={styles.disclosure}>
                        Verification events and subsequent session actions are recorded for audit and governance.
                      </p>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <footer className={styles.footerRow}>
              <span>© Veyqor GmbH I.G.</span>
              <nav className={styles.footerLinks} aria-label="Legal links">
                <Link href="/" className={styles.footerLink}>Privacy</Link>
                <span className={styles.footerDivider} aria-hidden="true">·</span>
                <Link href="/" className={styles.footerLink}>Legal</Link>
              </nav>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
