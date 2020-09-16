import { PipelineStatus } from '../../../commons/types/pipeline';
import { ExcludeCondition, IncludeCondition, StatusCondition } from '../ci-config';

function emptyArray<T>(arr: T[]) {
  return (
    !arr
    || !(arr instanceof Array)
    || arr.length === 0
  );
}

function canExecIfIncludes(upstreamStatus: PipelineStatus, patterns: string[]): boolean {
  if (emptyArray(patterns)) {
    return upstreamStatus !== 'failure';
  }
  return patterns.some(pattern => upstreamStatus.match(new RegExp(pattern)));
}

function canExecIfExcludes(upstreamStatus: PipelineStatus, patterns: string[]): boolean {
  if (emptyArray(patterns)) {
    return upstreamStatus !== 'failure';
  }
  return patterns.every(pattern => !upstreamStatus.match(new RegExp(pattern)));
}

export function canExecWhenStatus(upstreamStatus: PipelineStatus, condition: StatusCondition): boolean {
  if ((condition as IncludeCondition)?.include) {
    return canExecIfIncludes(upstreamStatus, (condition as IncludeCondition).include);
  }
  if ((condition as ExcludeCondition)?.exclude) {
    return canExecIfExcludes(upstreamStatus, (condition as ExcludeCondition).exclude);
  }
  return canExecIfIncludes(upstreamStatus, condition as string[]);
}
