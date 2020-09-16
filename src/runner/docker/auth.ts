export interface DockerConfigJson {
  auths: {
    [registry: string]: {
      username?: string;
      password?: string;
      auth?: string;
    }
  }
}

export function parseDockerAuthConfig(str: string): DockerConfigJson {
  return str ? JSON.parse(str) : {};
}

export function getCredentials(tag, { auths }: DockerConfigJson): { username?: string, password?: string } {
  if (!auths) {
    return;
  }
  // find registry
  const fragments = tag.split('/');
  let registry;
  if (fragments && fragments.length > 1) {
    // eslint-disable-next-line prefer-destructuring
    registry = fragments[0];
  }
  if (!registry) {
    return {};
  }
  // find credentials
  const credentials = auths[registry];
  if (!credentials) {
    return {};
  }
  // username password
  if (credentials.username || credentials.password) {
    return { username: credentials.username, password: credentials.password };
  }
  // basic auth token
  if (!credentials.auth) {
    return {};
  }
  const [username, password] = Buffer
    .from(credentials.auth, 'base64')
    .toString()
    .split(':');
  return { username, password };
}
