export interface ProcessConfig {
  tty: boolean;
  entrypoint: string;
  arguments: string[];
  privileged: boolean;
}

export interface ExecInspect {
  ID: string;
  Running: boolean;
  ExitCode: number;
  ProcessConfig: ProcessConfig;
  OpenStdin: boolean;
  OpenStderr: boolean;
  OpenStdout: boolean;
  CanRemove: boolean;
  ContainerID: string;
  DetachKeys: string;
  Pid: number;
}
