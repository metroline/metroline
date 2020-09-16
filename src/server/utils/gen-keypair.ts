import { promisify } from 'util';
import { generateKeyPair } from 'crypto';
import sshpk from 'sshpk';

export interface SshKeypair {
  publicKey: string;
  privateKey: string;
}

const generateKeyPairAsync = promisify(generateKeyPair);

export function genKeypair(): Promise<SshKeypair> {
  return generateKeyPairAsync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  }).then(value => {
    const pemKey = sshpk.parseKey(value.publicKey, 'pem');
    const sshRsa = pemKey.toString('ssh');
    return {
      publicKey: sshRsa,
      privateKey: value.privateKey,
    };
  });
}
