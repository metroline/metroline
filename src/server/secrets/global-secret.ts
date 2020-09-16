export interface GlobalSecret {
  name: string,
  value: string,
  protectedBranchesOnly?: boolean;
  branches?: string[];
}
