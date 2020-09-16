import { Router } from 'express';
import passport from 'passport';
import { authenticate, signOut } from '../auth/auth';
import { listGlobalSecrets } from '../secrets/list-global-secrets';
import { getPipeline, getPipelineValidators } from '../pipelines/get-pipeline';
import { wrapAsyncMiddleware } from '../../commons/utils/wrap-async-middleware';
import { listPipelineJobs, listPipelineJobsValidators } from '../jobs/list-pipeline-jobs';
import { cancelPipeline, cancelPipelineValidators } from '../pipelines/cancel/cancel-pipeline';
import { getJobLogs, getJobLogsValidators } from '../job-logs/get-job-logs';
import { listReposRoute, listReposRouteValidators } from '../repos/list-repos-route';
import { syncReposRoute } from '../repos/sync-repos';
import { postCommit, postCommitValidators } from '../pipelines/post-commit';
import { getRepoRoute, getRepoRouteValidators } from '../repos/get-repo';
import { setupRepoRoute, setupRepoRouteValidators } from '../repos/setup-repo';
import { disableRepo } from '../repos/disable-repo';
import { listPipelines, listPipelinesValidators } from '../pipelines/list-pipelines';
import { listSecrets, listSecretsValidators } from '../secrets/list-secrets';
import { runManualPipeline, runManualPipelineValidators } from '../pipelines/run-manual-pipeline';
import { listBranches, listBranchesValidators } from '../repos/list-branches';
import { addSecret, addSecretValidators } from '../secrets/add-secret';
import { updateSecret, updateSecretValidators } from '../secrets/update-secret';
import { removeSecret, removeSecretValidators } from '../secrets/remove-secret';
import {
  giteaOAuthAuthorizePath,
  giteaOAuthCallbackPath,
  githubOAuthAuthorizePath,
  githubOAuthCallbackPath,
  gitlabOAuthAuthorizePath,
  gitlabOAuthCallbackPath,
} from '../auth/passport';
import { getAuthMethods } from '../auth/get-auth-methods';
import { pipelineExistsGuard } from './guards/pipeline-exists-guard';
import { jobExistsGuard } from './guards/job-exists-guard';
import { repoExistsGuard } from './guards/repo-exists-guard';
import { repoSecretExistsGuard } from './guards/repo-secret-exists-guard';
import { canPullRepoGuard } from './guards/can-pull-repo-guard';
import { canPushToRepoGuard } from './guards/can-push-to-repo-guard';
import { canGetPipelineGuard } from './guards/can-get-pipeline-guard';
import { canGetJobGuard } from './guards/can-get-job-guard';
import { canAdminRepoGuard } from './guards/can-admin-repo-guard';
import { authGuard } from './guards/auth-guard';
import { getUserRoute } from '../auth/get-user-route';

const router = Router();

router.get(
  gitlabOAuthAuthorizePath,
  passport.authenticate('oauth2'),
);
router.get(gitlabOAuthCallbackPath,
  passport.authenticate('oauth2',
    { session: false }),
  authenticate);
router.get(
  giteaOAuthAuthorizePath,
  passport.authenticate('oauth2'),
);
router.get(
  giteaOAuthCallbackPath,
  passport.authenticate('oauth2',
    { session: false }),
  authenticate,
);
router.get(
  githubOAuthAuthorizePath,
  passport.authenticate('oauth2'),
);
router.get(
  githubOAuthCallbackPath,
  passport.authenticate('oauth2',
    { session: false }),
  authenticate,
);
router.post(
  '/auth/signout',
  signOut,
);
router.get(
  '/auth/methods',
  getAuthMethods,
);
router.get(
  '/api/v1/secrets',
  authGuard,
  listGlobalSecrets,
);
router.get(
  '/api/v1/user',
  getUserRoute,
);
router.get(
  '/api/v1/pipelines/:pipelineId',
  getPipelineValidators,
  pipelineExistsGuard,
  canGetPipelineGuard,
  wrapAsyncMiddleware(getPipeline),
);
router.get(
  '/api/v1/pipelines/:pipelineId/jobs',
  listPipelineJobsValidators,
  pipelineExistsGuard,
  canGetPipelineGuard,
  wrapAsyncMiddleware(listPipelineJobs),
);
router.post(
  '/api/v1/pipelines/:pipelineId/cancel',
  authGuard,
  cancelPipelineValidators,
  pipelineExistsGuard,
  canGetPipelineGuard,
  wrapAsyncMiddleware(cancelPipeline),
);
router.get(
  '/api/v1/jobs/:jobId/logs',
  getJobLogsValidators,
  jobExistsGuard,
  canGetJobGuard,
  wrapAsyncMiddleware(getJobLogs),
);
router.get(
  '/api/v1/repos',
  listReposRouteValidators,
  wrapAsyncMiddleware(listReposRoute),
);
router.post(
  '/api/v1/repos/sync',
  authGuard,
  wrapAsyncMiddleware(syncReposRoute),
);
router.post(
  '/api/v1/repos/:repoId/commits',
  postCommitValidators,
  repoExistsGuard,
  wrapAsyncMiddleware(postCommit),
);
router.get(
  '/api/v1/repos/:repoId',
  getRepoRouteValidators,
  repoExistsGuard,
  canPullRepoGuard,
  wrapAsyncMiddleware(getRepoRoute),
);
router.post(
  '/api/v1/repos/:repoId/setup',
  authGuard,
  setupRepoRouteValidators,
  repoExistsGuard,
  canAdminRepoGuard,
  wrapAsyncMiddleware(setupRepoRoute),
);
router.post(
  '/api/v1/repos/:repoId/disable',
  authGuard,
  repoExistsGuard,
  canAdminRepoGuard,
  wrapAsyncMiddleware(disableRepo),
);
router.get(
  '/api/v1/repos/:repoId/pipelines',
  listPipelinesValidators,
  repoExistsGuard,
  canPullRepoGuard,
  wrapAsyncMiddleware(listPipelines),
);
router.post(
  '/api/v1/repos/:repoId/pipelines',
  authGuard,
  runManualPipelineValidators,
  repoExistsGuard,
  canPushToRepoGuard,
  wrapAsyncMiddleware(runManualPipeline),
);
router.get(
  '/api/v1/repos/:repoId/branches',
  listBranchesValidators,
  repoExistsGuard,
  canPullRepoGuard,
  wrapAsyncMiddleware(listBranches),
);
router.get(
  '/api/v1/repos/:repoId/secrets',
  authGuard,
  listSecretsValidators,
  repoExistsGuard,
  canPullRepoGuard,
  wrapAsyncMiddleware(listSecrets),
);
router.post(
  '/api/v1/repos/:repoId/secrets',
  authGuard,
  addSecretValidators,
  repoExistsGuard,
  canAdminRepoGuard,
  wrapAsyncMiddleware(addSecret),
);
router.put(
  '/api/v1/repos/:repoId/secrets/:secretId',
  authGuard,
  updateSecretValidators,
  repoExistsGuard,
  canAdminRepoGuard,
  repoSecretExistsGuard,
  wrapAsyncMiddleware(updateSecret),
);
router.delete(
  '/api/v1/repos/:repoId/secrets/:secretId',
  authGuard,
  removeSecretValidators,
  repoExistsGuard,
  canAdminRepoGuard,
  repoSecretExistsGuard,
  wrapAsyncMiddleware(removeSecret),
);

export const routes = router;
