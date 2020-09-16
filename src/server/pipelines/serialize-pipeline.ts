import { Pipeline } from '../../commons/types/pipeline';

export function serializePipeline(pipeline: Pipeline) {
  return {
    _id: pipeline._id,
    duration: pipeline.duration,
    cancelledAt: pipeline.cancelledAt,
    end: pipeline.end,
    error: pipeline.error,
    createdAt: pipeline.createdAt,
    status: pipeline.status,
    commit: {
      sha: pipeline.commit.sha,
      url: pipeline.commit.url,
      message: pipeline.commit.message,
      author: pipeline.commit.author,
      branch: pipeline.commit.branch,
    },
  };
}
