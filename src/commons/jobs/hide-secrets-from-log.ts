import { replaceAll } from '../../runner/utils/replace-all';

export function hideSecretsFromLog(originalString: string, secretValues: string[]) {
  let text = originalString;
  if (secretValues && secretValues.length !== 0) {
    secretValues.forEach(str => {
      text = replaceAll(text, str, '******');
    });
  }
  return text;
}
