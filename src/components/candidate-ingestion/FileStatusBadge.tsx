import styles from './QuarantineWidgets.module.css';
import type { QuarantineFileStatus } from './types';

function label(status: QuarantineFileStatus) {
  if (status === 'queued') return 'Queued';
  if (status === 'uploading') return 'Uploading';
  if (status === 'quarantined') return 'Quarantined';
  if (status === 'validating') return 'Validating';
  if (status === 'processing') return 'Processing';
  if (status === 'cleared') return 'Cleared';
  if (status === 'blocked') return 'Blocked';
  if (status === 'requires_attention') return 'Requires attention';
  return 'Processing failed';
}

function tone(status: QuarantineFileStatus) {
  if (status === 'cleared') return styles.statusCleared;
  if (status === 'blocked') return styles.statusBlocked;
  if (status === 'requires_attention') return styles.statusAttention;
  if (status === 'failed') return styles.statusFailed;
  if (status === 'queued') return styles.statusQueued;
  if (status === 'uploading') return styles.statusUploading;
  if (status === 'quarantined') return styles.statusQuarantined;
  if (status === 'validating') return styles.statusValidating;
  return styles.statusProcessing;
}

export default function FileStatusBadge({ status }: { status: QuarantineFileStatus }) {
  return <span className={`${styles.badge} ${tone(status)}`}>{label(status)}</span>;
}
