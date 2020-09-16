import { Request, Response } from 'express';
import { query } from 'express-validator';
import { Repos } from './repo';
import { serializeRepo } from './serialize-repo';
import { Pipelines } from '../pipelines/pipelines';
import { Pipeline } from '../../commons/types/pipeline';
import { serializePipeline } from '../pipelines/serialize-pipeline';
import { page, pageResponse, pageValidators } from '../utils/page';
import { validateRequest } from '../utils/validate-request';
import { getUser } from '../auth/utils/get-user';
import { env } from '../env';
import { userCanPullDbQuery } from './user-can-pull-db-query';

export const listReposRouteValidators = [
  ...pageValidators,
  query('search').optional().isString().isLength({ min: 3, max: 255 }),
  validateRequest,
];

export async function listReposRoute(req: Request, res: Response): Promise<void> {
  const pagination = page(req);
  const user = getUser(req);

  if (env.METROLINE_REQUIRE_LOGIN_FOR_PUBLIC_REPOS && !user) {
    res.json(pageResponse([], 0));
    return;
  }

  const dbQuery = {
    ...userCanPullDbQuery(user),
    ...(
      req.query.search
        ? { $text: { $search: req.query.search } }
        : undefined as any
    ),
  };

  const count = await Repos()
    .find(dbQuery)
    .count();
  const repos = await Repos()
    .find(dbQuery)
    .sort({ lastUpdate: -1 })
    .skip(pagination.offset)
    .limit(pagination.size)
    .toArray();

  const pipelines: Pipeline[] = await Promise.all(
    repos.map(repo => Pipelines()
      .find({ 'commit.repoId': repo.repoId })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray()
      .then(arr => (arr.length > 0 ? arr[0] : undefined))),
  );

  const items = repos.map((repo, index) => {
    const pipeline = pipelines[index];
    return ({
      repo: serializeRepo(repo, user?._id.toHexString()),
      latestPipeline: pipeline && serializePipeline(pipeline),
    });
  });

  res.json(pageResponse(items, count));
}
