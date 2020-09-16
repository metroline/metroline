import { genKeypair } from './gen-keypair';

describe('genKeypair', () => {
  it('should generate keypair', async () => {
    const keypair = await genKeypair();
    expect(keypair).toBeDefined();
  });
});
