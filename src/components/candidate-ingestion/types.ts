export type QuarantineFileStatus =
  | 'queued'
  | 'uploading'
  | 'quarantined'
  | 'validating'
  | 'processing'
  | 'cleared'
  | 'blocked'
  | 'requires_attention'
  | 'failed';

export type CheckStatus = 'passed' | 'processing' | 'pending' | 'failed';

export type ValidationCheck = {
  label: string;
  status: CheckStatus;
};

export type QuarantineFile = {
  id: string;
  fileName: string;
  candidateName: string;
  fileType: string;
  source: string;
  status: QuarantineFileStatus;
  validation: 'Passed' | 'In progress' | 'Failed';
  reason: string;
  uploadedBy: string;
  uploadedAt: string;
  updatedAt: string;
  checks: ValidationCheck[];
};
