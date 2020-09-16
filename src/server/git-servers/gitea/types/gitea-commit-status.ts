// https://github.com/go-gitea/gitea/blob/9ce4d89e9922cc87bdb13d122339ae165a080c3d/templates/repo/commit_status.tmpl
export type GiteaCommitStatus =
// orange filled circle
  | 'pending'
  // green check
  | 'success'
  // red exclamation mark
  | 'error'
  // red cross
  | 'failure'
  // yellow filled triangle with white exclamation mark inside
  | 'warning';
