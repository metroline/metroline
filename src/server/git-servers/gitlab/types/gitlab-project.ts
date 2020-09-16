/* eslint-disable camelcase */

export interface Owner {
  id: number;
  name: string;
  created_at: Date;
}

export interface ContainerExpirationPolicy {
  cadence: string;
  enabled: boolean;
  keep_n?: any;
  older_than?: any;
  name_regex?: any;
  name_regex_delete?: any;
  name_regex_keep?: any;
  next_run_at: Date;
}

export interface Namespace {
  id: number;
  name: string;
  path: string;
  kind: string;
  full_path: string;
  avatar_url: string;
  web_url: string;
}

export interface ProjectAccess {
  access_level: number;
  notification_level: number;
}

export interface GroupAccess {
  access_level: number;
  notification_level: number;
}

export interface Permissions {
  project_access: ProjectAccess;
  group_access: GroupAccess;
}

export interface License {
  key: string;
  name: string;
  nickname: string;
  html_url: string;
  source_url: string;
}

export interface SharedWithGroup {
  group_id: number;
  group_name: string;
  group_full_path: string;
  group_access_level: number;
}

export interface Statistics {
  commit_count: number;
  storage_size: number;
  repository_size: number;
  wiki_size: number;
  lfs_objects_size: number;
  job_artifacts_size: number;
  packages_size: number;
  snippets_size: number;
}

export interface Links {
  self: string;
  issues: string;
  merge_requests: string;
  repo_branches: string;
  labels: string;
  events: string;
  members: string;
}

export interface GitlabProject {
  id: number;
  description?: any;
  default_branch: string;
  visibility: string;
  ssh_url_to_repo: string;
  http_url_to_repo: string;
  web_url: string;
  readme_url: string;
  tag_list: string[];
  owner: Owner;
  name: string;
  name_with_namespace: string;
  path: string;
  path_with_namespace: string;
  issues_enabled: boolean;
  open_issues_count: number;
  merge_requests_enabled: boolean;
  jobs_enabled: boolean;
  wiki_enabled: boolean;
  snippets_enabled: boolean;
  can_create_merge_request_in: boolean;
  resolve_outdated_diff_discussions: boolean;
  container_registry_enabled: boolean;
  container_expiration_policy: ContainerExpirationPolicy;
  created_at: Date;
  last_activity_at: Date;
  creator_id: number;
  namespace: Namespace;
  import_status: string;
  import_error?: any;
  permissions: Permissions;
  archived: boolean;
  avatar_url: string;
  license_url: string;
  license: License;
  shared_runners_enabled: boolean;
  forks_count: number;
  star_count: number;
  runners_token: string;
  ci_default_git_depth: number;
  public_jobs: boolean;
  shared_with_groups: SharedWithGroup[];
  repository_storage: string;
  only_allow_merge_if_pipeline_succeeds: boolean;
  allow_merge_on_skipped_pipeline: boolean;
  only_allow_merge_if_all_discussions_are_resolved: boolean;
  remove_source_branch_after_merge: boolean;
  printing_merge_requests_link_enabled: boolean;
  request_access_enabled: boolean;
  merge_method: string;
  auto_devops_enabled: boolean;
  auto_devops_deploy_strategy: string;
  approvals_before_merge: number;
  mirror: boolean;
  mirror_user_id: number;
  mirror_trigger_builds: boolean;
  only_mirror_protected_branches: boolean;
  mirror_overwrites_diverged_branches: boolean;
  external_authorization_classification_label?: any;
  packages_enabled: boolean;
  service_desk_enabled: boolean;
  service_desk_address?: any;
  autoclose_referenced_issues: boolean;
  suggestion_commit_message?: any;
  marked_for_deletion_at: string;
  marked_for_deletion_on: string;
  compliance_frameworks: string[];
  statistics: Statistics;
  _links: Links;
}
