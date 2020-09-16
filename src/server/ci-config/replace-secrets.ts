export async function replaceSecrets(
  plainConfig: string,
  secrets: { [secretName: string]: string },
): Promise<string> {
  return plainConfig.replace(
    /(\\*)({{([A-Za-z_]+)}})/g,
    (substring, leadingSlashes, marker, secretName) => {
      // if odd number of leading slash
      if (leadingSlashes && leadingSlashes.length % 2 !== 0) {
        // espace marker, remove espacing slash
        return leadingSlashes.substr(0, leadingSlashes.length - 1) + marker;
      }
      // replace marker with secret value
      const secretValue = secrets[secretName];
      if (!secretValue) {
        throw new Error(
          `Secret "${secretName}" from ref "${marker}" not found.`
          + ' It may not exist or it is protected and you are trying to use it on a non protected branch.',
        );
      }
      return (leadingSlashes || '') + secretValue;
    },
  );
}
