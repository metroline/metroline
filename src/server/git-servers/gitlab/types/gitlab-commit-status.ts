// https://docs.gitlab.com/ee/api/commits.html#post-the-build-status-to-a-commit
// TODO how does gitlab display the "warning" state when allow_failure is true ?
export type GitlabCommitStatus =
// orange filled circle with paused sign inside (but "external" bubble displayed as "running")
  | 'pending'
  // circle partially filled with blue
  | 'running'
  // green filled circle with check
  | 'success'
  // red filled circle with red cross
  | 'failed'
  // back circle with backslash
  | 'canceled';
