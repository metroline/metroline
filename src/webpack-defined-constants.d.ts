declare global {
  const BUILD_INFO: BuildInfo;
}

export interface BuildInfo {
  version: string;
  buildDate: Date;
  commitHash: string;
}
