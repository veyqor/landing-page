import FileStatusBadge from './FileStatusBadge';
import ProcessingPipeline from './ProcessingPipeline';
import styles from './QuarantineWidgets.module.css';
import type { QuarantineFile } from './types';

type DrawerActions = {
  onClose: () => void;
  onRetry: () => void;
  onReplace: () => void;
  onRemove: () => void;
};

export default function ProcessingDetailsDrawer({
  file,
  canManage,
  onClose,
  onRetry,
  onReplace,
  onRemove,
}: {
  file: QuarantineFile;
  canManage: boolean;
} & DrawerActions) {
  return (
    <>
      <div className={styles.drawerOverlay} role="presentation" onClick={onClose} />
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="File processing details">
        <header className={styles.drawerHeader}>
          <div>
            <h3>File details</h3>
            <p>{file.fileName}</p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close details">×</button>
        </header>

        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span>Status</span>
            <strong><FileStatusBadge status={file.status} /></strong>
            <p>{file.reason}</p>
          </div>

          <div className={styles.metaItem}>
            <span>Candidate</span>
            <strong>{file.candidateName}</strong>
            <p>{file.fileType} · {file.source}</p>
          </div>

          <div className={styles.metaItem}>
            <span>Audit context</span>
            <strong>Uploaded by {file.uploadedBy}</strong>
            <p>{file.uploadedAt} · Updated {file.updatedAt}</p>
          </div>

          <div className={styles.metaItem}>
            <span>Validation results</span>
            <strong>Automated check pipeline</strong>
            <ProcessingPipeline checks={file.checks} />
          </div>
        </div>

        {canManage ? (
          <div className={styles.drawerActions}>
            {(file.status === 'blocked' || file.status === 'failed' || file.status === 'requires_attention') ? (
              <button type="button" className={styles.actionBtn} onClick={onRetry}>Retry processing</button>
            ) : null}
            {(file.status === 'blocked' || file.status === 'failed') ? (
              <button type="button" className={styles.actionBtn} onClick={onReplace}>Replace file</button>
            ) : null}
            {(file.status === 'blocked' || file.status === 'failed' || file.status === 'requires_attention') ? (
              <button type="button" className={styles.actionBtn} onClick={onRemove}>Remove</button>
            ) : null}
          </div>
        ) : null}
      </aside>
    </>
  );
}
