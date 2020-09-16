import { BranchCondition, ExcludeCondition, IncludeCondition } from '../ci-config';

function emptyArray<T>(arr: T[]) {
  return (
    !arr
    || !(arr instanceof Array)
    || arr.length === 0
  );
}

function canExecIfIncludes(branch: string, patterns: string[]): boolean {
  if (emptyArray(patterns)) {
    return true;
  }
  return patterns.some(pattern => branch.match(new RegExp(pattern)));
}

function canExecIfExcludes(branch: string, patterns: string[]): boolean {
  if (emptyArray(patterns)) {
    return true;
  }
  return patterns.every(pattern => !branch.match(new RegExp(pattern)));
}

export function canExecWhenBranch(branch: string, condition: BranchCondition): boolean {
  if ((condition as IncludeCondition)?.include) {
    return canExecIfIncludes(branch, (condition as IncludeCondition).include);
  }
  if ((condition as ExcludeCondition)?.exclude) {
    return canExecIfExcludes(branch, (condition as ExcludeCondition).exclude);
  }
  return canExecIfIncludes(branch, condition as string[]);
}
