/**
 * https://docs.gitlab.com/ee/api/members.html#valid-access-levels
 */
export enum GitlabAccessLevel {
  NO_ACCESS = 0,
  GUEST = 10,
  REPORTER = 20,
  DEVELOPER = 30,
  MAINTAINER = 40,
  /**
   * Only valid to set for groups
   */
  OWNER = 50,
}
