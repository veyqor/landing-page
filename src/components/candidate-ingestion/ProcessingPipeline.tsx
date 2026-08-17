import styles from './QuarantineWidgets.module.css';
import type { ValidationCheck } from './types';

function marker(status: ValidationCheck['status']) {
  if (status === 'passed') return '✓';
  if (status === 'processing') return '●';
  if (status === 'failed') return '!';
  return '○';
}

function tone(status: ValidationCheck['status']) {
  if (status === 'passed') return styles.stepPassed;
  if (status === 'processing') return styles.stepProcessing;
  if (status === 'failed') return styles.stepFailed;
  return styles.stepPending;
}

export default function ProcessingPipeline({ checks }: { checks: ValidationCheck[] }) {
  return (
    <div className={styles.pipeline}>
      {checks.map((check) => (
        <div key={check.label} className={styles.step}>
          <span className={`${styles.stepMark} ${tone(check.status)}`} aria-hidden="true">{marker(check.status)}</span>
          <div className={styles.stepCopy}>
            <strong>{check.label}</strong>
            <small>
              {check.status === 'passed' ? 'Complete' : check.status === 'processing' ? 'Processing' : check.status === 'failed' ? 'Failed' : 'Pending'}
            </small>
          </div>
        </div>
      ))}
    </div>
  );
}
